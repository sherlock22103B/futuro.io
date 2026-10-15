/**
 * Converte un valore nominale futuro in euro di oggi (valore reale).
 *
 *   valore reale = valore nominale ÷ (1 + inflazione) ^ anni
 *
 * @param nominalValue valore espresso in euro dell'anno futuro
 * @param inflation    inflazione annua in forma decimale (0.02 = 2%)
 * @param years        anni che separano oggi dalla data del valore
 */
export function calculateRealValue(nominalValue: number, inflation: number, years: number): number {
  if (!Number.isFinite(nominalValue)) return 0;
  if (years <= 0) return nominalValue;
  const factor = Math.pow(1 + inflation, years);
  if (!Number.isFinite(factor) || factor <= 0) return nominalValue;
  return nominalValue / factor;
}

/** Operazione inversa: porta un valore in euro di oggi agli euro di un anno futuro. */
export function calculateNominalValue(realValue: number, inflation: number, years: number): number {
  if (!Number.isFinite(realValue)) return 0;
  if (years <= 0) return realValue;
  return realValue * Math.pow(1 + inflation, years);
}

/** Fattore di sconto per l'inflazione (1 / (1+i)^anni). */
export function deflator(inflation: number, years: number): number {
  return 1 / Math.pow(1 + inflation, Math.max(0, years));
}
