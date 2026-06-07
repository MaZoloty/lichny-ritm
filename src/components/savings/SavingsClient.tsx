"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { PiggyBank, Plus, ShieldCheck, WalletCards } from "lucide-react";
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
    <main className="px-5 pb-56 pt-safe">
      <header className="relative -mx-5 overflow-hidden px-5 pb-5 pt-4">
        <div className="page-ambient-glow" />
        <div className="relative z-10">
          <p className="text-sm font-medium text-[#7C7A88]">Резерв и накопления</p>
          <h1 className="mt-1 text-[34px] font-semibold leading-[1.04] text-[#2F2F35]">
            Сбережения
          </h1>
          <p className="mt-3 max-w-[17rem] text-[15px] leading-6 text-[#6F6D79]">
            Видим, какая часть денег остаётся опорой.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4">
      <section className="rounded-[28px] border border-[#B8DDF8] bg-[linear-gradient(145deg,#FFFFFF_0%,#E2F3FF_58%,#EAF8ED_100%)] p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-[#7C7A88]">Всего в сбережениях</div>
            <div className="mt-1 text-3xl font-semibold text-[#2F2F35]">
              {money(data.totalSavings, data.currency)}
            </div>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#70B9EE] text-white">
            <PiggyBank size={23} strokeWidth={1.9} />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[20px] bg-white/70 px-3 py-3 shadow-[0_10px_25px_-20px_rgba(47,47,53,0.55)]">
            <div className="text-xs text-[#7C7A88]">Счета</div>
            <div className="mt-1 text-lg font-semibold text-[#2F2F35]">
              {data.savingsAccountCount}
            </div>
          </div>
          <div className="rounded-[20px] bg-white/70 px-3 py-3 shadow-[0_10px_25px_-20px_rgba(47,47,53,0.55)]">
            <div className="text-xs text-[#7C7A88]">За месяц</div>
            <div className="mt-1 text-lg font-semibold text-[#2F2F35]">
              {signedMoney(data.monthlyChange, data.currency)}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#B9E9C1] bg-[linear-gradient(145deg,#FFFFFF_0%,#ECFAEF_62%,#EAF4FF_100%)] p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#74C984] text-white">
              <ShieldCheck size={19} strokeWidth={1.9} />
            </span>
            <div>
            <h2 className="font-semibold text-[#2F2F35]">Цель подушки безопасности</h2>
            <p className="mt-1 text-sm leading-5 text-[#7C7A88]">
              Резервная часть денег, которая не привязана к конкретной покупке.
            </p>
            </div>
          </div>
          {data.emergencyTargetAmount > 0 && (
            <button
              type="button"
              onClick={() => setShowTargetForm((v) => !v)}
              className="shrink-0 text-sm font-semibold text-[#7C3AED]"
            >
              Изменить
            </button>
          )}
        </div>

        {data.emergencyTargetAmount > 0 ? (
          <>
            <div className="mb-2 flex items-end justify-between gap-3">
              <div className="text-sm text-[#7C7A88]">
                Подушка:{" "}
                <span className="font-medium text-[#2F2F35]">
                  {money(data.totalSavings, data.currency)}
                </span>{" "}
                из {money(data.emergencyTargetAmount, data.currency)}
              </div>
              <div className="font-semibold text-[#2F9E52]">
                {data.emergencyProgress}%
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDE7DF]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#70B9EE_0%,#74C984_100%)] transition-all"
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
          <div className="mt-3 flex flex-col gap-2 border-t border-[#EDE7DF] pt-3">
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
        <section className="rounded-[30px] border border-[#B8DDF8] bg-[linear-gradient(145deg,#FFFFFF_0%,#E2F3FF_100%)] p-5 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#DDF1FF] text-[#55A9E8]">
            <WalletCards size={24} strokeWidth={1.9} />
          </div>
          <h2 className="font-semibold text-[#2F2F35]">Добавим счёт сбережений</h2>
          <p className="mt-2 text-sm leading-6 text-[#7C7A88]">
            Отметь счёт как сбережения в настройках. Например: накопления,
            подушка или резерв.
          </p>
          <Link href="/settings/accounts" className="btn-primary mt-4 w-full">
            Открыть счета
          </Link>
        </section>
      ) : (
        <>
          <section className="rounded-[28px] border border-[#D4BEFF] bg-[linear-gradient(145deg,#FFFFFF_0%,#F1E8FF_100%)] p-4 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8B5CF6] text-white">
                <Plus size={19} strokeWidth={1.9} />
              </span>
              <h2 className="font-semibold text-[#2F2F35]">Пополнить сбережения</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#7C7A88]">
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
                <p className="rounded-[22px] border border-[#F1C2B8] bg-[#FFE9E3] px-4 py-3 text-sm text-[#D96E61]">
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
            <h2 className="px-1 text-sm font-medium text-[#7C7A88]">
              Счета сбережений
            </h2>
            {data.accounts.map((account) => (
              <div key={account.id} className="rounded-[28px] border border-[#EDE7DF] bg-white/92 p-4 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[#2F2F35]">{account.name}</div>
                    <div className="text-sm text-[#7C7A88]">
                      Старт {money(Number(account.start_balance), account.currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#7C7A88]">Сейчас</div>
                    <div className="font-semibold text-[#2F2F35]">
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
    </main>
  );
}
