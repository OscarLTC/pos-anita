import { create } from "zustand";
import type { Payment, Sale, AbonoMethod } from "@/types";
import { saleService } from "@/services/firestore/sales";
import { paymentService } from "@/services/firestore/payments";
import { useClientsStore } from "@/stores/clients.store";

interface FiadosState {
  creditSales: Sale[];
  payments: Payment[];
  is_loading: boolean;

  /** Carga ventas a crédito + abonos de la tienda. */
  load: (store_id: string) => Promise<void>;
  /** Registra un abono (descuenta deuda) y refleja el cambio localmente. */
  addPayment: (
    store_id: string,
    client_id: string,
    amount: number,
    method: AbonoMethod,
  ) => Promise<void>;
  /** Añade al estado una venta a crédito recién creada (fiado manual o venta fiada). */
  pushCreditSale: (sale: Sale) => void;
}

export const useFiadosStore = create<FiadosState>((set) => ({
  creditSales: [],
  payments: [],
  is_loading: false,

  load: async (store_id) => {
    set({ is_loading: true });
    try {
      const [creditSales, payments] = await Promise.all([
        saleService.getCredit(store_id),
        paymentService.getAll(store_id),
      ]);
      set({ creditSales, payments, is_loading: false });
    } catch (error) {
      console.error("Error cargando fiados:", error);
      set({ is_loading: false });
    }
  },

  addPayment: async (store_id, client_id, amount, method) => {
    const payment = await paymentService.create(store_id, { client_id, amount, method });
    set((s) => ({ payments: [payment, ...s.payments] }));
    // Refleja el descuento de deuda en la store de clientes.
    useClientsStore.getState().applyDebt(client_id, -amount);
  },

  pushCreditSale: (sale) => set((s) => ({ creditSales: [sale, ...s.creditSales] })),
}));
