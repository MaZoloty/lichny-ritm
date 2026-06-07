"use client";

import { useState, useTransition } from "react";
import { MODULES, type ModuleKey } from "@/lib/modules";
import { setModuleEnabled } from "../../app/(app)/settings/actions";

export default function ModuleToggles({
  initial,
}: {
  initial: Record<ModuleKey, boolean>;
}) {
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle(key: ModuleKey) {
    const next = !state[key];
    setState((s) => ({ ...s, [key]: next })); // оптимистично
    startTransition(async () => {
      const res = await setModuleEnabled(key, next);
      if (res?.error) {
        setState((s) => ({ ...s, [key]: !next })); // откат
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {MODULES.map((m) => {
        const on = state[m.key];
        return (
          <button
            key={m.key}
            onClick={() => toggle(m.key)}
            disabled={pending}
            className="flex items-center justify-between rounded-[22px] bg-white/70 px-4 py-3 text-left shadow-[0_10px_25px_-20px_rgba(47,47,53,0.55)] transition active:scale-[0.99]"
          >
            <span>
              <span className="block font-semibold text-[#2F2F35]">{m.title}</span>
              <span className="block text-xs leading-5 text-[#7C7A88]">{m.description}</span>
            </span>
            <span
              className={`relative ml-3 h-6 w-11 shrink-0 rounded-full transition ${
                on ? "bg-[#8B5CF6]" : "bg-[#EDE7DF]"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  on ? "left-[22px]" : "left-0.5"
                }`}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
