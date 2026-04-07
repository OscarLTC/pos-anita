import { create } from "zustand";

export const lightColors = {
  bg: "#fff",
  bg2: "#f5f5f5",
  bg3: "#f8f8f8",
  bg4: "#fafafa",
  text: "#111",
  text2: "#555",
  text3: "#888",
  text4: "#aaa",
  border: "#ddd",
  border2: "#e0e0e0",
  border3: "#f0f0f0",
  accent: "#111",
  accent_text: "#fff",
  low_stock_bg: "#fff3f3",
  low_stock_text: "#c0392b",
  margin_bg: "#f0faf5",
  margin_text: "#27ae60",
};

export const darkColors: typeof lightColors = {
  bg: "#111",
  bg2: "#1c1c1e",
  bg3: "#252525",
  bg4: "#1a1a1a",
  text: "#f0f0f0",
  text2: "#aaa",
  text3: "#777",
  text4: "#555",
  border: "#333",
  border2: "#2e2e2e",
  border3: "#222",
  accent: "#f0f0f0",
  accent_text: "#111",
  low_stock_bg: "#3d1414",
  low_stock_text: "#e74c3c",
  margin_bg: "#163324",
  margin_text: "#2ecc71",
};

export type AppColors = typeof lightColors;

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
