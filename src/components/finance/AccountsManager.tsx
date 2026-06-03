"use client";

import { useState, useTransition } from "react";
import { money } from "@/lib/format";
import type { Account } from "@/types/db";
import {
  createAccount,
  updateAccount,
  setAccountActive,
} from "../../../app/(app)/finance/actions";

export default function AccountsManager({ accounts }: { accounts: Account[] }) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [isSavings, setIsSavings] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function create() {
    setError(null);
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await createAccount(
        name.trim(),
        Number(start) || 0,
        isSavings,
      );
      if (res?.error) setError(res.error);
      else {
        setName("");
        setStart("");
        setIsSavings(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card">
        <h2 className="mb-2 font-medium">Новый счёт</h2>
        <p className="mb-3 text-sm text-muted">
          Стартовый баланс станет текущим балансом счёта. Это не доход и не
          попадёт в аналитику периода.
        </p>
        <div className="flex flex-col gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название счёта"
            className="field"
          />
          <input
            value={start}
            onChange={(e) => setStart(e.target.value)}
            inputMode="decimal"
            placeholder="Стартовый баланс"
            className="field"
          />
          <label className="flex items-center gap-3 rounded-2xl bg-bg px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={isSavings}
              onChange={(e) => setIsSavings(e.target.checked)}
              className="h-5 w-5 accent-accent"
            />
            <span>Считать этот счёт сбережениями</span>
          </label>
          {error && (
            <p className="rounded-2xl bg-peach/15 px-4 py-3 text-sm">{error}</p>
          )}
          <button onClick={create} disabled={pending} className="btn-primary">
            Создать счёт
          </button>
        </div>
      </section>

      {accounts.length === 0 ? (
        <div className="card text-center text-muted">
          Счетов пока нет. Добавь карту, наличные или накопления.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {accounts.map((a) => (
            <AccountRow
              key={a.id}
              account={a}
              open={editingId === a.id}
              onToggle={() => setEditingId(editingId === a.id ? null : a.id)}
              pending={pending}
              startTransition={startTransition}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountRow({
  account,
  open,
  onToggle,
  pending,
  startTransition,
}: {
  account: Account;
  open: boolean;
  onToggle: () => void;
  pending: boolean;
  startTransition: (cb: () => void) => void;
}) {
  const [name, setName] = useState(account.name);
  const [start, setStart] = useState(String(account.start_balance));
  const [current, setCurrent] = useState(String(account.current_balance));
  const [isSavings, setIsSavings] = useState(Boolean(account.is_savings));

  function save() {
    startTransition(async () => {
      await updateAccount(account.id, {
        name,
        start_balance: Number(start) || 0,
        current_balance: Number(current) || 0,
        is_savings: isSavings,
      });
      onToggle();
    });
  }

  function toggleActive() {
    startTransition(async () => {
      await setAccountActive(account.id, !account.is_active);
    });
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className={account.is_active ? "" : "text-muted"}>
            {account.name}
            {!account.is_active && " · скрыт"}
          </div>
          {account.is_savings && (
            <div className="mt-1 inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              Сбережения
            </div>
          )}
          <div className="text-sm text-muted">
            Старт {money(Number(account.start_balance), account.currency)} ·
            Сейчас {money(Number(account.current_balance), account.currency)}
          </div>
        </div>
        <button onClick={onToggle} className="text-sm text-accent">
          {open ? "Свернуть" : "Изменить"}
        </button>
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название"
            className="field"
          />
          <label className="text-xs text-muted">Стартовый баланс</label>
          <input
            value={start}
            onChange={(e) => setStart(e.target.value)}
            inputMode="decimal"
            className="field"
          />
          <label className="text-xs text-muted">Текущий баланс</label>
          <input
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            inputMode="decimal"
            className="field"
          />
          <label className="flex items-center gap-3 rounded-2xl bg-bg px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={isSavings}
              onChange={(e) => setIsSavings(e.target.checked)}
              className="h-5 w-5 accent-accent"
            />
            <span>Считать этот счёт сбережениями</span>
          </label>
          <button onClick={save} disabled={pending} className="btn-primary">
            Сохранить
          </button>
          <button
            onClick={toggleActive}
            disabled={pending}
            className="text-center text-sm text-muted"
          >
            {account.is_active ? "Скрыть счёт" : "Вернуть счёт"}
          </button>
        </div>
      )}
    </div>
  );
}
