import { create } from "zustand";
import type { Sale, CashRegister, CreateSaleInput } from "@/types";
import { saleService } from "@/services/firestore/sales";
import { cashRegisterService } from "@/services/firestore/cash-registers";
import { useAuthStore } from "@/stores/auth.store";
import { useInventoryStore } from "@/stores/inventory.store";

export const todayISO = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());

interface SalesState {
  sales: Sale[];
  register: CashRegister | null;
  is_loading: boolean;
  error: string | null;

  loadSales: (store_id: string) => Promise<void>;
  loadRegister: (store_id: string) => Promise<void>;
  createSale: (store_id: string, input: CreateSaleInput) => Promise<Sale>;
  closeRegister: (store_id: string) => Promise<void>;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  sales: [],
  register: null,
  is_loading: false,
  error: null,

  loadSales: async (store_id) => {
    set({ is_loading: true, error: null });
    try {
      const sales = await saleService.getRecent(store_id);
      set({ sales, is_loading: false });
    } catch (error) {
      console.error("Error cargando ventas:", error);
      set({ error: "Error cargando ventas", is_loading: false });
    }
  },

  loadRegister: async (store_id) => {
    set({ is_loading: true, error: null });
    try {
      const register = await cashRegisterService.getByDate(store_id, todayISO());
      set({ register, is_loading: false });
    } catch (error) {
      console.error("Error cargando caja:", error);
      set({ error: "Error cargando caja", is_loading: false });
    }
  },

  createSale: async (store_id, input) => {
    const user_id = useAuthStore.getState().user?.uid ?? "unknown";
    const sale = await saleService.create(store_id, user_id, input);

    set((s) => ({ sales: [sale, ...s.sales] }));

    const { register } = get();
    const key = `total_${input.payment_type}` as keyof CashRegister;
    set((s) => ({
      register: s.register
        ? {
            ...s.register,
            total_sales: s.register.total_sales + input.total,
            [key]: (s.register[key] as number) + input.total,
            sales_count: s.register.sales_count + 1,
          }
        : null,
    }));

    for (const item of input.items) {
      useInventoryStore.setState((s) => ({
        products: s.products.map((p) =>
          p.id === item.product_id ? { ...p, stock: p.stock - item.quantity } : p,
        ),
      }));
    }

    cashRegisterService
      .addSale(store_id, todayISO(), input.total, input.payment_type)
      .catch((err) => console.error("Error actualizando caja:", err));

    return sale;
  },

  closeRegister: async (store_id) => {
    await cashRegisterService.close(store_id, todayISO());
    set((s) => ({
      register: s.register ? { ...s.register, status: "closed", closed_at: new Date() } : null,
    }));
  },
}));
