"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { money, signedMoney } from "@/lib/format";
import { parseISODate } from "@/lib/week";
import { PERIODS } from "@/lib/period";
import type { FinanceData, TxView, CategoryStat } from "@/lib/finance-data";
import TransactionModal from "./TransactionModal";
import { createDefaultCategories } from "../../../app/(app)/finance/actions";

function dayLabel(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(parseISODate(iso));
}

export default function FinanceClient({ data }: { data: FinanceData }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TxView | null>(null);
  const [pending, startTransition] = useTransition();

  const todayISO = new Intl.DateTimeFormat("en-CA").format(new Date());

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(t: TxView) {
    setEditing(t);
    setModalOpen(true);
  }

  function makeDefaults() {
    startTransition(async () => {
      await createDefaultCategories();
    });
  }

  const diffTone =
    data.diff > 0
      ? "в плюсе"
      : data.diff < 0
        ? "расходы выше доходов"
        : "ровно";

  return (
    <main className="px-5 pb-8 pt-safe">
      <header className="mb-4 mt-4">
        <h1 className="text-[1.85rem] font-bold leading-tight tracking-normal text-ink">
          Финансы
        </h1>
        <p className="mt-1 text-sm leading-6 text-muted">
          Деньги любят ясность. Просто зафиксируй факт.
        </p>
      </header>

      <div className="mb-4 flex gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/finance?period=${p.key}`}
            scroll={false}
            className={`flex-1 rounded-[1.15rem] py-2 text-center text-sm font-medium transition ${
              data.period === p.key
                ? "bg-accent text-white shadow-[0_12px_28px_-18px_rgba(139,92,246,0.8)]"
                : "bg-white/70 text-muted"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="metric-card bg-green/20">
          <div className="text-xs text-muted">Доходы</div>
          <div className="mt-1 text-lg font-bold text-ink">
            {money(data.incomeTotal, data.currency)}
          </div>
        </div>
        <div className="metric-card bg-peach/20">
          <div className="text-xs text-muted">Расходы</div>
          <div className="mt-1 text-lg font-bold text-ink">
            {money(data.expenseTotal, data.currency)}
          </div>
        </div>
        <div className="metric-card bg-accent/10">
          <div className="text-xs text-muted">Разница</div>
          <div
            className={`mt-1 text-lg font-bold ${
              data.diff < 0 ? "text-peach" : "text-ink"
            }`}
          >
            {signedMoney(data.diff, data.currency)}
          </div>
        </div>
      </div>
      <p className="mb-4 text-center text-sm text-muted">{diffTone}</p>

      <button onClick={openAdd} className="btn-primary mb-5 w-full">
        + Добавить операцию
      </button>

      {data.accounts.length === 0 && (
        <div className="card mb-4 text-center text-sm text-muted">
          <h2 className="mb-2 text-base font-medium text-ink">
            Добавим стартовую точку
          </h2>
          <p className="mb-3">
            Укажи, сколько денег сейчас есть на карте, наличными или в
            накоплениях. Дальше приложение будет считать доходы и расходы от
            этой суммы.
          </p>
          <Link href="/settings/accounts" className="btn-primary inline-flex">
            Добавить счета
          </Link>
        </div>
      )}

      {data.categories.length === 0 && (
        <div className="card mb-4 text-center text-sm text-muted">
          <p className="mb-3">
            Категории помогают понять, куда уходят деньги.
          </p>
          <button
            onClick={makeDefaults}
            disabled={pending}
            className="btn-primary"
          >
            Создать категории по умолчанию
          </button>
        </div>
      )}

      {data.expenseByCategory.length > 0 && (
        <CategoryBlock
          title="Расходы по категориям"
          stats={data.expenseByCategory}
          currency={data.currency}
          color="#F29B8F"
        />
      )}
      {data.incomeByCategory.length > 0 && (
        <CategoryBlock
          title="Доходы по категориям"
          stats={data.incomeByCategory}
          currency={data.currency}
          color="#A7D8A0"
        />
      )}

      {data.byAccount.length > 0 && (
        <section className="card mb-4">
          <h2 className="mb-3 font-medium">По счетам</h2>
          <ul className="flex flex-col gap-3">
            {data.byAccount.map((a) => (
              <li key={a.accountId ?? "none"} className="soft-tile">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{a.name}</span>
                  <div className="text-right">
                    <div className="text-[11px] text-muted">Сейчас</div>
                    <div className="font-semibold text-ink">
                      {a.currentBalance !== null
                        ? money(a.currentBalance, a.currency)
                        : "—"}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted">
                  Доходы {money(a.income, a.currency)} · Расходы{" "}
                  {money(a.expense, a.currency)} · Разница{" "}
                  {signedMoney(a.diff, a.currency)}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="mb-3 font-medium">Последние операции</h2>
        {data.transactions.length === 0 ? (
          <div className="text-center text-sm text-muted">
            <p className="mb-3">
              Сегодня пока пусто. Можно добавить первую операцию за пару секунд.
            </p>
            <button onClick={openAdd} className="btn-primary">
              Добавить операцию
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.transactions.map((t) => {
              const signed = t.type === "income" ? t.amount : -t.amount;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => openEdit(t)}
                    className="flex w-full items-center justify-between gap-3 rounded-[1.2rem] bg-bg/70 px-3 py-3 text-left transition hover:bg-bg"
                  >
                    <div className="min-w-0">
                      <div className="truncate">
                        {t.categoryName ?? "Без категории"}
                      </div>
                      <div className="truncate text-xs text-muted">
                        {dayLabel(t.date)}
                        {t.accountName ? ` · ${t.accountName}` : ""}
                        {t.comment ? ` · ${t.comment}` : ""}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 font-medium ${
                        t.type === "income" ? "text-green" : "text-ink"
                      }`}
                    >
                      {signedMoney(signed, t.accountCurrency)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {modalOpen && (
        <TransactionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          accounts={data.accounts}
          categories={data.categories}
          editing={editing}
          defaultDateISO={todayISO}
        />
      )}
    </main>
  );
}

function CategoryBlock({
  title,
  stats,
  currency,
  color,
}: {
  title: string;
  stats: CategoryStat[];
  currency: string;
  color: string;
}) {
  return (
    <section className="card mb-4">
      <h2 className="mb-3 font-medium">{title}</h2>
      <ul className="flex flex-col gap-3">
        {stats.map((s) => (
          <li key={s.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{s.name}</span>
              <span className="text-muted">
                {money(s.sum, currency)} · {s.pct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full"
                style={{ width: `${s.pct}%`, backgroundColor: color }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
