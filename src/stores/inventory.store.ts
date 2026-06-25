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
import { stockMovementService } from "@/services/firestore/stock-movements";
import { useAuthStore } from "@/stores/auth.store";

interface InventoryState {
  products: Product[];
  categories: Category[];
  is_loading: boolean;
  error: string | null;
  selected_category_id: string | null;
  search_query: string;

  subscribe: (store_id: string) => void;
  unsubscribe: () => void;
  setSelectedCategory: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  addCategory: (store_id: string, input: CreateCategoryInput) => Promise<void>;
  updateCategory: (id: string, input: CreateCategoryInput) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  addProduct: (store_id: string, input: CreateProductInput) => Promise<void>;
  updateProduct: (id: string, input: UpdateProductInput) => Promise<void>;
  adjustStock: (product: Product, delta: number) => Promise<void>;
  archiveProduct: (id: string) => Promise<void>;

  getFiltered: () => ProductWithMeta[];
  getLowStock: () => ProductWithMeta[];
}

const FALLBACK_CATEGORY: Category = {
  id: "",
  store_id: "",
  name: "Sin categoría",
  icon: "📦",
  color: "#929C94",
  order: 0,
  created_at: new Date(),
};

const toMeta = (
  product: Product,
  categories: Category[],
  default_min_margin: number,
): ProductWithMeta => {
  const category = categories.find((c) => c.id === product.category_id) ?? FALLBACK_CATEGORY;
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

// Listeners activos fuera del estado: no son datos renderizables.
let unsubProducts: (() => void) | null = null;
let unsubCategories: (() => void) | null = null;

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  categories: [],
  is_loading: false,
  error: null,
  selected_category_id: null,
  search_query: "",

  subscribe: (store_id) => {
    // Evita listeners duplicados si ya había una suscripción activa.
    get().unsubscribe();
    set({ is_loading: true, error: null });

    // Apagamos el loading recién cuando ambas colecciones emitieron una vez.
    let products_ready = false;
    let categories_ready = false;
    const settle = () => {
      if (products_ready && categories_ready) set({ is_loading: false });
    };
    const onError = (label: string) => (error: Error) => {
      console.error(`Error escuchando ${label}:`, error);
      set({ error: "Error cargando inventario", is_loading: false });
    };

    unsubProducts = productService.subscribe(
      store_id,
      (products) => {
        products_ready = true;
        set({ products });
        settle();
      },
      onError("productos"),
    );

    unsubCategories = categoryService.subscribe(
      store_id,
      (categories) => {
        categories_ready = true;
        set({ categories });
        settle();
      },
      onError("categorías"),
    );
  },

  unsubscribe: () => {
    unsubProducts?.();
    unsubCategories?.();
    unsubProducts = null;
    unsubCategories = null;
  },

  setSelectedCategory: (id) => set({ selected_category_id: id }),
  setSearchQuery: (q) => set({ search_query: q }),

  // Las mutaciones solo escriben en Firestore; el listener reconcilia el estado
  // local (con latency compensation el cambio se refleja al instante).
  addCategory: async (store_id, input) => {
    const { categories } = get();
    await categoryService.create(store_id, input, categories.length);
  },

  updateCategory: async (id, input) => {
    await categoryService.update(id, input);
  },

  removeCategory: async (id) => {
    await categoryService.remove(id);
  },

  addProduct: async (store_id, input) => {
    await productService.create(store_id, input);
  },

  updateProduct: async (id, input) => {
    const changed_by = useAuthStore.getState().user?.uid ?? "unknown";
    await productService.update(id, input, changed_by);
  },

  adjustStock: async (product, delta) => {
    if (delta === 0) return;
    await productService.updateStock(product.id, delta);
    await stockMovementService.create(
      product.store_id,
      product.id,
      delta > 0 ? "restock" : "adjustment",
      delta,
    );
  },

  archiveProduct: async (id) => {
    await productService.archive(id);
  },

  getFiltered: () => {
    const { products, categories, selected_category_id, search_query } = get();
    const default_min_margin = useAuthStore.getState().store?.default_min_margin ?? 0.2;
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
    const default_min_margin = useAuthStore.getState().store?.default_min_margin ?? 0.2;
    return products
      .filter((p) => p.stock <= p.min_stock)
      .map((p) => toMeta(p, categories, default_min_margin));
  },
}));
