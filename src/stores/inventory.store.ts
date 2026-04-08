import { create } from "zustand";
import type {
  Product,
  Category,
  ProductWithMeta,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
} from "@/types";
import { productService } from "@/services/firestore/products";
import { categoryService } from "@/services/firestore/categories";
import { useAuthStore } from "@/stores/auth.store";

interface InventoryState {
  products: Product[];
  categories: Category[];
  is_loading: boolean;
  error: string | null;
  selected_category_id: string | null;
  search_query: string;

  loadInventory: (store_id: string) => Promise<void>;
  setSelectedCategory: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  addCategory: (store_id: string, input: CreateCategoryInput) => Promise<void>;
  updateCategory: (id: string, input: CreateCategoryInput) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  addProduct: (store_id: string, input: CreateProductInput) => Promise<void>;
  updateProduct: (id: string, input: UpdateProductInput) => Promise<void>;
  archiveProduct: (id: string) => Promise<void>;

  getFiltered: () => ProductWithMeta[];
  getLowStock: () => ProductWithMeta[];
}

const FALLBACK_CATEGORY: Category = {
  id: "",
  store_id: "",
  name: "Sin categoría",
  icon: "📦",
  order: 0,
  created_at: new Date(),
};

const toMeta = (
  product: Product,
  categories: Category[],
  default_min_margin: number,
): ProductWithMeta => {
  const category =
    categories.find((c) => c.id === product.category_id) ?? FALLBACK_CATEGORY;
  const margin_amount = product.sale_price - product.cost_price;
  const margin = product.sale_price > 0 ? margin_amount / product.sale_price : 0;
  const effective_min_margin = product.min_margin ?? default_min_margin;

  return {
    ...product,
    category,
    margin_amount,
    margin,
    is_low_stock: product.stock <= product.min_stock,
    is_low_margin: margin < effective_min_margin,
  };
};

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  categories: [],
  is_loading: false,
  error: null,
  selected_category_id: null,
  search_query: "",

  loadInventory: async (store_id) => {
    set({ is_loading: true, error: null });
    try {
      const [products, categories] = await Promise.all([
        productService.getAll(store_id),
        categoryService.getAll(store_id),
      ]);
      set({ products, categories, is_loading: false });
    } catch (error) {
      console.error("Error cargando inventario:", error);
      set({ error: "Error cargando inventario", is_loading: false });
    }
  },

  setSelectedCategory: (id) => set({ selected_category_id: id }),
  setSearchQuery: (q) => set({ search_query: q }),

  addCategory: async (store_id, input) => {
    const { categories } = get();
    const category = await categoryService.create(store_id, input, categories.length);
    set((s) => ({ categories: [...s.categories, category] }));
  },

  updateCategory: async (id, input) => {
    await categoryService.update(id, input);
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...input } : c)),
    }));
  },

  removeCategory: async (id) => {
    await categoryService.remove(id);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },

  addProduct: async (store_id, input) => {
    const product = await productService.create(store_id, input);
    set((s) => ({ products: [...s.products, product] }));
  },

  updateProduct: async (id, input) => {
    const changed_by = useAuthStore.getState().user?.uid ?? "unknown";
    await productService.update(id, input, changed_by);
    set((s) => ({
      products: s.products.map((p) =>
        p.id === id ? { ...p, ...input, updated_at: new Date() } : p,
      ),
    }));
  },

  archiveProduct: async (id) => {
    await productService.archive(id);
    set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
  },

  getFiltered: () => {
    const { products, categories, selected_category_id, search_query } = get();
    const default_min_margin =
      useAuthStore.getState().store?.default_min_margin ?? 0.2;
    return products
      .filter(
        (p) =>
          (!selected_category_id || p.category_id === selected_category_id) &&
          (!search_query ||
            p.name.toLowerCase().includes(search_query.toLowerCase()) ||
            p.barcode === search_query),
      )
      .map((p) => toMeta(p, categories, default_min_margin));
  },

  getLowStock: () => {
    const { products, categories } = get();
    const default_min_margin =
      useAuthStore.getState().store?.default_min_margin ?? 0.2;
    return products
      .filter((p) => p.stock <= p.min_stock)
      .map((p) => toMeta(p, categories, default_min_margin));
  },
}));
