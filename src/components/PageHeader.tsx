export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6 mt-4 px-5 pt-safe">
      <h1 className="text-[1.7rem] font-bold leading-tight tracking-normal text-ink">
        {title}
      </h1>
      {subtitle && <p className="mt-1.5 text-sm leading-6 text-muted">{subtitle}</p>}
    </header>
  );
}
