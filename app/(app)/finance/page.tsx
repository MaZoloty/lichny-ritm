import { requireModule } from "@/lib/guard";
import { loadFinance } from "@/lib/finance-data";
import { isPeriod } from "@/lib/period";
import FinanceClient from "@/components/finance/FinanceClient";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireModule("finance");
  const sp = await searchParams;
  const period = isPeriod(sp.period) ? sp.period : "today";
  const data = await loadFinance(period);
  return <FinanceClient data={data} />;
}
