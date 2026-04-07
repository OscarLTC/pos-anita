import { create } from "zustand";
import { signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth } from "@/config/firebase.config";

interface AuthState {
  user: User | null | undefined;
  store_id: string | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  store_id: null,

  setUser: (user) =>
    set({
      user,
      store_id: user?.uid ?? null,
    }),

  login: async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  },

  logout: async () => {
    await signOut(auth);
  },
}));
