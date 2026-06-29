/**
 * Links de invitación (universal links / app links).
 *
 * IMPORTANTE: reemplaza `INVITE_DOMAIN` por tu dominio real. Debe coincidir con:
 *  - `app.json` → ios.associatedDomains (`applinks:<dominio>`)
 *  - `app.json` → android.intentFilters[].data.host
 *  - los archivos de asociación en `public/.well-known/`
 */
export const INVITE_DOMAIN = "links.caserita.app";

export const INVITE_BASE_URL = `https://${INVITE_DOMAIN}`;

/** URL universal de una invitación: abre la app (o el navegador si no está instalada). */
export function inviteLink(token: string): string {
  return `${INVITE_BASE_URL}/invite/${token}`;
}
