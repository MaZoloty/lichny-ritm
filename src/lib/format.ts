export function money(amount: number, currency = "RUB"): string {
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount)} ₽`;
  }
}

// Со знаком: +12 000 ₽ / −3 500 ₽ / 0 ₽
export function signedMoney(amount: number, currency = "RUB"): string {
  if (amount === 0) return money(0, currency);
  const sign = amount > 0 ? "+" : "−";
  return `${sign}${money(Math.abs(amount), currency)}`;
}

export function percent(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}
