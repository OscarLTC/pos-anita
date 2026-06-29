/** Configuración de planes de suscripción (estática; el cobro vendrá del backend). */

/** Límites del plan Gratis. */
export const FREE_LIMITS = {
  products: 50,
  users: 3,
  sales_month: 500,
  fiado_clients: 10,
} as const;

export interface ProPlan {
  name: string;
  price: number;
  tagline: string;
  features: string[];
  trialDays: number;
}

export const PRO_PLAN: ProPlan = {
  name: "Caserita Pro",
  price: 29,
  tagline: "Para bodegas que quieren crecer",
  features: [
    "Productos, usuarios y clientes ilimitados",
    "Recordatorios de fiado automáticos",
    "Reportes avanzados y exportar",
    "Multi-sucursal",
    "Soporte por WhatsApp",
  ],
  trialDays: 30,
};

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "set",
  "oct",
  "nov",
  "dic",
];

/** "feb 2026" a partir de una fecha. */
export function monthYearLabel(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
