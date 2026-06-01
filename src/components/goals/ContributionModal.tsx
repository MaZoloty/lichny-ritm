"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal";
import { money } from "@/lib/format";
import type { Account } from "@/types/db";
import type { ContributionView } from "@/lib/goals-data";
import {
  addContribution,
  updateContribution,
  deleteContribution,
  type ContributionInput,
} from "../../../app/(app)/goals/actions";

function num(s: string): number {
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export default function ContributionModal({
  open,
  onClose,
  accounts,
  goalId,
  goalName,
  defaultAccountId,
  defaultDateISO,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  goalId: string;
  goalName: string;
  defaultAccountId: string | null;
  defaultDateISO: string;
  editing: ContributionView | null;
}) {
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [accountId, setAccountId] = useState<string | null>(
    editing ? editing.account_id : defaultAccountId,
  );
  const [date, setDate] = useState(editing?.contribution_date ?? defaultDateISO);
  const [comment, setComment] = useState(editing?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const amountNum = num(amount);
  const valid = Number.isFinite(amountNum) && amountNum > 0;

  function save() {
    setError(null);
    if (!valid) {
      setError("Сумма пополнения должна быть больше нуля.");
      return;
    }
    const input: ContributionInput = {
      goalId,
      amount: amountNum,
      accountId,
      date,
      comment: comment.trim() || null,
    };
    startTransition(async () => {
      const res = editing
        ? await updateContribution(editing.id, input)
        : await addContribution(input);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  function remove() {
    if (!editing) return;
    startTransition(async () => {
      const res = await deleteContribution(editing.id);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Пополнение" : `Пополнить цель`}
    >
      <p className="mb-3 text-sm text-muted">{goalName}</p>

      <div className="mb-4 rounded-2xl bg-card p-4 text-center">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0"
          autoFocus
          className="w-full bg-transparent text-center text-4xl font-semibold outline-none placeholder:text-line"
        />
        <div className="mt-1 text-sm text-muted">
          {valid ? money(amountNum) : "Сумма пополнения"}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm text-muted">Списать со счёта</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAccountId(null)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                accountId === null ? "bg-accent text-white" : "bg-card text-ink"
              }`}
            >
              Без счёта
            </button>
            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccountId(a.id)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  accountId === a.id ? "bg-accent text-white" : "bg-card text-ink"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-muted">Дата</p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field"
          />
        </div>

        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Комментарий (необязательно)"
          className="field"
        />

        {error && (
          <p className="rounded-2xl bg-peach/15 px-4 py-3 text-sm">{error}</p>
        )}

        <button onClick={save} disabled={pending} className="btn-primary w-full">
          {pending ? "Сохраняю…" : editing ? "Сохранить" : "Пополнить цель"}
        </button>
        {editing && (
          <button
            onClick={remove}
            disabled={pending}
            className="text-center text-sm text-muted"
          >
            Удалить пополнение
          </button>
        )}
      </div>
    </Modal>
  );
}
