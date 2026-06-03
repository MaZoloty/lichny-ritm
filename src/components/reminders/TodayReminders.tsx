"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  CalendarCheck,
  Landmark,
  PiggyBank,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toISODate } from "@/lib/week";
import type { ReminderCard, ReminderType } from "@/lib/reminders";
import { loadTodayReminders } from "../../../app/(app)/settings/reminders/actions";

const ICONS: Record<ReminderType, LucideIcon> = {
  finance_daily: Wallet,
  habits_daily: CalendarCheck,
  debt_payment: Landmark,
  monday_goals: Target,
  savings: PiggyBank,
};

export default function TodayReminders() {
  const [cards, setCards] = useState<ReminderCard[] | null>(null);

  useEffect(() => {
    const todayISO = toISODate(new Date());
    let tz: string | null = null;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    } catch {
      tz = null;
    }
    let active = true;
    loadTodayReminders(todayISO, tz)
      .then((res) => {
        if (active) setCards(res);
      })
      .catch(() => {
        if (active) setCards([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Пока грузим — ничего не показываем, чтобы не дёргать вёрстку.
  if (cards === null) return null;

  return (
    <section className="mb-5">
      <h2 className="mb-2 px-1 text-lg font-medium text-ink">Сегодня важно</h2>
      {cards.length === 0 ? (
        <div className="card">
          <p className="text-sm text-muted">На сегодня всё спокойно.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {cards.map((card) => {
            const Icon = ICONS[card.type] ?? Bell;
            return (
              <li key={card.key}>
                <Link
                  href={card.href}
                  className="card flex items-center gap-3 active:scale-[0.99]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                    <Icon size={20} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">
                      {card.title}
                    </span>
                    <span className="block text-sm text-muted">
                      {card.text}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-accent">
                    {card.actionLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
