import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase.config";
import type { StockMovement, StockMovementType } from "@/types";

const col = collection(db, "stock_movements");

const fromFirestore = (id: string, data: DocumentData): StockMovement => ({
  id,
  store_id: data.store_id,
  product_id: data.product_id,
  type: data.type,
  delta: data.delta,
  created_at: data.created_at?.toDate() ?? new Date(),
});

export const stockMovementService = {
  /** Movimientos recientes de un producto, más nuevo primero. */
  async getRecentForProduct(
    store_id: string,
    product_id: string,
    count = 12,
  ): Promise<StockMovement[]> {
    // Dos filtros de igualdad (sin índice compuesto); ordenamos en cliente.
    const q = query(col, where("store_id", "==", store_id), where("product_id", "==", product_id));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => fromFirestore(d.id, d.data()))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, count);
  },

  async create(
    store_id: string,
    product_id: string,
    type: StockMovementType,
    delta: number,
  ): Promise<void> {
    await addDoc(col, { store_id, product_id, type, delta, created_at: serverTimestamp() });
  },
};
