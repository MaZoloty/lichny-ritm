"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DEBTS_DAYS_OPTIONS,
  FINANCE_TIME_OPTIONS,
  HABITS_TIME_OPTIONS,
  MONDAY_TIME_OPTIONS,
  SAVINGS_TIME_OPTIONS,
  type ReminderSettingsInput,
} from "@/lib/reminders";
import { saveReminderSettings } from "../../../app/(app)/settings/reminders/actions";

export default function RemindersSettingsClient({
  initial,
}: {
  initial: ReminderSettingsInput;
}) {
  const [s, setS] = useState<ReminderSettingsInput>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Один раз фиксируем timezone браузера, если он ещё не сохранён.
  useEffect(() => {
    if (s.timezone) return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) commit({ ...s, timezone: tz });
    } catch {
      /* игнорируем — останемся на локальных датах приложения */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commit(next: ReminderSettingsInput) {
    setS(next);
    setError(null);
    startTransition(async () => {
      const res = await saveReminderSettings(next);
      if (res.error) setError(res.error);
      else {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1500);
      }
    });
  }

  function toggleFinanceTime(time: string) {
    const has = s.finance_times.includes(time);
    const next = has
      ? s.finance_times.filter((t) => t !== time)
      : [...FINANCE_TIME_OPTIONS.filter((t) => s.finance_times.includes(t) || t === time)];
    // не даём выключить все
    commit({ ...s, finance_times: next.length ? next : s.finance_times });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1 text-xs text-[#7C7A88]">
        <span>Подсказки на главной в блоке «Сегодня важно».</span>
        <span className={saved ? "text-[#8B5CF6]" : "opacity-0"}>Сохранено</span>
      </div>

      {/* Финансы */}
      <ReminderCardBox
        title="Финансы"
        hint="Показывать подсказку заполнить доходы и расходы за день."
        enabled={s.finance_enabled}
        onToggle={(v) => commit({ ...s, finance_enabled: v })}
        disabled={pending}
      >
        <FieldLabel>Когда показывать подсказку</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {FINANCE_TIME_OPTIONS.map((t) => (
            <Chip
              key={t}
              active={s.finance_times.includes(t)}
              onClick={() => toggleFinanceTime(t)}
            >
              {t}
            </Chip>
          ))}
        </div>
      </ReminderCardBox>

      {/* Привычки */}
      <ReminderCardBox
        title="Привычки"
        hint="Показывать подсказку отметить, что получилось."
        enabled={s.habits_enabled}
        onToggle={(v) => commit({ ...s, habits_enabled: v })}
        disabled={pending}
      >
        <FieldLabel>Когда показывать подсказку</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {HABITS_TIME_OPTIONS.map((t) => (
            <Chip
              key={t}
              active={s.habits_times.includes(t)}
              onClick={() => commit({ ...s, habits_times: [t] })}
            >
              {t}
            </Chip>
          ))}
        </div>
      </ReminderCardBox>

      {/* Долги */}
      <ReminderCardBox
        title="Долги"
        hint="Подсказывать о ближайших платежах."
        enabled={s.debts_enabled}
        onToggle={(v) => commit({ ...s, debts_enabled: v })}
        disabled={pending}
      >
        <FieldLabel>За сколько дней напоминать</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {DEBTS_DAYS_OPTIONS.map((d) => (
            <Chip
              key={d}
              active={s.debts_days_before === d}
              onClick={() => commit({ ...s, debts_days_before: d })}
            >
              {d === 1 ? "1 день" : d === 7 ? "7 дней" : `${d} дня`}
            </Chip>
          ))}
        </div>
      </ReminderCardBox>

      {/* Цели недели */}
      <ReminderCardBox
        title="Цели недели"
        hint="В понедельник подсказывать поставить цели на неделю."
        enabled={s.monday_goals_enabled}
        onToggle={(v) => commit({ ...s, monday_goals_enabled: v })}
        disabled={pending}
      >
        <FieldLabel>Понедельник, время</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {MONDAY_TIME_OPTIONS.map((t) => (
            <Chip
              key={t}
              active={s.monday_goals_time === t}
              onClick={() => commit({ ...s, monday_goals_time: t })}
            >
              {t}
            </Chip>
          ))}
        </div>
      </ReminderCardBox>

      {/* Сбережения / цели */}
      <ReminderCardBox
        title="Сбережения и цели"
        hint="Раз в месяц подсказывать пополнить подушку или цель."
        enabled={s.savings_enabled}
        onToggle={(v) => commit({ ...s, savings_enabled: v })}
        disabled={pending}
      >
        <FieldLabel>День месяца</FieldLabel>
        <input
          type="number"
          min={1}
          max={28}
          inputMode="numeric"
          value={s.savings_day_of_month ?? ""}
          onChange={(e) => {
            const v = e.target.value.trim();
            setS((prev) => ({
              ...prev,
              savings_day_of_month: v === "" ? null : Number(v),
            }));
          }}
          onBlur={() => commit(s)}
          placeholder="например, 5"
          className="field"
        />
        <FieldLabel className="mt-3">Время</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {SAVINGS_TIME_OPTIONS.map((t) => (
            <Chip
              key={t}
              active={s.savings_time === t}
              onClick={() => commit({ ...s, savings_time: t })}
            >
              {t}
            </Chip>
          ))}
        </div>
      </ReminderCardBox>

      {error && (
        <p className="rounded-[22px] border border-[#F1C2B8] bg-[#FFE9E3] px-4 py-3 text-sm text-[#D96E61]">{error}</p>
      )}

      <p className="px-1 text-xs leading-5 text-[#7C7A88]">
        Подсказки показываются на главной в блоке «Сегодня важно», когда
        открываешь приложение. Push-уведомления (когда приложение закрыто) пока
        не настроены — это позже.
      </p>
    </div>
  );
}

function ReminderCardBox({
  title,
  hint,
  enabled,
  onToggle,
  disabled,
  children,
}: {
  title: string;
  hint: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#EDE7DF] bg-white/92 p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[#2F2F35]">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-[#7C7A88]">{hint}</p>
        </div>
        <Toggle on={enabled} onClick={() => onToggle(!enabled)} disabled={disabled} />
      </div>
      {enabled && (
        <div className="mt-4 border-t border-[#EDE7DF] pt-4">{children}</div>
      )}
    </section>
  );
}

function Toggle({
  on,
  onClick,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={`relative ml-3 h-6 w-11 shrink-0 rounded-full transition ${
        on ? "bg-[#8B5CF6]" : "bg-[#EDE7DF]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active
          ? "bg-[#8B5CF6] text-white shadow-soft"
          : "bg-white/75 text-[#7C7A88] hover:text-[#2F2F35]"
      }`}
    >
      {children}
    </button>
  );
}

function FieldLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-2 text-xs font-medium text-[#7C7A88] ${className}`}>
      {children}
    </div>
  );
}
