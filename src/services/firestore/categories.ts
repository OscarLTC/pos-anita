import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import type { Category, CreateCategoryInput } from "@/types";
import { db } from "@/config/firebase.config";
import { defaultCategoryColor } from "@/lib/colors";

const col = collection(db, "categories");

const fromFirestore = (id: string, data: DocumentData): Category => ({
  id,
  store_id: data.store_id,
  name: data.name,
  icon: data.icon,
  color: data.color ?? defaultCategoryColor(id),
  order: data.order,
  created_at: data.created_at?.toDate() ?? new Date(),
});

export const categoryService = {
  async getAll(store_id: string): Promise<Category[]> {
    const q = query(col, where("store_id", "==", store_id));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data())).sort((a, b) => a.order - b.order);
  },

  /**
   * Suscripción en tiempo real a las categorías de una tienda.
   * Devuelve la función para cancelar el listener.
   */
  subscribe(
    store_id: string,
    onChange: (categories: Category[]) => void,
    onError?: (error: Error) => void,
  ): () => void {
    const q = query(col, where("store_id", "==", store_id));
    return onSnapshot(
      q,
      (snap) =>
        onChange(
          snap.docs.map((d) => fromFirestore(d.id, d.data())).sort((a, b) => a.order - b.order),
        ),
      (error) => onError?.(error),
    );
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
