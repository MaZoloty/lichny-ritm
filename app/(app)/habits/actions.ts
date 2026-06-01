"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toISODate, weekStartISO } from "@/lib/week";

type Result = { error?: string };

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function refresh() {
  revalidatePath("/habits");
  revalidatePath("/");
}

// Переключить отметку выполнения за день.
export async function toggleHabitLog(
  habitId: string,
  dateISO: string,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };

  const { data: existing } = await supabase
    .from("habit_logs")
    .select("id, completed")
    .eq("user_id", user.id)
    .eq("habit_id", habitId)
    .eq("date", dateISO)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("habit_logs")
      .update({ completed: !existing.completed })
      .eq("id", existing.id);
    if (error) return { error: "Не удалось сохранить отметку." };
  } else {
    const { error } = await supabase.from("habit_logs").insert({
      user_id: user.id,
      habit_id: habitId,
      date: dateISO,
      completed: true,
    });
    if (error) return { error: "Не удалось сохранить отметку." };
  }

  refresh();
  return {};
}

// Сохранить недельные цели для текущей недели.
export async function saveWeeklyGoals(
  goals: { habitId: string; weeklyGoal: number }[],
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };

  const week = weekStartISO(toISODate(new Date()));
  const rows = goals.map((g) => ({
    user_id: user.id,
    habit_id: g.habitId,
    week_start_date: week,
    weekly_goal: Math.max(0, Math.round(g.weeklyGoal)),
  }));

  const { error } = await supabase
    .from("habit_weekly_goals")
    .upsert(rows, { onConflict: "user_id,habit_id,week_start_date" });
  if (error) return { error: "Не удалось сохранить цели." };

  refresh();
  return {};
}

export interface HabitInput {
  name: string;
  icon: string | null;
  color: string | null;
  track_daily_streak: boolean;
  track_weekly_streak: boolean;
}

export async function addHabit(input: HabitInput): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  if (!input.name.trim()) return { error: "Нужно название привычки." };

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name: input.name.trim(),
    icon: input.icon,
    color: input.color,
    track_daily_streak: input.track_daily_streak,
    track_weekly_streak: input.track_weekly_streak,
  });
  if (error) return { error: "Не удалось добавить привычку." };

  refresh();
  return {};
}

export async function updateHabit(
  habitId: string,
  input: HabitInput,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };
  if (!input.name.trim()) return { error: "Нужно название привычки." };

  const { error } = await supabase
    .from("habits")
    .update({
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
      track_daily_streak: input.track_daily_streak,
      track_weekly_streak: input.track_weekly_streak,
    })
    .eq("id", habitId)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось сохранить изменения." };

  refresh();
  return {};
}

// Отключить / включить привычку (без удаления из базы).
export async function setHabitActive(
  habitId: string,
  isActive: boolean,
): Promise<Result> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Нет доступа." };

  const { error } = await supabase
    .from("habits")
    .update({ is_active: isActive })
    .eq("id", habitId)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось обновить привычку." };

  refresh();
  return {};
}
