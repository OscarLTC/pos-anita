/**
 * Tests for services/firestore/sales.ts
 */

const mockBatchSet = jest.fn();
const mockBatchUpdate = jest.fn();
const mockBatchCommit = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  writeBatch: jest.fn(() => ({
    set: mockBatchSet,
    update: mockBatchUpdate,
    commit: mockBatchCommit,
  })),
  serverTimestamp: jest.fn(() => ({})),
  increment: jest.fn((n: number) => n),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  Timestamp: { fromDate: jest.fn((d: Date) => d) },
}));

jest.mock("@/config/firebase.config", () => ({ db: {} }));

import { getDoc, getDocs, limit } from "firebase/firestore";
import { saleService } from "@/services/firestore/sales";
import type { CreateSaleInput, SaleItem } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeTimestamp = (d = new Date()) => ({ toDate: () => d });

const makeItem = (overrides: Partial<SaleItem> = {}): SaleItem => ({
  product_id: "prod-1",
  product_name: "Agua",
  unit: "unit",
  quantity: 2,
  unit_price: 5,
  subtotal: 10,
  ...overrides,
});

const makeSaleData = (overrides = {}) => ({
  store_id: "store-1",
  created_by: "user-1",
  items: [makeItem()],
  total: 10,
  payment_type: "cash",
  status: "completed",
  created_at: makeTimestamp(),
  completed_at: makeTimestamp(),
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

describe("saleService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBatchCommit.mockResolvedValue(undefined);
  });

  // ── create ─────────────────────────────────────────────────────────────────
  describe("create", () => {
    const input: CreateSaleInput = {
      items: [makeItem()],
      total: 10,
      payment_type: "cash",
    };

    it("commits a batch and returns the created sale", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("sale-1", makeSaleData()));

      const result = await saleService.create("store-1", "user-1", input);

      expect(mockBatchCommit).toHaveBeenCalled();
      expect(result.store_id).toBe("store-1");
      expect(result.total).toBe(10);
    });

    it("sets sale status to completed", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("sale-1", makeSaleData()));

      await saleService.create("store-1", "user-1", input);

      const [, saleData] = mockBatchSet.mock.calls[0];
      expect(saleData.status).toBe("completed");
    });

    it("decrements stock for each item in the batch", async () => {
      const items = [
        makeItem({ product_id: "prod-1", quantity: 3 }),
        makeItem({ product_id: "prod-2", quantity: 1 }),
      ];
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("sale-1", makeSaleData({ items })));

      await saleService.create("store-1", "user-1", { ...input, items });

      expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
    });

    it("stores note as null when not provided", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("sale-1", makeSaleData()));

      await saleService.create("store-1", "user-1", input);

      const [, saleData] = mockBatchSet.mock.calls[0];
      expect(saleData.note).toBeNull();
    });

    it("stores note when provided", async () => {
      const inputWithNote: CreateSaleInput = { ...input, note: "Cliente VIP" };
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("sale-1", makeSaleData({ note: "Cliente VIP" })));

      await saleService.create("store-1", "user-1", inputWithNote);

      const [, saleData] = mockBatchSet.mock.calls[0];
      expect(saleData.note).toBe("Cliente VIP");
    });

    it("converts Firestore timestamps in returned sale", async () => {
      const createdDate = new Date("2025-01-15");
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("sale-1", makeSaleData({ created_at: makeTimestamp(createdDate) })),
      );

      const result = await saleService.create("store-1", "user-1", input);

      expect(result.created_at).toEqual(createdDate);
    });

    it("sets created_by on the sale document", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("sale-1", makeSaleData()));

      await saleService.create("store-1", "user-abc", input);

      const [, saleData] = mockBatchSet.mock.calls[0];
      expect(saleData.created_by).toBe("user-abc");
    });
  });

  // ── getRecent ──────────────────────────────────────────────────────────────
  describe("getRecent", () => {
    it("returns a list of recent sales", async () => {
      (getDocs as jest.Mock).mockResolvedValue(
        makeQuerySnap([
          { id: "sale-2", data: makeSaleData() },
          { id: "sale-1", data: makeSaleData() },
        ]),
      );

      const result = await saleService.getRecent("store-1");

      expect(result).toHaveLength(2);
    });

    it("returns empty array when no sales exist", async () => {
      (getDocs as jest.Mock).mockResolvedValue(makeQuerySnap([]));

      const result = await saleService.getRecent("store-1");

      expect(result).toEqual([]);
    });

    it("uses default count of 50", async () => {
      (getDocs as jest.Mock).mockResolvedValue(makeQuerySnap([]));

      await saleService.getRecent("store-1");

      expect(limit).toHaveBeenCalledWith(50);
    });

    it("respects custom count", async () => {
      (getDocs as jest.Mock).mockResolvedValue(makeQuerySnap([]));

      await saleService.getRecent("store-1", 10);

      expect(limit).toHaveBeenCalledWith(10);
    });

    it("maps note to undefined when absent", async () => {
      (getDocs as jest.Mock).mockResolvedValue(
        makeQuerySnap([{ id: "s1", data: makeSaleData() }]),
      );

      const result = await saleService.getRecent("store-1");

      expect(result[0].note).toBeUndefined();
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────
  describe("getById", () => {
    it("returns sale when it exists", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("sale-1", makeSaleData()));

      const result = await saleService.getById("sale-1");

      expect(result?.id).toBe("sale-1");
    });

    it("returns null when sale does not exist", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("", {}, false));

      const result = await saleService.getById("sale-1");

      expect(result).toBeNull();
    });
  });

  // ── getByDate ──────────────────────────────────────────────────────────────
  describe("getByDate", () => {
    it("returns sales for the specified date", async () => {
      (getDocs as jest.Mock).mockResolvedValue(
        makeQuerySnap([{ id: "sale-1", data: makeSaleData() }]),
      );

      const result = await saleService.getByDate("store-1", "2025-01-15");

      expect(result).toHaveLength(1);
    });

    it("returns empty array when no sales match date", async () => {
      (getDocs as jest.Mock).mockResolvedValue(makeQuerySnap([]));

      const result = await saleService.getByDate("store-1", "2025-01-15");

      expect(result).toEqual([]);
    });
  });
});
