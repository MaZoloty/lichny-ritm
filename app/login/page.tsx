"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signUp, type AuthState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Минутку…" : label}
    </button>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction] = useActionState<AuthState, FormData>(action, null);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent text-2xl text-white">
          ◍
        </div>
        <h1 className="text-2xl font-semibold">Личный ритм</h1>
        <p className="mt-2 text-muted">
          Спокойная личная система. Маленькими шагами.
        </p>
      </div>

      <form action={formAction} className="card flex flex-col gap-4">
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-sm text-muted">Как тебя звать</label>
            <input
              name="display_name"
              type="text"
              autoComplete="name"
              placeholder="Имя"
              className="field"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-muted">Почта</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="field"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Пароль</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="••••••"
            className="field"
          />
        </div>

        {state?.error && (
          <p className="rounded-2xl bg-peach/15 px-4 py-3 text-sm text-ink">
            {state.error}
          </p>
        )}

        <SubmitButton label={mode === "signin" ? "Войти" : "Создать аккаунт"} />
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-6 text-center text-sm text-accent"
      >
        {mode === "signin"
          ? "Ещё нет аккаунта? Зарегистрироваться"
          : "Уже есть аккаунт? Войти"}
      </button>
    </main>
  );
}
