import type { Client, Payment, Sale } from "@/types";
import { soles } from "@/lib/format";

/** Umbral (días) a partir del cual una deuda se considera "vieja" / vencida. */
export const OVERDUE_DAYS = 5;

/** Nº de apuntes a partir del cual un cliente se marca como "Frecuente". */
export const FREQUENT_APUNTES = 3;

const MS_DAY = 86_400_000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Días calendario transcurridos desde `date` hasta `now` (0 = hoy). */
export function daysAgo(date: Date, now = new Date()): number {
  return Math.max(0, Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / MS_DAY));
}

/** Badge corto de antigüedad: "Hoy", "1d", "4d"… */
export function daysBadge(date: Date, now = new Date()): string {
  const d = daysAgo(date, now);
  return d <= 0 ? "Hoy" : `${d}d`;
}

/** "hace 1 día", "hace 9 días", "hoy". */
export function daysAgoLabel(date: Date, now = new Date()): string {
  const d = daysAgo(date, now);
  if (d <= 0) return "hoy";
  return `hace ${d} ${d === 1 ? "día" : "días"}`;
}

/** Fecha corta "MM-DD". */
export function shortDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

/** Título de un apunte a partir de los ítems de la venta (o su nota si es manual). */
export function apunteTitle(sale: Sale): string {
  if (!sale.items || sale.items.length === 0) return sale.note?.trim() || "Fiado";
  return sale.items
    .map((it) => {
      const prefix = it.unit === "unit" && it.quantity > 1 ? `${it.quantity} ` : "";
      return `${prefix}${it.product_name}`;
    })
    .join(", ");
}

export interface Apunte {
  sale: Sale;
  /** Monto del apunte cubierto por abonos (0 si no se ha abonado nada). */
  abonado: number;
}

/**
 * Historial de un cliente: sus ventas a crédito, repartiendo el total abonado
 * empezando por el apunte más reciente (coincide con el diseño).
 */
export function buildHistorial(sales: Sale[], payments: Payment[]): Apunte[] {
  const sorted = [...sales].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  let pool = payments.reduce((sum, p) => sum + p.amount, 0);
  return sorted.map((sale) => {
    const abonado = Math.min(sale.total, Math.max(0, pool));
    pool -= abonado;
    return { sale, abonado: parseFloat(abonado.toFixed(2)) };
  });
}

export interface ClientSummary {
  client: Client;
  apuntesCount: number;
  /** Fecha del apunte más reciente (null si no tiene apuntes). */
  lastDate: Date | null;
  /** Deuda vieja: último apunte con más de OVERDUE_DAYS días. */
  overdue: boolean;
  frequent: boolean;
}

/** Resumen por cliente para el listado, derivado de sus ventas a crédito. */
export function summarize(
  client: Client,
  creditSales: Sale[],
  now = new Date(),
): ClientSummary {
  const sales = creditSales.filter((s) => s.client_id === client.id);
  const lastDate = sales.reduce<Date | null>(
    (acc, s) => (!acc || s.created_at > acc ? s.created_at : acc),
    null,
  );
  const overdue =
    client.debt > 0 && lastDate != null && daysAgo(lastDate, now) > OVERDUE_DAYS;
  return {
    client,
    apuntesCount: sales.length,
    lastDate,
    overdue,
    frequent: sales.length >= FREQUENT_APUNTES,
  };
}

// --- Mensajes de recordatorio por WhatsApp ---

export type ReminderTone = "amable" | "directa" | "formal";

export const REMINDER_TONES: { id: ReminderTone; label: string }[] = [
  { id: "amable", label: "Amable" },
  { id: "directa", label: "Directa" },
  { id: "formal", label: "Formal" },
];

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Mensaje de WhatsApp con el detalle de una venta fiada (recibo digital). */
export function saleReceiptMessage(sale: Sale, storeName?: string): string {
  const who = firstName(sale.client_name ?? "");
  const store = storeName?.trim() || "la bodega";
  const lines = sale.items.map((it) => `• ${it.product_name} — ${soles(it.subtotal)}`);
  const body = lines.length ? `\n${lines.join("\n")}` : "";
  return (
    `Hola${who ? ` ${who}` : ""} 👋 Le comparto el detalle de su fiado en ${store}:` +
    `${body}\n\nTotal: ${soles(sale.total)}. ¡Gracias por su compra!`
  );
}

/** Construye el mensaje de recordatorio según el tono elegido. */
export function reminderMessage(
  tone: ReminderTone,
  clientName: string,
  debt: number,
  storeName?: string,
): string {
  const who = firstName(clientName);
  const store = storeName?.trim() || "la bodega";
  const amount = soles(debt);
  switch (tone) {
    case "directa":
      return `Hola ${who}, le recuerdo su deuda pendiente de ${amount} en ${store}. ¿Cuándo podría pasar a cancelar? Gracias.`;
    case "formal":
      return `Estimado(a) ${clientName}, le escribimos de ${store} para recordarle que mantiene un saldo pendiente de ${amount}. Agradeceremos su pronta regularización. Saludos cordiales.`;
    case "amable":
    default:
      return `Buenas, ${who} 👋 Le saludo de ${store}. Le recuerdo que tiene un pendiente de ${amount}. Cuando pueda, se lo agradezco mucho. ¡Saludos!`;
  }
}

/** URL de WhatsApp (wa.me) con el mensaje ya codificado. */
export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
