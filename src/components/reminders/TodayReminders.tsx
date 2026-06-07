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

const TONES: Record<ReminderType, { icon: string }> = {
  finance_daily: {
    icon: "bg-[#EFEAFE] text-[#8B5CF6]",
  },
  habits_daily: {
    icon: "bg-[#E8F4E6] text-[#5E9F6B]",
  },
  debt_payment: {
    icon: "bg-[#FCEAE6] text-[#D77C70]",
  },
  monday_goals: {
    icon: "bg-[#EFEAFE] text-[#8B5CF6]",
  },
  savings: {
    icon: "bg-[#E6F0F9] text-[#608CB4]",
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
    <section className="space-y-3">
      <h2 className="px-1 text-lg font-semibold text-[#2F2F35]">
        Сегодня важно
      </h2>

      {cards.length === 0 ? (
        <div className="rounded-[28px] border border-[#EDE7DF] bg-white/90 p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#EFEAFE] text-[#8B5CF6]">
              <Bell size={19} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <div className="font-semibold leading-snug text-[#2F2F35]">
                На сегодня всё спокойно
              </div>
              <div className="mt-1 text-sm leading-5 text-[#7C7A88]">
                Можно двигаться в своём ритме.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-[28px] border border-[#EDE7DF] bg-white/90 p-2 shadow-card">
          {cards.map((card) => {
            const Icon = ICONS[card.type] ?? Bell;
            const tone = TONES[card.type] ?? TONES.finance_daily;
            return (
              <li key={card.key} className="border-b border-[#EDE7DF]/80 last:border-b-0">
                <Link
                  href={card.href}
                  className="flex items-center gap-3 rounded-[20px] px-2 py-2.5 transition active:scale-[0.99]"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}
                  >
                    <Icon size={18} strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold leading-snug text-[#2F2F35]">
                      {card.title}
                    </div>
                    <div className="mt-0.5 truncate text-sm text-[#7C7A88]">
                      {card.text}
                    </div>
                  </div>
                  <ChevronRight size={17} className="shrink-0 text-[#A8A6B2]" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
