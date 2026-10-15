"use client";

import * as React from "react";
import { buildDemoInput, buildInitialDraft, MAX_SAVED_SCENARIOS } from "@/config/simulationDefaults";
import {
  validateDraft,
  type SimulationDraft,
  type SimulationInput,
  type SimulationSection,
  type ValidationIssue,
} from "@/lib/validation/schemas";
import type { SavedScenario } from "@/lib/scenarios/calculateScenarios";
import {
  clearAllData,
  loadDraft,
  loadPreferences,
  loadScenarios,
  saveDraft,
  savePreferences,
  saveScenarios,
} from "@/lib/storage/localStorage";
import { createId } from "@/lib/utils";

type Validation = { ok: true; data: SimulationInput } | { ok: false; issues: ValidationIssue[] };

interface SimulationContextValue {
  hydrated: boolean;
  draft: SimulationDraft;
  validation: Validation;
  /** Aggiorna una sezione della bozza (merge). */
  updateSection: <K extends SimulationSection>(section: K, values: Partial<SimulationInput[K]>) => void;
  replaceDraft: (draft: SimulationDraft | SimulationInput) => void;
  resetDraft: () => void;
  loadDemo: () => void;
  scenarios: SavedScenario[];
  activeScenarioId: string | null;
  setActiveScenarioId: (id: string | null) => void;
  saveScenario: (nome: string, input: SimulationInput) => SavedScenario | null;
  updateScenario: (id: string, patch: Partial<Pick<SavedScenario, "nome" | "input">>) => void;
  duplicateScenario: (id: string) => SavedScenario | null;
  deleteScenario: (id: string) => void;
  replaceScenarios: (scenarios: SavedScenario[]) => void;
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
  clearAll: () => void;
}

const SimulationContext = React.createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(false);
  const [draft, setDraft] = React.useState<SimulationDraft>(() => buildInitialDraft());
  const [scenarios, setScenarios] = React.useState<SavedScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = React.useState<string | null>(null);
  const [reduceMotion, setReduceMotionState] = React.useState(false);

  // Caricamento iniziale dal browser
  React.useEffect(() => {
    const stored = loadDraft();
    if (stored) {
      const initial = buildInitialDraft();
      setDraft({
        personal: { ...initial.personal, ...stored.personal },
        career: { ...initial.career, ...stored.career },
        contributions: { ...initial.contributions, ...stored.contributions },
        etf: { ...initial.etf, ...stored.etf },
        withdrawal: { ...initial.withdrawal, ...stored.withdrawal },
        meta: { ...initial.meta, ...stored.meta },
      });
    }
    setScenarios(loadScenarios());
    setReduceMotionState(loadPreferences().reduceMotion);
    setHydrated(true);
  }, []);

  // Salvataggio automatico nel browser
  React.useEffect(() => {
    if (hydrated) saveDraft(draft);
  }, [draft, hydrated]);

  React.useEffect(() => {
    if (hydrated) saveScenarios(scenarios);
  }, [scenarios, hydrated]);

  React.useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduceMotion ? "true" : "false";
  }, [reduceMotion]);

  const touch = (d: SimulationDraft): SimulationDraft => ({
    ...d,
    meta: { ...d.meta, aggiornatoIl: new Date().toISOString() },
  });

  const updateSection = React.useCallback(
    <K extends SimulationSection>(section: K, values: Partial<SimulationInput[K]>) => {
      setDraft((prev) => {
        const next: SimulationDraft = { ...prev, [section]: { ...prev[section], ...values } };
        return touch(next);
      });
    },
    [],
  );

  const replaceDraft = React.useCallback((d: SimulationDraft | SimulationInput) => {
    setDraft(touch(JSON.parse(JSON.stringify(d)) as SimulationDraft));
  }, []);

  const resetDraft = React.useCallback(() => {
    setDraft(buildInitialDraft());
    setActiveScenarioId(null);
  }, []);

  const loadDemo = React.useCallback(() => {
    setDraft(buildDemoInput() as SimulationDraft);
    setActiveScenarioId(null);
  }, []);

  const saveScenario = React.useCallback(
    (nome: string, input: SimulationInput): SavedScenario | null => {
      if (scenarios.length >= MAX_SAVED_SCENARIOS) return null;
      const now = new Date().toISOString();
      const s: SavedScenario = {
        id: createId(),
        nome: nome.trim().slice(0, 60) || "Scenario",
        creatoIl: now,
        aggiornatoIl: now,
        input: JSON.parse(JSON.stringify(input)) as SimulationInput,
      };
      setScenarios((prev) => [...prev, s].slice(0, MAX_SAVED_SCENARIOS));
      return s;
    },
    [scenarios.length],
  );

  const updateScenario = React.useCallback((id: string, patch: Partial<Pick<SavedScenario, "nome" | "input">>) => {
    setScenarios((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              ...patch,
              nome: patch.nome !== undefined ? patch.nome.trim().slice(0, 60) || s.nome : s.nome,
              aggiornatoIl: new Date().toISOString(),
            }
          : s,
      ),
    );
  }, []);

  const duplicateScenario = React.useCallback(
    (id: string): SavedScenario | null => {
      const original = scenarios.find((s) => s.id === id);
      if (!original || scenarios.length >= MAX_SAVED_SCENARIOS) return null;
      const now = new Date().toISOString();
      const copy: SavedScenario = {
        ...JSON.parse(JSON.stringify(original)),
        id: createId(),
        nome: `${original.nome} (copia)`.slice(0, 60),
        creatoIl: now,
        aggiornatoIl: now,
      };
      setScenarios((prev) => [...prev, copy].slice(0, MAX_SAVED_SCENARIOS));
      return copy;
    },
    [scenarios],
  );

  const deleteScenario = React.useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    setActiveScenarioId((cur) => (cur === id ? null : cur));
  }, []);

  const replaceScenarios = React.useCallback((list: SavedScenario[]) => {
    setScenarios(list.slice(0, MAX_SAVED_SCENARIOS));
  }, []);

  const setReduceMotion = React.useCallback((value: boolean) => {
    setReduceMotionState(value);
    savePreferences({ reduceMotion: value });
  }, []);

  const clearAll = React.useCallback(() => {
    clearAllData();
    setDraft(buildInitialDraft());
    setScenarios([]);
    setActiveScenarioId(null);
    setReduceMotionState(false);
  }, []);

  const validation = React.useMemo(() => validateDraft(draft), [draft]);

  const value: SimulationContextValue = {
    hydrated,
    draft,
    validation,
    updateSection,
    replaceDraft,
    resetDraft,
    loadDemo,
    scenarios,
    activeScenarioId,
    setActiveScenarioId,
    saveScenario,
    updateScenario,
    duplicateScenario,
    deleteScenario,
    replaceScenarios,
    reduceMotion,
    setReduceMotion,
    clearAll,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation(): SimulationContextValue {
  const ctx = React.useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation deve essere usato dentro <SimulationProvider>.");
  return ctx;
}

/** True se l'utente preferisce animazioni ridotte (impostazione dell'app o del sistema). */
export function usePrefersReducedMotion(): boolean {
  const { reduceMotion } = useSimulation();
  const [system, setSystem] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystem(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduceMotion || system;
}
