import type { Store, TicketSettings, TicketSize } from "@/types";

/** Preferencias de ticket por defecto. */
export const DEFAULT_TICKETS: TicketSettings = {
  size: "80mm",
  print_client_copy: true,
  footer_message: "¡Gracias por su compra!",
};

export const TICKET_SIZES: TicketSize[] = ["58mm", "80mm", "A4"];

/** Ancho en caracteres (monoespaciado) según el tamaño de papel. */
const WIDTH: Record<TicketSize, number> = { "58mm": 32, "80mm": 42, A4: 48 };

interface SampleItem {
  left: string;
  right: string;
}

/** Venta de ejemplo para la vista previa. */
const SAMPLE = {
  date: "24/05/2026",
  time: "12:44",
  items: [
    { left: "2 × Sublime", right: "3.00" },
    { left: "4 × Galletas Soda", right: "4.80" },
    { left: "0.85 kg Tomate", right: "3.83" },
  ] as SampleItem[],
  total: "11.63",
  method: "Efectivo",
  paid: "15.00",
  change: "3.37",
};

/** "izquierda ........... derecha" ajustado al ancho. */
function row(left: string, right: string, w: number): string {
  const gap = Math.max(1, w - left.length - right.length);
  return left + " ".repeat(gap) + right;
}

/** Centra el texto con espacios a la izquierda. */
function center(text: string, w: number): string {
  const pad = Math.max(0, Math.floor((w - text.length) / 2));
  return " ".repeat(pad) + text;
}

/** Líneas de la vista previa del ticket a partir de los datos del negocio. */
export function buildReceiptPreview(
  store: Store | null | undefined,
  tickets: TicketSettings,
): string[] {
  const w = WIDTH[tickets.size];
  const div = "-".repeat(w);
  const lines: string[] = [];

  lines.push(center((store?.name || "Mi negocio").toUpperCase(), w));
  if (store?.ruc) lines.push(center(`RUC ${store.ruc}`, w));
  const addr = [store?.address, store?.district].filter(Boolean).join(" · ");
  if (addr) lines.push(center(addr, w));

  lines.push(div);
  lines.push(row(SAMPLE.date, SAMPLE.time, w));
  for (const it of SAMPLE.items) lines.push(row(it.left, it.right, w));
  lines.push(div);
  lines.push(row("TOTAL S/", SAMPLE.total, w));
  lines.push(row(SAMPLE.method, SAMPLE.paid, w));
  lines.push(row("Vuelto", SAMPLE.change, w));

  const footer = tickets.footer_message.trim();
  if (footer) {
    lines.push("");
    lines.push(center(footer, w));
  }
  return lines;
}
