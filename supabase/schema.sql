-- =====================================================================
--  «Личный ритм» — схема базы данных (Этап 1)
--  Запусти этот файл целиком в Supabase → SQL Editor → New query.
--  Безопасно запускать повторно (idempotent): использует IF NOT EXISTS
--  и пересоздаёт политики.
-- =====================================================================

-- ---------- ENUM-типы ------------------------------------------------
do $$ begin
  create type module_key as enum
    ('habits', 'finance', 'goals', 'debts', 'savings', 'reminders');
exception when duplicate_object then null; end $$;

do $$ begin
  create type category_type as enum ('income', 'expense');
exception when duplicate_object then null; end $$;

-- Тип операции 'saving' (пополнение цели) — добавляем, если ещё нет.
-- saving не считается обычным расходом в аналитике финансов.
do $$ begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'category_type' and e.enumlabel = 'saving'
  ) then
    alter type category_type add value 'saving';
  end if;
end $$;

-- Тип операции 'debt_payment' (платеж по долгу) не входит в обычную аналитику расходов.
do $$ begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'category_type' and e.enumlabel = 'debt_payment'
  ) then
    alter type category_type add value 'debt_payment';
  end if;
end $$;

do $$ begin
  create type debt_type as enum ('credit_card', 'loan', 'installment', 'other');
exception when duplicate_object then null; end $$;

-- ---------- Общая функция автo-обновления updated_at -----------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- =====================================================================
--  profiles
-- =====================================================================
create table if not exists public.profiles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null unique references auth.users(id) on delete cascade,
  display_name         text,
  onboarding_completed boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- =====================================================================
--  user_modules
-- =====================================================================
create table if not exists public.user_modules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  module_key  module_key not null,
  is_enabled  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, module_key)
);

-- =====================================================================
--  accounts (счета)
-- =====================================================================
create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  start_balance   numeric(14,2) not null default 0,
  current_balance numeric(14,2) not null default 0,
  currency        text not null default 'RUB',
  is_savings      boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.accounts add column if not exists is_savings boolean not null default false;

-- =====================================================================
--  habits (привычки)
-- =====================================================================
create table if not exists public.habits (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  icon                text,
  color               text,
  is_active           boolean not null default true,
  track_daily_streak  boolean not null default true,
  track_weekly_streak boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- =====================================================================
--  categories (категории доходов/расходов)
-- =====================================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  type        category_type not null,
  is_default  boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================================================================
--  goals (цели накопления)
-- =====================================================================
create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  target_amount  numeric(14,2) not null default 0,
  current_amount numeric(14,2) not null default 0,
  deadline       date,
  account_id     uuid references public.accounts(id) on delete set null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Дополнения для существующих установок (Этап 4).
alter table public.goals add column if not exists comment text;
do $$ begin
  alter table public.goals add constraint goals_current_nonneg
    check (current_amount >= 0);
exception when duplicate_object then null; end $$;

-- =====================================================================
--  debts (долги / кредиты)
-- =====================================================================
create table if not exists public.debts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  type              debt_type not null default 'other',
  initial_amount    numeric(14,2) not null default 0,
  current_amount    numeric(14,2) not null default 0,
  minimum_payment   numeric(14,2) not null default 0,
  payment_day       int,
  next_payment_date date,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.debts add column if not exists comment text;
do $$ begin
  alter table public.debts add constraint debts_initial_positive
    check (initial_amount > 0) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.debts add constraint debts_current_nonneg
    check (current_amount >= 0) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.debts add constraint debts_minimum_nonneg
    check (minimum_payment >= 0) not valid;
exception when duplicate_object then null; end $$;

create index if not exists debts_user_active_idx
  on public.debts (user_id, is_active);

-- =====================================================================
--  savings (сбережения / подушка)
-- =====================================================================
create table if not exists public.savings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  current_amount numeric(14,2) not null default 0,
  target_amount  numeric(14,2),
  account_id     uuid references public.accounts(id) on delete set null,
  comment        text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Настройки сбережений. Основная модель сбережений — accounts.is_savings,
-- эта таблица хранит только цель подушки безопасности.
create table if not exists public.savings_settings (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references auth.users(id) on delete cascade,
  emergency_target_amount numeric(14,2) not null default 0 check (emergency_target_amount >= 0),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- =====================================================================
--  transactions (операции: доходы и расходы)
-- =====================================================================
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount      numeric(14,2) not null check (amount > 0),
  type        category_type not null,
  category_id uuid references public.categories(id) on delete set null,
  account_id  uuid references public.accounts(id) on delete set null,
  date        date not null default current_date,
  comment     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date);

-- =====================================================================
--  debt_payments (фактические платежи по долгам)
-- =====================================================================
create table if not exists public.debt_payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  debt_id             uuid not null references public.debts(id) on delete cascade,
  account_id          uuid references public.accounts(id) on delete set null,
  transaction_id      uuid references public.transactions(id) on delete set null,
  actual_payment      numeric(14,2) not null check (actual_payment > 0),
  principal_reduction numeric(14,2) not null check (principal_reduction >= 0),
  interest_amount     numeric(14,2) not null check (interest_amount >= 0),
  payment_date        date not null default current_date,
  comment             text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (principal_reduction <= actual_payment),
  check (interest_amount <= actual_payment),
  check (interest_amount = actual_payment - principal_reduction)
);

