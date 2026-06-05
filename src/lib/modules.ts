// Каталог модулей приложения. Один источник правды для онбординга,
// настроек и навигации.

export type ModuleKey =
  | "habits"
  | "finance"
  | "goals"
  | "debts"
  | "savings"
  | "reminders";

export interface ModuleInfo {
  key: ModuleKey;
  title: string;
  description: string;
  /** Показывать ли модуль как пункт нижнего меню. */
  inNav: boolean;
  /** Путь в навигации (если inNav). */
  href?: string;
}

export const MODULES: ModuleInfo[] = [
  {
    key: "habits",
    title: "Привычки",
    description: "Недельные цели, отметки по дням, стрики и мягкий прогресс.",
    inNav: true,
    href: "/habits",
  },
  {
    key: "finance",
    title: "Доходы и расходы",
    description: "Быстрый ввод операций и понятная аналитика по категориям.",
    inNav: true,
    href: "/finance",
  },
  {
    key: "goals",
    title: "Накопления на цели",
    description:
      "Отпуск, подушка, обучение, покупки — всё, на что хочется копить.",
    inNav: true,
    href: "/goals",
  },
  {
    key: "debts",
    title: "Долги / кредиты",
    description: "Остатки, платежи, проценты и прогресс погашения.",
    inNav: true,
    href: "/debts",
  },
  {
    key: "savings",
    title: "Сбережения / подушка",
    description: "Отдельный учёт накопленной суммы и финансовой устойчивости.",
    inNav: true,
    href: "/savings",
  },
  {
    key: "reminders",
    title: "Подсказки на главной",
    description:
      "Блок «Сегодня важно» на главной: что заполнить и отметить. Push-уведомления — позже.",
    inNav: false,
    href: "/settings/reminders",
  },
];

export const MODULE_MAP: Record<ModuleKey, ModuleInfo> = MODULES.reduce(
  (acc, m) => {
    acc[m.key] = m;
    return acc;
  },
  {} as Record<ModuleKey, ModuleInfo>,
);

// Короткие подписи и порядок для нижнего меню.
export const NAV_MODULE_ORDER: ModuleKey[] = [
  "habits",
  "finance",
  "goals",
  "debts",
  "savings",
];

export const NAV_SHORT_LABEL: Partial<Record<ModuleKey, string>> = {
  habits: "Привычки",
  finance: "Финансы",
  goals: "Цели",
  debts: "Долги",
  savings: "Сбережения",
};

// Стартовые привычки, предлагаемые в онбординге.
export const STARTER_HABITS = [
  "Тренировка",
  "Зарядка",
  "Массаж лица",
  "День без сладкого",
];
