import { create } from "zustand";

/**
 * Token de invitación pendiente de aceptar. Se guarda al abrir el link para
 * sobrevivir al login: tras autenticarse, el root layout redirige a aceptarlo.
 */
interface InviteState {
  token: string | null;
  setToken: (token: string) => void;
  clear: () => void;
}

export const useInviteStore = create<InviteState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  clear: () => set({ token: null }),
}));
