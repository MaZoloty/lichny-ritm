"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  CalendarCheck,
  Landmark,
  PiggyBank,
  Sparkles,
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
    <section className="mb-6">
      <h2 className="eyebrow mb-2 px-1">Сегодня важно</h2>

      {cards.length === 0 ? (
        <div className="summary-card flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-soft text-ink">
            <Sparkles size={22} strokeWidth={1.9} />
          </span>
          <div>
            <div className="font-semibold text-ink">На сегодня всё спокойно</div>
            <div className="text-sm text-muted">
              Можно просто прожить день в своём ритме.
            </div>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {cards.map((card) => {
            const Icon = ICONS[card.type] ?? Bell;
            return (
              <li key={card.key}>
                <div className="summary-card">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
                      <Icon size={22} strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink">{card.title}</div>
                      <div className="mt-0.5 text-sm leading-snug text-muted">
                        {card.text}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={card.href}
                    className="btn-secondary mt-3 w-full"
                  >
                    {card.actionLabel}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
