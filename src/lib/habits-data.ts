import { createClient } from "@/lib/supabase/server";
import {
  addDays,
  formatWeekRange,
  startOfWeek,
  toISODate,
  weekDates,
} from "@/lib/week";
import type { Habit } from "@/types/db";

export interface HabitWeek {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  track_daily_streak: boolean;
  track_weekly_streak: boolean;
  // ISO-даты выполнения за окно истории (только completed = true)
  completedDates: string[];
  // недельные цели за окно: weekStartISO -> weekly_goal
  goals: Record<string, number>;
}

export interface WeekData {
  habits: HabitWeek[];
  weekDatesISO: string[];
  currentWeekStartISO: string;
  prevWeekStartISO: string;
  todayISO: string;
  weekLabel: string;
}

// Окно истории для стриков (недель назад).
const WINDOW_WEEKS = 26;

export async function loadHabitsWeek(): Promise<WeekData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date();
  const monday = startOfWeek(today);
  const todayISO = toISODate(today);
  const currentWeekStartISO = toISODate(monday);
  const prevWeekStartISO = toISODate(addDays(monday, -7));
  const weekDatesISO = weekDates(monday).map(toISODate);
  const weekLabel = formatWeekRange(monday);
  const windowStartISO = toISODate(addDays(monday, -7 * WINDOW_WEEKS));

  const empty: WeekData = {
    habits: [],
    weekDatesISO,
    currentWeekStartISO,
    prevWeekStartISO,
    todayISO,
    weekLabel,
  };
  if (!user) return empty;

  const [{ data: habitRows }, { data: logRows }, { data: goalRows }] =
    await Promise.all([
      supabase
        .from("habits")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("habit_logs")
        .select("habit_id, date")
        .eq("completed", true)
        .gte("date", windowStartISO),
      supabase
        .from("habit_weekly_goals")
        .select("habit_id, week_start_date, weekly_goal")
        .gte("week_start_date", windowStartISO),
    ]);

  const habits = (habitRows ?? []) as Habit[];

  const datesByHabit = new Map<string, string[]>();
  for (const row of logRows ?? []) {
    const arr = datesByHabit.get(row.habit_id) ?? [];
    arr.push(row.date as string);
    datesByHabit.set(row.habit_id, arr);
  }

  const goalsByHabit = new Map<string, Record<string, number>>();
  for (const row of goalRows ?? []) {
    const obj = goalsByHabit.get(row.habit_id) ?? {};
    obj[row.week_start_date as string] = row.weekly_goal as number;
    goalsByHabit.set(row.habit_id, obj);
  }

  return {
    ...empty,
    habits: habits.map((h) => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      is_active: h.is_active,
      track_daily_streak: h.track_daily_streak,
      track_weekly_streak: h.track_weekly_streak,
      completedDates: datesByHabit.get(h.id) ?? [],
      goals: goalsByHabit.get(h.id) ?? {},
    })),
  };
}
