import type { PaymentType } from "@/types";

export type PaymentMethodKind = "instant" | "credit";

export interface PaymentMethod {
  /** Para métodos "instant" es el PaymentType de la venta; "fiar" es crédito. */
  id: PaymentType | "fiar";
  label: string;
  subtitle: string;
  /** Texto corto del badge de color (ej. "S/", "Y", "P", "∞"). */
  badge: string;
  /** Color de fondo del badge. */
  color: string;
  /** El texto del badge va oscuro (para badges claros como el amarillo). */
  badgeDark?: boolean;
  kind: PaymentMethodKind;
}

/**
 * Métodos de pago disponibles en el cobro.
 *
 * NOTA: a futuro esto vendrá de la configuración de la cuenta/tienda. Por eso vive
 * aislado aquí: la UI del cobro se construye a partir de esta lista, así que cuando
 * se vuelva configurable solo cambia el origen de los datos, no las pantallas.
 */
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "cash",
    label: "Efectivo",
    subtitle: "Caja chica",
    badge: "S/",
    color: "#0E5E3E",
    kind: "instant",
  },
  {
    id: "yape",
    label: "Yape",
    subtitle: "BCP móvil",
    badge: "Y",
    color: "#742384",
    kind: "instant",
  },
  {
    id: "plin",
    label: "Plin",
    subtitle: "Multibank",
    badge: "P",
    color: "#0FA9C0",
    kind: "instant",
  },
  {
    id: "fiar",
    label: "Fiar",
    subtitle: "A cuenta del cliente",
    badge: "∞",
    color: "#F2C744",
    badgeDark: true,
    kind: "credit",
  },
];
