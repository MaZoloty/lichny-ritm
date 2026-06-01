import { requireModule } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import { money } from "@/lib/format";
import type { Debt } from "@/types/db";

export default async function DebtsPage() {
  await requireModule("debts");
  const supabase = await createClient();
  const { data } = await supabase
    .from("debts")
    .select("*")
    .order("created_at", { ascending: true });
  const debts = (data ?? []) as Debt[];
  const total = debts.reduce((s, d) => s + Number(d.current_amount), 0);

  return (
    <>
      <PageHeader
        title="Долги"
        subtitle="Видим реальность и двигаемся маленькими шагами."
      />
      <div className="flex flex-col gap-3 px-5">
        {debts.length > 0 && (
          <div className="card">
            <div className="text-sm text-muted">Всего к погашению</div>
            <div className="text-2xl font-semibold">{money(total)}</div>
          </div>
        )}
        {debts.length === 0 ? (
          <div className="card text-muted">
            Долгов пока не добавлено. И это тоже нормально.
          </div>
        ) : (
          debts.map((d) => (
            <div key={d.id} className="card">
              <div className="mb-1 flex justify-between">
                <span className="font-medium">{d.name}</span>
                <span>{money(Number(d.current_amount))}</span>
              </div>
              <div className="text-sm text-muted">
                Минимальный платёж: {money(Number(d.minimum_payment))}
                {d.next_payment_date ? ` · ${d.next_payment_date}` : ""}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
