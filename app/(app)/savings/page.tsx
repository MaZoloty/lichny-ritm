import { requireModule } from "@/lib/guard";
import PageHeader from "@/components/PageHeader";
import SavingsClient from "@/components/savings/SavingsClient";
import { loadSavings } from "@/lib/savings-data";

export default async function SavingsPage() {
  await requireModule("savings");
  const data = await loadSavings();

  return (
    <>
      <PageHeader
        title="Сбережения"
        subtitle="Резерв и накопления, которые уже лежат на отдельных счетах."
      />
      <SavingsClient data={data} />
    </>
  );
}
