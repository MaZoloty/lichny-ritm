import { requireModule } from "@/lib/guard";
import { loadGoals } from "@/lib/goals-data";
import GoalsClient from "@/components/goals/GoalsClient";

export default async function GoalsPage() {
  await requireModule("goals");
  const data = await loadGoals();
  return <GoalsClient data={data} />;
}
