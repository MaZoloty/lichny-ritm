import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { MODULES, type ModuleKey } from "@/lib/modules";
import PageHeader from "@/components/PageHeader";
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
    <>
      <PageHeader title="Настройки" />
      <div className="flex flex-col gap-4 px-5">
        <Section title="Профиль">
          <ProfileNameForm initial={ctx.profile?.display_name ?? ""} />
          <div className="mt-4 rounded-2xl bg-bg px-4 py-3">
            <div className="text-xs text-muted">Email</div>
            <div className="mt-1 break-all text-sm">{ctx.email ?? "Не указан"}</div>
          </div>
          <p className="mt-3 text-sm text-muted">
            После выхода можно войти под другим пользователем.
          </p>
          <form action="/auth/signout" method="post" className="mt-3">
            <button type="submit" className="btn-ghost w-full text-peach">
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
            <p className="text-sm text-muted">
              Категории появятся после включения финансов.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className={`rounded-full px-3 py-1 text-sm ${
                    c.type === "income"
                      ? "bg-green/25 text-ink"
                      : "bg-peach/20 text-ink"
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
            <p className="text-sm text-muted">Счетов пока нет.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {accounts.map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between rounded-2xl bg-bg px-4 py-3"
                >
                  <span>{a.name}</span>
                  <span className="text-muted">{a.currency}</span>
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
          title="Уведомления"
          hint="Появятся на следующем этапе."
        >
          <p className="text-sm text-muted">
            Мягкие вечерние напоминания скоро.
          </p>
        </Section>

        <Section
          title="Внешний вид"
          hint="Появится на следующем этапе."
        >
          <p className="text-sm text-muted">Светлая тема.</p>
        </Section>
      </div>
    </>
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
    <section className="card">
      <h2 className="font-medium">{title}</h2>
      {hint && <p className="mb-3 mt-0.5 text-sm text-muted">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </section>
  );
}
