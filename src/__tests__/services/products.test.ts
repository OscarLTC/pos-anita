/**
 * Tests for services/firestore/products.ts
 */

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({})),
  increment: jest.fn((n: number) => n),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
}));

jest.mock("@/config/firebase.config", () => ({ db: {} }));

jest.mock("@/services/firestore/price-history", () => ({
  priceHistoryService: {
    create: jest.fn().mockResolvedValue(undefined),
  },
}));

import { addDoc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { priceHistoryService } from "@/services/firestore/price-history";
import { productService } from "@/services/firestore/products";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeTimestamp = (d = new Date()) => ({ toDate: () => d });

const makeProductData = (overrides = {}) => ({
  store_id: "store-1",
  category_id: "cat-1",
  name: "Agua Mineral",
  unit: "unit",
  cost_price: 1.0,
  sale_price: 2.0,
  stock: 10,
  min_stock: 5,
  status: "active",
  created_at: makeTimestamp(),
  updated_at: makeTimestamp(),
  ...overrides,
});

const makeSnap = (id: string, data: Record<string, unknown>, exists = true) => ({
  id,
  data: () => data,
  exists: () => exists,
});

const makeQuerySnap = (docs: { id: string; data: Record<string, unknown> }[]) => ({
  docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("productService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (priceHistoryService.create as jest.Mock).mockResolvedValue(undefined);
  });

  // ── getAll ─────────────────────────────────────────────────────────────────
  describe("getAll", () => {
    it("returns active products for the store", async () => {
      const data = makeProductData();
      (getDocs as jest.Mock).mockResolvedValue(makeQuerySnap([{ id: "prod-1", data }]));

      const result = await productService.getAll("store-1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("prod-1");
      expect(result[0].name).toBe("Agua Mineral");
    });

    it("returns empty array when no products exist", async () => {
      (getDocs as jest.Mock).mockResolvedValue(makeQuerySnap([]));

      const result = await productService.getAll("store-1");

      expect(result).toEqual([]);
    });

    it("converts Firestore timestamps to Dates", async () => {
      const createdDate = new Date("2024-01-01");
      const updatedDate = new Date("2024-06-01");
      (getDocs as jest.Mock).mockResolvedValue(
        makeQuerySnap([
          {
            id: "prod-1",
            data: makeProductData({
              created_at: makeTimestamp(createdDate),
              updated_at: makeTimestamp(updatedDate),
            }),
          },
        ]),
      );

      const result = await productService.getAll("store-1");

      expect(result[0].created_at).toEqual(createdDate);
      expect(result[0].updated_at).toEqual(updatedDate);
    });

    it("maps barcode and min_margin optional fields", async () => {
      (getDocs as jest.Mock).mockResolvedValue(
        makeQuerySnap([
          { id: "prod-1", data: makeProductData({ barcode: "7501234", min_margin: 0.15 }) },
        ]),
      );

      const result = await productService.getAll("store-1");

      expect(result[0].barcode).toBe("7501234");
      expect(result[0].min_margin).toBe(0.15);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────
  describe("getById", () => {
    it("returns product when it exists", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("prod-1", makeProductData()));

      const result = await productService.getById("prod-1");

      expect(result?.id).toBe("prod-1");
    });

    it("returns null when product does not exist", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("", {}, false));

      const result = await productService.getById("prod-1");

      expect(result).toBeNull();
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────
  describe("create", () => {
    it("creates a product and returns it with the new id", async () => {
      (addDoc as jest.Mock).mockResolvedValue({ id: "new-prod" });
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("new-prod", makeProductData({ name: "Leche" })));

      const result = await productService.create("store-1", {
        category_id: "cat-1",
        name: "Leche",
        unit: "unit",
        cost_price: 2,
        sale_price: 3,
        stock: 20,
        min_stock: 5,
      });

      expect(result.id).toBe("new-prod");
      expect(result.name).toBe("Leche");
    });

    it("sets status to active", async () => {
      (addDoc as jest.Mock).mockResolvedValue({ id: "p1" });
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("p1", makeProductData()));

      await productService.create("store-1", {
        category_id: "cat-1",
        name: "Arroz",
        unit: "kg",
        cost_price: 1,
        sale_price: 2,
        stock: 50,
        min_stock: 10,
      });

      const [, docData] = (addDoc as jest.Mock).mock.calls[0];
      expect(docData.status).toBe("active");
    });

    it("includes store_id in the document", async () => {
      (addDoc as jest.Mock).mockResolvedValue({ id: "p1" });
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("p1", makeProductData()));

      await productService.create("store-99", {
        category_id: "cat-1",
        name: "Test",
        unit: "unit",
        cost_price: 1,
        sale_price: 2,
        stock: 10,
        min_stock: 2,
      });

      const [, docData] = (addDoc as jest.Mock).mock.calls[0];
      expect(docData.store_id).toBe("store-99");
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────
  describe("update", () => {
    it("calls updateDoc with updated fields", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("prod-1", makeProductData()));
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await productService.update("prod-1", { name: "Agua con Gas" }, "user-1");

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: "Agua con Gas" }),
      );
    });

    it("records price history when cost_price changes", async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("prod-1", makeProductData({ cost_price: 1.0, sale_price: 2.0 })),
      );
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await productService.update("prod-1", { cost_price: 1.5 }, "user-1");

      expect(priceHistoryService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          old_cost_price: 1.0,
          new_cost_price: 1.5,
          old_sale_price: 2.0,
          new_sale_price: 2.0,
          changed_by: "user-1",
        }),
      );
    });

    it("records price history when sale_price changes", async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("prod-1", makeProductData({ cost_price: 1.0, sale_price: 2.0 })),
      );
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await productService.update("prod-1", { sale_price: 3.0 }, "user-1");

      expect(priceHistoryService.create).toHaveBeenCalledWith(
        expect.objectContaining({ old_sale_price: 2.0, new_sale_price: 3.0 }),
      );
    });

    it("does not record price history when only name changes", async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("prod-1", makeProductData({ cost_price: 1.0, sale_price: 2.0 })),
      );
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await productService.update("prod-1", { name: "Same Price Product" }, "user-1");

      expect(priceHistoryService.create).not.toHaveBeenCalled();
    });

    it("does not record price history when cost_price is unchanged", async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("prod-1", makeProductData({ cost_price: 1.0, sale_price: 2.0 })),
      );
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await productService.update("prod-1", { cost_price: 1.0 }, "user-1");

      expect(priceHistoryService.create).not.toHaveBeenCalled();
    });

    it("records price history for store_id of the product", async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("prod-1", makeProductData({ store_id: "store-42" })),
      );
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await productService.update("prod-1", { cost_price: 2.0 }, "user-1");

      expect(priceHistoryService.create).toHaveBeenCalledWith(
        expect.objectContaining({ store_id: "store-42" }),
      );
    });
  });

  // ── updateStock ────────────────────────────────────────────────────────────
  describe("updateStock", () => {
    it("calls updateDoc with incremented stock", async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await productService.updateStock("prod-1", -2);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ stock: -2 }),
      );
    });
  });

  // ── archive ────────────────────────────────────────────────────────────────
  describe("archive", () => {
    it("sets status to archived", async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await productService.archive("prod-1");

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: "archived" }),
      );
    });
  });
});
