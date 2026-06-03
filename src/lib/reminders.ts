// Напоминания: общие типы, значения по умолчанию и варианты выбора.
// Файл без обращений к Supabase — безопасно импортировать и на клиенте.

export type ReminderType =
  | "finance_daily"
  | "habits_daily"
  | "debt_payment"
  | "monday_goals"
  | "savings";

// Карточка «Сегодня важно» на главной.
export interface ReminderCard {
  // Уникальный ключ карточки (для React и для будущего журнала событий).
  key: string;
  type: ReminderType;
  title: string;
  text: string;
  href: string;
  actionLabel: string;
}

// Форма настроек, с которой работают UI и server actions.
export interface ReminderSettingsInput {
  finance_enabled: boolean;
  finance_times: string[];
  habits_enabled: boolean;
  habits_times: string[];
  debts_enabled: boolean;
  debts_days_before: number;
  monday_goals_enabled: boolean;
  monday_goals_time: string;
  savings_enabled: boolean;
  savings_day_of_month: number | null;
  savings_time: string;
  timezone: string | null;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettingsInput = {
  finance_enabled: true,
  finance_times: ["20:30", "21:30", "22:30"],
  habits_enabled: true,
  habits_times: ["21:00"],
  debts_enabled: true,
  debts_days_before: 2,
  monday_goals_enabled: true,
  monday_goals_time: "10:00",
  savings_enabled: false,
  savings_day_of_month: null,
  savings_time: "11:00",
  timezone: null,
};

// Варианты выбора для UI настроек.
export const FINANCE_TIME_OPTIONS = ["20:30", "21:30", "22:30"];
export const HABITS_TIME_OPTIONS = ["20:00", "21:00", "22:00"];
export const DEBTS_DAYS_OPTIONS = [1, 2, 3, 7];
export const MONDAY_TIME_OPTIONS = ["09:00", "10:00", "11:00"];
export const SAVINGS_TIME_OPTIONS = ["10:00", "11:00", "12:00", "20:00"];

// Приводит частичные/«сырые» данные строки к полному объекту настроек.
export function normalizeReminderSettings(
  row: Partial<ReminderSettingsInput> | null | undefined,
): ReminderSettingsInput {
  if (!row) return { ...DEFAULT_REMINDER_SETTINGS };
  return {
    finance_enabled: row.finance_enabled ?? DEFAULT_REMINDER_SETTINGS.finance_enabled,
    finance_times:
      row.finance_times && row.finance_times.length
        ? row.finance_times
        : DEFAULT_REMINDER_SETTINGS.finance_times,
    habits_enabled: row.habits_enabled ?? DEFAULT_REMINDER_SETTINGS.habits_enabled,
    habits_times:
      row.habits_times && row.habits_times.length
        ? row.habits_times
        : DEFAULT_REMINDER_SETTINGS.habits_times,
    debts_enabled: row.debts_enabled ?? DEFAULT_REMINDER_SETTINGS.debts_enabled,
    debts_days_before:
      row.debts_days_before ?? DEFAULT_REMINDER_SETTINGS.debts_days_before,
    monday_goals_enabled:
      row.monday_goals_enabled ?? DEFAULT_REMINDER_SETTINGS.monday_goals_enabled,
    monday_goals_time:
      row.monday_goals_time ?? DEFAULT_REMINDER_SETTINGS.monday_goals_time,
    savings_enabled:
      row.savings_enabled ?? DEFAULT_REMINDER_SETTINGS.savings_enabled,
    savings_day_of_month:
      row.savings_day_of_month ?? DEFAULT_REMINDER_SETTINGS.savings_day_of_month,
    savings_time: row.savings_time ?? DEFAULT_REMINDER_SETTINGS.savings_time,
    timezone: row.timezone ?? DEFAULT_REMINDER_SETTINGS.timezone,
  };
}
