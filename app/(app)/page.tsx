import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarCheck,
  ChevronRight,
  Landmark,
  PiggyBank,
  Settings,
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
import {
  BankCardIllustration,
  DebtPaymentIllustration,
  GoalMountainIllustration,
  HabitProgressIllustration,
  PlantSceneIllustration,
  SavingsJarIllustration,
} from "@/components/home/HomeIllustrations";
import TodayReminders from "@/components/reminders/TodayReminders";

type ProgressTone = "accent" | "success" | "warning";
type CardTone = "violet" | "green" | "peach" | "milk" | "sky";

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
  const dateLabel = new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const totalHabits = habitSummary?.count ?? 0;
  const completedToday = habitSummary?.completedToday ?? 0;
  const pctToday = totalHabits > 0
    ? Math.round((completedToday / totalHabits) * 100)
    : 0;

  return (
    <main className="px-5 pb-56 pt-safe">
      <section className="relative -mx-5 overflow-hidden px-5 pb-0 pt-4">
        <div className="page-ambient-glow" />

        <div className="relative z-10 flex items-start justify-between gap-4 pt-1">
          <div className="min-w-0">
            <p className="truncate text-[20px] font-semibold leading-6 text-[#2F2F35]">
              {name ? `Привет, ${name}` : "Привет"}
            </p>
            <p className="mt-1 text-[15px] capitalize leading-5 text-[#6F6D79]">
              {dateLabel}
            </p>
          </div>

          <Link
            href="/settings"
            aria-label="Настройки"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#EDE7DF] bg-white/88 text-[#6F6D79] shadow-soft transition active:scale-95"
          >
            <Settings size={20} strokeWidth={1.9} />
          </Link>
        </div>

        <div className="relative z-10 min-h-[198px] pb-0 pt-6">
          <div className="relative z-20 max-w-[250px]">
            <div className="text-[15px] italic leading-6 text-[#7F7D8C] [&>p]:m-0">
              <DailyPhrase />
            </div>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.04] text-[#2F2F35]">
              В своём ритме
            </h1>
            <p className="mt-3 max-w-[236px] text-[16px] leading-6 text-[#6F6D79]">
              Маленькие действия складываются в спокойную систему.
            </p>
          </div>
          <PlantSceneIllustration className="pointer-events-none absolute right-[-2rem] top-[30px] z-0 w-[230px] origin-top-right scale-[0.66] opacity-70 min-[410px]:right-[-0.5rem]" />
        </div>
      </section>

      {enabled.has("habits") && (
        <RhythmCard
          completedToday={completedToday}
          totalHabits={totalHabits}
          pctToday={pctToday}
        />
      )}

      {enabled.has("reminders") && (
        <div className="mt-6">
          <TodayReminders />
        </div>
      )}

      {empty && (
        <section className="mt-6 rounded-[30px] border border-[#EDE7DF] bg-white/90 p-5 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#EFEAFE] text-[#8B5CF6]">
            <Sparkles size={24} strokeWidth={1.9} />
          </div>
          <h2 className="text-lg font-semibold text-[#2F2F35]">
            Соберём систему под тебя
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#7C7A88]">
            Пока не выбран ни один модуль. Включи нужное в настройках.
          </p>
          <Link href="/settings" className="btn-primary mt-5 w-full">
            Открыть настройки
          </Link>
        </section>
      )}

      {!empty && (
        <section className="mt-7 grid grid-cols-2 gap-3.5">
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
              <div className="relative z-20 mt-4 grid grid-cols-3 gap-1.5">
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
              tone="sky"
              illustration="savings"
              progress={
                savingsData && savingsData.emergencyTargetAmount > 0
                  ? { value: savingsData.emergencyProgress, tone: "accent" }
                  : undefined
              }
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
                  ? `Платёж ${money(Number(nextDebt.minimum_payment))}`
                  : "Осталось закрыть"
              }
              tone="peach"
              illustration="debts"
              progress={
                debtsData
                  ? {
                      value: debtsData.summary.overallPaidPercent,
                      tone: "warning",
                    }
                  : undefined
              }
            />
          )}
        </section>
      )}
    </main>
  );
}

