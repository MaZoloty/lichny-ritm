"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { seedDefaultCategories } from "@/lib/categories";

type Result = { error?: string };
type TxType = "income" | "expense";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function refresh() {
  revalidatePath("/finance");
  revalidatePath("/");
  revalidatePath("/settings/accounts");
  revalidatePath("/settings/categories");
}

// Влияние операции на баланс счёта.
function effect(type: TxType, amount: number): number {
  return type === "income" ? amount : -amount;
}

// Изменить текущий баланс счёта на delta.
async function bumpAccount(
  supabase: Awaited<ReturnType<typeof getUser>>["supabase"],
  userId: string,
  accountId: string | null,
  delta: number,
) {
  if (!accountId || !delta) return;
  const { data } = await supabase
    .from("accounts")
    .select("current_balance")
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return;
  await supabase
    .from("accounts")
    .update({ current_balance: Number(data.current_balance) + delta })
    .eq("id", accountId)
    .eq("user_id", userId);
}

export interface TransactionInput {
  amount: number;
  type: TxType;
  categoryId: string | null;
  accountId: string | null;
  date: string;
  comment: string | null;
}

function validate(input: TransactionInput): string | null {
  if (!Number.isFinite(input.amount) || input.amount <= 0)
    return "Сумма должна быть больше нуля.";
  if (input.type !== "income" && input.type !== "expense")
    return "Неизвестный тип операции.";
  return null;
}

export async function addTransaction(input: TransactionInput): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  const invalid = validate(input);
  if (invalid) return { error: invalid };

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    amount: input.amount,
    type: input.type,
    category_id: input.categoryId,
    account_id: input.accountId,
    date: input.date,
    comment: input.comment?.trim() || null,
  });
  if (error) return { error: "Не удалось сохранить операцию." };

  await bumpAccount(supabase, user.id, input.accountId, effect(input.type, input.amount));
  refresh();
  return {};
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  const invalid = validate(input);
  if (invalid) return { error: invalid };

  const { data: old } = await supabase
    .from("transactions")
    .select("amount, type, account_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!old) return { error: "Операция не найдена." };

  // Откатываем влияние старой операции.
  await bumpAccount(
    supabase,
    user.id,
    old.account_id,
    -effect(old.type as TxType, Number(old.amount)),
  );

  const { error } = await supabase
    .from("transactions")
    .update({
      amount: input.amount,
      type: input.type,
      category_id: input.categoryId,
      account_id: input.accountId,
      date: input.date,
      comment: input.comment?.trim() || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    // Восстанавливаем старое влияние, чтобы баланс не «поехал».
    await bumpAccount(
      supabase,
      user.id,
      old.account_id,
      effect(old.type as TxType, Number(old.amount)),
    );
    return { error: "Не удалось сохранить изменения." };
  }

  // Применяем влияние новой операции.
  await bumpAccount(supabase, user.id, input.accountId, effect(input.type, input.amount));
  refresh();
  return {};
}

export async function deleteTransaction(id: string): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };

  const { data: old } = await supabase
    .from("transactions")
    .select("amount, type, account_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!old) return { error: "Операция не найдена." };

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось удалить операцию." };

  await bumpAccount(
    supabase,
    user.id,
    old.account_id,
    -effect(old.type as TxType, Number(old.amount)),
  );
  refresh();
  return {};
}

// ---------- Счета -----------------------------------------------------

export async function createAccount(
  name: string,
  startBalance = 0,
): Promise<Result & { id?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  if (!name.trim()) return { error: "Нужно название счёта." };

  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      name: name.trim(),
      start_balance: Number.isFinite(startBalance) ? startBalance : 0,
      current_balance: Number.isFinite(startBalance) ? startBalance : 0,
      currency: "RUB",
      is_active: true,
    })
    .select("id")
    .single();
  if (error) return { error: "Не удалось создать счёт." };

  refresh();
  return { id: data.id };
}

export async function updateAccount(
  id: string,
  fields: { name?: string; start_balance?: number; current_balance?: number },
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };

  const patch: Record<string, unknown> = {};
  if (fields.name !== undefined) {
    if (!fields.name.trim()) return { error: "РќСѓР¶РЅРѕ РЅР°Р·РІР°РЅРёРµ СЃС‡С‘С‚Р°." };
    patch.name = fields.name.trim();
  }
  if (fields.start_balance !== undefined)
    patch.start_balance = Number.isFinite(fields.start_balance)
      ? fields.start_balance
      : 0;
  if (fields.current_balance !== undefined)
    patch.current_balance = Number.isFinite(fields.current_balance)
      ? fields.current_balance
      : 0;

  const { error } = await supabase
    .from("accounts")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось обновить счёт." };

  refresh();
  return {};
}

export async function setAccountActive(
  id: string,
  isActive: boolean,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  const { error } = await supabase
    .from("accounts")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось обновить счёт." };
  refresh();
  return {};
}

// ---------- Категории -------------------------------------------------

export async function createCategory(
  name: string,
  type: TxType,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  if (!name.trim()) return { error: "Нужно название категории." };
  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: name.trim(),
    type,
  });
  if (error) return { error: "Не удалось создать категорию." };
  refresh();
  return {};
}

export async function renameCategory(id: string, name: string): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  if (!name.trim()) return { error: "Нужно название категории." };
  const { error } = await supabase
    .from("categories")
    .update({ name: name.trim() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось переименовать." };
  refresh();
  return {};
}

export async function setCategoryActive(
  id: string,
  isActive: boolean,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось обновить категорию." };
  refresh();
  return {};
}

export async function createDefaultCategories(): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  await seedDefaultCategories(supabase, user.id);
  refresh();
  return {};
}
