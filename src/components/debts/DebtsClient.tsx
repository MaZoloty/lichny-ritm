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
    <main className="px-5 pb-56 pt-safe">
      <header className="relative -mx-5 overflow-hidden px-5 pb-5 pt-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(240,141,127,0.34),transparent_30%),radial-gradient(circle_at_18%_80%,rgba(155,99,244,0.2),transparent_34%),linear-gradient(180deg,rgba(255,253,251,0.92),rgba(250,247,242,0))]" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#7C7A88]">Долги и кредиты</p>
            <h1 className="mt-1 text-[34px] font-semibold leading-[1.04] text-[#2F2F35]">
              Осталось закрыть
            </h1>
            <p className="mt-3 max-w-[17rem] text-[15px] leading-6 text-[#6F6D79]">
              Видим платежи, проценты и движение без лишней тревоги.
            </p>
          </div>
          <button
            onClick={openAddDebt}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#F1C2B8] bg-[#FFE9E3] text-[#D96E61] shadow-soft transition active:scale-95"
            aria-label="Добавить долг"
          >
            <Plus size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

      {data.debts.length === 0 ? (
        <section className="rounded-[30px] border border-[#F1C2B8] bg-[linear-gradient(145deg,#FFFFFF_0%,#FFE9E3_100%)] p-5 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#FFE0DA] text-[#D96E61]">
            <ReceiptText size={26} />
          </div>
          <h2 className="text-lg font-semibold text-[#2F2F35]">Добавим первый долг</h2>
          <p className="mt-2 text-sm leading-6 text-[#7C7A88]">
            Так будет видно остаток, платежи, проценты и прогресс закрытия.
          </p>
          <button onClick={openAddDebt} className="btn-primary mt-5 w-full">
            Добавить долг
          </button>
        </section>
      ) : (
        <>
          <section className="mb-4 rounded-[28px] border border-[#F1C2B8] bg-[linear-gradient(145deg,#FFFFFF_0%,#FFE9E3_58%,#F6F0FF_100%)] p-4 shadow-card">
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
                <span className="text-[#7C7A88]">Прогресс закрытия</span>
                <span className="font-semibold text-[#D96E61]">
                  {data.summary.overallPaidPercent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDE7DF]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#F08D7F_0%,#8B5CF6_100%)] transition-all"
                  style={{ width: `${data.summary.overallPaidPercent}%` }}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-[20px] bg-white/70 px-3 py-3 shadow-[0_10px_25px_-20px_rgba(47,47,53,0.55)]">
              <CalendarDays className="shrink-0 text-[#D96E61]" size={20} />
              <div className="min-w-0">
                <div className="text-xs text-[#7C7A88]">Ближайший платёж</div>
                <div className="truncate font-semibold text-[#2F2F35]">
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
            <p className="mb-4 rounded-[22px] border border-[#F1C2B8] bg-[#FFE9E3] px-4 py-3 text-sm text-[#D96E61]">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-4">
            {data.debts.map((debt) => (
              <article key={debt.id} className="rounded-[28px] border border-[#F1C2B8] bg-[linear-gradient(145deg,#FFFFFF_0%,#FFF4F1_62%,#FAF6FF_100%)] p-4 shadow-card">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <button
                    onClick={() => openEditDebt(debt)}
                    className="min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F08D7F] text-white">
                        {debt.type === "credit_card" ? (
                          <CreditCard size={20} />
                        ) : (
                          <Landmark size={20} />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-lg font-semibold text-[#2F2F35]">
                          {debt.name}
                        </span>
                        <span className="text-xs text-[#7C7A88]">
                          {TYPE_LABEL[debt.type]}
                        </span>
                      </span>
                    </div>
                  </button>
                  <span className="rounded-full bg-[#FFE0DA] px-3 py-1 text-xs font-medium text-[#D96E61]">
                    {debt.paidPercent}%
                  </span>
                </div>

                <div className="mb-3">
                  <div className="text-xs text-[#7C7A88]">Осталось закрыть</div>
                  <div className="text-2xl font-semibold text-[#2F2F35]">
                    {money(debt.current_amount, data.currency)}
                  </div>
                </div>

                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#EDE7DF]">
                  <div
                    className="h-full rounded-full bg-[#F08D7F] transition-all"
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
                  <p className="mt-3 text-xs leading-5 text-[#7C7A88]">
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
    <div className={`rounded-[20px] px-3 py-3 shadow-[0_10px_25px_-20px_rgba(47,47,53,0.55)] ${accent ? "bg-[#FFE0DA]" : "bg-white/70"}`}>
      <div className="text-xs text-[#7C7A88]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[#2F2F35]">{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-white/70 px-3 py-2">
      <div className="text-xs text-[#7C7A88]">{label}</div>
      <div className="mt-0.5 truncate font-semibold text-[#2F2F35]">{value}</div>
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
      <div className="mt-4 rounded-[22px] bg-white/70 px-4 py-3 text-sm text-[#7C7A88]">
        Платежей пока нет.
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {debt.payments.map((payment) => (
        <div key={payment.id} className="rounded-[22px] bg-white/72 px-4 py-3">
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
