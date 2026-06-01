"use server";

import { revalidatePath } from "next/cache";
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
