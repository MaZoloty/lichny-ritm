import { requireModule } from "@/lib/guard";
import { loadHabitsWeek } from "@/lib/habits-data";
import HabitsClient from "@/components/habits/HabitsClient";

export default async function HabitsPage() {
  await requireModule("habits");
  const data = await loadHabitsWeek();
  return <HabitsClient data={data} />;
}
