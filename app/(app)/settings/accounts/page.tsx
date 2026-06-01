import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import AccountsManager from "@/components/finance/AccountsManager";
import type { Account } from "@/types/db";

export default async function AccountsSettingsPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");
  if (!ctx.profile?.onboarding_completed) redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true });

  return (
    <>
      <div className="px-5 pt-safe">
        <Link href="/settings" className="mt-4 inline-block text-sm text-accent">
          ← Настройки
        </Link>
      </div>
      <PageHeader title="Счета" subtitle="Где хранятся деньги." />
      <div className="px-5">
        <AccountsManager accounts={(data ?? []) as Account[]} />
      </div>
    </>
  );
}
