/**
 * Tests for inventory.store.ts
 */

const mockProductGetAll = jest.fn();
const mockProductCreate = jest.fn();
const mockProductUpdate = jest.fn();
const mockProductArchive = jest.fn();
jest.mock("@/services/firestore/products", () => ({
  productService: {
    getAll: (...args: unknown[]) => mockProductGetAll(...args),
    create: (...args: unknown[]) => mockProductCreate(...args),
    update: (...args: unknown[]) => mockProductUpdate(...args),
    archive: (...args: unknown[]) => mockProductArchive(...args),
  },
}));

const mockCategoryGetAll = jest.fn();
const mockCategoryCreate = jest.fn();
const mockCategoryUpdate = jest.fn();
const mockCategoryRemove = jest.fn();
jest.mock("@/services/firestore/categories", () => ({
  categoryService: {
    getAll: (...args: unknown[]) => mockCategoryGetAll(...args),
    create: (...args: unknown[]) => mockCategoryCreate(...args),
    update: (...args: unknown[]) => mockCategoryUpdate(...args),
    remove: (...args: unknown[]) => mockCategoryRemove(...args),
  },
}));

jest.mock("@/stores/auth.store", () => ({
  useAuthStore: {
    getState: () => ({
      user: { uid: "user-1" },
      store: { default_min_margin: 0.2 },
    }),
  },
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  setDoc: jest.fn(),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  serverTimestamp: jest.fn(() => ({})),
  increment: jest.fn((n: number) => n),
}));

jest.mock("@/config/firebase.config", () => ({ db: {}, auth: {} }));

