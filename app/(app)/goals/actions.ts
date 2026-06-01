"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  revalidatePath("/goals");
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

async function bumpGoal(
  supabase: SB,
  userId: string,
  goalId: string,
  delta: number,
) {
  if (!delta) return true;
  const { data } = await supabase
    .from("goals")
    .select("current_amount")
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return false;
  const next = Math.max(0, Number(data.current_amount) + delta);
  const { error } = await supabase
    .from("goals")
    .update({ current_amount: next })
    .eq("id", goalId)
    .eq("user_id", userId);
  return !error;
}

// ---------- Цели ------------------------------------------------------

export interface GoalInput {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  accountId: string | null;
  comment: string | null;
}

function validateGoal(input: GoalInput): string | null {
  if (!input.name.trim()) return "Нужно название цели.";
  if (!Number.isFinite(input.targetAmount) || input.targetAmount <= 0)
    return "Целевая сумма должна быть больше нуля.";
  if (!Number.isFinite(input.currentAmount) || input.currentAmount < 0)
    return "Текущая сумма не может быть отрицательной.";
  return null;
}

export async function createGoal(input: GoalInput): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  const invalid = validateGoal(input);
  if (invalid) return { error: invalid };

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    name: input.name.trim(),
    target_amount: input.targetAmount,
    current_amount: input.currentAmount,
    deadline: input.deadline,
    account_id: input.accountId,
    comment: input.comment?.trim() || null,
  });
  if (error) return { error: "Не удалось сохранить цель." };

  refresh();
  return {};
}

