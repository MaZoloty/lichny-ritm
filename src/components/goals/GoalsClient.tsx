"use client";

import { useState } from "react";
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
  start: "bg-line text-muted",
  moving: "bg-peach/20 text-ink",
  half: "bg-accent/15 text-accent",
  done: "bg-green/30 text-ink",
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
    <main className="px-5 pt-safe pb-6">
      <header className="mb-4 mt-4">
        <h1 className="text-2xl font-semibold">Цели</h1>
        <p className="text-muted">Копим спокойно, маленькими шагами.</p>
      </header>

      {data.goals.length === 0 ? (
        <div className="card text-center text-muted">
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
          <section className="card mb-4">
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

          <button onClick={openAddGoal} className="btn-ghost mb-4 w-full">
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
                <article key={g.id} className="card">
                  <div className="mb-2 flex items-start justify-between">
                    <button
                      onClick={() => openEditGoal(g)}
                      className="text-left text-lg font-medium"
                    >
                      {g.name}
                    </button>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${STATUS_STYLE[status]}`}
                    >
                      {GOAL_STATUS_LABEL[status]}
                    </span>
                  </div>

                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted">
                      {money(current, data.currency)} из{" "}
                      {money(target, data.currency)}
                    </span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <p className="mb-1 text-sm text-muted">
                    {current > target
                      ? "Цель закрыта с запасом"
                      : remaining > 0
                        ? `Осталось собрать: ${money(remaining, data.currency)}`
                        : "Цель закрыта"}
                  </p>

                  {g.deadline && (
                    <p className="mb-3 text-xs text-muted">
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
    <div className="rounded-2xl bg-bg px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
