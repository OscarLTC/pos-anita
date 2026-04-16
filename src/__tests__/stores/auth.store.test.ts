/**
 * Tests for auth.store.ts
 */

const mockSignInWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();

jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmailAndPassword(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
}));

jest.mock("@/config/firebase.config", () => ({ db: {}, auth: {} }));

const mockStoreEnsureExists = jest.fn();
jest.mock("@/services/firestore/stores", () => ({
  storeService: {
    ensureExists: (...args: unknown[]) => mockStoreEnsureExists(...args),
  },
}));

import { useAuthStore } from "@/stores/auth.store";
import type { Store } from "@/types";
import type { User } from "firebase/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeStore = (): Store => ({
  id: "store-1",
  name: "Test Store",
  owner_id: "user-1",
  currency: "PEN",
  default_min_margin: 0.2,
  rounding_methods: ["cash"],
  created_at: new Date(),
});

const makeUser = (): User => ({ uid: "user-1", email: "test@test.com" }) as unknown as User;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: undefined, store: undefined });
    jest.clearAllMocks();
  });

  // ── setUser ────────────────────────────────────────────────────────────────
  describe("setUser", () => {
    it("sets user and store to null when called with null", () => {
      useAuthStore.setState({ user: makeUser(), store: makeStore() });

      useAuthStore.getState().setUser(null);

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().store).toBeNull();
    });

    it("sets user and resets store to undefined when called with a User", () => {
      const user = makeUser();

      useAuthStore.getState().setUser(user);

      expect(useAuthStore.getState().user).toEqual(user);
      expect(useAuthStore.getState().store).toBeUndefined();
    });

    it("replaces an existing user", () => {
      useAuthStore.setState({ user: makeUser() });
      const newUser = { uid: "user-2" } as unknown as User;

      useAuthStore.getState().setUser(newUser);

      expect(useAuthStore.getState().user?.uid).toBe("user-2");
    });
  });

  // ── loadStore ──────────────────────────────────────────────────────────────
  describe("loadStore", () => {
    it("sets store on success", async () => {
      const store = makeStore();
      mockStoreEnsureExists.mockResolvedValue(store);

      await useAuthStore.getState().loadStore("user-1");

      expect(useAuthStore.getState().store).toEqual(store);
    });

    it("sets store to null on error", async () => {
      mockStoreEnsureExists.mockRejectedValue(new Error("Firestore error"));

      await useAuthStore.getState().loadStore("user-1");

      expect(useAuthStore.getState().store).toBeNull();
    });

    it("calls storeService.ensureExists with the userId", async () => {
      mockStoreEnsureExists.mockResolvedValue(makeStore());

      await useAuthStore.getState().loadStore("user-abc");

      expect(mockStoreEnsureExists).toHaveBeenCalledWith("user-abc");
    });
  });

  // ── login ──────────────────────────────────────────────────────────────────
  describe("login", () => {
    it("calls signInWithEmailAndPassword with auth, email, and password", async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({});

      await useAuthStore.getState().login("test@example.com", "secret");

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        "test@example.com",
        "secret",
      );
    });

    it("propagates errors from Firebase auth", async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue(new Error("wrong password"));

      await expect(
        useAuthStore.getState().login("test@example.com", "wrong"),
      ).rejects.toThrow("wrong password");
    });
  });

  // ── logout ─────────────────────────────────────────────────────────────────
  describe("logout", () => {
    it("calls signOut with the auth instance", async () => {
      mockSignOut.mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      expect(mockSignOut).toHaveBeenCalledWith({});
    });

    it("propagates errors from Firebase auth", async () => {
      mockSignOut.mockRejectedValue(new Error("network error"));

      await expect(useAuthStore.getState().logout()).rejects.toThrow("network error");
    });
  });
});
