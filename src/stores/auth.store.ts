import { create } from "zustand";
import { signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth } from "@/config/firebase.config";
import { storeService } from "@/services/firestore/stores";
import type { Store } from "@/types";

interface AuthState {
  user: User | null | undefined;
  store: Store | null | undefined;
  setUser: (user: User | null) => void;
  loadStore: (userId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  store: undefined,

  setUser: (user) => {
    if (!user) {
      set({ user: null, store: null });
    } else {
      set({ user, store: undefined });
    }
  },

  loadStore: async (userId) => {
    try {
      const store = await storeService.ensureExists(userId);
      set({ store });
    } catch (error) {
      console.error("Error cargando tienda:", error);
      set({ store: null });
    }
  },

  login: async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  },

  logout: async () => {
    await signOut(auth);
  },
}));
