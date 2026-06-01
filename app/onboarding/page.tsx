"use client";

import { useMemo, useState, useTransition } from "react";
import {
  MODULES,
  STARTER_HABITS,
  type ModuleKey,
} from "@/lib/modules";
import { completeOnboarding } from "./actions";

const STARTER_ACCOUNTS = ["Карта", "Наличные", "Накопления", "Другое"];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // выбранные модули
  const [modules, setModules] = useState<Set<ModuleKey>>(new Set());
  // мини-настройка
  const [habits, setHabits] = useState<Set<string>>(new Set(STARTER_HABITS));
  const [accounts, setAccounts] = useState<Set<string>>(
    new Set(["Карта", "Наличные"]),
  );
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [debtName, setDebtName] = useState("");
  const [debtCurrent, setDebtCurrent] = useState("");
  const [debtMin, setDebtMin] = useState("");
  const [saving, setSaving] = useState("");

  const has = (k: ModuleKey) => modules.has(k);
  const toggle = <T,>(set: Set<T>, v: T): Set<T> => {
    const next = new Set(set);
    next.has(v) ? next.delete(v) : next.add(v);
    return next;
  };

  // Нужен ли шаг мини-настройки (есть ли что настраивать)
  const hasMiniSetup = useMemo(
    () =>
      ["habits", "finance", "goals", "debts", "savings"].some((k) =>
        modules.has(k as ModuleKey),
      ),
    [modules],
  );

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await completeOnboarding({
        modules: Array.from(modules),
        habits: has("habits") ? Array.from(habits) : [],
        accounts: has("finance") ? Array.from(accounts) : [],
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
        saving: has("savings") ? { amount: Number(saving) || 0 } : null,
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
      setStep(4); // нечего настраивать — сразу к финалу
      return;
    }
    setStep(step + 1);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-safe pb-10">
      {/* индикатор шагов */}
      <div className="mt-6 mb-8 flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s <= step ? "bg-accent" : "bg-line"
            }`}
          />
        ))}
      </div>

      {/* ШАГ 1 — приветствие */}
      {step === 1 && (
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-2xl font-semibold">Соберём твою личную систему</h1>
          <p className="mt-3 text-muted">
            Выбери, что хочешь отслеживать сейчас. Можно начать с минимума и
            добавить остальное позже.
          </p>
          <button onClick={() => setStep(2)} className="btn-primary mt-8 w-full">
            Начать
          </button>
        </div>
      )}

      {/* ШАГ 2 — выбор модулей */}
      {step === 2 && (
        <div className="flex flex-1 flex-col">
          <h1 className="text-2xl font-semibold">Что отслеживаем?</h1>
          <p className="mt-2 text-muted">
            Можно выбрать только одно. Остальное добавишь в настройках.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {MODULES.map((m) => {
              const active = modules.has(m.key);
              return (
                <button
                  key={m.key}
                  onClick={() => setModules(toggle(modules, m.key))}
                  className={`card text-left transition ${
                    active ? "border-accent ring-1 ring-accent" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                        active
                          ? "border-accent bg-accent text-white"
                          : "border-line"
                      }`}
                    >
                      {active ? "✓" : ""}
                    </span>
                    <div>
                      <div className="font-medium">{m.title}</div>
                      <div className="text-sm text-muted">{m.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ШАГ 3 — мини-настройка */}
      {step === 3 && (
        <div className="flex flex-1 flex-col gap-6">
          <h1 className="text-2xl font-semibold">Немного настроим</h1>

          {has("habits") && (
            <section className="card">
              <h2 className="font-medium">Стартовые привычки</h2>
              <p className="mb-3 text-sm text-muted">
                Оставь те, что подходят. Остальные можно убрать.
              </p>
              <div className="flex flex-col gap-2">
                {STARTER_HABITS.map((h) => (
                  <label key={h} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={habits.has(h)}
                      onChange={() => setHabits(toggle(habits, h))}
                      className="h-5 w-5 accent-accent"
                    />
                    <span>{h}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {has("finance") && (
            <section className="card">
              <h2 className="font-medium">Хочешь добавить стартовые счета?</h2>
              <p className="mb-3 text-sm text-muted">Можно пропустить.</p>
              <div className="flex flex-col gap-2">
                {STARTER_ACCOUNTS.map((a) => (
                  <label key={a} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={accounts.has(a)}
                      onChange={() => setAccounts(toggle(accounts, a))}
                      className="h-5 w-5 accent-accent"
                    />
                    <span>{a}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {has("goals") && (
            <section className="card">
              <h2 className="font-medium">Первая цель</h2>
              <p className="mb-3 text-sm text-muted">Можно пропустить.</p>
              <input
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="Например: Отпуск"
                className="field mb-3"
              />
              <input
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                inputMode="numeric"
                placeholder="Целевая сумма"
                className="field"
              />
            </section>
          )}

          {has("debts") && (
            <section className="card">
              <h2 className="font-medium">Первый долг</h2>
              <p className="mb-3 text-sm text-muted">Можно пропустить.</p>
              <input
                value={debtName}
                onChange={(e) => setDebtName(e.target.value)}
                placeholder="Название"
                className="field mb-3"
              />
              <input
                value={debtCurrent}
                onChange={(e) => setDebtCurrent(e.target.value)}
                inputMode="numeric"
                placeholder="Текущий остаток"
                className="field mb-3"
              />
              <input
                value={debtMin}
                onChange={(e) => setDebtMin(e.target.value)}
                inputMode="numeric"
                placeholder="Минимальный платёж"
                className="field"
              />
            </section>
          )}

          {has("savings") && (
            <section className="card">
              <h2 className="font-medium">Текущая подушка</h2>
              <p className="mb-3 text-sm text-muted">
                Сколько уже отложено? Можно пропустить.
              </p>
              <input
                value={saving}
                onChange={(e) => setSaving(e.target.value)}
                inputMode="numeric"
                placeholder="Сумма"
                className="field"
              />
            </section>
          )}
        </div>
      )}

      {/* ШАГ 4 — завершение */}
      {step === 4 && (
        <div className="flex flex-1 flex-col justify-center text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-green/40 text-2xl">
            ✓
          </div>
          <h1 className="text-2xl font-semibold">Готово. Начинаем мягко.</h1>
          <p className="mt-3 text-muted">
            Можно просто отмечать факты и постепенно настраивать систему под
            себя.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-peach/15 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      {/* навигация */}
      <div className="mt-8 flex gap-3 pb-safe">
        {step > 1 && step < 4 && (
          <button
            onClick={() => setStep(step === 4 && !hasMiniSetup ? 2 : step - 1)}
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
            {pending ? "Минутку…" : "Перейти в приложение"}
          </button>
        )}
      </div>
    </main>
  );
}
