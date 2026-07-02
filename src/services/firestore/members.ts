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
  store_name: d.store_name ?? "",
  email: d.email ?? undefined,
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

  /**
   * Crea una invitación con token aleatorio (el id del doc) y la devuelve.
   * El token es el secreto del link `posanita://invite/{token}`.
   */
  async invite(
    store_id: string,
    store_name: string,
    role: InviteRole,
    invited_by: string,
    email?: string,
  ): Promise<StoreInvite> {
    const ref = doc(invitesCol);
    const normalized = email ? normEmail(email) : null;
    await setDoc(ref, {
      store_id,
      store_name,
      email: normalized,
      role,
      invited_at: serverTimestamp(),
      invited_by,
    });
    return {
      id: ref.id,
      store_id,
      store_name,
      email: normalized ?? undefined,
      role,
      invited_at: new Date(),
      invited_by,
    };
  },

  /** Lee una invitación por token (para la pantalla de aceptación). */
  async getInvite(token: string): Promise<StoreInvite | null> {
    const snap = await getDoc(doc(invitesCol, token));
    if (!snap.exists()) return null;
    return inviteFrom(snap.id, snap.data());
  },

  /**
   * Acepta una invitación: crea la membresía (las reglas la autorizan con el token)
   * y consume la invitación. La tienda se lee DESPUÉS de unirse (recién entonces
   * el usuario tiene permiso de lectura).
   */
  async acceptInvite(token: string, user: SessionUser): Promise<Access | null> {
    const snap = await getDoc(doc(invitesCol, token));
    if (!snap.exists()) return null;
    const invite = inviteFrom(snap.id, snap.data());

    await setDoc(doc(membersCol, memberId(invite.store_id, user.uid)), {
      store_id: invite.store_id,
      user_id: user.uid,
      email: user.email ? normEmail(user.email) : "",
      name: user.displayName ?? null,
      role: invite.role,
      invite_token: token,
      joined_at: serverTimestamp(),
      last_active_at: serverTimestamp(),
    });
    await deleteDoc(doc(invitesCol, token)).catch(() => {});

    const store = await storeService.getById(invite.store_id);
    if (!store) return null;
    return { store, role: invite.role };
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

  /** Borra todas las membresías de un usuario (en cualquier tienda). */
  async removeAllMembershipsOf(userId: string): Promise<void> {
    const snap = await getDocs(query(membersCol, where("user_id", "==", userId)));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  },

  /**
   * Todas las tiendas a las que el usuario tiene acceso, con su rol en cada una.
   * Es la base del modelo multi-tienda: un usuario puede ser dueño de la suya y
   * a la vez cajero/gerente en otras. NO crea ninguna tienda (ver createOwnStore).
   *
   * Incluye un backfill: si posee una tienda (stores/{uid}) sin registro de
   * membresía (tiendas creadas antes de este modelo), lo agrega al vuelo.
   */
  async listAccess(user: SessionUser): Promise<Access[]> {
    const snap = await getDocs(query(membersCol, where("user_id", "==", user.uid)));
    const accesses: Access[] = [];
    const seen = new Set<string>();

    for (const d of snap.docs) {
      const member = memberFrom(d.id, d.data());
      if (seen.has(member.store_id)) continue;
      const store = await storeService.getById(member.store_id);
      if (!store) continue;
      accesses.push({ store, role: member.role });
      seen.add(member.store_id);
      this.touch(member.id);
    }

    if (!seen.has(user.uid)) {
      const owned = await storeService.getById(user.uid);
      if (owned) {
        await this.ensureOwnerMembership(owned, user).catch(() => {});
        accesses.push({ store: owned, role: "owner" });
      }
    }

    return accesses;
  },

  /**
   * Crea (si no existe) la tienda propia del usuario y su membresía de dueña.
   * Se usa como fallback cuando el usuario no pertenece a ninguna tienda.
   */
  async createOwnStore(user: SessionUser): Promise<Access> {
    const created = await storeService.ensureExists(user.uid);
    await this.ensureOwnerMembership(created, user);
    this.touch(memberId(created.id, user.uid));
    return { store: created, role: "owner" };
  },

  /** Marca actividad reciente del miembro (best-effort). */
  touch(id: string): void {
    updateDoc(doc(membersCol, id), { last_active_at: serverTimestamp() }).catch(() => {});
  },
};
