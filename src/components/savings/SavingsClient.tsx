"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { money, signedMoney } from "@/lib/format";
import type { SavingsData } from "@/lib/savings-data";
import {
  addSavingsTopUp,
  saveEmergencyTarget,
} from "../../../app/(app)/savings/actions";

export default function SavingsClient({ data }: { data: SavingsData }) {
  const [target, setTarget] = useState(
    data.emergencyTargetAmount ? String(data.emergencyTargetAmount) : "",
  );
  const [showTargetForm, setShowTargetForm] = useState(
    data.emergencyTargetAmount <= 0,
  );
  const [accountId, setAccountId] = useState(data.accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submitTarget() {
    setError(null);
    startTransition(async () => {
      const res = await saveEmergencyTarget(Number(target) || 0);
      if (res.error) setError(res.error);
      else setShowTargetForm(false);
    });
  }

  function submitTopUp() {
    setError(null);
    startTransition(async () => {
      const res = await addSavingsTopUp({
        accountId,
        amount: Number(amount) || 0,
        date,
        comment,
      });
      if (res.error) setError(res.error);
      else {
        setAmount("");
        setComment("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 px-5">
      <section className="card">
        <div className="text-sm text-muted">Всего в сбережениях</div>
        <div className="mt-1 text-3xl font-semibold">
          {money(data.totalSavings, data.currency)}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="soft-tile px-3 py-3">
            <div className="text-xs text-muted">Счета</div>
            <div className="mt-1 text-lg font-semibold">
              {data.savingsAccountCount}
            </div>
          </div>
          <div className="soft-tile px-3 py-3">
            <div className="text-xs text-muted">За месяц</div>
            <div className="mt-1 text-lg font-semibold">
              {signedMoney(data.monthlyChange, data.currency)}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Цель подушки безопасности</h2>
            <p className="mt-1 text-sm text-muted">
              Резервная часть денег, которая не привязана к конкретной покупке.
            </p>
          </div>
          {data.emergencyTargetAmount > 0 && (
            <button
              type="button"
              onClick={() => setShowTargetForm((v) => !v)}
              className="text-sm text-accent"
            >
              Изменить
            </button>
          )}
        </div>

        {data.emergencyTargetAmount > 0 ? (
          <>
            <div className="mb-2 flex items-end justify-between gap-3">
              <div className="text-sm text-muted">
                Подушка:{" "}
                <span className="font-medium text-ink">
                  {money(data.totalSavings, data.currency)}
                </span>{" "}
                из {money(data.emergencyTargetAmount, data.currency)}
              </div>
              <div className="font-semibold text-accent">
                {data.emergencyProgress}%
              </div>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${data.emergencyProgress}%` }}
              />
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowTargetForm(true)}
            className="btn-ghost w-full"
          >
            Задать цель подушки
          </button>
        )}

        {showTargetForm && (
          <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              inputMode="decimal"
              placeholder="Цель подушки"
              className="field"
            />
            <button
              type="button"
              onClick={submitTarget}
              disabled={pending}
              className="btn-primary"
            >
              Сохранить цель
            </button>
          </div>
        )}
      </section>

      {data.accounts.length === 0 ? (
        <section className="card text-center">
          <h2 className="font-medium">Добавим счёт сбережений</h2>
          <p className="mt-2 text-sm text-muted">
            Отметь счёт как сбережения в настройках. Например: накопления,
            подушка или резерв.
          </p>
          <Link href="/settings/accounts" className="btn-primary mt-4 w-full">
            Открыть счета
          </Link>
        </section>
      ) : (
        <>
          <section className="card">
            <h2 className="font-medium">Пополнить сбережения</h2>
            <p className="mt-1 text-sm text-muted">
              Это создаст операцию типа saving и увеличит баланс выбранного
              счёта. В доходы и расходы периода она не попадёт.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="field"
              >
                {data.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="Сумма"
                className="field"
              />
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                type="date"
                className="field"
              />
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий"
                className="field"
              />
              {error && (
                <p className="rounded-2xl bg-peach/15 px-4 py-3 text-sm">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={submitTopUp}
                disabled={pending}
                className="btn-primary"
              >
                Пополнить
              </button>
              <Link href="/settings/accounts" className="btn-ghost text-center">
                Открыть счета
              </Link>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="px-1 text-sm font-medium text-muted">
              Счета сбережений
            </h2>
            {data.accounts.map((account) => (
              <div key={account.id} className="card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-sm text-muted">
                      Старт {money(Number(account.start_balance), account.currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted">Сейчас</div>
                    <div className="font-semibold">
                      {money(Number(account.current_balance), account.currency)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
