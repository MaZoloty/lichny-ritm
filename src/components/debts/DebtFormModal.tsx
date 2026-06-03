"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal";
import type { Debt } from "@/types/db";
import {
  createDebt,
  setDebtActive,
  updateDebt,
  type DebtInput,
} from "../../../app/(app)/debts/actions";

const TYPES: { value: DebtInput["type"]; label: string }[] = [
  { value: "credit_card", label: "Кредитка" },
  { value: "loan", label: "Кредит" },
  { value: "installment", label: "Рассрочка" },
  { value: "other", label: "Другое" },
];

export default function DebtFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Debt | null;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState<DebtInput["type"]>(editing?.type ?? "other");
  const [initial, setInitial] = useState(
    editing ? String(editing.initial_amount) : "",
  );
  const [current, setCurrent] = useState(
    editing ? String(editing.current_amount) : "",
  );
  const [minimum, setMinimum] = useState(
    editing ? String(editing.minimum_payment) : "",
  );
  const [nextDate, setNextDate] = useState(editing?.next_payment_date ?? "");
  const [paymentDay, setPaymentDay] = useState(
    editing?.payment_day ? String(editing.payment_day) : "",
  );
  const [comment, setComment] = useState(editing?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function buildInput(): DebtInput {
    const initialAmount = Number(initial) || Number(current) || 0;
    return {
      name,
      type,
      initialAmount,
      currentAmount: current === "" ? initialAmount : Number(current) || 0,
      minimumPayment: Number(minimum) || 0,
      nextPaymentDate: nextDate || null,
      paymentDay: paymentDay ? Number(paymentDay) : null,
      comment: comment.trim() || null,
    };
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const input = buildInput();
      const res = editing
        ? await updateDebt(editing.id, input)
        : await createDebt(input);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  function disable() {
    if (!editing) return;
    setError(null);
    startTransition(async () => {
      const res = await setDebtActive(editing.id, false);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Долг" : "Новый долг"}>
      <div className="flex flex-col gap-3">
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название"
        />
        <select
          className="field"
          value={type}
          onChange={(e) => setType(e.target.value as DebtInput["type"])}
        >
          {TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          className="field"
          type="number"
          inputMode="decimal"
          value={initial}
          onChange={(e) => setInitial(e.target.value)}
          placeholder="Изначальная сумма"
        />
        <input
          className="field"
          type="number"
          inputMode="decimal"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Осталось закрыть"
        />
        <input
          className="field"
          type="number"
          inputMode="decimal"
          value={minimum}
          onChange={(e) => setMinimum(e.target.value)}
          placeholder="Минимальный платёж"
        />
        <input
          className="field"
          type="date"
          value={nextDate}
          onChange={(e) => setNextDate(e.target.value)}
        />
        <input
          className="field"
          type="number"
          inputMode="numeric"
          min={1}
          max={31}
          value={paymentDay}
          onChange={(e) => setPaymentDay(e.target.value)}
          placeholder="День платежа"
        />
        <input
          className="field"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Комментарий"
        />
        {error && <p className="rounded-2xl bg-peach/15 px-4 py-3 text-sm">{error}</p>}
        <button onClick={save} disabled={pending} className="btn-primary w-full">
          {pending ? "Сохраняю..." : "Сохранить долг"}
        </button>
        {editing && (
          <button onClick={disable} disabled={pending} className="btn-ghost w-full">
            Отключить долг
          </button>
        )}
      </div>
    </Modal>
  );
}
