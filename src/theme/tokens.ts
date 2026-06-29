/**
 * Mercurio (Clean SaaS) — Design tokens
 *
 * Fuente única de verdad para colores, tipografía, espaciado, radios y sombras.
 * Pensado como base para el rediseño de la app. Los componentes nuevos deberían
 * consumir estos tokens directamente; las pantallas existentes siguen usando los
 * alias legacy expuestos en `./index.ts` mientras se migran.
 *
 * Tipografía: Bricolage Grotesque (display/body) + JetBrains Mono (numérico/mono).
 * Densidad: Compact · Layout POS: list.
 */

import type { TextStyle, ViewStyle } from "react-native";

/** Nombres de familias cargadas vía expo-font en `app/_layout.tsx`. */
export const fontFamilies = {
  display: "BricolageGrotesque-Bold",
  body: "BricolageGrotesque-Regular",
  mono: "JetBrainsMono-Regular",
} as const;

/** Mapa archivo->fuente para `useFonts`. */
export const fontAssets = {
  [fontFamilies.body]: require("../../assets/fonts/BricolageGrotesque-Regular.ttf"),
  [fontFamilies.display]: require("../../assets/fonts/BricolageGrotesque-Bold.ttf"),
  [fontFamilies.mono]: require("../../assets/fonts/JetBrainsMono-Regular.ttf"),
};

export const colors = {
  bg: "#FAFAF7", // Canvas / fondo
  surface: "#FFFFFF", // Cards / superficies
  surfaceMuted: "#F1F1EC", // Fondo secundario
  surfaceInk: "#0E1410", // Texto sobre superficie de alto contraste

  border: "rgba(14,20,16,0.08)",
  borderStrong: "rgba(14,20,16,0.16)",

  ink: "#0E1410", // Texto por defecto
  inkMid: "#5A655E", // Texto secundario / muted
  inkSoft: "#929C94", // Texto terciario / placeholder

  primary: "#0E5E3E", // Verde esmeralda
  primaryInk: "#FFFFFF", // Texto sobre primary
  accent: "#F2C744", // Amarillo suave
  accentInk: "#0E1410", // Texto sobre accent

  suscription: "#FCF3DB",
  suscriptionStar: "#F2C744",

  success: "#0E5E3E",
  danger: "#C04032",
  info: "#2B5FB8",

  frameBg: "#0E1410",
  statusInk: "#0E1410",

  chipBg: "rgba(14,94,62,0.08)",
  chipInk: "#0E5E3E",
} as const;

export type MercurioColors = typeof colors;

/** Espaciado — densidad Compact. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 32,
} as const;

/** Radios de borde. */
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

/** Escala de tamaños de fuente (base para construir variantes de texto). */
export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

/**
 * Estilos de texto reutilizables. Cada uno trae fontFamily + weight + tracking
 * listos para usar en un `Text`. Tipados como TextStyle.
 */
export const typography = {
  display: {
    fontFamily: fontFamilies.display,
    fontWeight: "700",
    fontSize: fontSize.xxl,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontWeight: "700",
    fontSize: fontSize.xl,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontWeight: "400",
    fontSize: fontSize.md,
  },
  bodySm: {
    fontFamily: fontFamilies.body,
    fontWeight: "400",
    fontSize: fontSize.sm,
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontWeight: "400",
    fontSize: fontSize.xs,
  },
  mono: {
    fontFamily: fontFamilies.mono,
    fontWeight: "400",
    fontSize: fontSize.md,
  },
} satisfies Record<string, TextStyle>;

/** Layout del POS — densidad compacta, listas en vez de grid. */
export const layout = {
  posLayout: "list",
  cardPadding: 8,
  itemHeight: 48,
} as const;

/** Sombras — iOS (shadow*) + Android (elevation). */
export const shadows = {
  shadow: {
    shadowColor: "#0E1410",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowLg: {
    shadowColor: "#0E1410",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
} satisfies Record<string, ViewStyle>;

/** Objeto agregado del theme Mercurio. */
export const mercurio = {
  id: "mercurio",
  name: "Mercurio",
  fontFamilies,
  colors,
  spacing,
  radius,
  fontSize,
  typography,
  layout,
  shadows,
} as const;

export type MercurioTheme = typeof mercurio;
