import type { ModuleKey } from "@/lib/modules";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserModule {
  id: string;
  user_id: string;
  module_key: ModuleKey;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  start_balance: number;
  current_balance: number;
  currency: string;
  is_savings: boolean;
  is_active: boolean;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  is_default: boolean;
  is_active: boolean;
}

export type TransactionType = "income" | "expense" | "saving" | "debt_payment";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  account_id: string | null;
  date: string;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  track_daily_streak: boolean;
  track_weekly_streak: boolean;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  account_id: string | null;
  comment: string | null;
  is_active: boolean;
}

export interface GoalContribution {
  id: string;
  user_id: string;
  goal_id: string;
  account_id: string | null;
  transaction_id: string | null;
  amount: number;
  contribution_date: string;
  comment: string | null;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  type: "credit_card" | "loan" | "installment" | "other";
  initial_amount: number;
  current_amount: number;
  minimum_payment: number;
  payment_day: number | null;
  next_payment_date: string | null;
  comment: string | null;
  is_active: boolean;
}

export interface DebtPayment {
  id: string;
  user_id: string;
  debt_id: string;
  account_id: string | null;
  transaction_id: string | null;
  actual_payment: number;
  principal_reduction: number;
  interest_amount: number;
  payment_date: string;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Saving {
  id: string;
  user_id: string;
  name: string;
  current_amount: number;
  target_amount: number | null;
  account_id: string | null;
  comment: string | null;
  is_active: boolean;
}

export interface SavingsSettings {
  id: string;
  user_id: string;
  emergency_target_amount: number;
  created_at: string;
  updated_at: string;
}

export interface RemindersSettings {
  id: string;
  user_id: string;
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
  created_at: string;
  updated_at: string;
}

export type ReminderEventStatus =
  | "pending"
  | "shown"
  | "sent"
  | "skipped"
  | "failed";

export interface ReminderEvent {
  id: string;
  user_id: string;
  type: string;
  scheduled_for: string | null;
  shown_at: string | null;
  sent_at: string | null;
  status: ReminderEventStatus;
  payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
