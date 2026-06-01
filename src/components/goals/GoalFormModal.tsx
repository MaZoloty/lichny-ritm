"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal";
import type { Account, Goal } from "@/types/db";
import {
  createGoal,
  updateGoal,
  setGoalActive,
  type GoalInput,
} from "../../../app/(app)/goals/actions";

function num(s: string): number {
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export default function GoalFormModal({
  open,
  onClose,
  accounts,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  editing: Goal | null;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [target, setTarget] = useState(
    editing ? String(editing.target_amount) : "",
  );
  const [current, setCurrent] = useState(
    editing ? String(editing.current_amount) : "",
  );
  const [deadline, setDeadline] = useState(editing?.deadline ?? "");
  const [accountId, setAccountId] = useState<string | null>(
    editing?.account_id ?? null,
  );
  const [comment, setComment] = useState(editing?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    const input: GoalInput = {
      name,
      targetAmount: num(target),
      currentAmount: current.trim() ? num(current) : 0,
      deadline: deadline || null,
      accountId,
      comment: comment.trim() || null,
    };
    startTransition(async () => {
      const res = editing
        ? await updateGoal(editing.id, input)
        : await createGoal(input);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  function deactivate() {
    if (!editing) return;
    startTransition(async () => {
      const res = await setGoalActive(editing.id, false);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Цель" : "Новая цель"}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-muted">Название</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Отпуск"
            className="field"
            autoFocus={!editing}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm text-muted">Целевая сумма</label>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="field"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm text-muted">
              Уже накоплено
            </label>
            <input
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="field"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">
            Дедлайн (необязательно)
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="field"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">
            Счёт (необязательно)
          </label>
          <select
            value={accountId ?? ""}
            onChange={(e) => setAccountId(e.target.value || null)}
            className="field"
          >
            <option value="">Не привязывать</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">
            Комментарий (необязательно)
          </label>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="field"
          />
        </div>

        {error && (
          <p className="rounded-2xl bg-peach/15 px-4 py-3 text-sm">{error}</p>
        )}

        <button onClick={save} disabled={pending} className="btn-primary w-full">
          {pending ? "Сохраняю…" : "Сохранить цель"}
        </button>
        {editing && (
          <button
            onClick={deactivate}
            disabled={pending}
            className="text-center text-sm text-muted"
          >
            Отключить цель (данные сохранятся)
          </button>
        )}
      </div>
    </Modal>
  );
}
