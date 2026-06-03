export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: {
  title: string;
  subtitle?: string;
  /** Маленькая вторичная подпись над заголовком. */
  eyebrow?: string;
  /** Действие справа от заголовка (кнопка/ссылка). */
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 mt-4 px-5 pt-safe">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h1 className="h1">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm leading-6 text-muted">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0 pt-0.5">{action}</div>}
      </div>
    </header>
  );
}
