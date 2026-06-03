"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  Home,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Settings,
  Target,
  Wallet,
  Bell,
  Circle,
  type LucideIcon,
} from "lucide-react";
import { MODULE_MAP, type ModuleKey } from "@/lib/modules";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const PRIMARY_MODULES: ModuleKey[] = ["habits", "finance", "goals"];
const MORE_MODULES: ModuleKey[] = ["debts", "savings", "reminders"];

const MODULE_LABEL: Partial<Record<ModuleKey, string>> = {
  habits: "Привычки",
  finance: "Финансы",
  goals: "Цели",
  debts: "Долги",
  savings: "Сбережения",
  reminders: "Напоминания",
};

const MODULE_ICON: Partial<Record<ModuleKey, LucideIcon>> = {
  habits: CalendarCheck,
  finance: Wallet,
  goals: Target,
  debts: Landmark,
  savings: PiggyBank,
  reminders: Bell,
};

export default function BottomNav({
  enabledModules,
}: {
  enabledModules: ModuleKey[];
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const enabled = new Set(enabledModules);

  const primaryItems: NavItem[] = [
    { href: "/", label: "Главная", icon: Home },
    ...PRIMARY_MODULES.filter((key) => enabled.has(key)).map((key) =>
      moduleToItem(key),
    ),
  ];

  const moreItems: NavItem[] = [
    ...MORE_MODULES.filter((key) => enabled.has(key)).map((key) =>
      moduleToItem(key),
    ),
    ...enabledModules
      .filter(
        (key) =>
          !PRIMARY_MODULES.includes(key) && !MORE_MODULES.includes(key),
      )
      .map((key) => moduleToItem(key)),
    { href: "/settings", label: "Настройки", icon: Settings },
  ];

  const moreActive = moreItems.some((item) => isActive(pathname, item.href));
  const visiblePrimaryItems = primaryItems.slice(0, 4);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-bg via-bg/95 to-bg/0 px-3 pb-2 pt-8">
      <div className="relative mx-auto max-w-md rounded-[1.65rem] border border-white/85 bg-white/90 px-2 pb-safe pt-2 shadow-[0_18px_46px_-24px_rgba(47,47,53,0.5)] backdrop-blur">
        {moreOpen && (
          <div className="absolute inset-x-1 bottom-full mb-3 rounded-[1.6rem] border border-white/85 bg-white/95 p-2 shadow-[0_18px_44px_-22px_rgba(47,47,53,0.45)] backdrop-blur">
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-2 rounded-[1.1rem] px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-accent/10 text-accent"
                        : "bg-bg/70 text-muted hover:bg-bg"
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.9} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <ul
          className="grid items-stretch gap-1"
          style={{
            gridTemplateColumns: `repeat(${visiblePrimaryItems.length + 1}, minmax(0, 1fr))`,
          }}
        >
          {visiblePrimaryItems.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={isActive(pathname, item.href)} />
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-[1.15rem] px-1 py-1.5 text-[11px] font-medium transition ${
                moreActive || moreOpen
                  ? "bg-accent/10 text-accent"
                  : "text-muted"
              }`}
            >
              <MoreHorizontal size={22} strokeWidth={1.9} />
              <span className="truncate">Ещё</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex h-full flex-col items-center justify-center gap-1 rounded-[1.15rem] px-1 py-1.5 text-[11px] font-medium transition ${
        active ? "bg-accent/10 text-accent" : "text-muted"
      }`}
    >
      <Icon size={22} strokeWidth={1.9} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function moduleToItem(key: ModuleKey): NavItem {
  const href = MODULE_MAP[key].href ?? "/settings";
  return {
    href,
    label: MODULE_LABEL[key] ?? MODULE_MAP[key].title,
    icon: MODULE_ICON[key] ?? Circle,
  };
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
