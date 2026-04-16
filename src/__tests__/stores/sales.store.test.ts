/**
 * Tests for sales.store.ts – todayISO() and store actions.
 */

const mockSaleServiceCreate = jest.fn();
const mockSaleServiceGetRecent = jest.fn();
jest.mock("@/services/firestore/sales", () => ({
  saleService: {
    create: (...args: unknown[]) => mockSaleServiceCreate(...args),
    getRecent: (...args: unknown[]) => mockSaleServiceGetRecent(...args),
  },
}));

const mockCashRegisterGetByDate = jest.fn();
const mockCashRegisterAddSale = jest.fn();
const mockCashRegisterClose = jest.fn();
jest.mock("@/services/firestore/cash-registers", () => ({
  cashRegisterService: {
    getByDate: (...args: unknown[]) => mockCashRegisterGetByDate(...args),
    addSale: (...args: unknown[]) => mockCashRegisterAddSale(...args),
    close: (...args: unknown[]) => mockCashRegisterClose(...args),
  },
}));

jest.mock("@/stores/auth.store", () => ({
  useAuthStore: {
    getState: () => ({ user: { uid: "user-1" } }),
  },
}));

const mockInventorySetState = jest.fn();
jest.mock("@/stores/inventory.store", () => ({
  useInventoryStore: {
    setState: (...args: unknown[]) => mockInventorySetState(...args),
  },
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  writeBatch: jest.fn(() => ({ set: jest.fn(), update: jest.fn(), commit: jest.fn() })),
  serverTimestamp: jest.fn(() => ({})),
  increment: jest.fn((n: number) => n),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  Timestamp: { fromDate: jest.fn((d: Date) => d) },
}));

jest.mock("@/config/firebase.config", () => ({ db: {}, auth: {} }));

import { todayISO, useSalesStore } from "@/stores/sales.store";
import type { Sale, CashRegister, CreateSaleInput } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeRegister = (overrides: Partial<CashRegister> = {}): CashRegister => ({
  id: "reg-1",
  store_id: "store-1",
  date: "2025-01-01",
  total_sales: 100,
  total_cash: 100,
  total_yape: 0,
  total_plin: 0,
  total_card: 0,
  sales_count: 1,
  opened_at: new Date(),
  status: "open",
  ...overrides,
});

