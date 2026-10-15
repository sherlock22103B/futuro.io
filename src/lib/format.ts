const euroFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const euroFormatterCents = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 });

/** Formatta un importo in euro (default senza decimali). */
export function formatEuro(value: number | null | undefined, withCents = false): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return (withCents ? euroFormatterCents : euroFormatter).format(value);
}

/** Formatta una differenza con segno esplicito: +1.234 € / −1.234 €. */
export function formatEuroDelta(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0.5 ? "+" : value < -0.5 ? "−" : "";
  return `${sign}${euroFormatter.format(Math.abs(value))}`;
}

/** Formatta un valore compatto per gli assi dei grafici (es. 120 k€). */
export function formatEuroCompact(value: number): string {
  if (!Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${numberFormatter.format(Math.round(value / 100_000) / 10)} mln €`;
  if (abs >= 10_000) return `${numberFormatter.format(Math.round(value / 1_000))} k€`;
  if (abs >= 1_000) return `${numberFormatter.format(Math.round(value / 100) / 10)} k€`;
  return `${Math.round(value)} €`;
}

/** Formatta una percentuale espressa in punti (4 → "4%"). */
export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: decimals }).format(value)}%`;
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: decimals }).format(value);
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
