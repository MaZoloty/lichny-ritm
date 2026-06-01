import { createClient } from "@/lib/supabase/server";
import { periodRange } from "@/lib/period";
import { remainingAmount } from "@/lib/goals";
import type { Account, Goal } from "@/types/db";

export interface ContributionView {
  id: string;
  goal_id: string;
  amount: number;
  contribution_date: string;
  comment: string | null;
  account_id: string | null;
  accountName: string | null;
}

export interface GoalView extends Goal {
  contributions: ContributionView[];
}

export interface GoalsData {
  goals: GoalView[];
  totalSaved: number;
  totalRemaining: number;
  activeCount: number;
  savedThisMonth: number;
  accounts: Account[];
  currency: string;
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function loadGoals(): Promise<GoalsData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const base: GoalsData = {
    goals: [],
    totalSaved: 0,
    totalRemaining: 0,
    activeCount: 0,
    savedThisMonth: 0,
    accounts: [],
    currency: "RUB",
  };
  if (!user) return base;

  const { fromISO: monthFrom, toISO: monthTo } = periodRange("month");

  const [{ data: goalRows }, { data: contribRows }, { data: accRows }] =
    await Promise.all([
      supabase
        .from("goals")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("goal_contributions")
        .select(
          "id, goal_id, amount, contribution_date, comment, account_id, accounts(name)",
        )
        .order("contribution_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("accounts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
    ]);

  const goals = (goalRows ?? []) as Goal[];
  const accounts = (accRows ?? []) as Account[];
  const currency = accounts[0]?.currency ?? "RUB";

  const byGoal = new Map<string, ContributionView[]>();
  let savedThisMonth = 0;
  for (const r of contribRows ?? []) {
    const acc = one<{ name: string }>(r.accounts as never);
    const view: ContributionView = {
      id: r.id as string,
      goal_id: r.goal_id as string,
      amount: Number(r.amount),
      contribution_date: r.contribution_date as string,
      comment: (r.comment as string | null) ?? null,
      account_id: (r.account_id as string | null) ?? null,
      accountName: acc?.name ?? null,
    };
    const arr = byGoal.get(view.goal_id) ?? [];
    arr.push(view);
    byGoal.set(view.goal_id, arr);
    if (
      view.contribution_date >= monthFrom &&
      view.contribution_date <= monthTo
    ) {
      savedThisMonth += view.amount;
    }
  }

  let totalSaved = 0;
  let totalRemaining = 0;
  const goalViews: GoalView[] = goals.map((g) => {
    totalSaved += Number(g.current_amount);
    totalRemaining += remainingAmount(
      Number(g.current_amount),
      Number(g.target_amount),
    );
    return { ...g, contributions: byGoal.get(g.id) ?? [] };
  });

  return {
    goals: goalViews,
    totalSaved,
    totalRemaining,
    activeCount: goals.length,
    savedThisMonth,
    accounts,
    currency,
  };
}