const makeSale = (overrides: Partial<Sale> = {}): Sale => ({
  id: "sale-1",
  store_id: "store-1",
  created_by: "user-1",
  items: [],
  total: 50,
  payment_type: "cash",
  status: "completed",
  created_at: new Date(),
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("todayISO()", () => {
  it("returns a string in YYYY-MM-DD format", () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches the Lima timezone date", () => {
    const expected = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
    expect(todayISO()).toBe(expected);
  });
});

describe("useSalesStore", () => {
  beforeEach(() => {
    useSalesStore.setState({ sales: [], register: null, is_loading: false, error: null });
    jest.clearAllMocks();
    mockCashRegisterAddSale.mockResolvedValue(undefined);
    mockCashRegisterClose.mockResolvedValue(undefined);
  });

  // ── loadSales ──────────────────────────────────────────────────────────────
  describe("loadSales", () => {
    it("loads sales and clears loading flag on success", async () => {
      const sales = [makeSale()];
      mockSaleServiceGetRecent.mockResolvedValue(sales);

      await useSalesStore.getState().loadSales("store-1");

      expect(useSalesStore.getState().sales).toEqual(sales);
      expect(useSalesStore.getState().is_loading).toBe(false);
      expect(useSalesStore.getState().error).toBeNull();
    });

    it("sets error message on failure", async () => {
      mockSaleServiceGetRecent.mockRejectedValue(new Error("network"));

      await useSalesStore.getState().loadSales("store-1");

      expect(useSalesStore.getState().error).toBe("Error cargando ventas");
      expect(useSalesStore.getState().is_loading).toBe(false);
    });
  });

  // ── loadRegister ───────────────────────────────────────────────────────────
  describe("loadRegister", () => {
    it("loads cash register on success", async () => {
      const register = makeRegister();
      mockCashRegisterGetByDate.mockResolvedValue(register);

      await useSalesStore.getState().loadRegister("store-1");

      expect(useSalesStore.getState().register).toEqual(register);
      expect(useSalesStore.getState().is_loading).toBe(false);
    });

    it("sets register to null when not found", async () => {
      mockCashRegisterGetByDate.mockResolvedValue(null);

      await useSalesStore.getState().loadRegister("store-1");

      expect(useSalesStore.getState().register).toBeNull();
    });

    it("sets error message on failure", async () => {
      mockCashRegisterGetByDate.mockRejectedValue(new Error("network"));

      await useSalesStore.getState().loadRegister("store-1");

      expect(useSalesStore.getState().error).toBe("Error cargando caja");
    });
  });

  // ── createSale ─────────────────────────────────────────────────────────────
  describe("createSale", () => {
    const input: CreateSaleInput = {
      items: [{ product_id: "p1", product_name: "Arroz", unit: "kg", quantity: 2, unit_price: 5, subtotal: 10 }],
      total: 10,
      payment_type: "cash",
    };

    it("prepends new sale to the sales array", async () => {
      const newSale = makeSale({ id: "sale-2", total: 10 });
      mockSaleServiceCreate.mockResolvedValue(newSale);
      useSalesStore.setState({ sales: [makeSale({ id: "sale-1" })] });

      await useSalesStore.getState().createSale("store-1", input);

      const { sales } = useSalesStore.getState();
      expect(sales[0]).toEqual(newSale);
      expect(sales).toHaveLength(2);
    });

    it("updates register totals when register is open (cash payment)", async () => {
      mockSaleServiceCreate.mockResolvedValue(makeSale({ total: 10 }));
      useSalesStore.setState({ register: makeRegister({ total_sales: 100, total_cash: 100, sales_count: 1 }) });

      await useSalesStore.getState().createSale("store-1", input);

      const { register } = useSalesStore.getState();
      expect(register?.total_sales).toBe(110);
      expect(register?.total_cash).toBe(110);
      expect(register?.sales_count).toBe(2);
    });

    it("updates yape total when payment_type is yape", async () => {
      mockSaleServiceCreate.mockResolvedValue(makeSale({ payment_type: "yape", total: 10 }));
      useSalesStore.setState({ register: makeRegister({ total_yape: 0 }) });

      await useSalesStore.getState().createSale("store-1", { ...input, payment_type: "yape" });

      expect(useSalesStore.getState().register?.total_yape).toBe(10);
    });

    it("updates plin total when payment_type is plin", async () => {
      mockSaleServiceCreate.mockResolvedValue(makeSale({ payment_type: "plin", total: 20 }));
      useSalesStore.setState({ register: makeRegister({ total_plin: 0 }) });

      await useSalesStore.getState().createSale("store-1", { ...input, payment_type: "plin", total: 20 });

      expect(useSalesStore.getState().register?.total_plin).toBe(20);
    });

    it("does not modify register when register is null", async () => {
      mockSaleServiceCreate.mockResolvedValue(makeSale());
      useSalesStore.setState({ register: null });

      await useSalesStore.getState().createSale("store-1", input);

      expect(useSalesStore.getState().register).toBeNull();
    });

    it("calls cashRegisterService.addSale asynchronously", async () => {
      mockSaleServiceCreate.mockResolvedValue(makeSale());

      await useSalesStore.getState().createSale("store-1", input);

      expect(mockCashRegisterAddSale).toHaveBeenCalledWith("store-1", expect.any(String), 10, "cash");
    });

    it("returns the created sale", async () => {
      const newSale = makeSale({ id: "sale-99" });
      mockSaleServiceCreate.mockResolvedValue(newSale);

      const result = await useSalesStore.getState().createSale("store-1", input);

      expect(result).toEqual(newSale);
    });

    it("updates inventory stock for each item", async () => {
      mockSaleServiceCreate.mockResolvedValue(makeSale());

      await useSalesStore.getState().createSale("store-1", input);

      expect(mockInventorySetState).toHaveBeenCalled();
    });
  });

  // ── closeRegister ──────────────────────────────────────────────────────────
  describe("closeRegister", () => {
    it("marks register as closed with a closed_at date", async () => {
      useSalesStore.setState({ register: makeRegister({ status: "open" }) });

      await useSalesStore.getState().closeRegister("store-1");

      const { register } = useSalesStore.getState();
      expect(register?.status).toBe("closed");
      expect(register?.closed_at).toBeInstanceOf(Date);
    });

    it("does nothing to state when register is null", async () => {
      useSalesStore.setState({ register: null });

      await useSalesStore.getState().closeRegister("store-1");

      expect(useSalesStore.getState().register).toBeNull();
    });

    it("delegates to cashRegisterService.close", async () => {
      useSalesStore.setState({ register: makeRegister() });

      await useSalesStore.getState().closeRegister("store-1");

      expect(mockCashRegisterClose).toHaveBeenCalledWith("store-1", expect.any(String));
    });
  });
});
