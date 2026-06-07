"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { CalendarCheck, CheckCircle2, Plus, Sparkles, Target } from "lucide-react";
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
  soft: "bg-[#F2ECE4] text-[#7C7A88]",
  in_progress: "bg-[#FFE0DA] text-[#D96E61]",
  moving: "bg-[#E8DAFF] text-[#7C3AED]",
  done: "bg-[#D2F4D8] text-[#2F9E52]",
  over: "bg-[#BFF0CA] text-[#248A43]",
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
    <main className="px-5 pb-56 pt-safe">
      <header className="relative -mx-5 overflow-hidden px-5 pb-4 pt-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_16%,rgba(116,201,132,0.38),transparent_30%),radial-gradient(circle_at_22%_72%,rgba(155,99,244,0.36),transparent_34%),radial-gradient(circle_at_72%_78%,rgba(240,141,127,0.22),transparent_30%),linear-gradient(180deg,rgba(255,253,251,0.92),rgba(250,247,242,0))]" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#7C7A88]">
              {data.weekLabel}
            </p>
            <h1 className="mt-1 text-[34px] font-semibold leading-[1.04] text-[#2F2F35]">
              Привычки
            </h1>
            <p className="mt-3 max-w-[16rem] text-[15px] leading-6 text-[#6F6D79]">
              Отмечай факты спокойно. Ритм собирается из повторений.
            </p>
          </div>

          <button
            onClick={openAdd}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#D9C6FF] bg-[#F1E8FF] text-[#7C3AED] shadow-soft transition active:scale-95"
            aria-label="Добавить привычку"
          >
            <Plus size={22} strokeWidth={2} />
          </button>
        </div>

        {data.habits.length > 0 && (
          <div className="relative z-10 mt-6 rounded-[28px] border border-[#CDECCF] bg-[linear-gradient(145deg,#FFFFFF_0%,#ECFAEF_58%,#F4EDFF_100%)] p-4 shadow-card">
            {overall === null ? (
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-[#E8DAFF] text-[#7C3AED]">
                  <Sparkles size={21} strokeWidth={1.9} />
                </span>
                <div>
                  <h2 className="text-[17px] font-semibold text-[#2F2F35]">
                    Мягкая неделя
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-[#7C7A88]">
                    Пока просто отмечаем факты. Без плана и оценки.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="relative grid shrink-0 place-items-center">
                  <WeekRingProgress value={overall} size={82} />
                  <span className="num absolute text-[18px] font-semibold text-[#2F2F35]">
                    {overall}%
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#48B96A] text-white">
                      <CalendarCheck size={16} strokeWidth={1.9} />
                    </span>
                    <h2 className="text-[18px] font-semibold text-[#2F2F35]">
                      Прогресс недели
                    </h2>
                  </div>
                  <p className="mt-1.5 text-sm text-[#7C7A88]">
                    Маленькие отметки складываются в понятный ритм.
                  </p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#EDE7DF]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#7C3AED_0%,#48B96A_100%)] transition-all"
                      style={{ width: `${overall}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Блок понедельника / постановки целей */}
      {needsGoals && (
        <section className="mb-4 rounded-[28px] border border-[#CDB7FF] bg-[linear-gradient(145deg,#FFFDFB_0%,#EFE4FF_62%,#EAF8ED_100%)] p-4 shadow-card">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8B5CF6] text-white">
              <Target size={18} strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="font-semibold text-[#2F2F35]">
                Поставим цели на эту неделю?
              </h2>
              <p className="mt-1 text-sm text-[#7C7A88]">
                Можно не ставить — тогда просто отмечаем факты.
              </p>
            </div>
          </div>
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
          className="mb-4 inline-flex rounded-full bg-[#E8DAFF] px-4 py-2 text-sm font-semibold text-[#7C3AED]"
        >
          Изменить цели недели
        </button>
      )}

      {error && (
        <p className="mb-4 rounded-[22px] border border-[#F3D7D0] bg-[#FFE9E3] px-4 py-3 text-sm text-[#C96F65]">{error}</p>
      )}

      {/* Карточки привычек */}
      {data.habits.length === 0 ? (
        <div className="rounded-[30px] border border-[#D9C6FF] bg-[linear-gradient(145deg,#FFFFFF_0%,#F1E8FF_100%)] p-5 text-center text-[#7C7A88] shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#E8DAFF] text-[#7C3AED]">
            <Sparkles size={24} strokeWidth={1.9} />
          </div>
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
              <article
                key={h.id}
                className="rounded-[28px] border border-[#E0D5FF] bg-[linear-gradient(145deg,#FFFFFF_0%,#FBF7FF_55%,#F3FFF5_100%)] p-4 shadow-card"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-white shadow-[0_14px_28px_-20px_rgba(47,47,53,0.85)]"
                      style={{ backgroundColor: h.color ?? "#8B5CF6" }}
                    >
                      {h.icon ? h.icon : <CheckCircle2 size={20} strokeWidth={2} />}
                    </span>
                    <button
                      onClick={() => openEdit(h)}
                      className="min-w-0 text-left text-[17px] font-semibold leading-snug text-[#2F2F35]"
                    >
                      {h.name}
                    </button>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[status]}`}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </div>

                {goal && goal > 0 ? (
                  <p className="mb-3 text-sm leading-5 text-[#7C7A88]">
                    Цель: {goal} раз в неделю · {done}/{goal}
                    {pct !== null && ` · ${pct}%`}
                    {pct !== null && pct > 100 && " · перевыполнение"}
                  </p>
                ) : (
                  <p className="mb-3 text-sm leading-5 text-[#7C7A88]">
                    Просто отмечаем факты · сделано: {done} раз
                  </p>
                )}

                {pct !== null && (
                  <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#EDE7DF]">
                    <div
                      className="h-full rounded-full shadow-[0_6px_14px_-10px_rgba(47,47,53,0.65)] transition-all"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        backgroundColor: h.color ?? "#8B5CF6",
                      }}
                    />
                  </div>
                )}

                <DayDots
                  weekDatesISO={weekDatesISO}
                  set={set}
                  todayISO={todayISO}
                  color={h.color ?? "#8B5CF6"}
                  onToggle={(d) => toggle(h.id, d)}
                />

                {(daily > 0 || weekly > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#7C7A88]">
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
    <div className="grid grid-cols-7 gap-1.5">
      {weekDatesISO.map((d, i) => {
        const on = set.has(d);
        const isToday = d === todayISO;
        const isFuture = d > todayISO;
        return (
          <button
            key={d}
            onClick={() => onToggle(d)}
            disabled={isFuture}
            className="flex min-w-0 flex-col items-center gap-1"
          >
            <span className="text-[10px] font-medium text-[#A8A6B2]">
              {DAY_LABELS[i]}
            </span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white/85 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition ${
                isFuture ? "opacity-40" : ""
              } ${isToday ? "ring-2 ring-[#8B5CF6] ring-offset-1" : ""}`}
              style={
                on
                  ? { backgroundColor: color, borderColor: color, color: "#fff" }
                  : { borderColor: "#EDE7DF", color: "#A8A6B2" }
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

function WeekRingProgress({
  value,
  size = 82,
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
