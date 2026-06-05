import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { loadReminderSettings } from "@/lib/reminders-data";
import PageHeader from "@/components/PageHeader";
import RemindersSettingsClient from "@/components/reminders/RemindersSettingsClient";
import PushManager from "@/components/reminders/PushManager";

export default async function RemindersSettingsPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");
  if (!ctx.profile?.onboarding_completed) redirect("/onboarding");

  const settings = await loadReminderSettings();
  const remindersEnabled = ctx.enabledModules.has("reminders");

  return (
    <>
      <div className="px-5 pt-safe">
        <Link href="/settings" className="mt-4 inline-block text-sm text-accent">
          ← Настройки
        </Link>
      </div>
      <PageHeader
        title="Подсказки «Сегодня важно»"
        subtitle="Подсказки на главной — что заполнить и отметить. Без навязчивых уведомлений."
      />
      <div className="flex flex-col gap-4 px-5">
        {!remindersEnabled && (
          <div className="card">
            <p className="text-sm text-muted">
              Модуль «Подсказки» сейчас выключен — блок «Сегодня важно» на
              главной не показывается. Настройки ниже сохранятся и заработают,
              когда включишь модуль в настройках.
            </p>
            <Link
              href="/settings"
              className="mt-3 inline-block text-sm text-accent"
            >
              Включить модуль
            </Link>
          </div>
        )}

        <RemindersSettingsClient initial={settings} />

        <section className="card">
          <h2 className="font-medium">Push-уведомления — позже</h2>
          <p className="mb-3 mt-0.5 text-sm text-muted">
            Пока не настроены. Сейчас подсказки видны только на главной, когда
            открываешь приложение. Доставка уведомлений при закрытом приложении
            подключится отдельно.
          </p>
          <PushManager />
        </section>
      </div>
    </>
  );
}
