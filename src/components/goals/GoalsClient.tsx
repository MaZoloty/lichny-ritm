"use client";

import { useState } from "react";
import { Plus, Target, WalletCards } from "lucide-react";
import { money } from "@/lib/format";
import { parseISODate } from "@/lib/week";
import {
  GOAL_STATUS_LABEL,
  goalPercent,
  goalStatus,
  monthlyNeeded,
  monthsUntilDeadline,
  remainingAmount,
  type GoalStatus,
} from "@/lib/goals";
import type { GoalsData, GoalView, ContributionView } from "@/lib/goals-data";
import type { Goal } from "@/types/db";
import GoalFormModal from "./GoalFormModal";
import ContributionModal from "./ContributionModal";
import HistoryModal from "./HistoryModal";

const STATUS_STYLE: Record<GoalStatus, string> = {
  start: "bg-[#F2ECE4] text-[#7C7A88]",
  moving: "bg-[#FFE0DA] text-[#D96E61]",
  half: "bg-[#E8DAFF] text-[#7C3AED]",
  done: "bg-[#D2F4D8] text-[#2F9E52]",
};

function deadlineLabel(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseISODate(iso));
}

export default function GoalsClient({ data }: { data: GoalsData }) {
  const todayISO = new Intl.DateTimeFormat("en-CA").format(new Date());

  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [contribGoal, setContribGoal] = useState<GoalView | null>(null);
  const [editingContrib, setEditingContrib] =
    useState<ContributionView | null>(null);

  const [historyGoal, setHistoryGoal] = useState<GoalView | null>(null);

  function openAddGoal() {
    setEditingGoal(null);
    setFormOpen(true);
  }
  function openEditGoal(g: GoalView) {
    setEditingGoal(g);
    setFormOpen(true);
  }
  function openContribute(g: GoalView) {
    setEditingContrib(null);
    setContribGoal(g);
  }
  function openEditContribution(g: GoalView, c: ContributionView) {
    setHistoryGoal(null);
    setEditingContrib(c);
    setContribGoal(g);
  }

  return (
    <main className="px-5 pb-56 pt-safe">
      <header className="relative -mx-5 overflow-hidden px-5 pb-5 pt-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(155,99,244,0.38),transparent_30%),radial-gradient(circle_at_18%_80%,rgba(116,201,132,0.22),transparent_34%),linear-gradient(180deg,rgba(255,253,251,0.92),rgba(250,247,242,0))]" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#7C7A88]">Цели и накопления</p>
            <h1 className="mt-1 text-[34px] font-semibold leading-[1.04] text-[#2F2F35]">
              Цели
            </h1>
            <p className="mt-3 max-w-[17rem] text-[15px] leading-6 text-[#6F6D79]">
              Копим спокойно, маленькими шагами.
            </p>
          </div>
          <button
            onClick={openAddGoal}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#D9C6FF] bg-[#F1E8FF] text-[#7C3AED] shadow-soft transition active:scale-95"
            aria-label="Добавить цель"
          >
            <Plus size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

      {data.goals.length === 0 ? (
        <div className="rounded-[30px] border border-[#D9C6FF] bg-[linear-gradient(145deg,#FFFFFF_0%,#F1E8FF_100%)] p-5 text-center text-[#7C7A88] shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#E8DAFF] text-[#7C3AED]">
            <Target size={24} strokeWidth={1.9} />
          </div>
          <p className="mb-4">
            Добавим первую цель — отпуск, подушку или любую сумму, которую
            хочется собрать спокойно.
          </p>
          <button onClick={openAddGoal} className="btn-primary">
            + Добавить цель
          </button>
        </div>
      ) : (
        <>
          {/* Сводка */}
          <section className="mb-4 rounded-[28px] border border-[#D4BEFF] bg-[linear-gradient(145deg,#FFFFFF_0%,#EFE4FF_62%,#EAF8ED_100%)] p-4 shadow-card">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Всего накоплено" value={money(data.totalSaved, data.currency)} />
              <Stat
                label="Осталось до целей"
                value={money(data.totalRemaining, data.currency)}
              />
              <Stat label="Активных целей" value={String(data.activeCount)} />
              <Stat
                label="Отложено в этом месяце"
                value={money(data.savedThisMonth, data.currency)}
              />
            </div>
          </section>

          <button onClick={openAddGoal} className="btn-ghost mb-4 w-full rounded-[22px] border-[#D4BEFF] bg-[#F1E8FF] text-[#7C3AED]">
            + Добавить цель
          </button>

          <div className="flex flex-col gap-4">
            {data.goals.map((g) => {
              const current = Number(g.current_amount);
              const target = Number(g.target_amount);
              const pct = goalPercent(current, target);
              const status = goalStatus(current, target);
              const remaining = remainingAmount(current, target);
              const months = monthsUntilDeadline(g.deadline);
              const perMonth = monthlyNeeded(remaining, months);

              return (
                <article key={g.id} className="rounded-[28px] border border-[#D4BEFF] bg-[linear-gradient(145deg,#FFFFFF_0%,#FAF6FF_60%,#F3FFF5_100%)] p-4 shadow-card">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <button
                      onClick={() => openEditGoal(g)}
                      className="min-w-0 text-left text-[18px] font-semibold leading-snug text-[#2F2F35]"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6] text-white">
                          <Target size={17} strokeWidth={1.9} />
                        </span>
                        <span className="truncate">{g.name}</span>
                      </span>
                    </button>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[status]}`}
                    >
                      {GOAL_STATUS_LABEL[status]}
                    </span>
                  </div>

                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-[#7C7A88]">
                      {money(current, data.currency)} из{" "}
                      {money(target, data.currency)}
                    </span>
                    <span className="font-semibold text-[#7C3AED]">{pct}%</span>
                  </div>
                  <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#EDE7DF]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#8B5CF6_0%,#74C984_100%)] transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <p className="mb-1 text-sm leading-5 text-[#7C7A88]">
                    {current > target
                      ? "Цель закрыта с запасом"
                      : remaining > 0
                        ? `Осталось собрать: ${money(remaining, data.currency)}`
                        : "Цель закрыта"}
                  </p>

                  {g.deadline && (
                    <p className="mb-3 text-xs leading-5 text-[#A8A6B2]">
                      Дедлайн: {deadlineLabel(g.deadline)}
                      {remaining > 0 &&
                        (perMonth !== null
                          ? ` · желательно ~${money(perMonth, data.currency)}/мес`
                          : " · можно пересмотреть срок или сумму")}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => openContribute(g)}
                      className="btn-primary flex-1"
                    >
                      Пополнить
                    </button>
                    <button
                      onClick={() => setHistoryGoal(g)}
                      className="btn-ghost flex-1"
                    >
                      История
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {formOpen && (
        <GoalFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          accounts={data.accounts}
          editing={editingGoal}
        />
      )}

      {contribGoal && (
        <ContributionModal
          open={!!contribGoal}
          onClose={() => {
            setContribGoal(null);
            setEditingContrib(null);
          }}
          accounts={data.accounts}
          goalId={contribGoal.id}
          goalName={contribGoal.name}
          defaultAccountId={editingContrib ? editingContrib.account_id : contribGoal.account_id}
          defaultDateISO={todayISO}
          editing={editingContrib}
        />
      )}

      {historyGoal && (
        <HistoryModal
          open={!!historyGoal}
          onClose={() => setHistoryGoal(null)}
          goal={historyGoal}
          currency={data.currency}
          onEdit={(c) => openEditContribution(historyGoal, c)}
        />
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-white/70 px-3 py-3 shadow-[0_10px_25px_-20px_rgba(47,47,53,0.55)]">
      <div className="flex items-center gap-2 text-xs text-[#7C7A88]">
        <WalletCards size={14} strokeWidth={1.8} />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-[#2F2F35]">{value}</div>
    </div>
  );
}
