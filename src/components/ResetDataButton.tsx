"use client";

import { useState } from "react";
import { resetApplicationData } from "../../app/(app)/settings/actions";

const CONFIRMATION = "СБРОСИТЬ";

export default function ResetDataButton() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const confirmed = confirmation.trim() === CONFIRMATION;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setConfirmation("");
          setOpen(true);
        }}
        className="btn-ghost w-full text-peach"
      >
        Сбросить данные приложения
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 px-4 pb-4 pt-safe sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-line bg-card p-5 shadow-soft">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Сбросить данные?</h2>
              <p className="mt-2 text-sm text-muted">
                Это удалит привычки, финансы, цели, счета, категории и
                настройки модулей. Аккаунт останется, но приложение начнётся
                заново.
              </p>
            </div>

            <form action={resetApplicationData} className="flex flex-col gap-3">
              <label className="text-sm text-muted">
                Для подтверждения введи СБРОСИТЬ
              </label>
              <input
                name="confirmation"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="field"
                autoComplete="off"
              />
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-ghost"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!confirmed}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Сбросить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
