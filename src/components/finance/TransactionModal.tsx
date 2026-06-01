"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal";
import { money } from "@/lib/format";
import type { Account, Category } from "@/types/db";
import type { TxView } from "@/lib/finance-data";
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  createAccount,
  createDefaultCategories,
  type TransactionInput,
} from "../../../app/(app)/finance/actions";

type TxType = "income" | "expense";

function parseAmount(s: string): number {
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export default function TransactionModal({
  open,
  onClose,
  accounts,
  categories,
  editing,
  defaultDateISO,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  editing: TxView | null;
  defaultDateISO: string;
}) {
  const isEdit = !!editing;
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [type, setType] = useState<TxType>(editing?.type ?? "expense");
  const [categoryId, setCategoryId] = useState<string | null>(
    editing?.category_id ?? null,
  );
  const [accountId, setAccountId] = useState<string | null>(
    editing?.account_id ?? accounts[0]?.id ?? null,
  );
  const [comment, setComment] = useState(editing?.comment ?? "");
  const [date, setDate] = useState(editing?.date ?? defaultDateISO);
  const [newAccountName, setNewAccountName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const amountNum = parseAmount(amount);
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;
  const typeCats = categories.filter((c) => c.type === type);

  function save() {
    setError(null);
    if (!amountValid) {
      setError("Сумма должна быть больше нуля.");
      return;
    }
    const input: TransactionInput = {
      amount: amountNum,
      type,
      categoryId,
      accountId,
      date,
      comment: comment.trim() || null,
    };
    startTransition(async () => {
      const res = editing
        ? await updateTransaction(editing.id, input)
        : await addTransaction(input);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  function remove() {
    if (!editing) return;
    startTransition(async () => {
      const res = await deleteTransaction(editing.id);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  function quickAccount() {
    if (!newAccountName.trim()) return;
    startTransition(async () => {
      const res = await createAccount(newAccountName.trim());
      if (res?.error) setError(res.error);
      else {
        setNewAccountName("");
        if (res.id) setAccountId(res.id);
        if (!isEdit) setStep(5);
      }
    });
  }

  function makeDefaults() {
    startTransition(async () => {
      await createDefaultCategories();
    });
  }

  // ----- Подкомпоненты выбора -----
  const CategoryPicker = (
    <div>
      {typeCats.length === 0 ? (
        <div className="rounded-2xl bg-card p-4 text-center text-sm text-muted">
          <p className="mb-3">Категории помогают понять, куда уходят деньги.</p>
          <button
            onClick={makeDefaults}
            disabled={pending}
            className="btn-primary"
          >
            Создать категории по умолчанию
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {typeCats.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCategoryId(c.id);
                if (!isEdit) setStep(4);
              }}
              className={`rounded-full px-4 py-2 text-sm transition ${
                categoryId === c.id
                  ? "bg-accent text-white"
                  : "bg-card text-ink"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const AccountPicker = (
    <div>
      {accounts.length === 0 ? (
        <div className="rounded-2xl bg-card p-4 text-sm text-muted">
          <p className="mb-3">
            Добавим первый счёт, чтобы операции было куда записывать.
          </p>
          <div className="flex gap-2">
            <input
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              placeholder="Например: Карта"
              className="field"
            />
            <button
              onClick={quickAccount}
              disabled={pending}
              className="btn-primary shrink-0"
            >
              Создать
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setAccountId(a.id);
                if (!isEdit) setStep(5);
              }}
              className={`rounded-full px-4 py-2 text-sm transition ${
                accountId === a.id ? "bg-accent text-white" : "bg-card text-ink"
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const TypeToggle = (
    <div className="grid grid-cols-2 gap-2">
      {(["expense", "income"] as TxType[]).map((t) => (
        <button
          key={t}
          onClick={() => {
            setType(t);
            setCategoryId(null);
            if (!isEdit) setStep(3);
          }}
          className={`rounded-2xl px-4 py-3 font-medium transition ${
            type === t ? "bg-accent text-white" : "bg-card text-ink"
          }`}
        >
          {t === "expense" ? "Расход" : "Доход"}
        </button>
      ))}
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Операция" : "Добавим операцию"}
    >
      {/* Сумма всегда сверху и крупно */}
      <div className="mb-4 rounded-2xl bg-card p-4 text-center">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0"
          autoFocus={!isEdit}
          className="w-full bg-transparent text-center text-4xl font-semibold outline-none placeholder:text-line"
        />
        <div className="mt-1 text-sm text-muted">
          {amountValid ? money(amountNum) : "Введи сумму"}
        </div>
      </div>

      {/* РЕДАКТИРОВАНИЕ — всё на одном экране */}
      {isEdit ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm text-muted">Что это было?</p>
            {TypeToggle}
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">Категория</p>
            {CategoryPicker}
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">Куда записать?</p>
            {AccountPicker}
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">Дата и комментарий</p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field mb-2"
            />
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий (необязательно)"
              className="field"
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-peach/15 px-4 py-3 text-sm">{error}</p>
          )}

          <button onClick={save} disabled={pending} className="btn-primary w-full">
            {pending ? "Сохраняю…" : "Сохранить"}
          </button>
          <button
            onClick={remove}
            disabled={pending}
            className="text-center text-sm text-muted"
          >
            Удалить операцию
          </button>
        </div>
      ) : (
        // ДОБАВЛЕНИЕ — пошагово
        <div className="flex flex-col gap-4">
          {step === 1 && (
            <button
              onClick={() => amountValid && setStep(2)}
              disabled={!amountValid}
              className="btn-primary w-full"
            >
              OK
            </button>
          )}

          {step === 2 && (
            <div>
              <p className="mb-2 text-sm text-muted">Что это было?</p>
              {TypeToggle}
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-2 text-sm text-muted">Категория</p>
              {CategoryPicker}
              {typeCats.length > 0 && (
                <button
                  onClick={() => setStep(4)}
                  className="mt-3 text-sm text-accent"
                >
                  Пропустить
                </button>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="mb-2 text-sm text-muted">Куда записать?</p>
              {AccountPicker}
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-3">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий (необязательно)"
                className="field"
              />
              {error && (
                <p className="rounded-2xl bg-peach/15 px-4 py-3 text-sm">
                  {error}
                </p>
              )}
              <button
                onClick={save}
                disabled={pending}
                className="btn-primary w-full"
              >
                {pending ? "Сохраняю…" : "Сохранить"}
              </button>
            </div>
          )}

          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="text-center text-sm text-muted"
            >
              Назад
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
