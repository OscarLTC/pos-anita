/** Formatea un monto en soles con coma decimal: 24.5 -> "S/ 24,50". */
export function soles(amount: number): string {
  return `S/ ${amount.toFixed(2).replace(".", ",")}`;
}

/** Formatea una cantidad según la unidad del producto. */
export function formatQty(qty: number, unit: string): string {
  if (unit === "unit") return String(qty);
  return parseFloat(qty.toFixed(3)).toString();
}

/** Sufijo de precio según unidad: "/kg", "/L" o "c/u". */
export function unitLabel(unit: string): string {
  if (unit === "kg") return "/kg";
  if (unit === "l") return "/L";
  return "c/u";
}

/** Abreviatura corta de la unidad para mostrar junto a una cantidad. */
export function unitShort(unit: string): string {
  if (unit === "kg") return "kg";
  if (unit === "l") return "L";
  return "u";
}

/** Iniciales para un avatar (hasta 2 letras). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "#D98AA6",
  "#A98CD8",
  "#AEA84C",
  "#7FA8E0",
  "#56C4C4",
  "#E0A06E",
  "#7FBF8A",
  "#E08C8C",
];

/** Color de avatar determinístico a partir de un texto (nombre/id). */
export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
