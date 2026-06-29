import { create } from "zustand";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/config/firebase.config";
import { storeService } from "@/services/firestore/stores";
import { memberService } from "@/services/firestore/members";
import type { MemberRole, Store, UpdateStoreInput } from "@/types";

/** Error de app: la cuenta existe pero solo tiene proveedor Google (sin contraseña). */
export const GOOGLE_ACCOUNT_ONLY = "auth/google-account-only";

interface AuthState {
  user: User | null | undefined;
  store: Store | null | undefined;
  /** Rol del usuario en la tienda cargada (null mientras resuelve / sin sesión). */
  role: MemberRole | null;
  setUser: (user: User | null) => void;
  loadStore: (user: User) => Promise<void>;
  updateStore: (input: UpdateStoreInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: undefined,
  store: undefined,
  role: null,

  setUser: (user) => {
    if (!user) {
      set({ user: null, store: null, role: null });
    } else {
      set({ user, store: undefined, role: null });
    }
  },

  loadStore: async (user) => {
    try {
      const { store, role } = await memberService.resolveAccess({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      });
      set({ store, role });
    } catch (error) {
      console.error("Error cargando tienda:", error);
      set({ store: null, role: null });
    }
  },

  updateStore: async (input) => {
    const current = get().store;
    if (!current) return;
    await storeService.update(current.id, input);
    set({ store: { ...current, ...input } });
  },

  login: async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  },

  register: async (email, password) => {
    await createUserWithEmailAndPassword(auth, email, password);
  },

  loginWithGoogle: async (idToken) => {
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
  },

  resetPassword: async (email) => {
    // Si la cuenta solo tiene proveedor Google no hay contraseña que restablecer.
    // Nota: con "Email enumeration protection" activado, fetchSignInMethodsForEmail
    // devuelve [] y simplemente seguimos con el envío normal.
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0 && !methods.includes("password")) {
      throw new Error(GOOGLE_ACCOUNT_ONLY);
    }
    await sendPasswordResetEmail(auth, email);
  },

  logout: async () => {
    await signOut(auth);
  },
}));
