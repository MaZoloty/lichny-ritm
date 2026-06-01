import { redirect } from "next/navigation";
import { getUserContext, type UserContext } from "@/lib/data";
import type { ModuleKey } from "@/lib/modules";

// Гарантирует, что пользователь авторизован, прошёл онбординг и модуль включён.
// Иначе мягко перенаправляет.
export async function requireModule(key: ModuleKey): Promise<UserContext> {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");
  if (!ctx.profile?.onboarding_completed) redirect("/onboarding");
  if (!ctx.enabledModules.has(key)) redirect("/");
  return ctx;
}
