import { create } from "zustand";
import type { Sale } from "@/types";
import { saleService } from "@/services/firestore/sales";
import { useClientsStore } from "@/stores/clients.store";
import { reportWindow } from "@/lib/reports";

interface ReportsState {
  /** Ventas crudas de la ventana (mes anterior → hoy); la pantalla deriva las métricas. */
  sales: Sale[];
  is_loading: boolean;
  error: string | null;
  load: (store_id: string) => Promise<void>;
  /** Anula una venta y la quita del listado local. */
  voidSale: (sale: Sale) => Promise<void>;
}

export const useReportsStore = create<ReportsState>((set) => ({
  sales: [],
  is_loading: false,
  error: null,

  load: async (store_id) => {
    set({ is_loading: true, error: null });
    try {
      const { start, end } = reportWindow();
      const sales = await saleService.getByRange(store_id, start, end);
      set({ sales, is_loading: false });
    } catch (error) {
      console.error("Error cargando reportes:", error);
      set({ error: "Error cargando reportes", is_loading: false });
    }
  },

  voidSale: async (sale) => {
    await saleService.voidSale(sale);
    set((s) => ({ sales: s.sales.filter((x) => x.id !== sale.id) }));
    // Refleja el alivio de deuda en el resto de la app (Fiados/Clientes).
    if (sale.payment_type === "credit" && sale.client_id) {
      useClientsStore.getState().applyDebt(sale.client_id, -sale.total);
    }
  },
}));
