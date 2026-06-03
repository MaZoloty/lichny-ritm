"use client";

import { useMemo, useState, useTransition } from "react";
import Modal from "@/components/Modal";
import { money } from "@/lib/format";
import type { Account } from "@/types/db";
import type { DebtPaymentView, DebtView } from "@/lib/debts-data";
import {
  addDebtPayment,
  deleteDebtPayment,
  updateDebtPayment,
  type DebtPaymentInput,
} from "../../../app/(app)/debts/actions";

export default function DebtPaymentModal({
  open,
  onClose,
  debts,
  accounts,
  defaultDebtId,
  editing,
  defaultDateISO,
}: {
  open: boolean;
  onClose: () => void;
  debts: DebtView[];
  accounts: Account[];
  defaultDebtId: string;
  editing: DebtPaymentView | null;
  defaultDateISO: string;
}) {
  const [debtId, setDebtId] = useState(editing?.debt_id ?? defaultDebtId);
  const [actual, setActual] = useState(
    editing ? String(editing.actual_payment) : "",
  );
  const [principal, setPrincipal] = useState(
    editing ? String(editing.principal_reduction) : "",
  );
  const [accountId, setAccountId] = useState<string | null>(
    editing?.account_id ?? null,
  );
  const [date, setDate] = useState(editing?.payment_date ?? defaultDateISO);
  const [comment, setComment] = useState(editing?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const actualValue = Number(actual) || 0;
  const principalValue = Number(principal) || 0;
  const interest = Math.max(0, actualValue - principalValue);
  const interestShare =
    actualValue > 0 ? Math.round((interest / actualValue) * 100) : 0;
  const selectedDebt = useMemo(
    () => debts.find((debt) => debt.id === debtId) ?? null,
    [debts, debtId],
  );

  function buildInput(): DebtPaymentInput {
    return {
      debtId,
      actualPayment: actualValue,
      principalReduction: principalValue,
      accountId,
      date,
      comment: comment.trim() || null,
    };
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const input = buildInput();
      const res = editing
        ? await updateDebtPayment(editing.id, input)
        : await addDebtPayment(input);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  function remove() {
    if (!editing) return;
    if (!window.confirm("Удалить этот платёж?")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteDebtPayment(editing.id);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Платёж" : "Внести платёж"}
    >
      <div className="flex flex-col gap-3">
        <select
          className="field"
          value={debtId}
          onChange={(e) => setDebtId(e.target.value)}
        >
          {debts.map((debt) => (
            <option key={debt.id} value={debt.id}>
              {debt.name}
            </option>
          ))}
        </select>
        {selectedDebt && (
          <div className="soft-tile text-sm text-muted">
            Осталось закрыть: {money(selectedDebt.current_amount)}
          </div>
        )}
        <input
          className="field"
          type="number"
          inputMode="decimal"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          placeholder="Фактический платёж"
        />
        <input
          className="field"
          type="number"
          inputMode="decimal"
          value={principal}
          onChange={(e) => setPrincipal(e.target.value)}
          placeholder="Тело долга"
        />
        <div className="soft-tile">
          <div className="text-xs text-muted">Проценты</div>
          <div className="mt-1 font-semibold">
            {money(interest)} · {interestShare}%
          </div>
        </div>
        <select
          className="field"
          value={accountId ?? ""}
          onChange={(e) => setAccountId(e.target.value || null)}
        >
          <option value="">Без счёта</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} · {money(Number(account.current_balance), account.currency)}
            </option>
          ))}
        </select>
        <input
          className="field"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          className="field"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Комментарий"
        />
        {error && <p className="rounded-2xl bg-peach/15 px-4 py-3 text-sm">{error}</p>}
        <button onClick={save} disabled={pending} className="btn-primary w-full">
          {pending ? "Сохраняю..." : editing ? "Сохранить" : "Внести платёж"}
        </button>
        {editing && (
          <button onClick={remove} disabled={pending} className="btn-ghost w-full">
            Удалить платёж
          </button>
        )}
      </div>
    </Modal>
  );
}
