import type { MemberRole } from "@/types";

/** Lo que cada rol puede hacer dentro de la tienda. */
export interface Capabilities {
  /** Ver la pestaña Reportes. */
  viewReports: boolean;
  /** Editar precios de productos en el inventario. */
  editPrices: boolean;
  /** Gestionar usuarios e invitaciones. */
  manageUsers: boolean;
  /** Editar datos del negocio y preferencias (redondeo, etc.). */
  editBusiness: boolean;
}

/**
 * Capacidades por rol (según la leyenda de la pantalla de permisos):
 * - Cajero: vender, anotar fiados y cobrar abonos.
 * - Gerente: además ve reportes y edita precios.
 * - Dueña: control total.
 */
export function capabilitiesFor(role: MemberRole | null | undefined): Capabilities {
  const isManagerUp = role === "manager" || role === "owner";
  return {
    viewReports: isManagerUp,
    editPrices: isManagerUp,
    manageUsers: role === "owner",
    editBusiness: role === "owner",
  };
}

export const ROLE_LABEL: Record<MemberRole, string> = {
  owner: "Dueña",
  manager: "Gerente",
  cashier: "Cajero",
};

/** Color del chip de rol (combina con la paleta Mercurio). */
export const ROLE_COLOR: Record<MemberRole, string> = {
  owner: "#B8A23A", // dorado
  manager: "#0E5E3E", // verde
  cashier: "#2B5FB8", // azul
};