import { useInventoryStore } from "@/stores/inventory.store";
import type { Product, Category, CreateProductInput, CreateCategoryInput } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: "cat-1",
  store_id: "store-1",
  name: "Bebidas",
  icon: "🥤",
  order: 0,
  created_at: new Date(),
  ...overrides,
});

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "prod-1",
  store_id: "store-1",
  category_id: "cat-1",
  name: "Agua",
  unit: "unit",
  cost_price: 1.0,
  sale_price: 2.0,
  stock: 10,
  min_stock: 5,
  status: "active",
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useInventoryStore", () => {
  beforeEach(() => {
    useInventoryStore.setState({
      products: [],
      categories: [],
      is_loading: false,
      error: null,
      selected_category_id: null,
      search_query: "",
    });
    jest.clearAllMocks();
  });

  // ── loadInventory ──────────────────────────────────────────────────────────
  describe("loadInventory", () => {
    it("sets products and categories on success", async () => {
      const products = [makeProduct()];
      const categories = [makeCategory()];
      mockProductGetAll.mockResolvedValue(products);
      mockCategoryGetAll.mockResolvedValue(categories);

      await useInventoryStore.getState().loadInventory("store-1");

      expect(useInventoryStore.getState().products).toEqual(products);
      expect(useInventoryStore.getState().categories).toEqual(categories);
      expect(useInventoryStore.getState().is_loading).toBe(false);
      expect(useInventoryStore.getState().error).toBeNull();
    });

    it("sets error on failure and clears loading", async () => {
      mockProductGetAll.mockRejectedValue(new Error("network"));
      mockCategoryGetAll.mockResolvedValue([]);

      await useInventoryStore.getState().loadInventory("store-1");

      expect(useInventoryStore.getState().error).toBe("Error cargando inventario");
      expect(useInventoryStore.getState().is_loading).toBe(false);
    });
  });

  // ── setSelectedCategory / setSearchQuery ───────────────────────────────────
  describe("setSelectedCategory", () => {
    it("updates selected_category_id", () => {
      useInventoryStore.getState().setSelectedCategory("cat-2");
      expect(useInventoryStore.getState().selected_category_id).toBe("cat-2");
    });

    it("clears selection when set to null", () => {
      useInventoryStore.setState({ selected_category_id: "cat-1" });
      useInventoryStore.getState().setSelectedCategory(null);
      expect(useInventoryStore.getState().selected_category_id).toBeNull();
    });
  });

  describe("setSearchQuery", () => {
    it("updates search_query", () => {
      useInventoryStore.getState().setSearchQuery("agua");
      expect(useInventoryStore.getState().search_query).toBe("agua");
    });
  });

  // ── Category CRUD ──────────────────────────────────────────────────────────
  describe("addCategory", () => {
    it("appends the created category to the list", async () => {
      const newCat = makeCategory({ id: "cat-2", name: "Snacks" });
      mockCategoryCreate.mockResolvedValue(newCat);

      await useInventoryStore.getState().addCategory("store-1", { name: "Snacks", icon: "🍟" });

      expect(useInventoryStore.getState().categories).toContainEqual(newCat);
    });

    it("passes current category count as order to the service", async () => {
      useInventoryStore.setState({ categories: [makeCategory(), makeCategory({ id: "cat-2" })] });
      mockCategoryCreate.mockResolvedValue(makeCategory({ id: "cat-3" }));

      await useInventoryStore.getState().addCategory("store-1", { name: "New", icon: "🆕" });

      expect(mockCategoryCreate).toHaveBeenCalledWith("store-1", expect.anything(), 2);
    });
  });

  describe("updateCategory", () => {
    it("updates the matching category in state", async () => {
      useInventoryStore.setState({ categories: [makeCategory({ name: "Old" })] });
      mockCategoryUpdate.mockResolvedValue(undefined);

      await useInventoryStore.getState().updateCategory("cat-1", { name: "New", icon: "🔥" });

      expect(useInventoryStore.getState().categories[0].name).toBe("New");
      expect(useInventoryStore.getState().categories[0].icon).toBe("🔥");
    });

    it("does not affect other categories", async () => {
      const cat2 = makeCategory({ id: "cat-2", name: "Other" });
      useInventoryStore.setState({ categories: [makeCategory(), cat2] });
      mockCategoryUpdate.mockResolvedValue(undefined);

      await useInventoryStore.getState().updateCategory("cat-1", { name: "Changed", icon: "✅" });

      expect(useInventoryStore.getState().categories.find((c) => c.id === "cat-2")?.name).toBe("Other");
    });
  });

  describe("removeCategory", () => {
    it("removes the category from the list", async () => {
      useInventoryStore.setState({ categories: [makeCategory()] });
      mockCategoryRemove.mockResolvedValue(undefined);

      await useInventoryStore.getState().removeCategory("cat-1");

      expect(useInventoryStore.getState().categories).toHaveLength(0);
    });
  });

  // ── Product CRUD ───────────────────────────────────────────────────────────
  describe("addProduct", () => {
    it("appends the created product", async () => {
      const newProduct = makeProduct({ id: "prod-2" });
      mockProductCreate.mockResolvedValue(newProduct);

      await useInventoryStore.getState().addProduct("store-1", {
        category_id: "cat-1",
        name: "Arroz",
        unit: "kg",
        cost_price: 1,
        sale_price: 2,
        stock: 20,
        min_stock: 5,
      });

      expect(useInventoryStore.getState().products).toContainEqual(newProduct);
    });
  });

  describe("updateProduct", () => {
    it("merges changes into the matching product", async () => {
      useInventoryStore.setState({ products: [makeProduct({ sale_price: 2.0 })] });
      mockProductUpdate.mockResolvedValue(undefined);

      await useInventoryStore.getState().updateProduct("prod-1", { sale_price: 3.5 });

      expect(useInventoryStore.getState().products[0].sale_price).toBe(3.5);
    });

    it("sets updated_at to a recent Date", async () => {
      useInventoryStore.setState({ products: [makeProduct()] });
      mockProductUpdate.mockResolvedValue(undefined);

      await useInventoryStore.getState().updateProduct("prod-1", { name: "New Name" });

      expect(useInventoryStore.getState().products[0].updated_at).toBeInstanceOf(Date);
    });
  });

  describe("archiveProduct", () => {
    it("removes the product from the state", async () => {
      useInventoryStore.setState({ products: [makeProduct()] });
      mockProductArchive.mockResolvedValue(undefined);

      await useInventoryStore.getState().archiveProduct("prod-1");

      expect(useInventoryStore.getState().products).toHaveLength(0);
    });
  });

  // ── getFiltered ────────────────────────────────────────────────────────────
  describe("getFiltered", () => {
    beforeEach(() => {
      useInventoryStore.setState({
        categories: [makeCategory()],
        products: [
          makeProduct({ id: "p1", name: "Agua", category_id: "cat-1" }),
          makeProduct({ id: "p2", name: "Leche", category_id: "cat-1" }),
          makeProduct({ id: "p3", name: "Pan", category_id: "cat-2" }),
        ],
      });
    });

    it("returns all products when no filter is active", () => {
      expect(useInventoryStore.getState().getFiltered()).toHaveLength(3);
    });

    it("filters by selected_category_id", () => {
      useInventoryStore.setState({ selected_category_id: "cat-2" });
      const result = useInventoryStore.getState().getFiltered();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("p3");
    });

    it("filters by search query (case-insensitive name match)", () => {
      useInventoryStore.setState({ search_query: "leche" });
      const result = useInventoryStore.getState().getFiltered();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("p2");
    });

    it("filters by exact barcode match", () => {
      useInventoryStore.setState({
        products: [
          makeProduct({ id: "p1", barcode: "7501234567890" }),
          makeProduct({ id: "p2", barcode: "1234567890123" }),
        ],
        search_query: "7501234567890",
      });

      const result = useInventoryStore.getState().getFiltered();
      expect(result[0].id).toBe("p1");
    });

    it("enriches product with its category", () => {
      const result = useInventoryStore.getState().getFiltered();
      expect(result.find((p) => p.id === "p1")?.category.name).toBe("Bebidas");
    });

    it("uses fallback 'Sin categoría' when category is not found", () => {
      useInventoryStore.setState({ categories: [] });
      const result = useInventoryStore.getState().getFiltered();
      expect(result[0].category.name).toBe("Sin categoría");
    });

    it("calculates margin_amount as sale_price minus cost_price", () => {
      // cost=1, sale=2 → margin_amount=1
      const result = useInventoryStore.getState().getFiltered();
      expect(result.find((p) => p.id === "p1")?.margin_amount).toBe(1);
    });

    it("calculates margin as margin_amount / sale_price", () => {
      // cost=1, sale=2 → margin=0.5
      const result = useInventoryStore.getState().getFiltered();
      expect(result.find((p) => p.id === "p1")?.margin).toBeCloseTo(0.5);
    });

    it("sets margin to 0 when sale_price is 0", () => {
      useInventoryStore.setState({
        products: [makeProduct({ sale_price: 0, cost_price: 0 })],
      });
      expect(useInventoryStore.getState().getFiltered()[0].margin).toBe(0);
    });

    it("marks is_low_stock=true when stock <= min_stock", () => {
      useInventoryStore.setState({ products: [makeProduct({ stock: 3, min_stock: 5 })] });
      expect(useInventoryStore.getState().getFiltered()[0].is_low_stock).toBe(true);
    });

    it("marks is_low_stock=true when stock equals min_stock (boundary)", () => {
      useInventoryStore.setState({ products: [makeProduct({ stock: 5, min_stock: 5 })] });
      expect(useInventoryStore.getState().getFiltered()[0].is_low_stock).toBe(true);
    });

    it("marks is_low_stock=false when stock > min_stock", () => {
      useInventoryStore.setState({ products: [makeProduct({ stock: 10, min_stock: 5 })] });
      expect(useInventoryStore.getState().getFiltered()[0].is_low_stock).toBe(false);
    });

    it("marks is_low_margin=true when margin < default_min_margin (0.2)", () => {
      // cost=1.8, sale=2 → margin=0.1 < 0.2
      useInventoryStore.setState({ products: [makeProduct({ cost_price: 1.8, sale_price: 2.0 })] });
      expect(useInventoryStore.getState().getFiltered()[0].is_low_margin).toBe(true);
    });

    it("marks is_low_margin=false when margin >= default_min_margin", () => {
      // cost=1.5, sale=2 → margin=0.25 >= 0.2
      useInventoryStore.setState({ products: [makeProduct({ cost_price: 1.5, sale_price: 2.0 })] });
      expect(useInventoryStore.getState().getFiltered()[0].is_low_margin).toBe(false);
    });

    it("uses product-level min_margin instead of default when set", () => {
      // cost=1.5, sale=2 → margin=0.25 > product min_margin=0.1 → not low
      useInventoryStore.setState({
        products: [makeProduct({ cost_price: 1.5, sale_price: 2.0, min_margin: 0.1 })],
      });
      expect(useInventoryStore.getState().getFiltered()[0].is_low_margin).toBe(false);
    });

    it("applies both category filter and search together", () => {
      useInventoryStore.setState({ selected_category_id: "cat-1", search_query: "agu" });
      const result = useInventoryStore.getState().getFiltered();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("p1");
    });
  });

  // ── getLowStock ────────────────────────────────────────────────────────────
  describe("getLowStock", () => {
    it("returns only products with stock <= min_stock", () => {
      useInventoryStore.setState({
        products: [
          makeProduct({ id: "p1", stock: 2, min_stock: 5 }),
          makeProduct({ id: "p2", stock: 10, min_stock: 5 }),
          makeProduct({ id: "p3", stock: 5, min_stock: 5 }), // boundary: equal
        ],
      });

      const result = useInventoryStore.getState().getLowStock();
      expect(result.map((p) => p.id).sort()).toEqual(["p1", "p3"]);
    });

    it("returns empty array when all products have adequate stock", () => {
      useInventoryStore.setState({ products: [makeProduct({ stock: 10, min_stock: 2 })] });
      expect(useInventoryStore.getState().getLowStock()).toHaveLength(0);
    });

    it("enriches returned products with category metadata", () => {
      useInventoryStore.setState({
        products: [makeProduct({ stock: 1, min_stock: 5 })],
        categories: [makeCategory()],
      });
      const result = useInventoryStore.getState().getLowStock();
      expect(result[0].category.name).toBe("Bebidas");
    });
  });
});
