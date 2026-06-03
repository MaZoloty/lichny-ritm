import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarCheck,
  Landmark,
  PiggyBank,
  Plus,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { getUserContext } from "@/lib/data";
import { money, signedMoney } from "@/lib/format";
import { loadHabitsWeek } from "@/lib/habits-data";
import { loadFinance } from "@/lib/finance-data";
import { loadGoals } from "@/lib/goals-data";
import { loadDebts } from "@/lib/debts-data";
import { loadSavings } from "@/lib/savings-data";
import { completedInWeek, overallProgress, percentOf } from "@/lib/habits";
import { goalPercent } from "@/lib/goals";
import LocalGreeting from "@/components/LocalGreeting";
import TodayReminders from "@/components/reminders/TodayReminders";

export default async function HomePage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");

  const enabled = ctx.enabledModules;
  const name = ctx.profile?.display_name?.trim();

  // Грузим только то, что нужно для включённых модулей.
  const [week, finance, goalsData, debtsData, savingsData] = await Promise.all([
    enabled.has("habits") ? loadHabitsWeek() : Promise.resolve(null),
    enabled.has("finance") ? loadFinance("today") : Promise.resolve(null),
    enabled.has("goals") ? loadGoals() : Promise.resolve(null),
    enabled.has("debts") ? loadDebts() : Promise.resolve(null),
    enabled.has("savings") ? loadSavings() : Promise.resolve(null),
  ]);

  // Сводка по привычкам недели для карточки на главной.
  const habitSummary = week
    ? (() => {
        const items = week.habits.map((h) => {
          const done = completedInWeek(h.completedDates, week.weekDatesISO);
          const goal = h.goals[week.currentWeekStartISO] ?? null;
          return { name: h.name, done, goal, pct: percentOf(done, goal) };
        });
        return {
          overall: overallProgress(
            items.map((i) => ({ completed: i.done, goal: i.goal })),
          ),
          count: items.length,
        };
      })()
    : null;

  const topGoal = goalsData?.goals[0] ?? null;
  const topGoalPct = topGoal
    ? goalPercent(Number(topGoal.current_amount), Number(topGoal.target_amount))
    : 0;
  const totalDebt = debtsData?.summary.totalCurrentDebt ?? 0;
  const nextDebt = debtsData?.summary.nextPayment ?? null;
  const totalSavings = savingsData?.totalSavings ?? 0;
  const totalBalance = (finance?.byAccount ?? []).reduce(
    (sum, account) => sum + (account.currentBalance ?? 0),
    0,
  );

  const empty = enabled.size === 0;

  return (
    <main className="px-5 pt-safe">
      {/* ---------- Hero ---------- */}
      <header className="mb-6 mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted">
            <LocalGreeting name={name} />
          </p>
          <span className="badge badge-primary">Мягкий режим</span>
        </div>
        <h1 className="mt-2 text-[2rem] font-bold leading-[1.1] tracking-tight text-ink">
          Твой ритм сегодня
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Соберём день спокойно: финансы, привычки и цели в одном месте.
        </p>
      </header>

      {/* ---------- Сегодня важно ---------- */}
      {enabled.has("reminders") && <TodayReminders />}

      {/* ---------- Быстрые действия ---------- */}
      {!empty && (
        <section className="mb-6">
          <h2 className="eyebrow mb-2 px-1">Быстрые действия</h2>
          <div className="grid grid-cols-2 gap-3">
            {enabled.has("finance") && (
              <>
                <QuickAction href="/finance" icon={Plus} label="Доход" />
                <QuickAction href="/finance" icon={Plus} label="Расход" />
              </>
            )}
            {enabled.has("habits") && (
              <QuickAction
                href="/habits"
                icon={CalendarCheck}
                label="Отметить"
              />
            )}
            {enabled.has("goals") && (
              <QuickAction href="/goals" icon={Target} label="Пополнить цель" />
            )}
          </div>
        </section>
      )}

      {/* ---------- Пустое состояние ---------- */}
      {empty && (
        <div className="summary-card text-center">
          <p className="text-muted">
            Пока не выбрано ни одного раздела. Включи нужное в настройках.
          </p>
          <Link href="/settings" className="btn-primary mt-4 inline-flex">
            Открыть настройки
          </Link>
        </div>
      )}

      {/* ---------- Карточки модулей ---------- */}
      {!empty && (
        <section>
          <h2 className="eyebrow mb-2 px-1">Разделы</h2>
          <div className="flex flex-col gap-3">
            {/* Привычки */}
            {enabled.has("habits") && (
              <ModuleCard
                href="/habits"
                icon={CalendarCheck}
                label="Привычки"
                metric={
                  !habitSummary || habitSummary.count === 0
                    ? "Мягкий старт"
                    : habitSummary.overall === null
                      ? "Без целей"
                      : `${habitSummary.overall}% недели`
                }
                meaning={
                  !habitSummary || habitSummary.count === 0
                    ? "Добавь первую привычку"
                    : habitSummary.overall === null
                      ? "Пока просто отмечаем факты"
                      : "Ты уже движешься"
                }
                progress={
                  habitSummary && habitSummary.overall !== null
                    ? { value: Math.min(100, habitSummary.overall), tone: "success" }
                    : undefined
                }
              />
            )}

            {/* Финансы */}
            {enabled.has("finance") && (
              <ModuleCard
                href="/finance"
                icon={Wallet}
                label="Финансы"
                metric={money(totalBalance, finance?.currency)}
                meaning="Баланс по счетам"
              >
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniStat
                    label="Доходы"
                    value={money(finance?.incomeTotal ?? 0, finance?.currency)}
                  />
                  <MiniStat
                    label="Расходы"
                    value={money(finance?.expenseTotal ?? 0, finance?.currency)}
                    tone="peach"
                  />
                  <MiniStat
                    label="Разница"
                    value={signedMoney(finance?.diff ?? 0, finance?.currency)}
                    tone={(finance?.diff ?? 0) < 0 ? "peach" : "ink"}
                  />
                </div>
              </ModuleCard>
            )}

            {/* Цели */}
            {enabled.has("goals") && (
              <ModuleCard
                href="/goals"
                icon={Target}
                label="Цели"
                metric={money(goalsData?.totalSaved ?? 0, goalsData?.currency)}
                meaning={
                  topGoal ? `Ближайшая: ${topGoal.name}` : "Добавь первую цель"
                }
                progress={
                  topGoal ? { value: Math.min(100, topGoalPct), tone: "accent" } : undefined
                }
              />
            )}

            {/* Долги */}
            {enabled.has("debts") && (
              <ModuleCard
                href="/debts"
                icon={Landmark}
                label="Долги"
                metric={money(totalDebt)}
                meaning={
                  nextDebt
                    ? `Платёж ${money(Number(nextDebt.minimum_payment))} · ${nextDebt.next_payment_date}`
                    : "Осталось закрыть"
                }
                progress={
                  debtsData
                    ? {
                        value: debtsData.summary.overallPaidPercent,
                        tone: "success",
                        label: `Закрыто ${debtsData.summary.overallPaidPercent}%`,
                      }
                    : undefined
                }
              />
            )}

            {/* Сбережения */}
            {enabled.has("savings") && (
              <ModuleCard
                href="/savings"
                icon={PiggyBank}
                label="Сбережения"
                metric={money(totalSavings)}
                meaning={
                  savingsData && savingsData.emergencyTargetAmount > 0
                    ? `Подушка ${savingsData.emergencyProgress}%`
                    : "Спокойная подушка на всякий случай"
                }
                progress={
                  savingsData && savingsData.emergencyTargetAmount > 0
                    ? { value: savingsData.emergencyProgress, tone: "accent" }
                    : undefined
                }
              />
            )}
          </div>
        </section>
      )}
    </main>
  );
}

