/** Convierte un hex (#RRGGBB) a rgba con la opacidad dada. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Paleta de colores para categorías (elegibles al crear/editar). */
export const CATEGORY_COLORS = [
  "#7C6FE0",
  "#E06F9C",
  "#5B9BE0",
  "#9B6FE0",
  "#C77FD8",
  "#E0796F",
  "#E0A94E",
  "#4FB477",
  "#4FB8C4",
  "#E0846F",
];

/** Color por defecto determinístico (para categorías sin color asignado). */
export function defaultCategoryColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return CATEGORY_COLORS[h % CATEGORY_COLORS.length];
}
