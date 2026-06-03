import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { MODULES } from "@/lib/modules";
import BottomNav from "@/components/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");
  if (!ctx.profile?.onboarding_completed) redirect("/onboarding");

  const navModules = MODULES.map((m) => m.key).filter((k) =>
    ctx.enabledModules.has(k),
  );

  return (
    <div className="app-shell">
      {children}
      <BottomNav enabledModules={navModules} />
    </div>
  );
}
