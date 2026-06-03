import { createClient } from "@/lib/supabase/server";
import { percent } from "@/lib/format";
import type { Account, SavingsSettings } from "@/types/db";

export interface SavingsData {
  accounts: Account[];
  totalSavings: number;
  savingsAccountCount: number;
  monthlyChange: number;
  emergencyTargetAmount: number;
  emergencyProgress: number;
  currency: string;
}

function firstDayOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

export async function loadSavings(): Promise<SavingsData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty: SavingsData = {
    accounts: [],
    totalSavings: 0,
    savingsAccountCount: 0,
    monthlyChange: 0,
    emergencyTargetAmount: 0,
    emergencyProgress: 0,
    currency: "RUB",
  };
  if (!user) return empty;

  const [{ data: accountRows }, { data: settingsRow }] = await Promise.all([
    supabase
      .from("accounts")
      .select("*")
      .eq("is_active", true)
      .eq("is_savings", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("savings_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const accounts = (accountRows ?? []) as Account[];
  const accountIds = accounts.map((account) => account.id);
  const totalSavings = accounts.reduce(
    (sum, account) => sum + Number(account.current_balance),
    0,
  );
  const settings = settingsRow as SavingsSettings | null;
  const emergencyTargetAmount = Number(
    settings?.emergency_target_amount ?? 0,
  );

  let monthlyChange = 0;
  if (accountIds.length) {
    const { data: transactionRows } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "saving")
      .gte("date", firstDayOfMonthISO())
      .in("account_id", accountIds);
    monthlyChange = (transactionRows ?? []).reduce(
      (sum, row) => sum + Number(row.amount),
      0,
    );
  }

  return {
    accounts,
    totalSavings,
    savingsAccountCount: accounts.length,
    monthlyChange,
    emergencyTargetAmount,
    emergencyProgress: percent(totalSavings, emergencyTargetAmount),
    currency: accounts[0]?.currency ?? "RUB",
  };
}
