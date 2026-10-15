/** Sottopercorso del sito pubblicato (es. "/futuro-io" su GitHub Pages); vuoto in locale. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Aggiunge il sottopercorso a un percorso assoluto di un file statico (es. "/icon.svg"). */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
