import { requireModule } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import { money, percent } from "@/lib/format";
import type { Saving } from "@/types/db";

export default async function SavingsPage() {
  await requireModule("savings");
  const supabase = await createClient();
  const { data } = await supabase
    .from("savings")
    .select("*")
    .order("created_at", { ascending: true });
  const savings = (data ?? []) as Saving[];
  const total = savings.reduce((s, v) => s + Number(v.current_amount), 0);

  return (
    <>
      <PageHeader
        title="Сбережения"
        subtitle="Финансовая устойчивость — спокойно и по чуть-чуть."
      />
      <div className="flex flex-col gap-3 px-5">
        <div className="card">
          <div className="text-sm text-muted">Накоплено</div>
          <div className="text-2xl font-semibold">{money(total)}</div>
        </div>
        {savings.map((s) => (
          <div key={s.id} className="card">
            <div className="mb-1 flex justify-between">
              <span className="font-medium">{s.name}</span>
              <span>{money(Number(s.current_amount))}</span>
            </div>
            {s.target_amount ? (
              <>
                <div className="mb-2 text-sm text-muted">
                  Цель: {money(Number(s.target_amount))}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-green"
                    style={{
                      width: `${percent(
                        Number(s.current_amount),
                        Number(s.target_amount),
                      )}%`,
                    }}
                  />
                </div>
              </>
            ) : (
              s.comment && <div className="text-sm text-muted">{s.comment}</div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
