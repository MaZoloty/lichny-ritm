import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Продукты",
  "Кафе/кофе",
  "Красота",
  "Здоровье",
  "Дом",
  "Транспорт",
  "Обучение",
  "Подписки",
  "Бизнес",
  "Маркетплейсы",
  "Погашение долга",
  "Другое",
];

export const DEFAULT_INCOME_CATEGORIES = [
  "Работа",
  "Проекты",
  "Возвраты",
  "Подарки",
  "Другое",
];

// Создаёт стандартные категории, пропуская уже существующие (по имени+типу).
export async function seedDefaultCategories(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from("categories")
    .select("name, type")
    .eq("user_id", userId);

  const have = new Set(
    (existing ?? []).map(
      (c: { name: string; type: string }) =>
        `${c.type}:${c.name.trim().toLowerCase()}`,
    ),
  );

  const all = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
      name,
      type: "expense" as const,
    })),
    ...DEFAULT_INCOME_CATEGORIES.map((name) => ({
      name,
      type: "income" as const,
    })),
  ];

  const rows = all
    .filter((r) => !have.has(`${r.type}:${r.name.toLowerCase()}`))
    .map((r) => ({
      user_id: userId,
      name: r.name,
      type: r.type,
      is_default: true,
    }));

  if (rows.length) await supabase.from("categories").insert(rows);
}
