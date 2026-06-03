import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { money, signedMoney } from "@/lib/format";
import { loadHabitsWeek } from "@/lib/habits-data";
import { loadFinance } from "@/lib/finance-data";
import { loadGoals } from "@/lib/goals-data";
import { loadDebts } from "@/lib/debts-data";
import { completedInWeek, overallProgress, percentOf } from "@/lib/habits";
import { goalPercent } from "@/lib/goals";
import LocalGreeting from "@/components/LocalGreeting";
import type { Saving } from "@/types/db";

export default async function HomePage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const enabled = ctx.enabledModules;
  const name = ctx.profile?.display_name?.trim();

  // Грузим только то, что нужно для включённых модулей.
  const [week, finance, goalsData, debtsData, savingsRes] = await Promise.all([
    enabled.has("habits") ? loadHabitsWeek() : Promise.resolve(null),
    enabled.has("finance") ? loadFinance("today") : Promise.resolve(null),
    enabled.has("goals") ? loadGoals() : Promise.resolve(null),
    enabled.has("debts") ? loadDebts() : Promise.resolve(null),
    enabled.has("savings")
      ? supabase.from("savings").select("*").eq("is_active", true)
      : Promise.resolve({ data: [] as Saving[] }),
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
          top: items.slice(0, 3),
        };
      })()
    : null;

  const topGoals = goalsData?.goals.slice(0, 2) ?? [];
  const savings = (savingsRes.data ?? []) as Saving[];

  const totalDebt = debtsData?.summary.totalCurrentDebt ?? 0;
  const nextDebt = debtsData?.summary.nextPayment ?? null;
  const totalSavings = savings.reduce(
    (s, v) => s + Number(v.current_amount),
    0,
  );

  const empty = enabled.size === 0;

  return (
    <main className="px-5 pt-safe">
      <header className="mb-5 mt-4">
        <p className="text-sm font-medium text-muted">
          <LocalGreeting name={name} />
        </p>
        <h1 className="mt-1 text-[1.85rem] font-bold leading-tight tracking-normal text-ink">
          Твой ритм сегодня
        </h1>
      </header>

      {!empty && (
        <section className="mb-5 grid grid-cols-2 gap-2">
          {enabled.has("finance") && (
            <>
              <Link href="/finance" className="soft-tile flex min-h-20 flex-col justify-between">
                <span className="text-xs font-medium text-muted">Быстро</span>
                <span className="text-base font-semibold text-ink">+ Доход</span>
              </Link>
              <Link href="/finance" className="soft-tile flex min-h-20 flex-col justify-between">
                <span className="text-xs font-medium text-muted">Быстро</span>
                <span className="text-base font-semibold text-ink">+ Расход</span>
              </Link>
            </>
          )}
          {enabled.has("goals") && (
            <Link href="/goals" className="soft-tile flex min-h-20 flex-col justify-between">
              <span className="text-xs font-medium text-muted">Цели</span>
              <span className="text-base font-semibold text-ink">Пополнить цель</span>
            </Link>
          )}
          {enabled.has("habits") && (
            <Link href="/habits" className="soft-tile flex min-h-20 flex-col justify-between">
              <span className="text-xs font-medium text-muted">Привычки</span>
              <span className="text-base font-semibold text-ink">Отметить</span>
            </Link>
          )}
        </section>
      )}

      {empty && (
        <div className="card text-center">
          <p className="text-muted">
            Пока не выбрано ни одного раздела. Включи нужное в настройках.
          </p>
          <Link href="/settings" className="btn-primary mt-4 inline-flex">
            Открыть настройки
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Привычки */}
        {enabled.has("habits") && (
          <section className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium">Привычки недели</h2>
              {habitSummary && habitSummary.overall !== null && (
                <span className="text-sm font-medium text-accent">
                  {habitSummary.overall}%
                </span>
              )}
            </div>
            {!habitSummary || habitSummary.count === 0 ? (
              <p className="mb-4 text-sm text-muted">
                Пока просто отмечаем факты. Цели можно поставить в понедельник.
              </p>
            ) : (
              <>
                {habitSummary.overall === null && (
                  <p className="mb-3 text-sm text-muted">
                    Пока просто отмечаем факты.
                  </p>
                )}
                <ul className="mb-4 flex flex-col gap-2">
                  {habitSummary.top.map((h) => (
                    <li
                      key={h.name}
                      className="soft-tile flex items-center justify-between"
                    >
                      <span>{h.name}</span>
                      <span className="text-sm text-muted">
                        {h.goal && h.goal > 0
                          ? `${h.done}/${h.goal}${
                              h.pct !== null ? ` · ${h.pct}%` : ""
                            }`
                          : `${h.done} раз`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Link href="/habits" className="btn-primary w-full">
              Открыть привычки
            </Link>
          </section>
        )}

        {/* Финансы */}
        {enabled.has("finance") && (
          <section className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium">Финансы</h2>
              <Link href="/finance" className="text-sm text-accent">
                Подробнее
              </Link>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="soft-tile px-3 py-3">
                <div className="text-xs text-muted">Расходы</div>
                <div className="mt-1 font-bold">
                  {money(finance?.expenseTotal ?? 0, finance?.currency)}
                </div>
              </div>
              <div className="soft-tile px-3 py-3">
                <div className="text-xs text-muted">Доходы</div>
                <div className="mt-1 font-bold">
                  {money(finance?.incomeTotal ?? 0, finance?.currency)}
                </div>
              </div>
              <div className="soft-tile px-3 py-3">
                <div className="text-xs text-muted">Разница</div>
                <div
                  className={`mt-1 font-bold ${
                    (finance?.diff ?? 0) < 0 ? "text-peach" : "text-ink"
                  }`}
                >
                  {signedMoney(finance?.diff ?? 0, finance?.currency)}
                </div>
              </div>
            </div>
            {!finance || finance.transactions.length === 0 ? (
              <p className="mb-4 text-sm text-muted">
                Сегодня пока пусто. Можно заполнить вечером.
              </p>
            ) : null}
            <Link href="/finance" className="btn-primary w-full">
              Открыть финансы
            </Link>
          </section>
        )}

        {/* Цели */}
        {enabled.has("goals") && (
          <section className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium">Цели</h2>
              {goalsData && goalsData.activeCount > 0 && (
                <span className="text-sm text-muted">
                  накоплено {money(goalsData.totalSaved, goalsData.currency)}
                </span>
              )}
            </div>
            {topGoals.length === 0 ? (
              <p className="mb-4 text-sm text-muted">
                Можно добавить первую цель, когда захочется копить на что-то
                конкретное.
              </p>
            ) : (
              <ul className="mb-4 flex flex-col gap-3">
                {topGoals.map((g) => {
                  const pct = goalPercent(
                    Number(g.current_amount),
                    Number(g.target_amount),
                  );
                  return (
                    <li key={g.id}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{g.name}</span>
                        <span className="text-muted">{pct}%</span>
                      </div>
                      <Progress value={Math.min(100, pct)} />
                    </li>
                  );
                })}
              </ul>
            )}
            <Link href="/goals" className="btn-primary w-full">
              {topGoals.length === 0 ? "Открыть цели" : "Пополнить"}
            </Link>
          </section>
        )}

        {/* Долги */}
        {enabled.has("debts") && (
          <section className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium">Долги</h2>
              <Link href="/debts" className="text-sm text-accent">
                Все
              </Link>
            </div>
            <div className="mb-1 text-2xl font-semibold">
              {money(totalDebt)}
            </div>
            <div className="mb-3 text-xs text-muted">Осталось закрыть</div>
            {debtsData && (
              <>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted">Прогресс закрытия</span>
                  <span className="font-medium">
                    {debtsData.summary.overallPaidPercent}%
                  </span>
                </div>
                <Progress value={debtsData.summary.overallPaidPercent} />
                <div className="mt-3 rounded-[1.15rem] bg-bg/70 px-3 py-2 text-sm">
                  Минимальные платежи:{" "}
                  <span className="font-medium">
                    {money(debtsData.summary.monthlyMinimumTotal)}
                  </span>
                </div>
              </>
            )}
            <p className="mb-4 text-sm text-muted">
              {nextDebt
                ? `Ближайший платёж: ${money(
                    Number(nextDebt.minimum_payment),
                  )} · ${nextDebt.next_payment_date}`
                : "Сроки платежей пока не заданы."}
            </p>
            <Link href="/debts" className="btn-ghost w-full">
              Внести платёж
            </Link>
          </section>
        )}

        {/* Сбережения */}
        {enabled.has("savings") && (
          <section className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium">Сбережения</h2>
              <Link href="/savings" className="text-sm text-accent">
                Подробнее
              </Link>
            </div>
            <div className="mb-1 text-2xl font-semibold">
              {money(totalSavings)}
            </div>
            <p className="mb-4 text-sm text-muted">
              Спокойная подушка на всякий случай.
            </p>
            <Link href="/savings" className="btn-ghost w-full">
              Добавить
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
