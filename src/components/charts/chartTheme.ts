/**
 * Colori dei segni grafici, validati sullo sfondo scuro delle card (#0f1b33):
 * banda di luminosità, croma minimo, separazione per daltonismo e contrasto ≥ 3:1.
 * Il testo nei grafici usa sempre i colori del testo, mai quello della serie.
 */
export const CHART_COLORS = {
  pensione: "#3b82f6",
  etf: "#16a34a",
  etfBand: "#4ade80",
  versamenti: "#94a3b8",
  desiderato: "#8b5cf6",
  invalidita: "#db2777",
  gap: "#ea580c",
  prudente: "#16a34a",
  favorevole: "#16a34a",
  grid: "#22314f",
  axis: "#64748b",
  surface: "#0f1b33",
  text: "#e2e8f0",
  muted: "#94a3b8",
} as const;

export const AXIS_TICK = { fill: "#cbd5e1", fontSize: 12 };
