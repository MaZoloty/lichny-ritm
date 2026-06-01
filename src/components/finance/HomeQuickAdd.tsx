"use client";

import { useState } from "react";
import TransactionModal from "./TransactionModal";
import type { Account, Category } from "@/types/db";

export default function HomeQuickAdd({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const todayISO = new Intl.DateTimeFormat("en-CA").format(new Date());

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost w-full">
        + Операция
      </button>
      {open && (
        <TransactionModal
          open={open}
          onClose={() => setOpen(false)}
          accounts={accounts}
          categories={categories}
          editing={null}
          defaultDateISO={todayISO}
        />
      )}
    </>
  );
}
