"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ModuleKey } from "@/lib/modules";

export async function setModuleEnabled(key: ModuleKey, enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нет доступа." };

  const { error } = await supabase.from("user_modules").upsert(
    { user_id: user.id, module_key: key, is_enabled: enabled },
    { onConflict: "user_id,module_key" },
  );
  if (error) return { error: "Не удалось сохранить." };

  revalidatePath("/", "layout");
  return {};
}

export async function updateDisplayName(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нет доступа." };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name.trim() })
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось сохранить имя." };

  revalidatePath("/", "layout");
  return {};
}

const RESET_TABLES: { table: string; optional?: boolean }[] = [
  { table: "habit_logs" },
  { table: "habit_weekly_goals" },
  { table: "goal_contributions" },
  { table: "transactions" },
  { table: "debt_payments", optional: true },
  { table: "habits" },
  { table: "goals" },
  { table: "savings" },
  { table: "debts" },
  { table: "accounts" },
  { table: "categories" },
  { table: "reminders_settings", optional: true },
  { table: "user_modules" },
];

function isMissingTableError(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table")
  );
}

async function deleteUserRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  userId: string,
  optional = false,
) {
  const { error } = await supabase.from(table).delete().eq("user_id", userId);
  if (!error) return null;
  if (optional && isMissingTableError(error)) return null;
  return error;
}

export async function resetApplicationData(formData: FormData) {
  const confirmation = String(formData.get("confirmation") || "").trim();
  if (confirmation !== "СБРОСИТЬ") {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const uid = user.id;

  for (const item of RESET_TABLES) {
    const error = await deleteUserRows(
      supabase,
      item.table,
      uid,
      item.optional,
    );
    if (error) throw new Error("Failed to reset application data.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarding_completed: false })
    .eq("user_id", uid);
  if (profileError) {
    throw new Error("Failed to reopen onboarding after reset.");
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}
