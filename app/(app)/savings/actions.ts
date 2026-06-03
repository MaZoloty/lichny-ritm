"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function refreshSavings() {
  revalidatePath("/");
  revalidatePath("/savings");
  revalidatePath("/finance");
  revalidatePath("/settings/accounts");
}

export async function saveEmergencyTarget(amount: number): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };

  const value = Math.max(0, Number.isFinite(amount) ? amount : 0);
  const { error } = await supabase.from("savings_settings").upsert(
    {
      user_id: user.id,
      emergency_target_amount: value,
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: "Не удалось сохранить цель подушки." };

  refreshSavings();
  return {};
}

export async function addSavingsTopUp(input: {
  accountId: string;
  amount: number;
  date: string;
  comment?: string;
}): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };

  const amount = Number(input.amount);
  if (!input.accountId) return { error: "Выбери счёт сбережений." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Укажи сумму больше нуля." };
  }

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("id,current_balance")
    .eq("id", input.accountId)
    .eq("user_id", user.id)
    .eq("is_savings", true)
    .eq("is_active", true)
    .maybeSingle();
  if (accountError || !account) {
    return { error: "Не удалось найти активный счёт сбережений." };
  }

  const date = input.date || new Date().toISOString().slice(0, 10);
  const comment = input.comment?.trim() || null;
  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    account_id: input.accountId,
    amount,
    type: "saving",
    date,
    comment,
  });
  if (txError) return { error: "Не удалось создать операцию сбережений." };

  const currentBalance = Number(account.current_balance) || 0;
  const { error: balanceError } = await supabase
    .from("accounts")
    .update({ current_balance: currentBalance + amount })
    .eq("id", input.accountId)
    .eq("user_id", user.id);
  if (balanceError) return { error: "Не удалось обновить баланс счёта." };

  refreshSavings();
  return {};
}
