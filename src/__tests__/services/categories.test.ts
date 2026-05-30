/**
 * Tests for services/firestore/categories.ts
 */

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
}));

jest.mock("@/config/firebase.config", () => ({ db: {}, auth: {} }));

import { addDoc, getDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { categoryService } from "@/services/firestore/categories";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeTimestamp = (d = new Date()) => ({ toDate: () => d });

const makeCategoryData = (overrides = {}) => ({
  store_id: "store-1",
  name: "Bebidas",
  icon: "🥤",
  order: 0,
  created_at: makeTimestamp(),
  ...overrides,
});

const makeQuerySnap = (docs: { id: string; data: Record<string, unknown> }[]) => ({
  docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
});

const makeSnap = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
  exists: () => true,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("categoryService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getAll ─────────────────────────────────────────────────────────────────
  describe("getAll", () => {
    it("returns categories sorted by order", async () => {
      (getDocs as jest.Mock).mockResolvedValue(
        makeQuerySnap([
          { id: "cat-2", data: makeCategoryData({ order: 2, name: "Snacks" }) },
          { id: "cat-1", data: makeCategoryData({ order: 0, name: "Bebidas" }) },
          { id: "cat-3", data: makeCategoryData({ order: 1, name: "Lácteos" }) },
        ]),
      );

      const result = await categoryService.getAll("store-1");

      expect(result.map((c) => c.name)).toEqual(["Bebidas", "Lácteos", "Snacks"]);
    });

    it("returns empty array when no categories exist", async () => {
      (getDocs as jest.Mock).mockResolvedValue(makeQuerySnap([]));

      const result = await categoryService.getAll("store-1");

      expect(result).toEqual([]);
    });

    it("converts Firestore timestamp to Date", async () => {
      const date = new Date("2025-01-01");
      (getDocs as jest.Mock).mockResolvedValue(
        makeQuerySnap([{ id: "cat-1", data: makeCategoryData({ created_at: makeTimestamp(date) }) }]),
      );

      const result = await categoryService.getAll("store-1");

      expect(result[0].created_at).toEqual(date);
    });

    it("maps all category fields correctly", async () => {
      (getDocs as jest.Mock).mockResolvedValue(
        makeQuerySnap([{ id: "cat-1", data: makeCategoryData({ name: "Frutas", icon: "🍎", order: 3 }) }]),
      );

      const result = await categoryService.getAll("store-1");

      expect(result[0]).toMatchObject({ id: "cat-1", name: "Frutas", icon: "🍎", order: 3 });
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────
  describe("create", () => {
    it("returns the created category with the correct id", async () => {
      const ref = { id: "new-cat" };
      (addDoc as jest.Mock).mockResolvedValue(ref);
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("new-cat", makeCategoryData({ name: "Frutas" })));

      const result = await categoryService.create("store-1", { name: "Frutas", icon: "🍎" }, 3);

      expect(result.id).toBe("new-cat");
      expect(result.name).toBe("Frutas");
    });

    it("passes order to the document", async () => {
      const ref = { id: "new-cat" };
      (addDoc as jest.Mock).mockResolvedValue(ref);
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("new-cat", makeCategoryData({ order: 5 })));

      await categoryService.create("store-1", { name: "Frutas", icon: "🍎" }, 5);

      const [, docData] = (addDoc as jest.Mock).mock.calls[0];
      expect(docData.order).toBe(5);
    });

    it("includes store_id in the document", async () => {
      (addDoc as jest.Mock).mockResolvedValue({ id: "c1" });
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("c1", makeCategoryData()));

      await categoryService.create("store-42", { name: "Test", icon: "📦" }, 0);

      const [, docData] = (addDoc as jest.Mock).mock.calls[0];
      expect(docData.store_id).toBe("store-42");
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────
  describe("update", () => {
    it("calls updateDoc with the new input", async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await categoryService.update("cat-1", { name: "Jugos", icon: "🍹" });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { name: "Jugos", icon: "🍹" },
      );
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────
  describe("remove", () => {
    it("calls deleteDoc", async () => {
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await categoryService.remove("cat-1");

      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});
