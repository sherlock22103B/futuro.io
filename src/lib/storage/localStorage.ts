import { z } from "zod";
import { simulationSchema, type SimulationDraft, type SimulationInput } from "@/lib/validation/schemas";
import type { SavedScenario } from "@/lib/scenarios/calculateScenarios";
import { MAX_SAVED_SCENARIOS } from "@/config/simulationDefaults";

/**
 * Persistenza SOLO nel browser dell'utente. Nessun dato viene inviato a server.
 */
export const STORAGE_KEYS = {
  draft: "futuro-io:simulazione:v1",
  scenarios: "futuro-io:scenari:v1",
  preferences: "futuro-io:preferenze:v1",
} as const;

export interface Preferences {
  reduceMotion: boolean;
}

/** Interfaccia minima di uno storage (permette di testare con un'implementazione in memoria). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getStorage(storage?: KeyValueStorage): KeyValueStorage | null {
  if (storage) return storage;
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    return null;
  }
  return null;
}

function readJSON(key: string, storage?: KeyValueStorage): unknown {
  const s = getStorage(storage);
  if (!s) return null;
  try {
    const raw = s.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown, storage?: KeyValueStorage): boolean {
  const s = getStorage(storage);
  if (!s) return false;
  try {
    s.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadDraft(storage?: KeyValueStorage): SimulationDraft | null {
  const value = readJSON(STORAGE_KEYS.draft, storage);
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<SimulationDraft>;
  if (!v.personal || !v.career || !v.contributions || !v.etf || !v.withdrawal || !v.meta) return null;
  return v as SimulationDraft;
}

export function saveDraft(draft: SimulationDraft, storage?: KeyValueStorage): boolean {
  return writeJSON(STORAGE_KEYS.draft, draft, storage);
}

const savedScenarioSchema = z.object({
  id: z.string(),
  nome: z.string().min(1).max(60),
  creatoIl: z.string(),
  aggiornatoIl: z.string(),
  input: simulationSchema,
});

export function loadScenarios(storage?: KeyValueStorage): SavedScenario[] {
  const value = readJSON(STORAGE_KEYS.scenarios, storage);
  if (!Array.isArray(value)) return [];
  const out: SavedScenario[] = [];
  for (const item of value) {
    const res = savedScenarioSchema.safeParse(item);
    if (res.success) out.push(res.data);
  }
  return out.slice(0, MAX_SAVED_SCENARIOS);
}

export function saveScenarios(scenarios: SavedScenario[], storage?: KeyValueStorage): boolean {
  return writeJSON(STORAGE_KEYS.scenarios, scenarios.slice(0, MAX_SAVED_SCENARIOS), storage);
}

export function loadPreferences(storage?: KeyValueStorage): Preferences {
  const value = readJSON(STORAGE_KEYS.preferences, storage) as Partial<Preferences> | null;
  return { reduceMotion: Boolean(value?.reduceMotion) };
}

export function savePreferences(prefs: Preferences, storage?: KeyValueStorage): boolean {
  return writeJSON(STORAGE_KEYS.preferences, prefs, storage);
}

/** Cancella tutti i dati di FUTURO.IO dal dispositivo. */
export function clearAllData(storage?: KeyValueStorage): void {
  const s = getStorage(storage);
  if (!s) return;
  for (const key of Object.values(STORAGE_KEYS)) {
    try {
      s.removeItem(key);
    } catch {
      /* storage non disponibile: nulla da cancellare */
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Esportazione e importazione JSON                                            */
/* -------------------------------------------------------------------------- */

export const EXPORT_FORMAT = "futuro-io-simulazione";
export const EXPORT_VERSION = 1;

export interface ExportPayload {
  formato: typeof EXPORT_FORMAT;
  versione: typeof EXPORT_VERSION;
  esportatoIl: string;
  simulazione: SimulationInput;
  scenari: SavedScenario[];
}

export function buildExportPayload(
  simulazione: SimulationInput,
  scenari: SavedScenario[],
  now: Date = new Date(),
): ExportPayload {
  return {
    formato: EXPORT_FORMAT,
    versione: EXPORT_VERSION,
    esportatoIl: now.toISOString(),
    simulazione,
    scenari: scenari.slice(0, MAX_SAVED_SCENARIOS),
  };
}

export function serializeExport(payload: ExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

const exportSchema = z.object({
  formato: z.literal(EXPORT_FORMAT),
  versione: z.literal(EXPORT_VERSION),
  esportatoIl: z.string(),
  simulazione: simulationSchema,
  scenari: z.array(savedScenarioSchema).max(MAX_SAVED_SCENARIOS).default([]),
});

export type ImportResult = { ok: true; data: ExportPayload } | { ok: false; errore: string };

/** Legge e valida un file JSON esportato da FUTURO.IO. */
export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errore: "Il file non è un JSON valido." };
  }
  const res = exportSchema.safeParse(raw);
  if (!res.success) {
    const first = res.error.issues[0];
    const where = first?.path.length ? ` (campo: ${first.path.join(".")})` : "";
    return {
      ok: false,
      errore: `Il file non è una simulazione FUTURO.IO valida${where}: ${first?.message ?? "formato non riconosciuto"}.`,
    };
  }
  return { ok: true, data: res.data as ExportPayload };
}
