import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  increment,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase.config";
import type { Sale, CreateSaleInput } from "@/types";

const col = collection(db, "sales");

const fromFirestore = (id: string, data: DocumentData): Sale => ({
  id,
  store_id: data.store_id,
  created_by: data.created_by,
  items: data.items ?? [],
  total: data.total,
  payment_type: data.payment_type,
  status: data.status,
  note: data.note ?? undefined,
  created_at: data.created_at?.toDate() ?? new Date(),
  completed_at: data.completed_at?.toDate() ?? undefined,
});

export const saleService = {
  async create(
    store_id: string,
    created_by: string,
    input: CreateSaleInput,
  ): Promise<Sale> {
    const batch = writeBatch(db);
    const saleRef = doc(col);
    const now = serverTimestamp();

    batch.set(saleRef, {
      store_id,
      created_by,
      items: input.items,
      total: input.total,
      payment_type: input.payment_type,
      status: "completed",
      note: input.note ?? null,
      created_at: now,
      completed_at: now,
    });

    for (const item of input.items) {
      const productRef = doc(db, "products", item.product_id);
      batch.update(productRef, {
        stock: increment(-item.quantity),
        updated_at: now,
      });
    }

    await batch.commit();

    const snap = await getDoc(saleRef);
    return fromFirestore(snap.id, snap.data()!);
  },

  async getRecent(store_id: string, count = 50): Promise<Sale[]> {
    const q = query(
      col,
      where("store_id", "==", store_id),
      where("status", "==", "completed"),
      orderBy("created_at", "desc"),
      limit(count),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  async getByDate(store_id: string, date: string): Promise<Sale[]> {
    const start = new Date(date + "T00:00:00-05:00");
    const end = new Date(date + "T23:59:59-05:00");
    const q = query(
      col,
      where("store_id", "==", store_id),
      where("status", "==", "completed"),
      where("created_at", ">=", Timestamp.fromDate(start)),
      where("created_at", "<=", Timestamp.fromDate(end)),
      orderBy("created_at", "desc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  async getById(id: string): Promise<Sale | null> {
    const snap = await getDoc(doc(db, "sales", id));
    if (!snap.exists()) return null;
    return fromFirestore(snap.id, snap.data());
  },
};
