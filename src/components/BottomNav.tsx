"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_MODULE_ORDER, NAV_SHORT_LABEL, type ModuleKey } from "@/lib/modules";

const ICONS: Record<string, string> = {
  "/": "◍",
  "/habits": "✦",
  "/finance": "₽",
  "/goals": "◎",
  "/debts": "▭",
  "/savings": "❀",
  "/settings": "⚙",
};

interface NavItem {
  href: string;
  label: string;
}

export default function BottomNav({
  enabledModules,
}: {
  enabledModules: ModuleKey[];
}) {
  const pathname = usePathname();
  const enabled = new Set(enabledModules);

  const items: NavItem[] = [{ href: "/", label: "Главная" }];

  for (const key of NAV_MODULE_ORDER) {
    if (enabled.has(key)) {
      items.push({
        href: `/${key}`,
        label: NAV_SHORT_LABEL[key] ?? key,
      });
    }
  }

  items.push({ href: "/settings", label: "Настройки" });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-safe pt-2">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-2xl py-1 text-[11px] ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <span className="text-lg leading-none">
                  {ICONS[item.href] ?? "•"}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
