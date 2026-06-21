import { create } from "zustand";
import { colors as m } from "./tokens";

export * from "./tokens";

/**
 * Alias legacy → tokens Mercurio.
 *
 * Las pantallas actuales consumen `useThemeStore().colors.<clave>` con el esquema
 * antiguo (text, text4, bg, accent_text…). Mientras se migran al rediseño, esos
 * nombres apuntan a la paleta Mercurio. Código nuevo debería importar los tokens
 * desde `@/theme` (colors, typography, spacing…) en vez de estos alias.
 */
export type AppColors = {
  bg: string;
  bg2: string;
  bg3: string;
  bg4: string;
  text: string;
  text2: string;
  text3: string;
  text4: string;
  border: string;
  border2: string;
  border3: string;
  accent: string;
  accent_text: string;
  low_stock_bg: string;
  low_stock_text: string;
  margin_bg: string;
  margin_text: string;
};

export const lightColors: AppColors = {
  bg: m.bg,
  bg2: m.surfaceMuted,
  bg3: m.surface,
  bg4: m.surface,
  text: m.ink,
  text2: m.inkMid,
  text3: m.inkSoft,
  text4: m.inkSoft,
  border: m.border,
  border2: m.border,
  border3: m.border,
  accent: m.primary,
  accent_text: m.primaryInk,
  low_stock_bg: "rgba(192,64,50,0.08)",
  low_stock_text: m.danger,
  margin_bg: m.chipBg,
  margin_text: m.success,
};

export const darkColors: AppColors = {
  bg: "#0E1410",
  bg2: "#171F1A",
  bg3: "#1E2722",
  bg4: "#1A221D",
  text: "#F1F1EC",
  text2: "#A6B0A8",
  text3: "#7C857E",
  text4: "#7C857E",
  border: "rgba(241,241,236,0.10)",
  border2: "rgba(241,241,236,0.10)",
  border3: "rgba(241,241,236,0.08)",
  accent: "#2E9E6E",
  accent_text: "#0E1410",
  low_stock_bg: "rgba(192,64,50,0.18)",
  low_stock_text: "#E07568",
  margin_bg: "rgba(46,158,110,0.16)",
  margin_text: "#2E9E6E",
};

interface ThemeState {
  isDark: boolean;
  colors: AppColors;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  colors: lightColors,
  toggle: () =>
    set((state) => {
      const isDark = !state.isDark;
      return { isDark, colors: isDark ? darkColors : lightColors };
    }),
}));