export async function updateGoal(
  id: string,
  input: GoalInput,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  const invalid = validateGoal(input);
  if (invalid) return { error: invalid };

  const { error } = await supabase
    .from("goals")
    .update({
      name: input.name.trim(),
      target_amount: input.targetAmount,
      current_amount: input.currentAmount,
      deadline: input.deadline,
      account_id: input.accountId,
      comment: input.comment?.trim() || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось сохранить изменения." };

  refresh();
  return {};
}

export async function setGoalActive(
  id: string,
  isActive: boolean,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  const { error } = await supabase
    .from("goals")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось обновить цель." };
  refresh();
  return {};
}

// ---------- Пополнения ------------------------------------------------

export interface ContributionInput {
  goalId: string;
  amount: number;
  accountId: string | null;
  date: string;
  comment: string | null;
}

function validateContribution(input: ContributionInput): string | null {
  if (!Number.isFinite(input.amount) || input.amount <= 0)
    return "Сумма пополнения должна быть больше нуля.";
  return null;
}

async function createSavingTransaction(
  supabase: SB,
  userId: string,
  input: ContributionInput,
) {
  return supabase
    .from("transactions")
    .insert({
      user_id: userId,
      amount: input.amount,
      type: "saving",
      category_id: null,
      account_id: input.accountId,
      date: input.date,
      comment: input.comment?.trim() || null,
    })
    .select("id")
    .single();
}

export async function addContribution(
  input: ContributionInput,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  const invalid = validateContribution(input);
  if (invalid) return { error: invalid };

  // Операция type = saving (не входит в обычные расходы).
  const { data: tx, error: txError } = await createSavingTransaction(
    supabase,
    user.id,
    input,
  );
  if (txError || !tx?.id) {
    return { error: "Не удалось сохранить операцию накопления." };
  }

  const { error } = await supabase.from("goal_contributions").insert({
    user_id: user.id,
    goal_id: input.goalId,
    account_id: input.accountId,
    transaction_id: tx?.id ?? null,
    amount: input.amount,
    contribution_date: input.date,
    comment: input.comment?.trim() || null,
  });
  if (error) {
    if (tx?.id) await supabase.from("transactions").delete().eq("id", tx.id);
    return { error: "Не удалось сохранить пополнение." };
  }

  const goalOk = await bumpGoal(supabase, user.id, input.goalId, input.amount);
  const accountOk = await bumpAccount(
    supabase,
    user.id,
    input.accountId,
    -input.amount,
  );
  if (!goalOk || !accountOk) {
    if (goalOk) await bumpGoal(supabase, user.id, input.goalId, -input.amount);
    await supabase.from("goal_contributions").delete().eq("transaction_id", tx.id);
    await supabase.from("transactions").delete().eq("id", tx.id);
    return { error: "Не удалось пересчитать цель и счёт." };
  }
  refresh();
  return {};
}

export async function updateContribution(
  id: string,
  input: ContributionInput,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  const invalid = validateContribution(input);
  if (invalid) return { error: invalid };

  const { data: old } = await supabase
    .from("goal_contributions")
    .select("amount, account_id, transaction_id, goal_id, contribution_date, comment")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!old) return { error: "Пополнение не найдено." };

  // Откатываем старое влияние.
  await bumpGoal(supabase, user.id, old.goal_id as string, -Number(old.amount));
  await bumpAccount(
    supabase,
    user.id,
    old.account_id as string | null,
    Number(old.amount),
  );

  const { error } = await supabase
    .from("goal_contributions")
    .update({
      amount: input.amount,
      account_id: input.accountId,
      contribution_date: input.date,
      comment: input.comment?.trim() || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    // Восстанавливаем старое влияние.
    await bumpGoal(supabase, user.id, old.goal_id as string, Number(old.amount));
    await bumpAccount(
      supabase,
      user.id,
      old.account_id as string | null,
      -Number(old.amount),
    );
    return { error: "Не удалось сохранить изменения." };
  }

  // Применяем новое влияние.
  const applyGoalOk = await bumpGoal(
    supabase,
    user.id,
    old.goal_id as string,
    input.amount,
  );
  const applyAccountOk = applyGoalOk
    ? await bumpAccount(supabase, user.id, input.accountId, -input.amount)
    : false;
  if (!applyGoalOk || !applyAccountOk) {
    if (applyGoalOk) {
      await bumpGoal(supabase, user.id, old.goal_id as string, -input.amount);
    }
    await supabase
      .from("goal_contributions")
      .update({
        amount: old.amount,
        account_id: old.account_id as string | null,
        contribution_date: old.contribution_date as string,
        comment: (old.comment as string | null) ?? null,
      })
      .eq("id", id)
      .eq("user_id", user.id);
    await bumpGoal(supabase, user.id, old.goal_id as string, Number(old.amount));
    await bumpAccount(
      supabase,
      user.id,
      old.account_id as string | null,
      -Number(old.amount),
    );
    return { error: "Не удалось пересчитать цель и счёт." };
  }

  // Синхронизируем связанную операцию saving.
  if (old.transaction_id) {
    const { error: txError } = await supabase
      .from("transactions")
      .update({
        amount: input.amount,
        type: "saving",
        category_id: null,
        account_id: input.accountId,
        date: input.date,
        comment: input.comment?.trim() || null,
      })
      .eq("id", old.transaction_id as string)
      .eq("user_id", user.id);
    if (txError) {
      await bumpGoal(supabase, user.id, old.goal_id as string, -input.amount);
      await bumpAccount(supabase, user.id, input.accountId, input.amount);
      await supabase
        .from("goal_contributions")
        .update({
          amount: old.amount,
          account_id: old.account_id as string | null,
          contribution_date: old.contribution_date as string,
          comment: (old.comment as string | null) ?? null,
        })
        .eq("id", id)
        .eq("user_id", user.id);
      await bumpGoal(supabase, user.id, old.goal_id as string, Number(old.amount));
      await bumpAccount(
        supabase,
        user.id,
        old.account_id as string | null,
        -Number(old.amount),
      );
      return { error: "Не удалось обновить операцию накопления." };
    }
  } else {
    const { data: tx, error: txError } = await createSavingTransaction(
      supabase,
      user.id,
      input,
    );
    if (txError || !tx?.id) {
      await bumpGoal(supabase, user.id, old.goal_id as string, -input.amount);
      await bumpAccount(supabase, user.id, input.accountId, input.amount);
      await supabase
        .from("goal_contributions")
        .update({
          amount: old.amount,
          account_id: old.account_id as string | null,
          contribution_date: old.contribution_date as string,
          comment: (old.comment as string | null) ?? null,
        })
        .eq("id", id)
        .eq("user_id", user.id);
      await bumpGoal(supabase, user.id, old.goal_id as string, Number(old.amount));
      await bumpAccount(
        supabase,
        user.id,
        old.account_id as string | null,
        -Number(old.amount),
      );
      return { error: "Не удалось создать операцию накопления." };
    }
    const { error: linkError } = await supabase
      .from("goal_contributions")
      .update({ transaction_id: tx.id })
      .eq("id", id)
      .eq("user_id", user.id);
    if (linkError) {
      await supabase.from("transactions").delete().eq("id", tx.id);
      await bumpGoal(supabase, user.id, old.goal_id as string, -input.amount);
      await bumpAccount(supabase, user.id, input.accountId, input.amount);
      await supabase
        .from("goal_contributions")
        .update({
          amount: old.amount,
          account_id: old.account_id as string | null,
          contribution_date: old.contribution_date as string,
          comment: (old.comment as string | null) ?? null,
        })
        .eq("id", id)
        .eq("user_id", user.id);
      await bumpGoal(supabase, user.id, old.goal_id as string, Number(old.amount));
      await bumpAccount(
        supabase,
        user.id,
        old.account_id as string | null,
        -Number(old.amount),
      );
      return { error: "Не удалось связать пополнение с операцией." };
    }
  }

  refresh();
  return {};
}

export async function deleteContribution(id: string): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };

  const { data: old } = await supabase
    .from("goal_contributions")
    .select("amount, account_id, transaction_id, goal_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!old) return { error: "Пополнение не найдено." };

  const { error } = await supabase
    .from("goal_contributions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось удалить пополнение." };

  await bumpGoal(supabase, user.id, old.goal_id as string, -Number(old.amount));
  await bumpAccount(
    supabase,
    user.id,
    old.account_id as string | null,
    Number(old.amount),
  );
  if (old.transaction_id) {
    await supabase
      .from("transactions")
      .delete()
      .eq("id", old.transaction_id as string)
      .eq("user_id", user.id);
  }

  refresh();
  return {};
}
