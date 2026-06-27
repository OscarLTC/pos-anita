import type { Sale, PaymentType } from "@/types";

/** Períodos que ofrece la pantalla de reportes. */
export type ReportPeriod = "today" | "week" | "month";

// Lima es UTC-5 fijo (sin horario de verano): se puede anclar con offset literal.
const LIMA = "-05:00";

const isoFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" });
const hourFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/Lima",
  hour: "2-digit",
  hour12: false,
});

/** YYYY-MM-DD de una fecha en hora Lima. */
export function limaISO(d: Date = new Date()): string {
  return isoFmt.format(d);
}

/** Hora (0–23) de una fecha en hora Lima. */
function limaHour(d: Date): number {
  return Number(hourFmt.format(d)) % 24;
}

function isoToUTC(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function utcToISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Suma (o resta) días a una fecha ISO, sin tocar la hora. */
function addDays(iso: string, days: number): string {
  const d = isoToUTC(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return utcToISO(d);
}

/** Día de la semana con lunes = 0 … domingo = 6. */
function weekdayMon0(iso: string): number {
  return (isoToUTC(iso).getUTCDay() + 6) % 7;
}

function startOfDay(iso: string): Date {
  return new Date(`${iso}T00:00:00.000${LIMA}`);
}

function endOfDay(iso: string): Date {
  return new Date(`${iso}T23:59:59.999${LIMA}`);
}

export interface DateRange {
  start: Date;
  end: Date;
  startISO: string;
  endISO: string;
}

/** Rango de fechas del período seleccionado (acotado hasta hoy). */
export function periodRange(period: ReportPeriod, now: Date = new Date()): DateRange {
  const today = limaISO(now);
  let startISO = today;
  if (period === "week") startISO = addDays(today, -weekdayMon0(today));
  else if (period === "month") startISO = `${today.slice(0, 8)}01`;
  return { start: startOfDay(startISO), end: endOfDay(today), startISO, endISO: today };
}

/** Período anterior equivalente, para la comparación porcentual. */
export function previousRange(period: ReportPeriod, now: Date = new Date()): DateRange {
  const today = limaISO(now);
  if (period === "today") {
    const y = addDays(today, -1);
    return { start: startOfDay(y), end: endOfDay(y), startISO: y, endISO: y };
  }
  if (period === "week") {
    const curStart = addDays(today, -weekdayMon0(today));
    const prevStart = addDays(curStart, -7);
    const prevEnd = addDays(curStart, -1);
    return { start: startOfDay(prevStart), end: endOfDay(prevEnd), startISO: prevStart, endISO: prevEnd };
  }
  const firstThis = `${today.slice(0, 8)}01`;
  const prevEnd = addDays(firstThis, -1);
  const startISO = `${prevEnd.slice(0, 8)}01`;
  return { start: startOfDay(startISO), end: endOfDay(prevEnd), startISO, endISO: prevEnd };
}

/**
 * Ventana de Firestore a descargar: desde el inicio del mes anterior hasta hoy.
 * Cubre los tres períodos y sus comparaciones con una sola consulta.
 */
export function reportWindow(now: Date = new Date()): { start: Date; end: Date } {
  return { start: previousRange("month", now).start, end: endOfDay(limaISO(now)) };
}

function inRange(s: Sale, r: DateRange): boolean {
  const t = s.created_at.getTime();
  return t >= r.start.getTime() && t <= r.end.getTime();
}

export interface PaymentBreakdown {
  type: PaymentType;
  amount: number;
  /** Proporción 0–1 del total del período. */
  pct: number;
}

export interface TopProduct {
  product_id: string;
  name: string;
  unit: string;
  quantity: number;
  amount: number;
}

export interface ChartBar {
  label: string;
  value: number;
}

export interface ReportSummary {
  total: number;
  count: number;
  avgTicket: number;
  /** Total fiado (ventas a crédito) del período. */
  credit: number;
  /** "18h" para hoy; "Vie 13" para semana/mes. null si no hubo ventas. */
  peakLabel: string | null;
  chart: ChartBar[];
  payments: PaymentBreakdown[];
  topProducts: TopProduct[];
  /** Ventas del período, de más reciente a más antigua. */
  sales: Sale[];
  /** Variación vs período anterior (0.12 = +12%). null si no hay base. */
  deltaPct: number | null;
}

const PAYMENT_ORDER: PaymentType[] = ["cash", "yape", "plin", "card", "credit"];
const WEEK_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function buildChart(
  sales: Sale[],
  period: ReportPeriod,
  range: DateRange,
): { chart: ChartBar[]; peakLabel: string | null } {
  if (period === "today") {
    const hours = new Map<number, number>();
    for (const s of sales) {
      const h = limaHour(s.created_at);
      hours.set(h, (hours.get(h) ?? 0) + s.total);
    }
    // Ventana base 8h–19h, ampliada si hubo ventas fuera de ese horario.
    let min = 8;
    let max = 19;
    if (hours.size) {
      const hs = [...hours.keys()];
      min = Math.min(min, ...hs);
      max = Math.max(max, ...hs);
    }
    const chart: ChartBar[] = [];
    for (let h = min; h <= max; h++) chart.push({ label: `${h}h`, value: hours.get(h) ?? 0 });

    let peakLabel: string | null = null;
    let best = 0;
    for (const [h, v] of hours) {
      if (v > best) {
        best = v;
        peakLabel = `${h}h`;
      }
    }
    return { chart, peakLabel };
  }

  // Totales por día calendario, base para semana/mes y para el día pico.
  const dayTotals = new Map<string, number>();
  for (const s of sales) {
    const k = limaISO(s.created_at);
    dayTotals.set(k, (dayTotals.get(k) ?? 0) + s.total);
  }

  let peakISO: string | null = null;
  let best = 0;
  for (const [k, v] of dayTotals) {
    if (v > best) {
      best = v;
      peakISO = k;
    }
  }
  const peakLabel = peakISO
    ? `${WEEK_LABELS[weekdayMon0(peakISO)]} ${Number(peakISO.slice(8, 10))}`
    : null;

  if (period === "week") {
    const chart: ChartBar[] = [];
    for (let i = 0; i < 7; i++) {
      const iso = addDays(range.startISO, i);
      chart.push({ label: WEEK_LABELS[i], value: dayTotals.get(iso) ?? 0 });
    }
    return { chart, peakLabel };
  }

  // Mes: agrupa los días en semanas del mes (S1…S5).
  const weeks = new Map<number, number>();
  for (const [k, v] of dayTotals) {
    const w = Math.ceil(Number(k.slice(8, 10)) / 7);
    weeks.set(w, (weeks.get(w) ?? 0) + v);
  }
  const weekCount = Math.ceil(Number(range.endISO.slice(8, 10)) / 7);
  const chart: ChartBar[] = [];
  for (let w = 1; w <= weekCount; w++) chart.push({ label: `S${w}`, value: weeks.get(w) ?? 0 });
  return { chart, peakLabel };
}

/** Calcula todas las métricas de la pantalla para el período elegido. */
export function buildSummary(
  allSales: Sale[],
  period: ReportPeriod,
  now: Date = new Date(),
): ReportSummary {
  const range = periodRange(period, now);
  const sales = allSales
    .filter((s) => s.status === "completed" && inRange(s, range))
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

  const total = sales.reduce((sum, s) => sum + s.total, 0);
  const count = sales.length;
  const avgTicket = count ? total / count : 0;
  const credit = sales
    .filter((s) => s.payment_type === "credit")
    .reduce((sum, s) => sum + s.total, 0);

  const byPay = new Map<PaymentType, number>();
  for (const s of sales) byPay.set(s.payment_type, (byPay.get(s.payment_type) ?? 0) + s.total);
  const payments: PaymentBreakdown[] = PAYMENT_ORDER.filter((t) => byPay.has(t))
    .map((t) => ({ type: t, amount: byPay.get(t)!, pct: total ? byPay.get(t)! / total : 0 }))
    .sort((a, b) => b.amount - a.amount);

  const prodMap = new Map<string, TopProduct>();
  for (const s of sales) {
    for (const it of s.items) {
      const cur =
        prodMap.get(it.product_id) ??
        ({
          product_id: it.product_id,
          name: it.product_name,
          unit: it.unit,
          quantity: 0,
          amount: 0,
        } as TopProduct);
      cur.quantity += it.quantity;
      cur.amount += it.subtotal;
      prodMap.set(it.product_id, cur);
    }
  }
  const topProducts = [...prodMap.values()].sort((a, b) => b.amount - a.amount);

  const { chart, peakLabel } = buildChart(sales, period, range);

  const prev = previousRange(period, now);
  const prevTotal = allSales
    .filter((s) => s.status === "completed" && inRange(s, prev))
    .reduce((sum, s) => sum + s.total, 0);
  const deltaPct = prevTotal > 0 ? (total - prevTotal) / prevTotal : null;

  return { total, count, avgTicket, credit, peakLabel, chart, payments, topProducts, sales, deltaPct };
}
