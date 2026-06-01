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
            className={`flex-1 rounded-2xl py-2 text-center text-sm transition ${
              tab === t ? "bg-accent text-white" : "bg-card text-muted"
            }`}
          >
            {t === "expense" ? "Расходы" : "Доходы"}
          </button>
        ))}
      </div>

      <section className="card">
        <h2 className="mb-3 font-medium">Новая категория</h2>
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
          <p className="mt-2 rounded-2xl bg-peach/15 px-4 py-3 text-sm">
            {error}
          </p>
        )}
      </section>

      {categories.length === 0 && (
        <div className="card text-center text-sm text-muted">
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
    <div className="card flex items-center justify-between py-3">
      {editing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field mr-2"
        />
      ) : (
        <span className={category.is_active ? "" : "text-muted"}>
          {category.name}
          {!category.is_active && " · скрыта"}
        </span>
      )}
      <div className="flex shrink-0 items-center gap-3">
        {editing ? (
          <button onClick={save} disabled={pending} className="text-sm text-accent">
            Сохранить
          </button>
        ) : (
          <button onClick={() => setEditing(true)} className="text-sm text-accent">
            Изменить
          </button>
        )}
        <button
          onClick={toggleActive}
          disabled={pending}
          className="text-sm text-muted"
        >
          {category.is_active ? "Скрыть" : "Вернуть"}
        </button>
      </div>
    </div>
  );
}
