/**
 * Tests for services/firestore/stores.ts
 */

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({})),
}));

jest.mock("@/config/firebase.config", () => ({ db: {} }));

import { getDoc, setDoc, updateDoc } from "firebase/firestore";
import { storeService } from "@/services/firestore/stores";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeTimestamp = (d = new Date()) => ({ toDate: () => d });

const makeStoreData = (overrides = {}) => ({
  name: "Mi Tienda",
  owner_id: "user-1",
  currency: "PEN",
  default_min_margin: 0.2,
  rounding_methods: ["cash"],
  created_at: makeTimestamp(),
  ...overrides,
});

const makeSnap = (id: string, data: Record<string, unknown>, exists = true) => ({
  id,
  data: () => data,
  exists: () => exists,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("storeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getById ────────────────────────────────────────────────────────────────
  describe("getById", () => {
    it("returns store when document exists", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("store-1", makeStoreData()));

      const result = await storeService.getById("store-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("store-1");
      expect(result?.name).toBe("Mi Tienda");
    });

    it("returns null when document does not exist", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("", {}, false));

      const result = await storeService.getById("store-1");

      expect(result).toBeNull();
    });

    it("uses default currency PEN when field is missing", async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("store-1", { name: "Shop", owner_id: "u1", created_at: makeTimestamp() }),
      );

      const result = await storeService.getById("store-1");

      expect(result?.currency).toBe("PEN");
    });

    it("uses default default_min_margin 0.2 when field is missing", async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("store-1", { name: "Shop", owner_id: "u1", created_at: makeTimestamp() }),
      );

      const result = await storeService.getById("store-1");

      expect(result?.default_min_margin).toBe(0.2);
    });

    it("uses default rounding_methods when field is missing", async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("store-1", { name: "Shop", owner_id: "u1", created_at: makeTimestamp() }),
      );

      const result = await storeService.getById("store-1");

      expect(result?.rounding_methods).toEqual(["cash", "yape", "plin", "card"]);
    });

    it("converts created_at timestamp to Date", async () => {
      const date = new Date("2024-06-01");
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("s1", makeStoreData({ created_at: makeTimestamp(date) })),
      );

      const result = await storeService.getById("s1");

      expect(result?.created_at).toEqual(date);
    });
  });

  // ── ensureExists ───────────────────────────────────────────────────────────
  describe("ensureExists", () => {
    it("returns existing store when document exists", async () => {
      const data = makeStoreData({ name: "Existing Store" });
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("user-1", data));

      const result = await storeService.ensureExists("user-1");

      expect(result.name).toBe("Existing Store");
      expect(setDoc).not.toHaveBeenCalled();
    });

    it("creates new store document when it does not exist", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("", {}, false));
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await storeService.ensureExists("user-99");

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ owner_id: "user-99", name: "Mi Tienda" }),
      );
    });

    it("returns correct Store shape when creating new store", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("", {}, false));
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await storeService.ensureExists("user-99");

      expect(result.id).toBe("user-99");
      expect(result.name).toBe("Mi Tienda");
      expect(result.currency).toBe("PEN");
      expect(result.default_min_margin).toBe(0.2);
      expect(result.rounding_methods).toEqual(["cash"]);
    });

    it("sets created_at to a Date when creating new store", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("", {}, false));
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await storeService.ensureExists("user-99");

      expect(result.created_at).toBeInstanceOf(Date);
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────
  describe("update", () => {
    it("calls updateDoc with provided input", async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await storeService.update("store-1", { name: "New Name", currency: "USD" });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { name: "New Name", currency: "USD" },
      );
    });

    it("propagates errors from Firestore", async () => {
      (updateDoc as jest.Mock).mockRejectedValue(new Error("Firestore error"));

      await expect(storeService.update("store-1", { name: "X" })).rejects.toThrow("Firestore error");
    });
  });
});
