import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";
import { parseISODate, toISODate, weekStartISO } from "@/lib/week";
import {
  normalizeReminderSettings,
  type ReminderCard,
  type ReminderSettingsInput,
} from "@/lib/reminders";
import type { ModuleKey } from "@/lib/modules";

// Загружает настройки напоминаний (или значения по умолчанию, если строки нет).
export async function loadReminderSettings(): Promise<ReminderSettingsInput> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return normalizeReminderSettings(null);

  const { data } = await supabase
    .from("reminders_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return normalizeReminderSettings(data as Partial<ReminderSettingsInput> | null);
}

// Разница в днях между двумя локальными датами (b - a), без учёта времени.
function daysBetween(aISO: string, bISO: string): number {
  const a = parseISODate(aISO).getTime();
  const b = parseISODate(bISO).getTime();
  return Math.round((b - a) / 86_400_000);
}

// Вычисляет список актуальных карточек напоминаний на дату todayISO.
// todayISO передаётся с клиента — это локальная дата пользователя,
// чтобы не зависеть от UTC на сервере (как в LocalGreeting).
// Если передан timezone и в настройках он ещё не сохранён — сохраняем.
export async function loadReminderCards(
  todayISO: string,
  timezone?: string | null,
): Promise<ReminderCard[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: moduleRows }, { data: settingsRow }] = await Promise.all([
    supabase
      .from("user_modules")
      .select("module_key, is_enabled")
      .eq("user_id", user.id),
    supabase
      .from("reminders_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const enabledModules = new Set<ModuleKey>();
  (moduleRows ?? []).forEach((m) => {
    if (m.is_enabled) enabledModules.add(m.module_key as ModuleKey);
  });

  // Блок напоминаний работает только при включённом модуле «reminders».
  if (!enabledModules.has("reminders")) return [];

  const settings = normalizeReminderSettings(
    settingsRow as Partial<ReminderSettingsInput> | null,
  );

  // Сохраняем timezone пользователя один раз, если он ещё не задан.
  if (settingsRow && timezone && !settings.timezone) {
    await supabase
      .from("reminders_settings")
      .update({ timezone })
      .eq("user_id", user.id);
  }

  const today = parseISODate(todayISO);
  const dow = today.getDay(); // 0=вс .. 1=пн .. 6=сб
  const dayOfMonth = today.getDate();
  const currentWeekStart = weekStartISO(todayISO);

  const wantFinance = enabledModules.has("finance") && settings.finance_enabled;
  const wantHabits = enabledModules.has("habits") && settings.habits_enabled;
  const wantDebts = enabledModules.has("debts") && settings.debts_enabled;
  const wantMonday =
    enabledModules.has("habits") && settings.monday_goals_enabled && dow === 1;
  const wantSavings =
    enabledModules.has("savings") &&
    settings.savings_enabled &&
    settings.savings_day_of_month != null &&
    settings.savings_day_of_month === dayOfMonth;

  const cards: ReminderCard[] = [];

  // --- Финансы: сегодня нет ни одной операции income/expense ---
  if (wantFinance) {
    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .in("type", ["income", "expense"]) // saving и debt_payment не считаем
      .eq("date", todayISO);
    if ((count ?? 0) === 0) {
      cards.push({
        key: `finance_daily:${todayISO}`,
        type: "finance_daily",
        title: "Финансы сегодня ещё пустые",
        text: "Заполни доходы и расходы за сегодня. Это займёт минуту.",
        href: "/finance",
        actionLabel: "Добавить операцию",
      });
    }
  }

  // --- Привычки: есть активные привычки, но сегодня ни одной отметки ---
  if (wantHabits) {
    const [{ count: habitCount }, { count: logCount }] = await Promise.all([
      supabase
        .from("habits")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("habit_logs")
        .select("id", { count: "exact", head: true })
        .eq("completed", true)
        .eq("date", todayISO),
    ]);
    if ((habitCount ?? 0) > 0 && (logCount ?? 0) === 0) {
      cards.push({
        key: `habits_daily:${todayISO}`,
        type: "habits_daily",
        title: "Что из привычек получилось?",
        text: "Просто отметь факт — без оценок.",
        href: "/habits",
        actionLabel: "Отметить",
      });
    }
  }

  // --- Долги: ближайший платёж через N дней или сегодня ---
  if (wantDebts) {
    const { data: debtRows } = await supabase
      .from("debts")
      .select("id, name, minimum_payment, next_payment_date")
      .eq("is_active", true)
      .not("next_payment_date", "is", null);
    const before = settings.debts_days_before;
    for (const debt of debtRows ?? []) {
      const dateISO = debt.next_payment_date as string;
      const left = daysBetween(todayISO, dateISO);
      if (left >= 0 && left <= before) {
        const amount = money(Number(debt.minimum_payment) || 0);
        const when =
          left === 0
            ? "сегодня"
            : left === 1
              ? "завтра"
              : `через ${left} дн.`;
        cards.push({
          key: `debt_payment:${debt.id}:${dateISO}`,
          type: "debt_payment",
          title: "Скоро платёж",
          text: `Платёж ${when} по «${debt.name}»: ${amount}.`,
          href: "/debts",
          actionLabel: "Открыть долги",
        });
      }
    }
  }

  // --- Понедельник: есть активные привычки, но нет целей на эту неделю ---
  if (wantMonday) {
    const [{ count: habitCount }, { count: goalCount }] = await Promise.all([
      supabase
        .from("habits")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("habit_weekly_goals")
        .select("id", { count: "exact", head: true })
        .eq("week_start_date", currentWeekStart),
    ]);
    if ((habitCount ?? 0) > 0 && (goalCount ?? 0) === 0) {
      cards.push({
        key: `monday_goals:${currentWeekStart}`,
        type: "monday_goals",
        title: "Поставим цели на неделю?",
        text: "Мягкие цели по привычкам — по желанию.",
        href: "/habits",
        actionLabel: "Поставить цели",
      });
    }
  }

  // --- Сбережения: мягкое напоминание раз в месяц ---
  if (wantSavings) {
    cards.push({
      key: `savings:${toISODate(today).slice(0, 7)}`,
      type: "savings",
      title: "Можно отложить немного",
      text: "В подушку или цель — небольшими шагами.",
      href: "/savings",
      actionLabel: "Открыть сбережения",
    });
  }

  return cards;
}
