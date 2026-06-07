"use client";

import { useMemo, useState, useTransition } from "react";
import { MODULES, STARTER_HABITS, type ModuleKey } from "@/lib/modules";
import { completeOnboarding } from "./actions";

type AccountDraft = {
  id: string;
  name: string;
  startBalance: string;
  isSavings: boolean;
};

const STARTER_ACCOUNTS: AccountDraft[] = [
  { id: "card", name: "Карта", startBalance: "", isSavings: false },
  { id: "cash", name: "Наличные", startBalance: "", isSavings: false },
  { id: "savings", name: "Накопления", startBalance: "", isSavings: true },
  { id: "other", name: "Другое", startBalance: "", isSavings: false },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [modules, setModules] = useState<Set<ModuleKey>>(new Set());
  const [habits, setHabits] = useState<Set<string>>(new Set(STARTER_HABITS));
  const [accounts, setAccounts] = useState<AccountDraft[]>(STARTER_ACCOUNTS);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [debtName, setDebtName] = useState("");
  const [debtCurrent, setDebtCurrent] = useState("");
  const [debtMin, setDebtMin] = useState("");

  const has = (k: ModuleKey) => modules.has(k);
  const needsAccounts = has("finance") || has("savings");

  const hasMiniSetup = useMemo(
    () =>
      ["habits", "finance", "goals", "debts", "savings"].some((k) =>
        modules.has(k as ModuleKey),
      ),
    [modules],
  );

  function toggleModule(key: ModuleKey) {
    setModules((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleHabit(name: string) {
    setHabits((current) => {
      const next = new Set(current);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function updateAccount(id: string, patch: Partial<AccountDraft>) {
    setAccounts((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addAccount() {
    setAccounts((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        name: "",
        startBalance: "",
        isSavings: false,
      },
    ]);
  }

  function removeAccount(id: string) {
    setAccounts((items) => items.filter((item) => item.id !== id));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await completeOnboarding({
        modules: Array.from(modules),
        habits: has("habits") ? Array.from(habits) : [],
        accounts: needsAccounts
          ? accounts
              .map((account) => ({
                name: account.name.trim(),
                start_balance: Number(account.startBalance) || 0,
                is_savings: account.isSavings,
              }))
              .filter((account) => account.name.length > 0)
          : [],
        goal:
          has("goals") && goalName.trim()
            ? { name: goalName.trim(), target: Number(goalTarget) || 0 }
            : null,
        debt:
          has("debts") && debtName.trim()
            ? {
                name: debtName.trim(),
                current: Number(debtCurrent) || 0,
                min: Number(debtMin) || 0,
              }
            : null,
      });
      if (res?.error) setError(res.error);
    });
  }

  function goForward() {
    setError(null);
    if (step === 2 && modules.size === 0) {
      setError("Выбери хотя бы один раздел.");
      return;
    }
    if (step === 2 && !hasMiniSetup) {
      setStep(4);
      return;
    }
    setStep(step + 1);
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col overflow-hidden px-6 pb-10 pt-safe">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(155,99,244,0.32),transparent_30%),radial-gradient(circle_at_18%_82%,rgba(116,201,132,0.24),transparent_34%),linear-gradient(180deg,#FFFDFB_0%,#FAF7F2_100%)]" />
      <div className="relative z-10 mb-8 mt-6 flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s <= step ? "bg-[#8B5CF6]" : "bg-[#EDE7DF]"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="relative z-10 flex flex-1 flex-col justify-center">
          <h1 className="text-[32px] font-semibold leading-tight text-[#2F2F35]">
            Соберём твою личную систему
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-[#6F6D79]">
            Выбери, что хочешь отслеживать сейчас. Можно начать с минимума и
            добавить остальное позже.
          </p>
          <button onClick={() => setStep(2)} className="btn-primary mt-8 w-full">
            Начать
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="relative z-10 flex flex-1 flex-col">
          <h1 className="text-[30px] font-semibold leading-tight text-[#2F2F35]">Что отслеживаем?</h1>
          <p className="mt-2 text-[15px] leading-6 text-[#6F6D79]">
            Можно выбрать один или несколько разделов. Остальное добавишь в
            настройках.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {MODULES.map((m) => {
              const active = modules.has(m.key);
              return (
                <button
                  key={m.key}
                  onClick={() => toggleModule(m.key)}
                  className={`rounded-[28px] border bg-white/92 p-4 text-left shadow-card transition ${
                    active ? "border-[#8B5CF6] ring-1 ring-[#8B5CF6]" : "border-[#EDE7DF]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                        active
                          ? "border-[#8B5CF6] bg-[#8B5CF6] text-white"
                          : "border-[#EDE7DF] bg-white"
                      }`}
                    >
                      {active ? "✓" : ""}
                    </span>
                    <div>
                      <div className="font-semibold text-[#2F2F35]">{m.title}</div>
                      <div className="text-sm leading-5 text-[#7C7A88]">{m.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="relative z-10 flex flex-1 flex-col gap-6">
          <h1 className="text-[30px] font-semibold leading-tight text-[#2F2F35]">Немного настроим</h1>

          {has("habits") && (
            <section className="rounded-[28px] border border-[#EDE7DF] bg-white/92 p-4 shadow-card">
              <h2 className="font-semibold text-[#2F2F35]">Стартовые привычки</h2>
              <p className="mb-3 text-sm leading-5 text-[#7C7A88]">
                Оставь то, что подходит. Остальные можно убрать.
              </p>
              <div className="flex flex-col gap-2">
                {STARTER_HABITS.map((h) => (
                  <label key={h} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={habits.has(h)}
                      onChange={() => toggleHabit(h)}
                      className="h-5 w-5 accent-accent"
                    />
                    <span>{h}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {needsAccounts && (
            <section className="rounded-[28px] border border-[#EDE7DF] bg-white/92 p-4 shadow-card">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-[#2F2F35]">С какой суммы начинаем?</h2>
                  <p className="mt-1 text-sm leading-5 text-[#7C7A88]">
                    Укажи, сколько денег сейчас есть на карте, наличными или в
                    накоплениях. Стартовый баланс не считается доходом.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAccounts([])}
                  className="shrink-0 text-sm text-[#7C7A88]"
                >
                  Пропустить
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {accounts.map((account) => (
                  <div key={account.id} className="rounded-[22px] bg-white/70 p-3 shadow-[0_10px_25px_-20px_rgba(47,47,53,0.55)]">
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        value={account.name}
                        onChange={(e) =>
                          updateAccount(account.id, { name: e.target.value })
                        }
                        placeholder="Название счёта"
                        className="field"
                      />
                      <button
                        type="button"
                        onClick={() => removeAccount(account.id)}
                        className="px-2 text-sm text-[#7C7A88]"
                        aria-label="Убрать счёт"
                      >
                        ×
                      </button>
                    </div>
                    <input
                      value={account.startBalance}
                      onChange={(e) =>
                        updateAccount(account.id, {
                          startBalance: e.target.value,
                        })
                      }
                      inputMode="decimal"
                      placeholder="Стартовая сумма"
                      className="field"
                    />
                    <label className="mt-2 flex items-center gap-3 rounded-[20px] bg-white/80 px-4 py-3 text-sm text-[#2F2F35]">
                      <input
                        type="checkbox"
                        checked={account.isSavings}
                        onChange={(e) =>
                          updateAccount(account.id, {
                            isSavings: e.target.checked,
                          })
                        }
                        className="h-5 w-5 accent-accent"
                      />
                      <span>Это сбережения</span>
                    </label>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addAccount}
                className="btn-ghost mt-3 w-full"
              >
                Добавить свой счёт
              </button>
            </section>
          )}

          {has("goals") && (
            <section className="rounded-[28px] border border-[#D4BEFF] bg-[linear-gradient(145deg,#FFFFFF_0%,#F1E8FF_100%)] p-4 shadow-card">
              <h2 className="font-semibold text-[#2F2F35]">Первая цель</h2>
              <p className="mb-3 text-sm text-[#7C7A88]">Можно пропустить.</p>
              <input
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="Например: отпуск"
                className="field mb-3"
              />
              <input
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                inputMode="decimal"
                placeholder="Целевая сумма"
                className="field"
              />
            </section>
          )}

          {has("debts") && (
            <section className="rounded-[28px] border border-[#F1C2B8] bg-[linear-gradient(145deg,#FFFFFF_0%,#FFE9E3_100%)] p-4 shadow-card">
              <h2 className="font-semibold text-[#2F2F35]">Первый долг</h2>
              <p className="mb-3 text-sm text-[#7C7A88]">Можно пропустить.</p>
              <input
                value={debtName}
                onChange={(e) => setDebtName(e.target.value)}
                placeholder="Название"
                className="field mb-3"
              />
              <input
                value={debtCurrent}
                onChange={(e) => setDebtCurrent(e.target.value)}
                inputMode="decimal"
                placeholder="Текущий остаток"
                className="field mb-3"
              />
              <input
                value={debtMin}
                onChange={(e) => setDebtMin(e.target.value)}
                inputMode="decimal"
                placeholder="Минимальный платёж"
                className="field"
              />
            </section>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="relative z-10 flex flex-1 flex-col justify-center text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[26px] bg-[#D2F4D8] text-2xl text-[#2F9E52]">
            ✓
          </div>
          <h1 className="text-[30px] font-semibold leading-tight text-[#2F2F35]">
            Готово. Начинаем мягко.
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-[#6F6D79]">
            Можно просто отмечать факты и постепенно настраивать систему под
            себя.
          </p>
        </div>
      )}

      {error && (
        <p className="relative z-10 mt-4 rounded-[22px] border border-[#F1C2B8] bg-[#FFE9E3] px-4 py-3 text-sm text-[#D96E61]">
          {error}
        </p>
      )}

      <div className="relative z-10 mt-8 flex gap-3 pb-safe">
        {step > 1 && step < 4 && (
          <button
            onClick={() => setStep(step - 1)}
            className="btn-ghost flex-1"
          >
            Назад
          </button>
        )}
        {step === 2 && (
          <button onClick={goForward} className="btn-primary flex-1">
            Продолжить
          </button>
        )}
        {step === 3 && (
          <button onClick={() => setStep(4)} className="btn-primary flex-1">
            Продолжить
          </button>
        )}
        {step === 4 && (
          <button
            onClick={submit}
            disabled={pending}
            className="btn-primary flex-1"
          >
            {pending ? "Минутку..." : "Перейти в приложение"}
          </button>
        )}
      </div>
    </main>
  );
}
