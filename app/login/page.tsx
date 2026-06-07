"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Sparkles } from "lucide-react";
import { signIn, signUp, type AuthState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full rounded-[22px]" disabled={pending}>
      {pending ? "Минутку…" : label}
    </button>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction] = useActionState<AuthState, FormData>(action, null);

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center overflow-hidden px-6 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(155,99,244,0.34),transparent_30%),radial-gradient(circle_at_18%_82%,rgba(116,201,132,0.24),transparent_34%),linear-gradient(180deg,#FFFDFB_0%,#FAF7F2_100%)]" />

      <div className="relative z-10 mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[26px] bg-[#8B5CF6] text-white shadow-soft">
          <Sparkles size={28} strokeWidth={1.9} />
        </div>
        <h1 className="text-[30px] font-semibold leading-tight text-[#2F2F35]">Личный ритм</h1>
        <p className="mt-2 text-[15px] leading-6 text-[#6F6D79]">
          Спокойная личная система. Маленькими шагами.
        </p>
      </div>

      <form
        action={formAction}
        className="relative z-10 flex flex-col gap-4 rounded-[30px] border border-[#EDE7DF] bg-white/92 p-5 shadow-card"
      >
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-sm text-[#7C7A88]">Как тебя звать</label>
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
          <label className="mb-1 block text-sm text-[#7C7A88]">Почта</label>
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
          <label className="mb-1 block text-sm text-[#7C7A88]">Пароль</label>
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
          <p className="rounded-[22px] border border-[#F1C2B8] bg-[#FFE9E3] px-4 py-3 text-sm text-[#D96E61]">
            {state.error}
          </p>
        )}

        <SubmitButton label={mode === "signin" ? "Войти" : "Создать аккаунт"} />
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="relative z-10 mt-6 text-center text-sm font-semibold text-[#8B5CF6]"
      >
        {mode === "signin"
          ? "Ещё нет аккаунта? Зарегистрироваться"
          : "Уже есть аккаунт? Войти"}
      </button>
    </main>
  );
}
