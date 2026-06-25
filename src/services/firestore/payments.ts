import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
  increment,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase.config";
import type { Payment, CreatePaymentInput } from "@/types";

const col = collection(db, "payments");

const fromFirestore = (id: string, data: DocumentData): Payment => ({
  id,
  store_id: data.store_id,
  client_id: data.client_id,
  amount: data.amount,
  method: data.method,
  created_at: data.created_at?.toDate() ?? new Date(),
});

export const paymentService = {
  /** Todos los abonos de la tienda (más recientes primero). */
  async getAll(store_id: string): Promise<Payment[]> {
    const q = query(col, where("store_id", "==", store_id));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => fromFirestore(d.id, d.data()))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  },

  /**
   * Registra un abono y descuenta el monto de la deuda del cliente de forma
   * atómica (batch: doc de payment + clients.debt).
   */
  async create(store_id: string, input: CreatePaymentInput): Promise<Payment> {
    const batch = writeBatch(db);
    const ref = doc(col);
    const now = serverTimestamp();

    batch.set(ref, {
      store_id,
      client_id: input.client_id,
      amount: input.amount,
      method: input.method,
      created_at: now,
    });

    const clientRef = doc(db, "clients", input.client_id);
    batch.update(clientRef, { debt: increment(-input.amount), updated_at: now });

    await batch.commit();

    const snap = await getDoc(ref);
    return fromFirestore(snap.id, snap.data()!);
  },
};
