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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function create() {
    setError(null);
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await createAccount(name.trim(), Number(start) || 0);
      if (res?.error) setError(res.error);
      else {
        setName("");
        setStart("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card">
        <h2 className="mb-3 font-medium">Новый счёт</h2>
        <div className="flex flex-col gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название (например, Карта)"
            className="field"
          />
          <input
            value={start}
            onChange={(e) => setStart(e.target.value)}
            inputMode="decimal"
            placeholder="Стартовый баланс (необязательно)"
            className="field"
          />
          {error && (
            <p className="rounded-2xl bg-peach/15 px-4 py-3 text-sm">{error}</p>
          )}
          <button onClick={create} disabled={pending} className="btn-primary">
            Создать счёт
          </button>
        </div>
      </section>

      {accounts.length === 0 ? (
        <div className="card text-center text-muted">Счетов пока нет.</div>
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

  function save() {
    startTransition(async () => {
      await updateAccount(account.id, {
        name,
        start_balance: Number(start) || 0,
        current_balance: Number(current) || 0,
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
      <div className="flex items-center justify-between">
        <div>
          <div className={account.is_active ? "" : "text-muted"}>
            {account.name}
            {!account.is_active && " · скрыт"}
          </div>
          <div className="text-sm text-muted">
            {money(Number(account.current_balance), account.currency)}
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
