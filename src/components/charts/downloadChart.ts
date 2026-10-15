/**
 * Esporta come PNG il primo grafico SVG presente nel contenitore.
 * Tutto avviene nel browser: nessun dato lascia il dispositivo.
 */
export async function downloadChartAsPng(container: HTMLElement | null, fileName: string, title?: string): Promise<boolean> {
  if (!container) return false;
  const svg = container.querySelector<SVGSVGElement>("svg.recharts-surface");
  if (!svg) return false;

  const { width, height } = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  // Testo leggibile anche fuori dalla pagina
  clone.querySelectorAll("text").forEach((t) => {
    if (!t.getAttribute("fill")) t.setAttribute("fill", "#cbd5e1");
    t.setAttribute("font-family", "Segoe UI, Roboto, Arial, sans-serif");
  });

  const xml = new XMLSerializer().serializeToString(clone);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  const scale = 2;
  const header = title ? 40 : 0;
  const footer = 28;

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Impossibile creare l'immagine"));
    img.src = url;
  }).catch(() => undefined);
  if (!img.complete || img.naturalWidth === 0) return false;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil((height + header + footer) * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#0f1b33";
  ctx.fillRect(0, 0, width, height + header + footer);
  if (title) {
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "600 16px Segoe UI, Roboto, Arial, sans-serif";
    ctx.fillText(title, 12, 26);
  }
  ctx.drawImage(img, 0, header, width, height);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px Segoe UI, Roboto, Arial, sans-serif";
  ctx.fillText("FUTURO.IO · Stima educativa, non è una previsione né una consulenza.", 12, header + height + 18);

  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}
