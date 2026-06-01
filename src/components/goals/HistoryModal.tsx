"use client";

import { useTransition } from "react";
import Modal from "@/components/Modal";
import { money } from "@/lib/format";
import { parseISODate } from "@/lib/week";
import type { GoalView, ContributionView } from "@/lib/goals-data";
import { deleteContribution } from "../../../app/(app)/goals/actions";

function dayLabel(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseISODate(iso));
}

export default function HistoryModal({
  open,
  onClose,
  goal,
  currency,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  goal: GoalView;
  currency: string;
  onEdit: (c: ContributionView) => void;
}) {
  const [pending, startTransition] = useTransition();

  function remove(id: string) {
    startTransition(async () => {
      await deleteContribution(id);
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="История пополнений">
      <p className="mb-3 text-sm text-muted">{goal.name}</p>
      {goal.contributions.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          Пополнений пока нет. Можно начать с небольшой суммы.
        </p>
      ) : (
        <ul className="flex flex-col">
          {goal.contributions.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0"
            >
              <div className="min-w-0">
                <div className="font-medium">{money(c.amount, currency)}</div>
                <div className="truncate text-xs text-muted">
                  {dayLabel(c.contribution_date)}
                  {c.accountName ? ` · ${c.accountName}` : ""}
                  {c.comment ? ` · ${c.comment}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => onEdit(c)}
                  className="text-sm text-accent"
                >
                  Изменить
                </button>
                <button
                  onClick={() => remove(c.id)}
                  disabled={pending}
                  className="text-sm text-muted"
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
