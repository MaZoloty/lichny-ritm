import { createClient } from "@/lib/supabase/server";
import type { ModuleKey } from "@/lib/modules";
import type { Profile } from "@/types/db";

export interface UserContext {
  userId: string;
  email: string | null;
  profile: Profile | null;
  enabledModules: Set<ModuleKey>;
}

// Загружает пользователя, профиль и включённые модули.
// Возвращает null, если пользователь не авторизован.
export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: modules }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase
      .from("user_modules")
      .select("module_key, is_enabled")
      .eq("user_id", user.id),
  ]);

  const enabled = new Set<ModuleKey>();
  (modules ?? []).forEach((m) => {
    if (m.is_enabled) enabled.add(m.module_key as ModuleKey);
  });

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: (profile as Profile) ?? null,
    enabledModules: enabled,
  };
}
