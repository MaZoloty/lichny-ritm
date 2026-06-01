import { addDays, startOfWeek, toISODate } from "@/lib/week";

export type Period = "today" | "week" | "month";

export const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Сегодня" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
];

export function isPeriod(v: string | undefined): v is Period {
  return v === "today" || v === "week" || v === "month";
}

export function periodRange(
  p: Period,
  today = new Date(),
): { fromISO: string; toISO: string } {
  if (p === "today") {
    const t = toISODate(today);
    return { fromISO: t, toISO: t };
  }
  if (p === "week") {
    const monday = startOfWeek(today);
    return { fromISO: toISODate(monday), toISO: toISODate(addDays(monday, 6)) };
  }
  // month
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { fromISO: toISODate(first), toISO: toISODate(last) };
}