/* ---------- Вспомогательные компоненты главной ---------- */

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="soft-card flex items-center gap-3 transition active:scale-[0.99]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
        <Icon size={20} strokeWidth={2} />
      </span>
      <span className="text-sm font-semibold text-ink">{label}</span>
    </Link>
  );
}

type ProgressTone = "accent" | "success" | "warning";

function ModuleCard({
  href,
  icon: Icon,
  label,
  metric,
  meaning,
  progress,
  children,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  metric: string;
  meaning: string;
  progress?: { value: number; tone?: ProgressTone; label?: string };
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="app-card block transition active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Icon size={22} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted">{label}</span>
            <Chevron />
          </div>
          <div className="mt-0.5 text-2xl font-bold leading-tight text-ink num">
            {metric}
          </div>
          <div className="mt-0.5 truncate text-sm text-muted">{meaning}</div>

          {progress && (
            <div className="mt-3">
              {progress.label && (
                <div className="mb-1 text-xs font-medium text-muted">
                  {progress.label}
                </div>
              )}
              <Progress value={progress.value} tone={progress.tone} />
            </div>
          )}

          {children}
        </div>
      </div>
    </Link>
  );
}

function MiniStat({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: string;
  tone?: "ink" | "peach";
}) {
  return (
    <div className="soft-tile px-3 py-2.5">
      <div className="text-[0.7rem] text-muted">{label}</div>
      <div
        className={`mt-0.5 text-sm font-bold num ${
          tone === "peach" ? "text-peach" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Progress({
  value,
  tone = "accent",
}: {
  value: number;
  tone?: ProgressTone;
}) {
  const fill =
    tone === "success"
      ? "progress-fill-success"
      : tone === "warning"
        ? "progress-fill-warning"
        : "progress-fill";
  return (
    <div className="progress-track">
      <div className={fill} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function Chevron() {
  return (
    <span className="mr-0.5 inline-block h-2.5 w-2.5 rotate-45 border-r-2 border-t-2 border-faint" />
  );
}
