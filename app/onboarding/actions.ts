"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MODULES, type ModuleKey } from "@/lib/modules";
import { seedDefaultCategories } from "@/lib/categories";

export interface OnboardingPayload {
  modules: ModuleKey[];
  habits: string[];
  accounts: string[];
  goal: { name: string; target: number } | null;
  debt: { name: string; current: number; min: number } | null;
  saving: { amount: number } | null;
}

export async function completeOnboarding(
  payload: OnboardingPayload,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const uid = user.id;

  // 1. Модули: пишем все, включая выключенные (для настроек).
  const moduleRows = MODULES.map((m) => ({
    user_id: uid,
    module_key: m.key,
    is_enabled: payload.modules.includes(m.key),
  }));
  const { error: modErr } = await supabase
    .from("user_modules")
    .upsert(moduleRows, { onConflict: "user_id,module_key" });
  if (modErr) return { error: "Не удалось сохранить выбор модулей." };

  // 2. Привычки
  if (payload.modules.includes("habits") && payload.habits.length) {
    await supabase.from("habits").insert(
      payload.habits.map((name) => ({
        user_id: uid,
        name,
        track_daily_streak: true,
        track_weekly_streak: true,
      })),
    );
  }

  // 3. Финансы: счета + дефолтные категории
  if (payload.modules.includes("finance")) {
    if (payload.accounts.length) {
      await supabase.from("accounts").insert(
        payload.accounts.map((name) => ({ user_id: uid, name })),
      );
    }
    await seedDefaultCategories(supabase, uid);
  }

  // 4. Цель
  if (payload.modules.includes("goals") && payload.goal?.name) {
    await supabase.from("goals").insert({
      user_id: uid,
      name: payload.goal.name,
      target_amount: payload.goal.target || 0,
    });
  }

  // 5. Долг
  if (payload.modules.includes("debts") && payload.debt?.name) {
    await supabase.from("debts").insert({
      user_id: uid,
      name: payload.debt.name,
      initial_amount: payload.debt.current || 0,
      current_amount: payload.debt.current || 0,
      minimum_payment: payload.debt.min || 0,
    });
  }

  // 6. Сбережения
  if (payload.modules.includes("savings") && payload.saving) {
    await supabase.from("savings").insert({
      user_id: uid,
      name: "Подушка",
      current_amount: payload.saving.amount || 0,
    });
  }

  // Завершаем онбординг
  const { error: profErr } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("user_id", uid);
  if (profErr) return { error: "Почти готово, но не удалось сохранить профиль." };

  redirect("/");
}
