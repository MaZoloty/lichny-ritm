import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
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
    <>
      <div className="px-5 pt-safe">
        <Link href="/settings" className="mt-4 inline-block text-sm text-accent">
          ← Настройки
        </Link>
      </div>
      <PageHeader title="Категории" subtitle="Куда уходят деньги." />
      <div className="px-5">
        <CategoriesManager categories={(data ?? []) as Category[]} />
      </div>
    </>
  );
}
