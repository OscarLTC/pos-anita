import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase.config";
import type { CashRegister, PaymentType } from "@/types";

const registerId = (store_id: string, date: string) => `${store_id}_${date}`;

const fromFirestore = (id: string, data: DocumentData): CashRegister => ({
  id,
  store_id: data.store_id,
  date: data.date,
  total_sales: data.total_sales ?? 0,
  total_cash: data.total_cash ?? 0,
  total_yape: data.total_yape ?? 0,
  total_plin: data.total_plin ?? 0,
  total_card: data.total_card ?? 0,
  sales_count: data.sales_count ?? 0,
  opened_at: data.opened_at?.toDate() ?? new Date(),
  closed_at: data.closed_at?.toDate() ?? undefined,
  status: data.status ?? "open",
});

export const cashRegisterService = {
  async getByDate(store_id: string, date: string): Promise<CashRegister | null> {
    const id = registerId(store_id, date);
    const snap = await getDoc(doc(db, "cash_registers", id));
    if (!snap.exists()) return null;
    return fromFirestore(snap.id, snap.data());
  },

  async addSale(
    store_id: string,
    date: string,
    total: number,
    payment_type: PaymentType,
  ): Promise<void> {
    const id = registerId(store_id, date);
    const ref = doc(db, "cash_registers", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        store_id,
        date,
        total_sales: total,
        total_cash: payment_type === "cash" ? total : 0,
        total_yape: payment_type === "yape" ? total : 0,
        total_plin: payment_type === "plin" ? total : 0,
        total_card: payment_type === "card" ? total : 0,
        sales_count: 1,
        opened_at: serverTimestamp(),
        status: "open",
      });
    } else {
      await updateDoc(ref, {
        total_sales: increment(total),
        [`total_${payment_type}`]: increment(total),
        sales_count: increment(1),
      });
    }
  },

  async close(store_id: string, date: string): Promise<void> {
    const id = registerId(store_id, date);
    await updateDoc(doc(db, "cash_registers", id), {
      status: "closed",
      closed_at: serverTimestamp(),
    });
  },
};
