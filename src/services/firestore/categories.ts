import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import type { Category, CreateCategoryInput } from "@/types";
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
    const q = query(col, where("store_id", "==", store_id));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => fromFirestore(d.id, d.data()))
      .sort((a, b) => a.order - b.order);
  },

  async create(store_id: string, input: CreateCategoryInput, order: number): Promise<Category> {
    const ref = await addDoc(col, {
      ...input,
      store_id,
      order,
      created_at: serverTimestamp(),
    });
    const snap = await getDoc(ref);
    return fromFirestore(snap.id, snap.data()!);
  },

  async update(id: string, input: CreateCategoryInput): Promise<void> {
    await updateDoc(doc(col, id), input);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(col, id));
  },
};