create index if not exists debt_payments_user_debt_idx
  on public.debt_payments (user_id, debt_id, payment_date desc);

create index if not exists debt_payments_transaction_idx
  on public.debt_payments (transaction_id);

-- =====================================================================
--  goal_contributions (пополнения целей)
-- =====================================================================
create table if not exists public.goal_contributions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  goal_id           uuid not null references public.goals(id) on delete cascade,
  account_id        uuid references public.accounts(id) on delete set null,
  transaction_id    uuid references public.transactions(id) on delete set null,
  amount            numeric(14,2) not null check (amount > 0),
  contribution_date date not null default current_date,
  comment           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists goal_contributions_user_goal_idx
  on public.goal_contributions (user_id, goal_id);

-- =====================================================================
--  habit_weekly_goals (недельные цели по привычкам)
-- =====================================================================
create table if not exists public.habit_weekly_goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  habit_id        uuid not null references public.habits(id) on delete cascade,
  week_start_date date not null,
  weekly_goal     int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, habit_id, week_start_date)
);

create index if not exists habit_weekly_goals_user_week_idx
  on public.habit_weekly_goals (user_id, week_start_date);

-- =====================================================================
--  habit_logs (отметки выполнения по дням)
-- =====================================================================
create table if not exists public.habit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  habit_id    uuid not null references public.habits(id) on delete cascade,
  date        date not null,
  completed   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, habit_id, date)
);

create index if not exists habit_logs_user_date_idx
  on public.habit_logs (user_id, date);

-- ---------- Триггеры updated_at для всех таблиц ----------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_modules','accounts','habits',
    'categories','goals','debts','savings','savings_settings','transactions',
    'debt_payments','goal_contributions','habit_weekly_goals','habit_logs'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- =====================================================================
--  Row Level Security: пользователь видит только свои данные
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_modules','accounts','habits',
    'categories','goals','debts','savings','savings_settings','transactions',
    'debt_payments','goal_contributions','habit_weekly_goals','habit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "own_select" on public.%I', t);
    execute format('drop policy if exists "own_insert" on public.%I', t);
    execute format('drop policy if exists "own_update" on public.%I', t);
    execute format('drop policy if exists "own_delete" on public.%I', t);

    execute format(
      'create policy "own_select" on public.%I
       for select using (auth.uid() = user_id)', t);
    execute format(
      'create policy "own_insert" on public.%I
       for insert with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "own_update" on public.%I
       for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "own_delete" on public.%I
       for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- =====================================================================
--  Авто-создание профиля при регистрации пользователя
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''))
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
