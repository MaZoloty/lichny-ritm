"use client";

import { useState, useTransition } from "react";
import { CalendarDays, CreditCard, Landmark, Plus, ReceiptText } from "lucide-react";
import { money } from "@/lib/format";
import type { DebtPaymentView, DebtsData, DebtView } from "@/lib/debts-data";
import DebtFormModal from "./DebtFormModal";
import DebtPaymentModal from "./DebtPaymentModal";
import { deleteDebtPayment } from "../../../app/(app)/debts/actions";

const TYPE_LABEL: Record<DebtView["type"], string> = {
  credit_card: "Кредитка",
  loan: "Кредит",
  installment: "Рассрочка",
  other: "Другое",
};

function dateLabel(iso: string | null) {
  if (!iso) return "Не задан";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00`));
}

export default function DebtsClient({ data }: { data: DebtsData }) {
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtView | null>(null);
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<DebtPaymentView | null>(
    null,
  );
  const [openHistory, setOpenHistory] = useState<string | null>(
    data.debts[0]?.id ?? null,
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const todayISO = new Intl.DateTimeFormat("en-CA").format(new Date());

  function openAddDebt() {
    setEditingDebt(null);
    setDebtModalOpen(true);
  }

  function openEditDebt(debt: DebtView) {
    setEditingDebt(debt);
    setDebtModalOpen(true);
  }

  function openPayment(debt: DebtView) {
    setEditingPayment(null);
    setPaymentDebtId(debt.id);
  }

  function editPayment(payment: DebtPaymentView) {
    setEditingPayment(payment);
    setPaymentDebtId(payment.debt_id);
  }

  function removePayment(payment: DebtPaymentView) {
    if (!window.confirm("Удалить этот платёж?")) return;
    setError(null);
    setPendingDeleteId(payment.id);
    startTransition(async () => {
      const res = await deleteDebtPayment(payment.id);
      if (res?.error) setError(res.error);
      setPendingDeleteId(null);
    });
  }

  const paymentDebt = paymentDebtId
    ? data.debts.find((debt) => debt.id === paymentDebtId)
    : null;

  return (
    <main className="px-5 pb-8 pt-safe">
      <header className="mb-4 mt-4">
        <p className="text-sm font-medium text-muted">Долги и кредиты</p>
        <h1 className="mt-1 text-[1.85rem] font-bold leading-tight tracking-normal text-ink">
          Осталось закрыть
        </h1>
      </header>

      {data.debts.length === 0 ? (
        <section className="card text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-accent/10 text-accent">
            <ReceiptText size={26} />
          </div>
          <h2 className="text-lg font-semibold">Добавим первый долг</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Так будет видно остаток, платежи, проценты и прогресс закрытия.
          </p>
          <button onClick={openAddDebt} className="btn-primary mt-5 w-full">
            Добавить долг
          </button>
        </section>
      ) : (
        <>
          <section className="card mb-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Осталось закрыть"
                value={money(data.summary.totalCurrentDebt, data.currency)}
                accent
              />
              <Stat
                label="Минимальные платежи"
                value={money(data.summary.monthlyMinimumTotal, data.currency)}
              />
              <Stat
                label="Погашено"
                value={money(data.summary.totalPaid, data.currency)}
              />
              <Stat
                label="Проценты"
                value={money(data.summary.totalInterest, data.currency)}
              />
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted">Прогресс закрытия</span>
                <span className="font-semibold">
                  {data.summary.overallPaidPercent}%
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${data.summary.overallPaidPercent}%` }}
                />
              </div>
            </div>
            <div className="soft-tile mt-4 flex items-center gap-3">
              <CalendarDays className="shrink-0 text-accent" size={20} />
              <div className="min-w-0">
                <div className="text-xs text-muted">Ближайший платёж</div>
                <div className="truncate font-semibold">
                  {data.summary.nextPayment
                    ? `${data.summary.nextPayment.name} · ${dateLabel(
                        data.summary.nextPayment.next_payment_date,
                      )}`
                    : "Не задан"}
                </div>
              </div>
            </div>
          </section>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <button onClick={openAddDebt} className="btn-ghost">
              <Plus size={18} />
              Долг
            </button>
            <button
              onClick={() => data.debts[0] && openPayment(data.debts[0])}
              className="btn-primary"
            >
              Внести платёж
            </button>
          </div>

          {error && (
            <p className="mb-4 rounded-2xl bg-peach/15 px-4 py-3 text-sm">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-4">
            {data.debts.map((debt) => (
              <article key={debt.id} className="card">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <button
                    onClick={() => openEditDebt(debt)}
                    className="min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                        {debt.type === "credit_card" ? (
                          <CreditCard size={20} />
                        ) : (
                          <Landmark size={20} />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-lg font-semibold">
                          {debt.name}
                        </span>
                        <span className="text-xs text-muted">
                          {TYPE_LABEL[debt.type]}
                        </span>
                      </span>
                    </div>
                  </button>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    {debt.paidPercent}%
                  </span>
                </div>

                <div className="mb-3">
                  <div className="text-xs text-muted">Осталось закрыть</div>
                  <div className="text-2xl font-bold">
                    {money(debt.current_amount, data.currency)}
                  </div>
                </div>

                <div className="progress-track mb-3">
                  <div
                    className="progress-fill"
                    style={{ width: `${debt.paidPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Mini label="Погашено" value={money(debt.paidAmount, data.currency)} />
                  <Mini
                    label="Минимальный платёж"
                    value={money(debt.minimum_payment, data.currency)}
                  />
                  <Mini
                    label="Изначально"
                    value={money(debt.initial_amount, data.currency)}
                  />
                  <Mini
                    label="Ближайший платёж"
                    value={dateLabel(debt.next_payment_date)}
                  />
                </div>

                {debt.latestPayment && (
                  <p className="mt-3 text-xs leading-5 text-muted">
                    Последний платёж: {money(debt.latestPayment.actual_payment, data.currency)}.
                    Тело долга {money(debt.latestPayment.principal_reduction, data.currency)},
                    проценты {money(debt.latestPayment.interest_amount, data.currency)}.
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openPayment(debt)}
                    className="btn-primary flex-1"
                  >
                    Внести платёж
                  </button>
                  <button
                    onClick={() =>
                      setOpenHistory(openHistory === debt.id ? null : debt.id)
                    }
                    className="btn-ghost flex-1"
                  >
                    История
                  </button>
                </div>

                {openHistory === debt.id && (
                  <PaymentHistory
                    debt={debt}
                    currency={data.currency}
                    pending={pending}
                    pendingDeleteId={pendingDeleteId}
                    onEdit={editPayment}
                    onDelete={removePayment}
                  />
                )}
              </article>
            ))}
          </div>
        </>
      )}

      {debtModalOpen && (
        <DebtFormModal
          open={debtModalOpen}
          onClose={() => setDebtModalOpen(false)}
          editing={editingDebt}
        />
      )}

      {paymentDebt && (
        <DebtPaymentModal
          open={!!paymentDebt}
          onClose={() => {
            setPaymentDebtId(null);
            setEditingPayment(null);
          }}
          debts={data.debts}
          accounts={data.accounts}
          defaultDebtId={paymentDebt.id}
          editing={editingPayment}
          defaultDateISO={todayISO}
        />
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`soft-tile ${accent ? "bg-accent/10" : ""}`}>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] bg-bg/70 px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 truncate font-semibold">{value}</div>
    </div>
  );
}

function PaymentHistory({
  debt,
  currency,
  pending,
  pendingDeleteId,
  onEdit,
  onDelete,
}: {
  debt: DebtView;
  currency: string;
  pending: boolean;
  pendingDeleteId: string | null;
  onEdit: (payment: DebtPaymentView) => void;
  onDelete: (payment: DebtPaymentView) => void;
}) {
  if (debt.payments.length === 0) {
    return (
      <div className="mt-4 rounded-[1.3rem] bg-bg/70 px-4 py-3 text-sm text-muted">
        Платежей пока нет.
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {debt.payments.map((payment) => (
        <div key={payment.id} className="rounded-[1.3rem] bg-bg/70 px-4 py-3">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">
                {money(payment.actual_payment, currency)}
              </div>
              <div className="text-xs text-muted">
                {dateLabel(payment.payment_date)}
                {payment.accountName ? ` · ${payment.accountName}` : ""}
              </div>
            </div>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-muted">
              {payment.interestShare}% проценты
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Mini
              label="Тело долга"
              value={money(payment.principal_reduction, currency)}
            />
            <Mini
              label="Проценты"
              value={money(payment.interest_amount, currency)}
            />
          </div>
          {payment.comment && (
            <p className="mt-2 text-xs text-muted">{payment.comment}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onEdit(payment)}
              className="btn-ghost min-h-10 flex-1 py-2 text-sm"
            >
              Редактировать
            </button>
            <button
              onClick={() => onDelete(payment)}
              disabled={pending || pendingDeleteId === payment.id}
              className="btn-ghost min-h-10 flex-1 py-2 text-sm text-peach"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
