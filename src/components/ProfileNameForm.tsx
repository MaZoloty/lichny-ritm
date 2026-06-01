"use client";

import { useState, useTransition } from "react";
import { updateDisplayName } from "../../app/(app)/settings/actions";

export default function ProfileNameForm({ initial }: { initial: string }) {
  const [name, setName] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setSaved(false);
    startTransition(async () => {
      await updateDisplayName(name);
      setSaved(true);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setSaved(false);
        }}
        placeholder="Имя"
        className="field"
      />
      <button onClick={save} disabled={pending} className="btn-ghost">
        {pending ? "Сохраняю…" : saved ? "Сохранено ✓" : "Сохранить имя"}
      </button>
    </div>
  );
}
