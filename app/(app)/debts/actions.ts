"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Debt } from "@/types/db";

type Result = { error?: string };
type SB = Awaited<ReturnType<typeof getUser>>["supabase"];

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function refresh() {
  revalidatePath("/debts");
  revalidatePath("/finance");
  revalidatePath("/settings/accounts");
  revalidatePath("/");
}

async function bumpAccount(
  supabase: SB,
  userId: string,
  accountId: string | null,
  delta: number,
) {
  if (!accountId || !delta) return true;
  const { data } = await supabase
    .from("accounts")
    .select("current_balance")
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return false;
  const { error } = await supabase
    .from("accounts")
    .update({ current_balance: Number(data.current_balance) + delta })
    .eq("id", accountId)
    .eq("user_id", userId);
  return !error;
}

async function bumpDebt(
  supabase: SB,
  userId: string,
  debtId: string,
  delta: number,
) {
  if (!delta) return true;
  const { data } = await supabase
    .from("debts")
    .select("current_amount")
    .eq("id", debtId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return false;
  const next = Number(data.current_amount) + delta;
  if (next < 0) return false;
  const { error } = await supabase
    .from("debts")
    .update({ current_amount: next })
    .eq("id", debtId)
    .eq("user_id", userId);
  return !error;
}

async function createDebtTransaction(
  supabase: SB,
  userId: string,
  input: DebtPaymentInput,
) {
  return supabase
    .from("transactions")
    .insert({
      user_id: userId,
      amount: input.actualPayment,
      type: "debt_payment",
      category_id: null,
      account_id: input.accountId,
      date: input.date,
      comment: input.comment?.trim() || null,
    })
    .select("id")
    .single();
}

export interface DebtInput {
  name: string;
  type: "credit_card" | "loan" | "installment" | "other";
  initialAmount: number;
  currentAmount: number;
  minimumPayment: number;
  paymentDay: number | null;
  nextPaymentDate: string | null;
  comment: string | null;
}

function validateDebt(input: DebtInput): string | null {
  if (!input.name.trim()) return "Нужно название долга.";
  if (!Number.isFinite(input.initialAmount) || input.initialAmount <= 0)
    return "Изначальная сумма должна быть больше нуля.";
  if (!Number.isFinite(input.currentAmount) || input.currentAmount < 0)
    return "Текущий остаток не может быть отрицательным.";
  if (!Number.isFinite(input.minimumPayment) || input.minimumPayment < 0)
    return "Минимальный платёж не может быть отрицательным.";
  if (
    input.paymentDay !== null &&
    (!Number.isInteger(input.paymentDay) ||
      input.paymentDay < 1 ||
      input.paymentDay > 31)
  ) {
    return "День платежа должен быть от 1 до 31.";
  }
  return null;
}

export async function createDebt(input: DebtInput): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  const invalid = validateDebt(input);
  if (invalid) return { error: invalid };

  const { error } = await supabase.from("debts").insert({
    user_id: user.id,
    name: input.name.trim(),
    type: input.type,
    initial_amount: input.initialAmount,
    current_amount: input.currentAmount,
    minimum_payment: input.minimumPayment,
    payment_day: input.paymentDay,
    next_payment_date: input.nextPaymentDate,
    comment: input.comment?.trim() || null,
    is_active: true,
  });
  if (error) return { error: "Не удалось сохранить долг." };

  refresh();
  return {};
}

