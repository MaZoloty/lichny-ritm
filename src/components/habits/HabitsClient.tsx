"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import type { WeekData, HabitWeek } from "@/lib/habits-data";
import {
  DAY_LABELS,
  STATUS_LABEL,
  type HabitStatus,
  completedInWeek,
  countByWeek,
  dailyStreak,
  overallProgress,
  percentOf,
  softWeekGoal,
  statusOf,
  weeklyStreak,
} from "@/lib/habits";
import { saveWeeklyGoals, toggleHabitLog } from "../../../app/(app)/habits/actions";
import GoalsModal, { type GoalHabit } from "./GoalsModal";
import HabitFormModal, { type EditingHabit } from "./HabitFormModal";

type CompletedMap = Record<string, string[]>;

const STATUS_STYLE: Record<HabitStatus, string> = {
  soft: "bg-line text-muted",
  in_progress: "bg-peach/20 text-ink",
  moving: "bg-accent/15 text-accent",
  done: "bg-green/30 text-ink",
  over: "bg-green/40 text-ink",
};

export default function HabitsClient({ data }: { data: WeekData }) {
  const { weekDatesISO, currentWeekStartISO, prevWeekStartISO, todayISO } = data;

  const base: CompletedMap = useMemo(
    () =>
      Object.fromEntries(data.habits.map((h) => [h.id, h.completedDates])),
    [data.habits],
  );

  const [completed, addOptimistic] = useOptimistic(
    base,
    (state: CompletedMap, action: { habitId: string; date: string }) => {
      const set = new Set(state[action.habitId] ?? []);
      set.has(action.date) ? set.delete(action.date) : set.add(action.date);
      return { ...state, [action.habitId]: Array.from(set) };
    },
  );

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EditingHabit | null>(null);

  function toggle(habitId: string, dateISO: string) {
    if (dateISO > todayISO) return; // будущие дни не отмечаем
    setError(null);
    startTransition(async () => {
      addOptimistic({ habitId, date: dateISO });
      const res = await toggleHabitLog(habitId, dateISO);
      if (res?.error) setError(res.error);
    });
  }

  function persistGoals(goals: { habitId: string; weeklyGoal: number }[]) {
    setError(null);
    startTransition(async () => {
      const res = await saveWeeklyGoals(goals);
      if (res?.error) setError(res.error);
    });
  }

  // Производные значения для общего прогресса и блока понедельника.
  const overall = overallProgress(
    data.habits.map((h) => ({
      completed: completedInWeek(completed[h.id] ?? [], weekDatesISO),
      goal: h.goals[currentWeekStartISO] ?? null,
    })),
  );
  const anyGoals = data.habits.some(
    (h) => (h.goals[currentWeekStartISO] ?? 0) > 0,
  );
  const needsGoals =
    data.habits.length > 0 &&
    data.habits.some((h) => !(currentWeekStartISO in h.goals));

  const goalHabits: GoalHabit[] = data.habits.map((h) => ({
    id: h.id,
    name: h.name,
    currentGoal: h.goals[currentWeekStartISO] ?? null,
    prevGoal: h.goals[prevWeekStartISO] ?? null,
  }));

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(h: HabitWeek) {
    setEditing({
      id: h.id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      track_daily_streak: h.track_daily_streak,
      track_weekly_streak: h.track_weekly_streak,
    });
    setFormOpen(true);
  }

  return (
    <main className="px-5 pb-8 pt-safe">
      <header className="mb-5 mt-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[1.85rem] font-bold leading-tight tracking-normal text-ink">
              Привычки
            </h1>
            <p className="mt-1 text-sm text-muted">{data.weekLabel}</p>
          </div>
          <button onClick={openAdd} className="btn-ghost px-4 py-2 text-sm">
            + привычка
          </button>
        </div>

        {data.habits.length > 0 && (
          <div className="mt-4">
            {overall === null ? (
              <p className="text-sm text-muted">
                Пока просто отмечаем факты. Без плана и оценки.
              </p>
            ) : (
              <>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted">Прогресс недели</span>
                  <span className="font-medium">{overall}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${overall}%` }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Блок понедельника / постановки целей */}
      {needsGoals && (
        <section className="card mb-4">
          <h2 className="font-medium">Поставим цели на эту неделю?</h2>
          <p className="mb-3 mt-1 text-sm text-muted">
            Можно не ставить — тогда просто отмечаем факты.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setGoalsOpen(true)}
              className="btn-primary w-full"
            >
              Поставить цели
            </button>
            <div className="flex gap-2">
              <button
                disabled={pending}
                onClick={() =>
                  persistGoals(
                    data.habits.map((h) => ({
                      habitId: h.id,
                      weeklyGoal: h.goals[prevWeekStartISO] ?? 0,
                    })),
                  )
                }
                className="btn-ghost flex-1 text-sm"
              >
                Повторить прошлую неделю
              </button>
              <button
                disabled={pending}
                onClick={() =>
                  persistGoals(
                    data.habits.map((h) => ({
                      habitId: h.id,
                      weeklyGoal: softWeekGoal(
                        h.name,
                        h.goals[prevWeekStartISO] ?? null,
                      ),
                    })),
                  )
                }
                className="btn-ghost flex-1 text-sm"
              >
                Мягкая неделя
              </button>
            </div>
          </div>
        </section>
      )}

      {!needsGoals && data.habits.length > 0 && (
        <button
          onClick={() => setGoalsOpen(true)}
          className="mb-4 text-sm text-accent"
        >
          Изменить цели недели
        </button>
      )}

      {error && (
        <p className="mb-4 rounded-2xl bg-peach/15 px-4 py-3 text-sm">{error}</p>
      )}

      {/* Карточки привычек */}
      {data.habits.length === 0 ? (
        <div className="card text-center text-muted">
          <p>Привычек пока нет. Добавь первую — маленькими шагами.</p>
          <button onClick={openAdd} className="btn-primary mt-4 inline-flex">
            + привычка
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.habits.map((h) => {
            const set = new Set(completed[h.id] ?? []);
            const goal = h.goals[currentWeekStartISO] ?? null;
            const done = completedInWeek(set, weekDatesISO);
            const pct = percentOf(done, goal);
            const status = statusOf(done, goal);
            const daily = h.track_daily_streak
              ? dailyStreak(set, todayISO)
              : 0;
            const weekly = h.track_weekly_streak
              ? weeklyStreak(
                  countByWeek(set),
                  new Map(Object.entries(h.goals)),
                  currentWeekStartISO,
                )
              : 0;

            return (
              <article key={h.id} className="card">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
                      style={{ backgroundColor: (h.color ?? "#8B5CF6") + "22" }}
                    >
                      {h.icon ?? "✦"}
                    </span>
                    <button
                      onClick={() => openEdit(h)}
                      className="text-left font-medium"
                    >
                      {h.name}
                    </button>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${STATUS_STYLE[status]}`}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </div>

                {goal && goal > 0 ? (
                  <p className="mb-3 text-sm text-muted">
                    Цель: {goal} раз в неделю · {done}/{goal}
                    {pct !== null && ` · ${pct}%`}
                    {pct !== null && pct > 100 && " · перевыполнение"}
                  </p>
                ) : (
                  <p className="mb-3 text-sm text-muted">
                    Просто отмечаем факты · сделано: {done} раз
                  </p>
                )}

                <DayDots
                  weekDatesISO={weekDatesISO}
                  set={set}
                  todayISO={todayISO}
                  color={h.color ?? "#8B5CF6"}
                  onToggle={(d) => toggle(h.id, d)}
                />

                {(daily > 0 || weekly > 0) && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    {daily > 0 && <span>🔥 Стрик: {daily} дн.</span>}
                    {weekly > 0 && (
                      <span>✓ {weekly} нед. подряд цель закрыта</span>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {goalsOpen && (
        <GoalsModal
          open={goalsOpen}
          onClose={() => setGoalsOpen(false)}
          habits={goalHabits}
        />
      )}
      {formOpen && (
        <HabitFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          editing={editing}
        />
      )}
    </main>
  );
}

function DayDots({
  weekDatesISO,
  set,
  todayISO,
  color,
  onToggle,
}: {
  weekDatesISO: string[];
  set: Set<string>;
  todayISO: string;
  color: string;
  onToggle: (dateISO: string) => void;
}) {
  return (
    <div className="flex justify-between">
      {weekDatesISO.map((d, i) => {
        const on = set.has(d);
        const isToday = d === todayISO;
        const isFuture = d > todayISO;
        return (
          <button
            key={d}
            onClick={() => onToggle(d)}
            disabled={isFuture}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-[11px] text-muted">{DAY_LABELS[i]}</span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white/75 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition ${
                isFuture ? "opacity-40" : ""
              } ${isToday ? "ring-2 ring-accent ring-offset-1" : ""}`}
              style={
                on
                  ? { backgroundColor: color, borderColor: color, color: "#fff" }
                  : { borderColor: "#EEE8E0" }
              }
            >
              {on ? "✓" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
