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
