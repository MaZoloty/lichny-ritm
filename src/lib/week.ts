// Работа с неделями. Неделя начинается с понедельника.
// Даты храним и сравниваем как локальные строки YYYY-MM-DD.

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Понедельник недели, в которую попадает дата.
export function startOfWeek(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = r.getDay(); // 0=вс..6=сб
  const shift = day === 0 ? -6 : 1 - day;
  return addDays(r, shift);
}

// 7 дат недели (Пн..Вс) от понедельника.
export function weekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// Понедельник недели для ISO-даты.
export function weekStartISO(dateISO: string): string {
  return toISODate(startOfWeek(parseISODate(dateISO)));
}

// "3–9 июня" или "30 июня – 6 июля"
export function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const d1 = monday.getDate();
  const d2 = sunday.getDate();
  const m1 = MONTHS_GENITIVE[monday.getMonth()];
  const m2 = MONTHS_GENITIVE[sunday.getMonth()];
  if (monday.getMonth() === sunday.getMonth()) {
    return `${d1}–${d2} ${m1}`;
  }
  return `${d1} ${m1} – ${d2} ${m2}`;
}