export async function updateDebt(
  id: string,
  input: DebtInput,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  const invalid = validateDebt(input);
  if (invalid) return { error: invalid };

  const { error } = await supabase
    .from("debts")
    .update({
      name: input.name.trim(),
      type: input.type,
      initial_amount: input.initialAmount,
      current_amount: input.currentAmount,
      minimum_payment: input.minimumPayment,
      payment_day: input.paymentDay,
      next_payment_date: input.nextPaymentDate,
      comment: input.comment?.trim() || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось сохранить изменения." };

  refresh();
  return {};
}

export async function setDebtActive(
  id: string,
  isActive: boolean,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  const { error } = await supabase
    .from("debts")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось обновить долг." };

  refresh();
  return {};
}

export interface DebtPaymentInput {
  debtId: string;
  actualPayment: number;
  principalReduction: number;
  accountId: string | null;
  date: string;
  comment: string | null;
}

function normalizedPayment(input: DebtPaymentInput) {
  return {
    ...input,
    interestAmount: input.actualPayment - input.principalReduction,
  };
}

async function validatePayment(
  supabase: SB,
  userId: string,
  input: DebtPaymentInput,
  availablePrincipal?: number,
): Promise<string | null> {
  if (!input.debtId) return "Нужно выбрать долг.";
  if (!Number.isFinite(input.actualPayment) || input.actualPayment <= 0)
    return "Фактический платёж должен быть больше нуля.";
  if (
    !Number.isFinite(input.principalReduction) ||
    input.principalReduction < 0
  ) {
    return "Тело долга не может быть отрицательным.";
  }
  if (input.principalReduction > input.actualPayment)
    return "Тело долга не может быть больше платежа.";

  const { data: debt } = await supabase
    .from("debts")
    .select("current_amount")
    .eq("id", input.debtId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!debt) return "Долг не найден.";

  const available = availablePrincipal ?? Number(debt.current_amount);
  if (input.principalReduction > available)
    return "Тело долга больше текущего остатка.";

  return null;
}

export async function addDebtPayment(
  input: DebtPaymentInput,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  const invalid = await validatePayment(supabase, user.id, input);
  if (invalid) return { error: invalid };
  const normalized = normalizedPayment(input);

  const { data: tx, error: txError } = await createDebtTransaction(
    supabase,
    user.id,
    input,
  );
  if (txError || !tx?.id) {
    return { error: "Не удалось создать операцию платежа." };
  }

  const { error: paymentError } = await supabase.from("debt_payments").insert({
    user_id: user.id,
    debt_id: input.debtId,
    account_id: input.accountId,
    transaction_id: tx.id,
    actual_payment: input.actualPayment,
    principal_reduction: input.principalReduction,
    interest_amount: normalized.interestAmount,
    payment_date: input.date,
    comment: input.comment?.trim() || null,
  });
  if (paymentError) {
    await supabase.from("transactions").delete().eq("id", tx.id).eq("user_id", user.id);
    return { error: "Не удалось сохранить платёж." };
  }

  const debtOk = await bumpDebt(
    supabase,
    user.id,
    input.debtId,
    -input.principalReduction,
  );
  const accountOk = debtOk
    ? await bumpAccount(supabase, user.id, input.accountId, -input.actualPayment)
    : false;
  if (!debtOk || !accountOk) {
    if (debtOk) {
      await bumpDebt(supabase, user.id, input.debtId, input.principalReduction);
    }
    await supabase.from("debt_payments").delete().eq("transaction_id", tx.id);
    await supabase.from("transactions").delete().eq("id", tx.id).eq("user_id", user.id);
    return { error: "Не удалось пересчитать долг и счёт." };
  }

  refresh();
  return {};
}

export async function updateDebtPayment(
  id: string,
  input: DebtPaymentInput,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };

  const { data: old } = await supabase
    .from("debt_payments")
    .select(
      "debt_id, account_id, transaction_id, actual_payment, principal_reduction, payment_date, comment",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!old) return { error: "Платёж не найден." };

  const oldDebtId = old.debt_id as string;
  const oldAccountId = (old.account_id as string | null) ?? null;
  const oldTransactionId = (old.transaction_id as string | null) ?? null;
  const oldActual = Number(old.actual_payment);
  const oldPrincipal = Number(old.principal_reduction);
  const normalized = normalizedPayment(input);

  if (!input.debtId) return { error: "Нужно выбрать долг." };
  if (!Number.isFinite(input.actualPayment) || input.actualPayment <= 0)
    return { error: "Фактический платёж должен быть больше нуля." };
  if (
    !Number.isFinite(input.principalReduction) ||
    input.principalReduction < 0
  ) {
    return { error: "Тело долга не может быть отрицательным." };
  }
  if (input.principalReduction > input.actualPayment)
    return { error: "Тело долга не может быть больше платежа." };

  // 1. Откатываем старое влияние.
  const rollbackDebtOk = await bumpDebt(supabase, user.id, oldDebtId, oldPrincipal);
  const rollbackAccountOk = rollbackDebtOk
    ? await bumpAccount(supabase, user.id, oldAccountId, oldActual)
    : false;
  if (!rollbackDebtOk || !rollbackAccountOk) {
    if (rollbackDebtOk) await bumpDebt(supabase, user.id, oldDebtId, -oldPrincipal);
    return { error: "Не удалось откатить старый платёж." };
  }

  const invalidAfterRollback = await validatePayment(
    supabase,
    user.id,
    input,
  );
  if (invalidAfterRollback) {
    await bumpDebt(supabase, user.id, oldDebtId, -oldPrincipal);
    await bumpAccount(supabase, user.id, oldAccountId, -oldActual);
    return { error: invalidAfterRollback };
  }

  const { error: paymentError } = await supabase
    .from("debt_payments")
    .update({
      debt_id: input.debtId,
      account_id: input.accountId,
      actual_payment: input.actualPayment,
      principal_reduction: input.principalReduction,
      interest_amount: normalized.interestAmount,
      payment_date: input.date,
      comment: input.comment?.trim() || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (paymentError) {
    await bumpDebt(supabase, user.id, oldDebtId, -oldPrincipal);
    await bumpAccount(supabase, user.id, oldAccountId, -oldActual);
    return { error: "Не удалось обновить платёж." };
  }

  // 2. Применяем новое влияние.
  const applyDebtOk = await bumpDebt(
    supabase,
    user.id,
    input.debtId,
    -input.principalReduction,
  );
  const applyAccountOk = applyDebtOk
    ? await bumpAccount(supabase, user.id, input.accountId, -input.actualPayment)
    : false;
  if (!applyDebtOk || !applyAccountOk) {
    if (applyDebtOk) {
      await bumpDebt(supabase, user.id, input.debtId, input.principalReduction);
    }
    await supabase
      .from("debt_payments")
      .update({
        debt_id: oldDebtId,
        account_id: oldAccountId,
        actual_payment: oldActual,
        principal_reduction: oldPrincipal,
        interest_amount: oldActual - oldPrincipal,
        payment_date: old.payment_date as string,
        comment: (old.comment as string | null) ?? null,
      })
      .eq("id", id)
      .eq("user_id", user.id);
    await bumpDebt(supabase, user.id, oldDebtId, -oldPrincipal);
    await bumpAccount(supabase, user.id, oldAccountId, -oldActual);
    return { error: "Не удалось применить новый платёж." };
  }

  if (oldTransactionId) {
    const { error: txError } = await supabase
      .from("transactions")
      .update({
        amount: input.actualPayment,
        type: "debt_payment",
        category_id: null,
        account_id: input.accountId,
        date: input.date,
        comment: input.comment?.trim() || null,
      })
      .eq("id", oldTransactionId)
      .eq("user_id", user.id);
    if (txError) {
      await bumpDebt(supabase, user.id, input.debtId, input.principalReduction);
      await bumpAccount(supabase, user.id, input.accountId, input.actualPayment);
      await supabase
        .from("debt_payments")
        .update({
          debt_id: oldDebtId,
          account_id: oldAccountId,
          actual_payment: oldActual,
          principal_reduction: oldPrincipal,
          interest_amount: oldActual - oldPrincipal,
          payment_date: old.payment_date as string,
          comment: (old.comment as string | null) ?? null,
        })
        .eq("id", id)
        .eq("user_id", user.id);
      await bumpDebt(supabase, user.id, oldDebtId, -oldPrincipal);
      await bumpAccount(supabase, user.id, oldAccountId, -oldActual);
      return { error: "Не удалось обновить операцию платежа." };
    }
  } else {
    const { data: tx, error: txError } = await createDebtTransaction(
      supabase,
      user.id,
      input,
    );
    if (txError || !tx?.id) {
      return { error: "Платёж обновлён, но операцию создать не удалось." };
    }
    await supabase
      .from("debt_payments")
      .update({ transaction_id: tx.id })
      .eq("id", id)
      .eq("user_id", user.id);
  }

  refresh();
  return {};
}

export async function deleteDebtPayment(id: string): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };

  const { data: old } = await supabase
    .from("debt_payments")
    .select("debt_id, account_id, transaction_id, actual_payment, principal_reduction")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!old) return { error: "Платёж не найден." };

  const debtId = old.debt_id as string;
  const accountId = (old.account_id as string | null) ?? null;
  const transactionId = (old.transaction_id as string | null) ?? null;
  const actual = Number(old.actual_payment);
  const principal = Number(old.principal_reduction);

  // Сначала откатываем влияние, затем удаляем записи.
  const rollbackDebtOk = await bumpDebt(supabase, user.id, debtId, principal);
  const rollbackAccountOk = rollbackDebtOk
    ? await bumpAccount(supabase, user.id, accountId, actual)
    : false;
  if (!rollbackDebtOk || !rollbackAccountOk) {
    if (rollbackDebtOk) await bumpDebt(supabase, user.id, debtId, -principal);
    return { error: "Не удалось откатить платёж." };
  }

  const { error: paymentError } = await supabase
    .from("debt_payments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (paymentError) {
    await bumpDebt(supabase, user.id, debtId, -principal);
    await bumpAccount(supabase, user.id, accountId, -actual);
    return { error: "Не удалось удалить платёж." };
  }

  if (transactionId) {
    await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId)
      .eq("user_id", user.id);
  }

  refresh();
  return {};
}

export type DebtForForm = Debt;
