"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string } | null;

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Не удалось войти. Проверь почту и пароль." };
  }
  redirect("/");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("display_name") || "").trim();

  if (password.length < 6) {
    return { error: "Пароль должен быть не короче 6 символов." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    return { error: "Не получилось зарегистрироваться. Попробуй другую почту." };
  }
  // Если в проекте включено подтверждение почты — сессии ещё нет.
  // Пробуем сразу войти; при включённом подтверждении пользователь
  // увидит экран входа.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    return {
      error:
        "Аккаунт создан. Подтверди почту по ссылке из письма и войди снова.",
    };
  }
  redirect("/");
}
