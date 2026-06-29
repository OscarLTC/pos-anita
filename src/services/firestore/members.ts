import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { storeService } from "@/services/firestore/stores";
import type { MemberRole, Store, StoreInvite, StoreMember, InviteRole } from "@/types";

const membersCol = collection(db, "store_members");
const invitesCol = collection(db, "store_invites");

const memberId = (store_id: string, user_id: string) => `${store_id}_${user_id}`;
const normEmail = (email: string) => email.trim().toLowerCase();
const inviteId = (store_id: string, email: string) => `${store_id}_${normEmail(email)}`;

const memberFrom = (id: string, d: DocumentData): StoreMember => ({
  id,
  store_id: d.store_id,
  user_id: d.user_id,
  email: d.email,
  name: d.name ?? undefined,
  role: d.role,
  joined_at: d.joined_at?.toDate() ?? new Date(),
  last_active_at: d.last_active_at?.toDate() ?? undefined,
});

const inviteFrom = (id: string, d: DocumentData): StoreInvite => ({
  id,
  store_id: d.store_id,
  email: d.email,
  role: d.role,
  invited_at: d.invited_at?.toDate() ?? new Date(),
  invited_by: d.invited_by ?? undefined,
});

interface SessionUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

export interface Access {
  store: Store;
  role: MemberRole;
}

export const memberService = {
  /** Miembros activos de una tienda. */
  async listMembers(store_id: string): Promise<StoreMember[]> {
    const snap = await getDocs(query(membersCol, where("store_id", "==", store_id)));
    return snap.docs
      .map((d) => memberFrom(d.id, d.data()))
      .sort((a, b) => a.joined_at.getTime() - b.joined_at.getTime());
  },

  /** Invitaciones pendientes de una tienda. */
  async listInvites(store_id: string): Promise<StoreInvite[]> {
    const snap = await getDocs(query(invitesCol, where("store_id", "==", store_id)));
    return snap.docs.map((d) => inviteFrom(d.id, d.data()));
  },

  /** Asegura el registro de membresía de la dueña (backfill para tiendas existentes). */
  async ensureOwnerMembership(store: Store, user: SessionUser): Promise<void> {
    const ref = doc(membersCol, memberId(store.id, store.owner_id));
    const snap = await getDoc(ref);
    if (snap.exists()) return;
    await setDoc(ref, {
      store_id: store.id,
      user_id: store.owner_id,
      email: user.email ? normEmail(user.email) : "",
      name: user.displayName ?? null,
      role: "owner" as MemberRole,
      joined_at: store.created_at ?? serverTimestamp(),
      last_active_at: serverTimestamp(),
    });
  },

  /** Crea/actualiza una invitación pendiente. */
  async invite(store_id: string, email: string, role: InviteRole, invited_by: string): Promise<void> {
    await setDoc(doc(invitesCol, inviteId(store_id, email)), {
      store_id,
      email: normEmail(email),
      role,
      invited_at: serverTimestamp(),
      invited_by,
    });
  },

  async cancelInvite(invite: StoreInvite): Promise<void> {
    await deleteDoc(doc(invitesCol, invite.id));
  },

  async changeInviteRole(invite: StoreInvite, role: InviteRole): Promise<void> {
    await updateDoc(doc(invitesCol, invite.id), { role });
  },

  async changeMemberRole(member: StoreMember, role: MemberRole): Promise<void> {
    await updateDoc(doc(membersCol, member.id), { role });
  },

  async removeMember(member: StoreMember): Promise<void> {
    await deleteDoc(doc(membersCol, member.id));
  },

  /**
   * Resuelve a qué tienda y con qué rol entra el usuario al iniciar sesión:
   * 1) si es dueño de una tienda (stores/{uid}); 2) si es miembro de otra;
   * 3) si tiene una invitación pendiente (la reclama); 4) si no, crea su tienda.
   *
   * El orden preserva el comportamiento previo: los dueños existentes resuelven
   * en el paso 1 exactamente igual que antes.
   */
  async resolveAccess(user: SessionUser): Promise<Access> {
    const owned = await storeService.getById(user.uid);
    if (owned) {
      this.touch(memberId(owned.id, user.uid));
      return { store: owned, role: "owner" };
    }

    const mineSnap = await getDocs(query(membersCol, where("user_id", "==", user.uid)));
    if (!mineSnap.empty) {
      const member = memberFrom(mineSnap.docs[0].id, mineSnap.docs[0].data());
      const store = await storeService.getById(member.store_id);
      if (store) {
        this.touch(member.id);
        return { store, role: member.role };
      }
    }

    if (user.email) {
      const email = normEmail(user.email);
      const invSnap = await getDocs(query(invitesCol, where("email", "==", email)));
      if (!invSnap.empty) {
        const invite = inviteFrom(invSnap.docs[0].id, invSnap.docs[0].data());
        const store = await storeService.getById(invite.store_id);
        if (store) {
          await setDoc(doc(membersCol, memberId(store.id, user.uid)), {
            store_id: store.id,
            user_id: user.uid,
            email,
            name: user.displayName ?? null,
            role: invite.role,
            joined_at: serverTimestamp(),
            last_active_at: serverTimestamp(),
          });
          await deleteDoc(doc(invitesCol, invite.id)).catch(() => {});
          return { store, role: invite.role };
        }
      }
    }

    const created = await storeService.ensureExists(user.uid);
    await this.ensureOwnerMembership(created, user);
    return { store: created, role: "owner" };
  },

  /** Marca actividad reciente del miembro (best-effort). */
  touch(id: string): void {
    updateDoc(doc(membersCol, id), { last_active_at: serverTimestamp() }).catch(() => {});
  },
};
