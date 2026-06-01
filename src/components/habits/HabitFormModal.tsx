"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal";
import {
  addHabit,
  updateHabit,
  setHabitActive,
  type HabitInput,
} from "../../../app/(app)/habits/actions";

export const HABIT_COLORS = [
  { name: "Сиреневый", value: "#8B5CF6" },
  { name: "Зелёный", value: "#A7D8A0" },
  { name: "Персиковый", value: "#F29B8F" },
  { name: "Песочный", value: "#E6C79C" },
  { name: "Небесный", value: "#9CC3E6" },
];

export interface EditingHabit {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  track_daily_streak: boolean;
  track_weekly_streak: boolean;
}

export default function HabitFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: EditingHabit | null;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [icon, setIcon] = useState(editing?.icon ?? "✦");
  const [color, setColor] = useState(editing?.color ?? HABIT_COLORS[0].value);
  const [daily, setDaily] = useState(editing?.track_daily_streak ?? true);
  const [weekly, setWeekly] = useState(editing?.track_weekly_streak ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const input: HabitInput = {
      name,
      icon: icon.trim() || null,
      color,
      track_daily_streak: daily,
      track_weekly_streak: weekly,
    };
    startTransition(async () => {
      const res = editing
        ? await updateHabit(editing.id, input)
        : await addHabit(input);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  function deactivate() {
    if (!editing) return;
    startTransition(async () => {
      const res = await setHabitActive(editing.id, false);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Привычка" : "Новая привычка"}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-muted">Название</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Тренировка"
            className="field"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <div className="w-24">
            <label className="mb-1 block text-sm text-muted">Иконка</label>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={2}
              className="field text-center text-xl"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm text-muted">Цвет</label>
            <div className="flex gap-2 pt-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  aria-label={c.name}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    color === c.value ? "border-ink" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>
        </div>

        <label className="flex items-center justify-between rounded-2xl bg-card px-4 py-3">
          <span>Считать ежедневный стрик</span>
          <input
            type="checkbox"
            checked={daily}
            onChange={(e) => setDaily(e.target.checked)}
            className="h-5 w-5 accent-accent"
          />
        </label>

        <label className="flex items-center justify-between rounded-2xl bg-card px-4 py-3">
          <span>Считать недельный стрик</span>
          <input
            type="checkbox"
            checked={weekly}
            onChange={(e) => setWeekly(e.target.checked)}
            className="h-5 w-5 accent-accent"
          />
        </label>

        {error && (
          <p className="rounded-2xl bg-peach/15 px-4 py-3 text-sm">{error}</p>
        )}

        <button onClick={submit} disabled={pending} className="btn-primary w-full">
          {pending ? "Сохраняю…" : editing ? "Сохранить" : "Добавить привычку"}
        </button>

        {editing && (
          <button
            onClick={deactivate}
            disabled={pending}
            className="text-center text-sm text-muted"
          >
            Отключить привычку (данные сохранятся)
          </button>
        )}
      </div>
    </Modal>
  );
}
