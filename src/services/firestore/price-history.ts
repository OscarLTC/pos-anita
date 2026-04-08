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
import type { PriceHistory, CreatePriceHistoryInput } from "@/types";

const col = collection(db, "price_history");

const fromFirestore = (id: string, data: DocumentData): PriceHistory => ({
  id,
  product_id: data.product_id,
  store_id: data.store_id,
  old_cost_price: data.old_cost_price,
  new_cost_price: data.new_cost_price,
  old_sale_price: data.old_sale_price,
  new_sale_price: data.new_sale_price,
  changed_by: data.changed_by,
  changed_at: data.changed_at?.toDate() ?? new Date(),
  note: data.note,
});

export const priceHistoryService = {
  async create(input: CreatePriceHistoryInput): Promise<void> {
    await addDoc(col, {
      ...input,
      changed_at: serverTimestamp(),
    });
  },

  async getByProduct(product_id: string, store_id: string): Promise<PriceHistory[]> {
    const q = query(
      col,
      where("product_id", "==", product_id),
      where("store_id", "==", store_id),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => fromFirestore(d.id, d.data()))
      .sort((a, b) => b.changed_at.getTime() - a.changed_at.getTime());
  },
};
