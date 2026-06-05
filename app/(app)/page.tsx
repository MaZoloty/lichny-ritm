import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Coins,
  CreditCard,
  Flag,
  Landmark,
  PiggyBank,
  Sparkles,
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
import DailyPhrase from "@/components/DailyPhrase";
import TodayReminders from "@/components/reminders/TodayReminders";

type ProgressTone = "accent" | "success" | "warning";
type CardTone = "violet" | "green" | "peach" | "milk";

export default async function HomePage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");

  const enabled = ctx.enabledModules;
  const name = ctx.profile?.display_name?.trim();

  const [week, finance, goalsData, debtsData, savingsData] = await Promise.all([
    enabled.has("habits") ? loadHabitsWeek() : Promise.resolve(null),
    enabled.has("finance") ? loadFinance("today") : Promise.resolve(null),
    enabled.has("goals") ? loadGoals() : Promise.resolve(null),
    enabled.has("debts") ? loadDebts() : Promise.resolve(null),
    enabled.has("savings") ? loadSavings() : Promise.resolve(null),
  ]);

  const habitSummary = week
    ? (() => {
        const items = week.habits.map((habit) => {
          const done = completedInWeek(habit.completedDates, week.weekDatesISO);
          const goal = habit.goals[week.currentWeekStartISO] ?? null;
          return { completed: done, goal, pct: percentOf(done, goal) };
        });
        return {
          overall: overallProgress(items),
          count: items.length,
          completedToday: week.habits.filter((habit) =>
            habit.completedDates.includes(week.todayISO),
          ).length,
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
    <main className="px-5 pb-36 pt-safe">
      <section className="relative -mx-5 mb-5 overflow-hidden bg-[linear-gradient(180deg,#FFF8EF_0%,#FAF7F2_78%)] px-5 pb-5 pt-5">
        <div className="relative">
          <p className="mb-2 text-sm font-medium text-muted">
            {name ? `Привет, ${name}` : "Привет"}
          </p>
          <div className="[&>p]:mb-3 [&>p]:text-[0.78rem] [&>p]:leading-5 [&>p]:text-muted/75">
            <DailyPhrase />
          </div>
          <h1 className="max-w-[18rem] text-[2.25rem] font-semibold leading-[1.02] tracking-tight text-ink">
            В своём ритме
          </h1>
          <p className="mt-3 max-w-[18rem] text-sm leading-6 text-muted">
            Маленькие действия складываются в спокойную систему.
          </p>
        </div>
      </section>

      {enabled.has("reminders") && <TodayReminders />}

      {!empty && (
        <section className="mb-6">
          <div className="mb-3 flex items-end justify-between px-1">
            <div>
              <h2 className="h2">Действия</h2>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {enabled.has("finance") && (
              <>
                <QuickAction
                  href="/finance"
                  icon={ArrowDownLeft}
                  label="Доход"
                  tone="green"
                />
                <QuickAction
                  href="/finance"
                  icon={ArrowUpRight}
                  label="Расход"
                  tone="peach"
                />
              </>
            )}
            {enabled.has("habits") && (
              <QuickAction
                href="/habits"
                icon={CheckCircle2}
                label="Отметить"
                tone="violet"
              />
            )}
            {enabled.has("goals") && (
              <QuickAction
                href="/goals"
                icon={Target}
                label="Пополнить"
                tone="violet"
              />
            )}
          </div>
        </section>
      )}

      {empty && (
        <section className="summary-card text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-accent-soft text-accent">
            <Sparkles size={24} strokeWidth={1.9} />
          </div>
          <h2 className="h2">Соберём систему под тебя</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Пока не выбран ни один раздел. Включи нужное в настройках.
          </p>
          <Link href="/settings" className="btn-primary mt-5 w-full">
            Открыть настройки
          </Link>
        </section>
      )}

      {!empty && (
        <section>
          <div className="grid grid-cols-2 gap-3">
              {enabled.has("finance") && (
                <ModuleWidget
                  href="/finance"
                  icon={Wallet}
                  title="Финансы"
                  metric={money(totalBalance, finance?.currency)}
                  text="Доходы и расходы под рукой."
                  tone="violet"
                  illustration="finance"
                >
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    <MiniStat
                      label="Доходы"
                      value={money(finance?.incomeTotal ?? 0, finance?.currency)}
                      tone="green"
                    />
                    <MiniStat
                      label="Расходы"
                      value={money(finance?.expenseTotal ?? 0, finance?.currency)}
                      tone="peach"
                    />
                    <MiniStat
                      label="Разница"
                      value={signedMoney(finance?.diff ?? 0, finance?.currency)}
                    />
                  </div>
                </ModuleWidget>
              )}

              {enabled.has("habits") && (
                <ModuleWidget
                  href="/habits"
                  icon={CalendarCheck}
                  title="Привычки"
                  metric={
                    !habitSummary || habitSummary.count === 0
                      ? "Старт"
                      : habitSummary.overall === null
                        ? `${habitSummary.completedToday} сегодня`
                        : `${habitSummary.overall}% недели`
                  }
                  text={
                    habitSummary?.overall === null
                      ? "Пока просто отмечаем факты"
                      : "Ритм недели"
                  }
                  tone="green"
                  illustration="habits"
                  progress={
                    habitSummary?.overall !== null &&
                    habitSummary?.overall !== undefined
                      ? { value: Math.min(100, habitSummary.overall), tone: "success" }
                      : undefined
                  }
                />
              )}

              {enabled.has("goals") && (
                <ModuleWidget
                  href="/goals"
                  icon={Target}
                  title="Цели"
                  metric={money(goalsData?.totalSaved ?? 0, goalsData?.currency)}
                  text={topGoal ? topGoal.name : "Можно добавить первую цель"}
                  tone="violet"
                  illustration="goals"
                  progress={
                    topGoal
                      ? { value: Math.min(100, topGoalPct), tone: "accent" }
                      : undefined
                  }
                  className={enabled.size % 2 === 1 ? "col-span-2" : undefined}
                />
              )}

              {enabled.has("debts") && (
                <ModuleWidget
                  href="/debts"
                  icon={Landmark}
                  title="Долги"
                  metric={money(totalDebt)}
                  text={
                    nextDebt
                      ? `Ближайший платёж ${money(Number(nextDebt.minimum_payment))}`
                      : "Осталось закрыть"
                  }
                  tone="peach"
                  illustration="debts"
                  progress={
                    debtsData
                      ? {
                          value: debtsData.summary.overallPaidPercent,
                          tone: "success",
                        }
                      : undefined
                  }
                />
              )}

              {enabled.has("savings") && (
                <ModuleWidget
                  href="/savings"
                  icon={PiggyBank}
                  title="Сбережения"
                  metric={money(totalSavings)}
                  text={
                    savingsData && savingsData.emergencyTargetAmount > 0
                      ? `Подушка ${savingsData.emergencyProgress}%`
                      : "Резерв и накопления"
                  }
                  tone="milk"
                  illustration="savings"
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

function QuickAction({
  href,
  icon: Icon,
  label,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  tone: CardTone;
}) {
  return (
    <Link
      href={href}
      className={`group flex h-[4.05rem] flex-col items-center justify-center rounded-[1.2rem] border px-1.5 py-2 text-center shadow-soft transition active:scale-[0.98] ${toneSurface(tone)}`}
    >
      <span
        className={`mb-1.5 grid h-8 w-8 place-items-center rounded-full ${iconSurface(tone)}`}
      >
        <Icon size={17} strokeWidth={2} />
      </span>
      <span className="block text-[0.72rem] font-medium leading-tight text-ink">
        {label}
      </span>
    </Link>
  );
}

function ModuleWidget({
  href,
  icon: Icon,
  title,
  metric,
  text,
  tone,
  progress,
  children,
  className,
  illustration,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  metric: string;
  text: string;
  tone: CardTone;
  progress?: { value: number; tone?: ProgressTone };
  children?: React.ReactNode;
  className?: string;
  illustration: "finance" | "habits" | "goals" | "debts" | "savings";
}) {
  return (
    <Link
      href={href}
      className={`relative block overflow-hidden rounded-[1.45rem] border bg-white/80 p-3.5 shadow-soft transition active:scale-[0.99] ${widgetTone(tone)} ${className ?? ""}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/40 blur-2xl" />
      <div className="relative">
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <span className={`grid h-9 w-9 place-items-center rounded-[1rem] ${iconSurface(tone)}`}>
            <Icon size={18} strokeWidth={1.9} />
          </span>
          <ModuleIllustration type={illustration} />
        </div>
        <h3 className="text-[0.95rem] font-medium text-ink">{title}</h3>
        <div className="num mt-1.5 break-words text-[1.35rem] font-bold leading-none text-ink">
          {metric}
        </div>
        <p className="mt-1.5 truncate text-xs leading-5 text-muted">{text}</p>
        {progress && (
          <div className="mt-3">
            <Progress value={progress.value} tone={progress.tone} />
          </div>
        )}
        {children}
      </div>
    </Link>
  );
}

function ModuleIllustration({
  type,
}: {
  type: "finance" | "habits" | "goals" | "debts" | "savings";
}) {
  if (type === "finance") {
    return (
      <span className="relative h-10 w-12 shrink-0">
        <span className="absolute bottom-0 right-0 h-8 w-11 rounded-xl bg-accent-soft shadow-[0_10px_24px_rgba(139,92,246,0.12)]" />
        <span className="absolute bottom-2 right-2 h-1 w-5 rounded-full bg-accent/25" />
        <CreditCard
          size={20}
          strokeWidth={1.8}
          className="absolute right-3 top-2 text-accent"
        />
      </span>
    );
  }

  if (type === "habits") {
    return (
      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-soft">
        <span className="absolute inset-1 rounded-full border border-green/30" />
        <CheckCircle2 size={19} strokeWidth={1.8} className="text-ink" />
      </span>
    );
  }

  if (type === "goals") {
    return (
      <span className="relative h-10 w-12 shrink-0">
        <span className="absolute bottom-1 right-0 h-7 w-11 rounded-[1rem] bg-accent-soft" />
        <span className="absolute bottom-2 right-3 h-1 w-6 rounded-full bg-accent/20" />
        <Flag
          size={19}
          strokeWidth={1.8}
          className="absolute right-4 top-2 text-accent"
        />
      </span>
    );
  }

  if (type === "debts") {
    return (
      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-peach-soft">
        <CalendarDays size={19} strokeWidth={1.8} className="text-ink" />
        <span className="absolute bottom-2 h-1 w-4 rounded-full bg-peach/35" />
      </span>
    );
  }

  return (
    <span className="relative h-10 w-12 shrink-0">
      <span className="absolute bottom-0 right-1 h-8 w-10 rounded-2xl bg-accent-soft" />
      <Coins
        size={20}
        strokeWidth={1.8}
        className="absolute right-3 top-2 text-accent"
      />
      <span className="absolute bottom-1 right-0 h-4 w-4 rounded-full bg-green-soft" />
    </span>
  );
}

function MiniStat({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: string;
  tone?: "ink" | "green" | "peach";
}) {
  const color =
    tone === "green" ? "text-ink" : tone === "peach" ? "text-peach" : "text-ink";
  return (
    <div className="rounded-[1rem] border border-white/70 bg-white/60 px-2.5 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className={`num mt-1 truncate text-sm font-bold ${color}`}>
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

function toneSurface(tone: CardTone) {
  if (tone === "green") return "border-green/30 bg-green-soft";
  if (tone === "peach") return "border-peach/25 bg-peach-soft";
  if (tone === "milk") return "border-line bg-milk";
  return "border-accent/15 bg-[linear-gradient(145deg,#FFFFFF_0%,#F3EEFF_100%)]";
}

function widgetTone(tone: CardTone) {
  if (tone === "green") return "border-green/25 bg-white";
  if (tone === "peach") return "border-peach/25 bg-white";
  if (tone === "milk") return "border-line bg-white";
  return "border-accent/15 bg-white";
}

function iconSurface(tone: CardTone) {
  if (tone === "green") return "bg-white/65 text-ink";
  if (tone === "peach") return "bg-white/65 text-ink";
  if (tone === "milk") return "bg-accent-soft text-accent";
  return "bg-accent text-white";
}
