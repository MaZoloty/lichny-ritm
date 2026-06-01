"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal";
import { softWeekGoal } from "@/lib/habits";
import { saveWeeklyGoals } from "../../../app/(app)/habits/actions";

export interface GoalHabit {
  id: string;
  name: string;
  currentGoal: number | null;
  prevGoal: number | null;
}

export default function GoalsModal({
  open,
  onClose,
  habits,
}: {
  open: boolean;
  onClose: () => void;
  habits: GoalHabit[];
}) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(habits.map((h) => [h.id, h.currentGoal ?? 0])),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set(id: string, v: number) {
    setValues((s) => ({ ...s, [id]: Math.max(0, v) }));
  }

  function persist(goals: { habitId: string; weeklyGoal: number }[]) {
    setError(null);
    startTransition(async () => {
      const res = await saveWeeklyGoals(goals);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  function saveCurrent() {
    persist(habits.map((h) => ({ habitId: h.id, weeklyGoal: values[h.id] ?? 0 })));
  }

  function repeatLast() {
    persist(habits.map((h) => ({ habitId: h.id, weeklyGoal: h.prevGoal ?? 0 })));
  }

  function softWeek() {
    persist(
      habits.map((h) => ({
        habitId: h.id,
        weeklyGoal: softWeekGoal(h.name, h.prevGoal),
      })),
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Поставим цели на неделю?">
      <p className="mb-4 text-sm text-muted">
        Сколько раз за неделю комфортно? Маленькие шаги тоже считаются.
      </p>

      <div className="flex flex-col gap-2">
        {habits.map((h) => (
          <div
            key={h.id}
            className="flex items-center justify-between rounded-2xl bg-card px-4 py-3"
          >
            <span className="pr-3">{h.name}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => set(h.id, (values[h.id] ?? 0) - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-lg"
                aria-label="Меньше"
              >
                −
              </button>
              <span className="w-6 text-center text-lg font-medium">
                {values[h.id] ?? 0}
              </span>
              <button
                onClick={() => set(h.id, (values[h.id] ?? 0) + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-lg"
                aria-label="Больше"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-2xl bg-peach/15 px-4 py-3 text-sm">{error}</p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <button
          onClick={saveCurrent}
          disabled={pending}
          className="btn-primary w-full"
        >
          {pending ? "Сохраняю…" : "Сохранить цели"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={repeatLast}
            disabled={pending}
            className="btn-ghost flex-1 text-sm"
          >
            Повторить прошлую неделю
          </button>
          <button
            onClick={softWeek}
            disabled={pending}
            className="btn-ghost flex-1 text-sm"
          >
            Мягкая неделя
          </button>
        </div>
      </div>
    </Modal>
  );
}
