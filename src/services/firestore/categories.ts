import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  type DocumentData,
} from "firebase/firestore";
import type { Category } from "@/types";
import { db } from "@/config/firebase.config";

const col = collection(db, "categories");

const fromFirestore = (id: string, data: DocumentData): Category => ({
  id,
  store_id: data.store_id,
  name: data.name,
  icon: data.icon,
  order: data.order,
  created_at: data.created_at?.toDate() ?? new Date(),
});

export const categoryService = {
  async getAll(store_id: string): Promise<Category[]> {
    const q = query(col, where("store_id", "==", store_id), orderBy("order"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },
};
