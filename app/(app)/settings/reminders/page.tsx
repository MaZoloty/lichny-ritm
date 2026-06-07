import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { loadReminderSettings } from "@/lib/reminders-data";
import RemindersSettingsClient from "@/components/reminders/RemindersSettingsClient";
import PushManager from "@/components/reminders/PushManager";

export default async function RemindersSettingsPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");
  if (!ctx.profile?.onboarding_completed) redirect("/onboarding");

  const settings = await loadReminderSettings();
  const remindersEnabled = ctx.enabledModules.has("reminders");

  return (
    <main className="px-5 pb-56 pt-safe">
      <div className="pt-4">
        <Link href="/settings" className="inline-block text-sm font-semibold text-[#8B5CF6]">
          ← Настройки
        </Link>
      </div>
      <header className="relative -mx-5 overflow-hidden px-5 pb-5 pt-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(116,201,132,0.3),transparent_30%),radial-gradient(circle_at_18%_80%,rgba(155,99,244,0.24),transparent_34%),linear-gradient(180deg,rgba(255,253,251,0.92),rgba(250,247,242,0))]" />
        <div className="relative z-10">
          <h1 className="text-[30px] font-semibold leading-[1.08] text-[#2F2F35]">
            Сегодня важно
          </h1>
          <p className="mt-3 max-w-[18rem] text-[15px] leading-6 text-[#6F6D79]">
            Подсказки на главной — что заполнить и отметить. Без навязчивости.
          </p>
        </div>
      </header>
      <div className="flex flex-col gap-4">
        {!remindersEnabled && (
          <div className="rounded-[28px] border border-[#D4BEFF] bg-[linear-gradient(145deg,#FFFFFF_0%,#F1E8FF_100%)] p-4 shadow-card">
            <p className="text-sm leading-6 text-[#7C7A88]">
              Модуль «Подсказки» сейчас выключен — блок «Сегодня важно» на
              главной не показывается. Настройки ниже сохранятся и заработают,
              когда включишь модуль в настройках.
            </p>
            <Link
              href="/settings"
              className="mt-3 inline-block text-sm font-semibold text-[#8B5CF6]"
            >
              Включить модуль
            </Link>
          </div>
        )}

        <RemindersSettingsClient initial={settings} />

        <section className="rounded-[28px] border border-[#EDE7DF] bg-white/92 p-4 shadow-card">
          <h2 className="font-semibold text-[#2F2F35]">Push-уведомления — позже</h2>
          <p className="mb-3 mt-1 text-sm leading-5 text-[#7C7A88]">
            Пока не настроены. Сейчас подсказки видны только на главной, когда
            открываешь приложение. Доставка уведомлений при закрытом приложении
            подключится отдельно.
          </p>
          <PushManager />
        </section>
      </div>
    </main>
  );
}
