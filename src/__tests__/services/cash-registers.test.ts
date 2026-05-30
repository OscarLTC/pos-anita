/**
 * Tests for services/firestore/cash-registers.ts
 */

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({})),
  increment: jest.fn((n: number) => n),
}));

jest.mock("@/config/firebase.config", () => ({ db: {} }));

import { getDoc, setDoc, updateDoc } from "firebase/firestore";
import { cashRegisterService } from "@/services/firestore/cash-registers";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeTimestamp = (d = new Date()) => ({ toDate: () => d });

const makeRegisterData = (overrides = {}) => ({
  store_id: "store-1",
  date: "2025-01-01",
  total_sales: 100,
  total_cash: 100,
  total_yape: 0,
  total_plin: 0,
  total_card: 0,
  sales_count: 1,
  opened_at: makeTimestamp(),
  status: "open",
  ...overrides,
});

const makeSnap = (id: string, data: Record<string, unknown>, exists = true) => ({
  id,
  data: () => data,
  exists: () => exists,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("cashRegisterService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getByDate ──────────────────────────────────────────────────────────────
  describe("getByDate", () => {
    it("returns register when document exists", async () => {
      const data = makeRegisterData();
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("store-1_2025-01-01", data));

      const result = await cashRegisterService.getByDate("store-1", "2025-01-01");

      expect(result).not.toBeNull();
      expect(result?.store_id).toBe("store-1");
      expect(result?.total_sales).toBe(100);
    });

    it("returns null when document does not exist", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("", {}, false));

      const result = await cashRegisterService.getByDate("store-1", "2025-01-01");

      expect(result).toBeNull();
    });

    it("uses default total values of 0 when fields are missing", async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("store-1_2025-01-01", { store_id: "store-1", date: "2025-01-01" }),
      );

      const result = await cashRegisterService.getByDate("store-1", "2025-01-01");

      expect(result?.total_sales).toBe(0);
      expect(result?.total_cash).toBe(0);
      expect(result?.total_yape).toBe(0);
      expect(result?.total_plin).toBe(0);
      expect(result?.total_card).toBe(0);
      expect(result?.sales_count).toBe(0);
    });

    it("defaults status to open when field is missing", async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("store-1_2025-01-01", { store_id: "store-1", date: "2025-01-01" }),
      );

      const result = await cashRegisterService.getByDate("store-1", "2025-01-01");

      expect(result?.status).toBe("open");
    });

    it("converts opened_at timestamp to Date", async () => {
      const date = new Date("2025-03-15");
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("store-1_2025-03-15", makeRegisterData({ opened_at: makeTimestamp(date) })),
      );

      const result = await cashRegisterService.getByDate("store-1", "2025-03-15");

      expect(result?.opened_at).toEqual(date);
    });

    it("leaves closed_at as undefined when missing", async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("store-1_2025-01-01", makeRegisterData()),
      );

      const result = await cashRegisterService.getByDate("store-1", "2025-01-01");

      expect(result?.closed_at).toBeUndefined();
    });
  });

  // ── addSale ────────────────────────────────────────────────────────────────
  describe("addSale", () => {
    it("creates a new register document when it does not exist", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("", {}, false));
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await cashRegisterService.addSale("store-1", "2025-01-01", 50, "cash");

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          store_id: "store-1",
          date: "2025-01-01",
          total_sales: 50,
          total_cash: 50,
          total_yape: 0,
          total_plin: 0,
          total_card: 0,
          sales_count: 1,
          status: "open",
        }),
      );
    });

    it("sets yape total when payment type is yape on first sale", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("", {}, false));
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await cashRegisterService.addSale("store-1", "2025-01-01", 75, "yape");

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ total_yape: 75, total_cash: 0 }),
      );
    });

    it("sets plin total when payment type is plin on first sale", async () => {
      (getDoc as jest.Mock).mockResolvedValue(makeSnap("", {}, false));
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await cashRegisterService.addSale("store-1", "2025-01-01", 30, "plin");

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ total_plin: 30 }),
      );
    });

    it("updates existing register document when it exists", async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("store-1_2025-01-01", makeRegisterData(), true),
      );
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await cashRegisterService.addSale("store-1", "2025-01-01", 30, "card");

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          total_sales: 30,
          total_card: 30,
          sales_count: 1,
        }),
      );
    });

    it("does not call setDoc when register already exists", async () => {
      (getDoc as jest.Mock).mockResolvedValue(
        makeSnap("store-1_2025-01-01", makeRegisterData(), true),
      );
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await cashRegisterService.addSale("store-1", "2025-01-01", 30, "cash");

      expect(setDoc).not.toHaveBeenCalled();
    });
  });

  // ── close ──────────────────────────────────────────────────────────────────
  describe("close", () => {
    it("updates status to closed", async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await cashRegisterService.close("store-1", "2025-01-01");

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: "closed" }),
      );
    });

    it("sets closed_at timestamp", async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await cashRegisterService.close("store-1", "2025-01-01");

      const [, data] = (updateDoc as jest.Mock).mock.calls[0];
      expect(data).toHaveProperty("closed_at");
    });
  });
});
