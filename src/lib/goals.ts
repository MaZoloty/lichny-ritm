// Чистая логика целей: прогресс, статусы, расчёт темпа накопления.
import { parseISODate } from "@/lib/week";

export function goalPercent(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.round((current / target) * 100);
}

export function remainingAmount(current: number, target: number): number {
  return Math.max(0, target - current);
}

export type GoalStatus = "start" | "moving" | "half" | "done";

export function goalStatus(current: number, target: number): GoalStatus {
  const pct = goalPercent(current, target);
  if (pct >= 100) return "done";
  if (pct >= 50) return "half";
  if (pct >= 25) return "moving";
  return "start";
}

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  start: "Начало положено",
  moving: "Уже движется",
  half: "Больше половины пути",
  done: "Цель закрыта",
};

// Сколько целых месяцев до дедлайна. 0 — дедлайн в текущем месяце или раньше
// (тогда показываем мягкую подсказку вместо цифры).
export function monthsUntilDeadline(
  deadlineISO: string | null,
  today = new Date(),
): number {
  if (!deadlineISO) return 0;
  const d = parseISODate(deadlineISO);
  const ty = today.getFullYear();
  const tm = today.getMonth();
  if (d.getFullYear() < ty || (d.getFullYear() === ty && d.getMonth() <= tm)) {
    return 0;
  }
  return (d.getFullYear() - ty) * 12 + (d.getMonth() - tm);
}

// Желательная сумма в месяц до дедлайна. null — если считать нечего.
export function monthlyNeeded(
  remaining: number,
  months: number,
): number | null {
  if (remaining <= 0 || months <= 0) return null;
  return Math.ceil(remaining / months);
}
