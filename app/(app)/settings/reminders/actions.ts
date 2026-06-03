"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loadReminderCards } from "@/lib/reminders-data";
import {
  normalizeReminderSettings,
  type ReminderCard,
  type ReminderSettingsInput,
} from "@/lib/reminders";

type Result = { error?: string };

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// Сохраняет настройки напоминаний (upsert по user_id).
export async function saveReminderSettings(
  input: ReminderSettingsInput,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };

  const s = normalizeReminderSettings(input);
  const dayRaw = s.savings_day_of_month;
  const savingsDay =
    dayRaw == null || !Number.isFinite(dayRaw)
      ? null
      : Math.min(28, Math.max(1, Math.round(dayRaw)));

  const { error } = await supabase.from("reminders_settings").upsert(
    {
      user_id: user.id,
      finance_enabled: s.finance_enabled,
      finance_times: s.finance_times,
      habits_enabled: s.habits_enabled,
      habits_times: s.habits_times,
      debts_enabled: s.debts_enabled,
      debts_days_before: s.debts_days_before,
      monday_goals_enabled: s.monday_goals_enabled,
      monday_goals_time: s.monday_goals_time,
      savings_enabled: s.savings_enabled,
      savings_day_of_month: savingsDay,
      savings_time: s.savings_time,
      timezone: s.timezone,
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: "Не удалось сохранить настройки напоминаний." };

  revalidatePath("/");
  revalidatePath("/settings/reminders");
  return {};
}

// Загружает актуальные карточки «Сегодня важно» для главной.
// todayISO и timezone приходят с клиента (локальное время пользователя).
export async function loadTodayReminders(
  todayISO: string,
  timezone?: string | null,
): Promise<ReminderCard[]> {
  const { user } = await getUser();
  if (!user) return [];
  // Простейшая валидация формата YYYY-MM-DD.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(todayISO)) return [];
  return loadReminderCards(todayISO, timezone);
}

// --- Web Push (подготовка) ---

export async function savePushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  if (!input.endpoint || !input.p256dh || !input.auth) {
    return { error: "Неполные данные подписки." };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent ?? null,
      is_active: true,
    },
    { onConflict: "user_id,endpoint" },
  );
  if (error) return { error: "Не удалось сохранить подписку." };
  return {};
}

export async function removePushSubscription(
  endpoint: string,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };

  const { error } = await supabase
    .from("push_subscriptions")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  if (error) return { error: "Не удалось отключить подписку." };
  return {};
}
