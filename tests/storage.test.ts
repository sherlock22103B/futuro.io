import { describe, expect, it } from "vitest";
import {
  buildExportPayload,
  clearAllData,
  loadDraft,
  loadScenarios,
  parseImport,
  saveDraft,
  saveScenarios,
  serializeExport,
  type KeyValueStorage,
} from "@/lib/storage/localStorage";
import { buildDemoInput, buildInitialDraft } from "@/config/simulationDefaults";

class MemoryStorage implements KeyValueStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

const now = new Date("2026-10-14T10:00:00Z");

describe("10. salvataggio e importazione JSON", () => {
  it("salva e ricarica la bozza dal browser", () => {
    const s = new MemoryStorage();
    const draft = buildInitialDraft(now);
    expect(saveDraft(draft, s)).toBe(true);
    expect(loadDraft(s)).toEqual(JSON.parse(JSON.stringify(draft)));
  });

  it("salva al massimo tre scenari e scarta quelli non validi", () => {
    const s = new MemoryStorage();
    const input = buildDemoInput(now);
    const sc = (id: string) => ({ id, nome: id, creatoIl: "", aggiornatoIl: "", input });
    saveScenarios([sc("a"), sc("b"), sc("c"), sc("d")], s);
    expect(loadScenarios(s)).toHaveLength(3);
    s.setItem("futuro-io:scenari:v1", JSON.stringify([{ id: "x" }]));
    expect(loadScenarios(s)).toHaveLength(0);
  });

  it("esporta e reimporta la stessa simulazione", () => {
    const input = buildDemoInput(now);
    const text = serializeExport(buildExportPayload(input, [], now));
    const res = parseImport(text);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.simulazione).toEqual(input);
  });

  it("rifiuta file non validi con un messaggio comprensibile", () => {
    const bad = parseImport("non è json");
    expect(bad.ok).toBe(false);
    const wrong = parseImport(JSON.stringify({ formato: "altro" }));
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.errore).toMatch(/non è una simulazione/);
  });

  it("cancella tutti i dati", () => {
    const s = new MemoryStorage();
    saveDraft(buildInitialDraft(now), s);
    clearAllData(s);
    expect(loadDraft(s)).toBeNull();
  });
});
