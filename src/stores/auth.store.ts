import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/config/firebase.config";
import { storeService } from "@/services/firestore/stores";
import { memberService, type Access } from "@/services/firestore/members";
import type { MemberRole, Store, UpdateStoreInput } from "@/types";

/** Error de app: la cuenta existe pero solo tiene proveedor Google (sin contraseña). */
export const GOOGLE_ACCOUNT_ONLY = "auth/google-account-only";

/** Clave de AsyncStorage donde se recuerda la última tienda activa por usuario. */
const activeStoreKey = (uid: string) => `active_store:${uid}`;

interface AuthState {
  user: User | null | undefined;
  /** Todas las tiendas a las que el usuario tiene acceso (multi-tienda). */
  memberships: Access[];
  /** Tienda activa (la que se está usando ahora). */
  store: Store | null | undefined;
  /** Rol del usuario en la tienda activa (null mientras resuelve / sin sesión). */
  role: MemberRole | null;
  setUser: (user: User | null) => void;
  loadStore: (user: User) => Promise<void>;
  /** Cambia la tienda activa (y la recuerda para la próxima sesión). */
  switchStore: (storeId: string) => Promise<void>;
  updateStore: (input: UpdateStoreInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Reautentica con contraseña (requisito de Firebase para operaciones sensibles). */
  reauthenticateWithPassword: (password: string) => Promise<void>;
  /** Reautentica con un idToken fresco de Google. */
  reauthenticateWithGoogle: (idToken: string) => Promise<void>;
  /** Elimina definitivamente el negocio propio, sus datos y la cuenta del usuario. */
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: undefined,
  memberships: [],
  store: undefined,
  role: null,

  setUser: (user) => {
    if (!user) {
      set({ user: null, memberships: [], store: null, role: null });
    } else {
      set({ user, memberships: [], store: undefined, role: null });
    }
  },

  loadStore: async (user) => {
    try {
      const session = { uid: user.uid, email: user.email, displayName: user.displayName };
      let memberships = await memberService.listAccess(session);
      // Sin ninguna tienda: crea la propia (dueña) como fallback.
      if (memberships.length === 0) {
        memberships = [await memberService.createOwnStore(session)];
      }
      // Tienda activa: la recordada si sigue disponible; si no, la propia o la primera.
      const savedId = await AsyncStorage.getItem(activeStoreKey(user.uid)).catch(() => null);
      const active =
        memberships.find((m) => m.store.id === savedId) ??
        memberships.find((m) => m.role === "owner" && m.store.id === user.uid) ??
        memberships[0];
      set({ memberships, store: active.store, role: active.role });
    } catch (error) {
      console.error("Error cargando tienda:", error);
      set({ memberships: [], store: null, role: null });
    }
  },

  switchStore: async (storeId) => {
    const { memberships, user } = get();
    const match = memberships.find((m) => m.store.id === storeId);
    if (!match) return;
    set({ store: match.store, role: match.role });
    if (user) await AsyncStorage.setItem(activeStoreKey(user.uid), storeId).catch(() => {});
  },

  updateStore: async (input) => {
    const current = get().store;
    if (!current) return;
    await storeService.update(current.id, input);
    set((s) => ({
      store: { ...current, ...input },
      memberships: s.memberships.map((m) =>
        m.store.id === current.id ? { ...m, store: { ...m.store, ...input } } : m,
      ),
    }));
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

  reauthenticateWithPassword: async (password) => {
    const current = auth.currentUser;
    if (!current?.email) throw new Error("no-current-user");
    const credential = EmailAuthProvider.credential(current.email, password);
    await reauthenticateWithCredential(current, credential);
  },

  reauthenticateWithGoogle: async (idToken) => {
    const current = auth.currentUser;
    if (!current) throw new Error("no-current-user");
    const credential = GoogleAuthProvider.credential(idToken);
    await reauthenticateWithCredential(current, credential);
  },

  deleteAccount: async () => {
    const current = auth.currentUser;
    if (!current) throw new Error("no-current-user");
    // 1) Quita las membresías del usuario en cualquier tienda.
    await memberService.removeAllMembershipsOf(current.uid);
    // 2) Borra el negocio propio y todos sus datos.
    await storeService.purge(current.uid);
    // 3) Elimina la cuenta de autenticación (dispara onAuthStateChanged -> null).
    await deleteUser(current);
  },
}));
