import { createClient } from "@/lib/supabase/server";
import { periodRange, type Period } from "@/lib/period";
import type { Account, Category } from "@/types/db";

export interface TxView {
  id: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  comment: string | null;
  category_id: string | null;
  account_id: string | null;
  categoryName: string | null;
  accountName: string | null;
  accountCurrency: string;
}

export interface CategoryStat {
  name: string;
  sum: number;
  pct: number;
}

export interface AccountStat {
  accountId: string | null;
  name: string;
  income: number;
  expense: number;
  diff: number;
  currentBalance: number | null;
  currency: string;
}

export interface FinanceData {
  period: Period;
  fromISO: string;
  toISO: string;
  currency: string;
  transactions: TxView[];
  incomeTotal: number;
  expenseTotal: number;
  diff: number;
  expenseByCategory: CategoryStat[];
  incomeByCategory: CategoryStat[];
  byAccount: AccountStat[];
  accounts: Account[]; // активные — для модалки
  categories: Category[]; // активные — для модалки
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function loadFinance(period: Period): Promise<FinanceData> {
  const supabase = await createClient();
  const { fromISO, toISO } = periodRange(period);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const base: FinanceData = {
    period,
    fromISO,
    toISO,
    currency: "RUB",
    transactions: [],
    incomeTotal: 0,
    expenseTotal: 0,
    diff: 0,
    expenseByCategory: [],
    incomeByCategory: [],
    byAccount: [],
    accounts: [],
    categories: [],
  };
  if (!user) return base;

  const [{ data: accRows }, { data: catRows }, { data: txRows }] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("transactions")
        .select(
          "id, amount, type, date, comment, category_id, account_id, categories(name), accounts(name, current_balance, currency)",
        )
        .neq("type", "saving") // пополнения целей не входят в обычную аналитику
        .gte("date", fromISO)
        .lte("date", toISO)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  const accounts = (accRows ?? []) as Account[];
  const categories = (catRows ?? []) as Category[];
  const currency = accounts[0]?.currency ?? "RUB";

  const transactions: TxView[] = (txRows ?? []).map((r) => {
    const cat = one<{ name: string }>(r.categories as never);
    const acc = one<{ name: string; current_balance: number; currency: string }>(
      r.accounts as never,
    );
    return {
      id: r.id as string,
      amount: Number(r.amount),
      type: r.type as "income" | "expense",
      date: r.date as string,
      comment: (r.comment as string | null) ?? null,
      category_id: (r.category_id as string | null) ?? null,
      account_id: (r.account_id as string | null) ?? null,
      categoryName: cat?.name ?? null,
      accountName: acc?.name ?? null,
      accountCurrency: acc?.currency ?? currency,
    };
  });

  let incomeTotal = 0;
  let expenseTotal = 0;
  const expenseCat = new Map<string, number>();
  const incomeCat = new Map<string, number>();
  const accMap = new Map<string, AccountStat>();

  for (const t of transactions) {
    if (t.type === "income") incomeTotal += t.amount;
    else expenseTotal += t.amount;

    const catName = t.categoryName ?? "Без категории";
    if (t.type === "expense")
      expenseCat.set(catName, (expenseCat.get(catName) ?? 0) + t.amount);
    else incomeCat.set(catName, (incomeCat.get(catName) ?? 0) + t.amount);

    const accKey = t.account_id ?? "none";
    const stat =
      accMap.get(accKey) ??
      ({
        accountId: t.account_id,
        name: t.accountName ?? "Без счёта",
        income: 0,
        expense: 0,
        diff: 0,
        currentBalance: null,
        currency: t.accountCurrency,
      } as AccountStat);
    if (t.type === "income") stat.income += t.amount;
    else stat.expense += t.amount;
    stat.diff = stat.income - stat.expense;
    accMap.set(accKey, stat);
  }

  // Текущие балансы активных счетов в разрезе по счетам.
  for (const a of accounts) {
    const stat = accMap.get(a.id);
    if (stat) stat.currentBalance = Number(a.current_balance);
  }

  const toStats = (m: Map<string, number>, total: number): CategoryStat[] =>
    Array.from(m.entries())
      .map(([name, sum]) => ({
        name,
        sum,
        pct: total > 0 ? Math.round((sum / total) * 100) : 0,
      }))
      .sort((a, b) => b.sum - a.sum);

  return {
    ...base,
    currency,
    transactions,
    incomeTotal,
    expenseTotal,
    diff: incomeTotal - expenseTotal,
    expenseByCategory: toStats(expenseCat, expenseTotal),
    incomeByCategory: toStats(incomeCat, incomeTotal),
    byAccount: Array.from(accMap.values()).sort(
      (a, b) => b.expense - a.expense,
    ),
    accounts,
    categories,
  };
}
