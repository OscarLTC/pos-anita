import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  increment,
  type DocumentData,
} from "firebase/firestore";
import type { Client, CreateClientInput } from "@/types";
import { db } from "@/config/firebase.config";

const col = collection(db, "clients");

const fromFirestore = (id: string, data: DocumentData): Client => ({
  id,
  store_id: data.store_id,
  name: data.name,
  nickname: data.nickname ?? undefined,
  phone: data.phone ?? undefined,
  debt: data.debt ?? 0,
  created_at: data.created_at?.toDate() ?? new Date(),
  updated_at: data.updated_at?.toDate() ?? new Date(),
});

export const clientService = {
  async getAll(store_id: string): Promise<Client[]> {
    const q = query(col, where("store_id", "==", store_id));
    const snap = await getDocs(q);
    // Mayor deuda primero; sin deuda al final, alfabético como desempate.
    return snap.docs
      .map((d) => fromFirestore(d.id, d.data()))
      .sort((a, b) => b.debt - a.debt || a.name.localeCompare(b.name));
  },

  async create(store_id: string, input: CreateClientInput): Promise<Client> {
    const now = serverTimestamp();
    const ref = await addDoc(col, {
      store_id,
      name: input.name,
      nickname: input.nickname ?? null,
      phone: input.phone ?? null,
      debt: 0,
      created_at: now,
      updated_at: now,
    });
    const snap = await getDoc(ref);
    return fromFirestore(snap.id, snap.data()!);
  },

  /** Ajusta la deuda (positivo suma, negativo abona). */
  async adjustDebt(id: string, amount: number): Promise<void> {
    await updateDoc(doc(col, id), { debt: increment(amount), updated_at: serverTimestamp() });
  },
};