function RhythmCard({
  completedToday,
  totalHabits,
  pctToday,
}: {
  completedToday: number;
  totalHabits: number;
  pctToday: number;
}) {
  return (
    <section className="relative z-10 -mt-2 rounded-[28px] border border-[#EDE7DF] bg-white/92 p-4 shadow-card">
      <div className="flex items-center gap-4">
        <div className="relative grid shrink-0 place-items-center">
          <RingProgress value={pctToday} size={76} />
          <span className="num absolute text-[18px] font-semibold text-[#2F2F35]">
            {pctToday}%
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold leading-6 text-[#2F2F35]">
            Ритм сегодня
          </h2>
          <p className="mt-0.5 text-[14px] leading-5 text-[#8A8794]">
            {completedToday} из {totalHabits} {pluralHabits(totalHabits)} отмечено
          </p>
          <Link
            href="/habits"
            className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-[#8B5CF6]"
          >
            Отметить
            <ChevronRight size={17} strokeWidth={2.3} />
          </Link>
        </div>
      </div>
    </section>
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
  illustration: "finance" | "habits" | "goals" | "debts" | "savings";
}) {
  return (
    <Link
      href={href}
      className={`relative isolate min-h-[184px] overflow-hidden rounded-[28px] border p-3 shadow-card transition active:scale-[0.99] ${widgetSurface(tone)}`}
    >
      <div className="relative z-20">
        <div className="flex min-w-0 items-center gap-1.5 pr-6">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${moduleIconSurface(tone)}`}
            >
              <Icon size={16} strokeWidth={1.9} />
            </span>
            <h3 className="min-w-0 whitespace-nowrap text-[14px] font-semibold text-[#2F2F35] min-[410px]:text-[15px]">
              {title}
            </h3>
          </div>
        </div>
        <div className="num mt-6 break-words text-[26px] font-semibold leading-none text-[#2F2F35]">
          {metric}
        </div>
        <p className="mt-2 max-w-[122px] text-[14px] leading-5 text-[#7C7A88]">
          {text}
        </p>
      </div>

      <ModuleIllustration type={illustration} />

      <div className="relative z-20">{children}</div>

      {progress && (
        <div className="absolute bottom-4 left-3 right-3 z-20">
          <Progress value={progress.value} tone={progress.tone} />
        </div>
      )}
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
      <BankCardIllustration className="pointer-events-none absolute right-2 top-[86px] z-0 w-[64px] opacity-58" />
    );
  }

  if (type === "habits") {
    return (
      <HabitProgressIllustration className="pointer-events-none absolute bottom-7 right-2 z-0 w-[68px] opacity-62" />
    );
  }

  if (type === "goals") {
    return (
      <GoalMountainIllustration className="pointer-events-none absolute bottom-8 right-2 z-0 w-[72px] opacity-60" />
    );
  }

  if (type === "debts") {
    return (
      <DebtPaymentIllustration className="pointer-events-none absolute bottom-10 right-3 z-0 w-[58px] opacity-58" />
    );
  }

  return (
    <SavingsJarIllustration className="pointer-events-none absolute bottom-7 right-2 z-0 w-[66px] opacity-62" />
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
    tone === "green"
      ? "text-[#3F9E5A]"
      : tone === "peach"
        ? "text-[#EF6F63]"
        : "text-[#2F2F35]";
  return (
    <div className="min-w-0 rounded-[14px] bg-white/68 px-1 py-2 shadow-[0_10px_25px_-20px_rgba(47,47,53,0.55)]">
      <div className="text-center text-[9px] leading-none text-[#8A8794]">{label}</div>
      <div className={`num mt-1.5 truncate text-center text-[12px] font-semibold ${color}`}>
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

function RingProgress({
  value,
  size = 104,
}: {
  value: number;
  size?: number;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const v = Math.min(100, Math.max(0, value));
  const offset = circumference * (1 - v / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#DDF3DD"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#74C984"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function widgetSurface(tone: CardTone) {
  if (tone === "green") return "border-[#B9E9C1] bg-[linear-gradient(145deg,#FBFFFB_0%,#E7F9EA_100%)]";
  if (tone === "peach") return "border-[#F1C2B8] bg-[linear-gradient(145deg,#FFFDFC_0%,#FFE9E3_100%)]";
  if (tone === "sky") return "border-[#B8DDF8] bg-[linear-gradient(145deg,#FBFEFF_0%,#E2F3FF_100%)]";
  return "border-[#D4BEFF] bg-[linear-gradient(145deg,#FFFDFB_0%,#F1E8FF_100%)]";
}

function moduleIconSurface(tone: CardTone) {
  if (tone === "green") return "bg-[#74C984] text-white";
  if (tone === "peach") return "bg-[#F08D7F] text-white";
  if (tone === "sky") return "bg-[#70B9EE] text-white";
  return "bg-[#9B63F4] text-white";
}

function pluralHabits(n: number): string {
  return n % 10 === 1 && n % 100 !== 11 ? "привычки" : "привычек";
}
