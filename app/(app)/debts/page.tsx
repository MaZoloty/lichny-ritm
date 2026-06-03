import { requireModule } from "@/lib/guard";
import { loadDebts } from "@/lib/debts-data";
import DebtsClient from "@/components/debts/DebtsClient";

export default async function DebtsPage() {
  await requireModule("debts");
  const data = await loadDebts();
  return <DebtsClient data={data} />;
}
