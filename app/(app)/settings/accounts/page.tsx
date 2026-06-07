import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
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
    <main className="px-5 pb-56 pt-safe">
      <div className="pt-4">
        <Link href="/settings" className="inline-block text-sm font-semibold text-[#8B5CF6]">
          ← Настройки
        </Link>
      </div>
      <header className="relative -mx-5 overflow-hidden px-5 pb-5 pt-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(112,185,238,0.32),transparent_30%),radial-gradient(circle_at_18%_80%,rgba(155,99,244,0.22),transparent_34%),linear-gradient(180deg,rgba(255,253,251,0.92),rgba(250,247,242,0))]" />
        <div className="relative z-10">
          <h1 className="text-[34px] font-semibold leading-[1.04] text-[#2F2F35]">Счета</h1>
          <p className="mt-3 max-w-[17rem] text-[15px] leading-6 text-[#6F6D79]">
            Где хранятся деньги и какая часть считается сбережениями.
          </p>
        </div>
      </header>
      <AccountsManager accounts={(data ?? []) as Account[]} />
    </main>
  );
}
