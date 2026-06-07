import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { MODULES, type ModuleKey } from "@/lib/modules";
import ModuleToggles from "@/components/ModuleToggles";
import ProfileNameForm from "@/components/ProfileNameForm";
import ResetDataButton from "@/components/ResetDataButton";
import type { Account } from "@/types/db";

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
}

export default async function SettingsPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const [{ data: cats }, { data: accs }] = await Promise.all([
    supabase.from("categories").select("id, name, type").eq("is_active", true),
    supabase.from("accounts").select("*").eq("is_active", true),
  ]);
  const categories = (cats ?? []) as Category[];
  const accounts = (accs ?? []) as Account[];

  const initialModules = MODULES.reduce(
    (acc, m) => {
      acc[m.key] = ctx.enabledModules.has(m.key);
      return acc;
    },
    {} as Record<ModuleKey, boolean>,
  );

  return (
    <main className="px-5 pb-56 pt-safe">
      <header className="relative -mx-5 overflow-hidden px-5 pb-5 pt-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(155,99,244,0.34),transparent_30%),radial-gradient(circle_at_18%_80%,rgba(116,201,132,0.22),transparent_34%),linear-gradient(180deg,rgba(255,253,251,0.92),rgba(250,247,242,0))]" />
        <div className="relative z-10">
          <p className="text-sm font-medium text-[#7C7A88]">Приложение под тебя</p>
          <h1 className="mt-1 text-[34px] font-semibold leading-[1.04] text-[#2F2F35]">
            Настройки
          </h1>
          <p className="mt-3 max-w-[18rem] text-[15px] leading-6 text-[#6F6D79]">
            Профиль, модули и данные — в одном спокойном месте.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        <Section title="Профиль">
          <ProfileNameForm initial={ctx.profile?.display_name ?? ""} />
          <div className="mt-4 rounded-[20px] bg-white/70 px-4 py-3 shadow-[0_10px_25px_-20px_rgba(47,47,53,0.55)]">
            <div className="text-xs text-[#7C7A88]">Email</div>
            <div className="mt-1 break-all text-sm font-medium text-[#2F2F35]">{ctx.email ?? "Не указан"}</div>
          </div>
          <p className="mt-3 text-sm leading-5 text-[#7C7A88]">
            После выхода можно войти под другим пользователем.
          </p>
          <form action="/auth/signout" method="post" className="mt-3">
            <button type="submit" className="btn-ghost w-full text-[#D96E61]">
              Выйти из аккаунта
            </button>
          </form>
        </Section>

        <Section
          title="Модули"
          hint="Выключенный модуль просто скрывается, данные сохраняются."
        >
          <ModuleToggles initial={initialModules} />
        </Section>

        <Section title="Категории" hint="Доходы и расходы.">
          {categories.length === 0 ? (
            <p className="text-sm text-[#7C7A88]">
              Категории появятся после включения финансов.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    c.type === "income"
                      ? "bg-[#D2F4D8] text-[#2F9E52]"
                      : "bg-[#FFE0DA] text-[#D96E61]"
                  }`}
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/settings/categories"
            className="mt-3 inline-block text-sm text-accent"
          >
            Управлять категориями
          </Link>
        </Section>

        <Section title="Счета">
          {accounts.length === 0 ? (
            <p className="text-sm text-[#7C7A88]">Счетов пока нет.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {accounts.map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between rounded-[20px] bg-white/70 px-4 py-3 shadow-[0_10px_25px_-20px_rgba(47,47,53,0.55)]"
                >
                  <span className="font-medium text-[#2F2F35]">{a.name}</span>
                  <span className="text-[#7C7A88]">{a.currency}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/settings/accounts"
            className="mt-3 inline-block text-sm text-accent"
          >
            Управлять счетами
          </Link>
        </Section>

        <Section
          title="Управление данными"
          hint="Для тестирования можно очистить данные приложения и пройти онбординг заново."
        >
          <ResetDataButton />
        </Section>

        <Section
          title="Подсказки «Сегодня важно»"
          hint="Подсказки на главной — что заполнить и отметить. Push-уведомления пока не настроены."
        >
          <Link href="/settings/reminders" className="btn-ghost w-full text-center">
            Настроить
          </Link>
        </Section>

        <Section
          title="Внешний вид"
          hint="Появится на следующем этапе."
        >
          <p className="text-sm text-[#7C7A88]">Светлая тема.</p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#EDE7DF] bg-white/92 p-4 shadow-card">
      <h2 className="font-semibold text-[#2F2F35]">{title}</h2>
      {hint && <p className="mb-3 mt-1 text-sm leading-5 text-[#7C7A88]">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </section>
  );
}
