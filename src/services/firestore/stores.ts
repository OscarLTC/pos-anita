import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { DEFAULT_NOTIFICATIONS } from "@/lib/notifications";
import { DEFAULT_TICKETS } from "@/lib/receipt";
import type { Store, UpdateStoreInput } from "@/types";

const fromFirestore = (id: string, data: DocumentData): Store => ({
  id,
  name: data.name,
  owner_id: data.owner_id,
  currency: data.currency ?? "PEN",
  default_min_margin: data.default_min_margin ?? 0.2,
  round_weighted: data.round_weighted ?? false,
  ruc: data.ruc ?? undefined,
  phone: data.phone ?? undefined,
  address: data.address ?? undefined,
  district: data.district ?? undefined,
  open_time: data.open_time ?? undefined,
  close_time: data.close_time ?? undefined,
  logo_url: data.logo_url ?? undefined,
  notifications: { ...DEFAULT_NOTIFICATIONS, ...(data.notifications ?? {}) },
  tickets: { ...DEFAULT_TICKETS, ...(data.tickets ?? {}) },
  created_at: data.created_at?.toDate() ?? new Date(),
});

export const storeService = {
  async getById(id: string): Promise<Store | null> {
    const snap = await getDoc(doc(db, "stores", id));
    if (!snap.exists()) return null;
    return fromFirestore(snap.id, snap.data());
  },

  async ensureExists(userId: string): Promise<Store> {
    const ref = doc(db, "stores", userId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return fromFirestore(snap.id, snap.data());
    }

    await setDoc(ref, {
      name: "Mi Tienda",
      owner_id: userId,
      currency: "PEN",
      default_min_margin: 0.2,
      round_weighted: false,
      created_at: serverTimestamp(),
    });

    return {
      id: userId,
      name: "Mi Tienda",
      owner_id: userId,
      currency: "PEN",
      default_min_margin: 0.2,
      round_weighted: false,
      created_at: new Date(),
    };
  },

  async update(id: string, input: UpdateStoreInput): Promise<void> {
    await updateDoc(doc(db, "stores", id), input);
  },
};
