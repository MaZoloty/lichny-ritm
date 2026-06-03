import { createClient } from "@/lib/supabase/server";
import type { Account, Debt, DebtPayment } from "@/types/db";

export interface DebtPaymentView extends DebtPayment {
  accountName: string | null;
  accountCurrency: string;
  interestShare: number;
}

export interface DebtView extends Debt {
  payments: DebtPaymentView[];
  latestPayment: DebtPaymentView | null;
  paidAmount: number;
  paidPercent: number;
  remainingPercent: number;
  totalInterest: number;
}

export interface DebtsSummary {
  totalCurrentDebt: number;
  totalInitialDebt: number;
  totalPaid: number;
  overallPaidPercent: number;
  monthlyMinimumTotal: number;
  totalInterest: number;
  nextPayment: DebtView | null;
}

export interface DebtsData {
  debts: DebtView[];
  accounts: Account[];
  currency: string;
  summary: DebtsSummary;
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function pct(part: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

export async function loadDebts(): Promise<DebtsData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty: DebtsData = {
    debts: [],
    accounts: [],
    currency: "RUB",
    summary: {
      totalCurrentDebt: 0,
      totalInitialDebt: 0,
      totalPaid: 0,
      overallPaidPercent: 0,
      monthlyMinimumTotal: 0,
      totalInterest: 0,
      nextPayment: null,
    },
  };
  if (!user) return empty;

  const [{ data: debtRows }, { data: accountRows }, { data: paymentRows }] =
    await Promise.all([
      supabase
        .from("debts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("accounts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("debt_payments")
        .select(
          "*, accounts(name, currency)",
        )
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  const accounts = (accountRows ?? []) as Account[];
  const currency = accounts[0]?.currency ?? "RUB";
  const paymentMap = new Map<string, DebtPaymentView[]>();

  for (const row of paymentRows ?? []) {
    const acc = one<{ name: string; currency: string }>(row.accounts as never);
    const payment: DebtPaymentView = {
      id: row.id as string,
      user_id: row.user_id as string,
      debt_id: row.debt_id as string,
      account_id: (row.account_id as string | null) ?? null,
      transaction_id: (row.transaction_id as string | null) ?? null,
      actual_payment: Number(row.actual_payment),
      principal_reduction: Number(row.principal_reduction),
      interest_amount: Number(row.interest_amount),
      payment_date: row.payment_date as string,
      comment: (row.comment as string | null) ?? null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      accountName: acc?.name ?? null,
      accountCurrency: acc?.currency ?? currency,
      interestShare: pct(Number(row.interest_amount), Number(row.actual_payment)),
    };
    const list = paymentMap.get(payment.debt_id) ?? [];
    list.push(payment);
    paymentMap.set(payment.debt_id, list);
  }

  const debts: DebtView[] = ((debtRows ?? []) as Debt[]).map((debt) => {
    const initial = Number(debt.initial_amount);
    const current = Number(debt.current_amount);
    const paid = Math.max(0, initial - current);
    const payments = paymentMap.get(debt.id) ?? [];
    const totalInterest = payments.reduce(
      (sum, payment) => sum + Number(payment.interest_amount),
      0,
    );
    return {
      ...debt,
      initial_amount: initial,
      current_amount: current,
      minimum_payment: Number(debt.minimum_payment),
      payments,
      latestPayment: payments[0] ?? null,
      paidAmount: paid,
      paidPercent: pct(paid, initial),
      remainingPercent: pct(current, initial),
      totalInterest,
    };
  });

  const totalCurrentDebt = debts.reduce((sum, debt) => sum + debt.current_amount, 0);
  const totalInitialDebt = debts.reduce((sum, debt) => sum + debt.initial_amount, 0);
  const monthlyMinimumTotal = debts.reduce(
    (sum, debt) => sum + debt.minimum_payment,
    0,
  );
  const totalPaid = Math.max(0, totalInitialDebt - totalCurrentDebt);
  const totalInterest = debts.reduce((sum, debt) => sum + debt.totalInterest, 0);
  const nextPayment =
    debts
      .filter((debt) => debt.next_payment_date)
      .sort((a, b) =>
        (a.next_payment_date ?? "").localeCompare(b.next_payment_date ?? ""),
      )[0] ?? null;

  return {
    debts,
    accounts,
    currency,
    summary: {
      totalCurrentDebt,
      totalInitialDebt,
      totalPaid,
      overallPaidPercent: pct(totalPaid, totalInitialDebt),
      monthlyMinimumTotal,
      totalInterest,
      nextPayment,
    },
  };
}
