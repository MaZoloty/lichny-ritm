// Чистая логика привычек: проценты, статусы, стрики.
// Используется и на сервере (главная, страница привычек), и на клиенте.

import { addDays, parseISODate, toISODate, weekStartISO } from "@/lib/week";

export const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export type HabitStatus =
  | "soft"
  | "in_progress"
  | "moving"
  | "done"
  | "over";

// Процент выполнения. null — если цели нет (режим мягкого старта).
export function percentOf(completed: number, goal: number | null): number | null {
  if (!goal || goal <= 0) return null;
  return Math.round((completed / goal) * 100);
}

export function statusOf(completed: number, goal: number | null): HabitStatus {
  if (!goal || goal <= 0) return "soft";
  const p = (completed / goal) * 100;
  if (p > 100) return "over";
  if (p >= 100) return "done";
  if (p >= 50) return "moving";
  return "in_progress";
}

export const STATUS_LABEL: Record<HabitStatus, string> = {
  soft: "Мягкий старт",
  in_progress: "Неделя в процессе",
  moving: "Ты уже движешься",
  done: "Цель закрыта",
  over: "Перевыполнение",
};

// Общий прогресс недели: среднее по привычкам с целью > 0,
// процент каждой ограничен 100%. null — если целей нет ни у кого.
export function overallProgress(
  items: { completed: number; goal: number | null }[],
): number | null {
  const withGoal = items.filter((i) => i.goal && i.goal > 0);
  if (withGoal.length === 0) return null;
  const sum = withGoal.reduce((acc, i) => {
    const p = Math.min(100, (i.completed / (i.goal as number)) * 100);
    return acc + p;
  }, 0);
  return Math.round(sum / withGoal.length);
}

// Сколько дней недели отмечено (пересечение отметок и дат недели).
export function completedInWeek(
  completedDates: Iterable<string>,
  weekDatesISO: string[],
): number {
  const set = completedDates instanceof Set ? completedDates : new Set(completedDates);
  return weekDatesISO.reduce((n, d) => (set.has(d) ? n + 1 : n), 0);
}

// Ежедневный стрик: идём назад от сегодня. Если сегодня не отмечено,
// начинаем со вчера, чтобы утром стрик не обнулялся.
export function dailyStreak(completed: Set<string>, todayISO: string): number {
  let cur = parseISODate(todayISO);
  if (!completed.has(todayISO)) cur = addDays(cur, -1);
  let streak = 0;
  // ограничение на случай очень длинной истории
  for (let i = 0; i < 366; i++) {
    if (completed.has(toISODate(cur))) {
      streak++;
      cur = addDays(cur, -1);
    } else {
      break;
    }
  }
  return streak;
}

// Кол-во отметок по неделям: weekStartISO -> count.
export function countByWeek(completedDates: Iterable<string>): Map<string, number> {
  const map = new Map<string, number>();
  for (const d of completedDates) {
    const wk = weekStartISO(d);
    map.set(wk, (map.get(wk) ?? 0) + 1);
  }
  return map;
}

// Недельный стрик: подряд идущие недели, где цель закрыта (completed >= goal).
// Учитываем только недели с goal > 0; недели без цели пропускаем (не рвут стрик).
// Текущая неделя, если ещё не закрыта, не рвёт стрик (в процессе).
export function weeklyStreak(
  completedByWeek: Map<string, number>,
  goalsByWeek: Map<string, number>,
  currentWeekStartISO: string,
  maxWeeks = 26,
): number {
  let streak = 0;
  let cur = parseISODate(currentWeekStartISO);
  for (let i = 0; i < maxWeeks; i++) {
    const wk = toISODate(cur);
    const goal = goalsByWeek.get(wk) ?? 0;
    const done = completedByWeek.get(wk) ?? 0;
    const isCurrent = wk === currentWeekStartISO;
    if (goal > 0) {
      if (done >= goal) {
        streak++;
      } else if (!isCurrent) {
        break; // прошлая неделя не закрыта — стрик прерывается
      }
      // текущая неделя не закрыта — просто не считаем, но не рвём
    }
    cur = addDays(cur, -7);
  }
  return streak;
}

// Значение «мягкой недели» для привычки.
export function softWeekGoal(name: string, prevGoal: number | null): number {
  if (prevGoal && prevGoal > 0) {
    if (prevGoal >= 3) return prevGoal - 1;
    if (prevGoal === 2) return 1;
    return 1;
  }
  const n = name.toLowerCase();
  if (n.includes("трениров")) return 1;
  if (n.includes("зарядк")) return 2;
  if (n.includes("массаж")) return 2;
  if (n.includes("сладк")) return 2;
  return 1;
}
