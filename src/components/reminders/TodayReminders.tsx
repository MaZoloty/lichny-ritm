"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  CalendarCheck,
  ChevronRight,
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

const TONES: Record<
  ReminderType,
  { icon: string }
> = {
  finance_daily: {
    icon: "bg-accent text-white",
  },
  habits_daily: {
    icon: "bg-green-soft text-ink",
  },
  debt_payment: {
    icon: "bg-peach-soft text-ink",
  },
  monday_goals: {
    icon: "bg-accent-soft text-accent",
  },
  savings: {
    icon: "bg-accent-soft text-accent",
  },
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

  if (cards === null) return null;

  return (
    <section className="mb-7">
      <div className="mb-3 px-1">
        <h2 className="h2">Сегодня важно</h2>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-[1.45rem] border border-line bg-white/80 p-3.5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="relative h-9 w-11 shrink-0 overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#FFFFFF,#EFEAFE)]">
              <span className="absolute left-2 top-2 h-1.5 w-6 rounded-full bg-accent/18" />
              <span className="absolute left-3 top-4 h-1.5 w-5 rounded-full bg-green/20" />
              <span className="absolute bottom-2 left-2 h-1.5 w-7 rounded-full bg-peach/18" />
            </span>
            <div>
              <div className="font-semibold leading-snug text-ink">
                На сегодня всё спокойно
              </div>
              <div className="mt-0.5 text-sm leading-6 text-muted">
                Можно двигаться в своём ритме.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-[1.45rem] border border-line bg-white/85 shadow-soft">
          {cards.map((card) => {
            const Icon = ICONS[card.type] ?? Bell;
            const tone = TONES[card.type] ?? TONES.finance_daily;
            return (
              <li key={card.key} className="border-b border-line/70 last:border-b-0">
                <Link href={card.href} className="flex items-center gap-3 p-3">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tone.icon}`}
                  >
                    <Icon size={18} strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold leading-snug text-ink">
                      {card.title}
                    </div>
                    <div className="mt-0.5 truncate text-sm text-muted">
                      {card.text}
                    </div>
                  </div>
                  <ChevronRight size={17} className="shrink-0 text-faint" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
