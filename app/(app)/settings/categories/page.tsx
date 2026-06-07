import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import CategoriesManager from "@/components/finance/CategoriesManager";
import type { Category } from "@/types/db";

export default async function CategoriesSettingsPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");
  if (!ctx.profile?.onboarding_completed) redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  return (
    <main className="px-5 pb-56 pt-safe">
      <div className="pt-4">
        <Link href="/settings" className="inline-block text-sm font-semibold text-[#8B5CF6]">
          ← Настройки
        </Link>
      </div>
      <header className="relative -mx-5 overflow-hidden px-5 pb-5 pt-3">
        <div className="page-ambient-glow" />
        <div className="relative z-10">
          <h1 className="text-[34px] font-semibold leading-[1.04] text-[#2F2F35]">Категории</h1>
          <p className="mt-3 max-w-[17rem] text-[15px] leading-6 text-[#6F6D79]">
            Куда приходят и уходят деньги.
          </p>
        </div>
      </header>
      <CategoriesManager categories={(data ?? []) as Category[]} />
    </main>
  );
}
