"use client";

import { useState, useTransition } from "react";
import type { Category } from "@/types/db";
import {
  createCategory,
  renameCategory,
  setCategoryActive,
  createDefaultCategories,
} from "../../../app/(app)/finance/actions";

type TxType = "income" | "expense";

export default function CategoriesManager({
  categories,
}: {
  categories: Category[];
}) {
  const [tab, setTab] = useState<TxType>("expense");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const list = categories.filter((c) => c.type === tab);

  function create() {
    setError(null);
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await createCategory(name.trim(), tab);
      if (res?.error) setError(res.error);
      else setName("");
    });
  }
  function makeDefaults() {
    startTransition(async () => {
      await createDefaultCategories();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["expense", "income"] as TxType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-[20px] py-2.5 text-center text-sm font-semibold transition ${
              tab === t ? "bg-[#8B5CF6] text-white shadow-soft" : "bg-white/75 text-[#7C7A88]"
            }`}
          >
            {t === "expense" ? "Расходы" : "Доходы"}
          </button>
        ))}
      </div>

      <section className="rounded-[28px] border border-[#EDE7DF] bg-white/92 p-4 shadow-card">
        <h2 className="mb-3 font-semibold text-[#2F2F35]">Новая категория</h2>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tab === "expense" ? "Например: Спорт" : "Например: Бонус"}
            className="field"
          />
          <button
            onClick={create}
            disabled={pending}
            className="btn-primary shrink-0"
          >
            Добавить
          </button>
        </div>
        {error && (
          <p className="mt-2 rounded-[22px] border border-[#F1C2B8] bg-[#FFE9E3] px-4 py-3 text-sm text-[#D96E61]">
            {error}
          </p>
        )}
      </section>

      {categories.length === 0 && (
        <div className="rounded-[28px] border border-[#D4BEFF] bg-[linear-gradient(145deg,#FFFFFF_0%,#F1E8FF_100%)] p-4 text-center text-sm text-[#7C7A88] shadow-card">
          <p className="mb-3">Категории помогают понять, куда уходят деньги.</p>
          <button onClick={makeDefaults} disabled={pending} className="btn-primary">
            Создать категории по умолчанию
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {list.map((c) => (
          <CategoryRow
            key={c.id}
            category={c}
            pending={pending}
            startTransition={startTransition}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  pending,
  startTransition,
}: {
  category: Category;
  pending: boolean;
  startTransition: (cb: () => void) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  function save() {
    startTransition(async () => {
      await renameCategory(category.id, name);
      setEditing(false);
    });
  }
  function toggleActive() {
    startTransition(async () => {
      await setCategoryActive(category.id, !category.is_active);
    });
  }

  return (
    <div className="flex items-center justify-between rounded-[24px] border border-[#EDE7DF] bg-white/92 px-4 py-3 shadow-card">
      {editing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field mr-2"
        />
      ) : (
        <span className={category.is_active ? "font-medium text-[#2F2F35]" : "text-[#7C7A88]"}>
          {category.name}
          {!category.is_active && " · скрыта"}
        </span>
      )}
      <div className="flex shrink-0 items-center gap-3">
        {editing ? (
          <button onClick={save} disabled={pending} className="text-sm font-semibold text-[#8B5CF6]">
            Сохранить
          </button>
        ) : (
          <button onClick={() => setEditing(true)} className="text-sm font-semibold text-[#8B5CF6]">
            Изменить
          </button>
        )}
        <button
          onClick={toggleActive}
          disabled={pending}
          className="text-sm text-[#7C7A88]"
        >
          {category.is_active ? "Скрыть" : "Вернуть"}
        </button>
      </div>
    </div>
  );
}
