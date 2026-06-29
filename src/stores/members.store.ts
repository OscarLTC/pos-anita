import { create } from "zustand";
import type { StoreInvite, StoreMember, MemberRole, InviteRole } from "@/types";
import { memberService } from "@/services/firestore/members";
import { useAuthStore } from "@/stores/auth.store";

interface MembersState {
  members: StoreMember[];
  invites: StoreInvite[];
  is_loading: boolean;
  load: (store_id: string) => Promise<void>;
  invite: (store_id: string, email: string, role: InviteRole) => Promise<StoreInvite>;
  changeMemberRole: (member: StoreMember, role: MemberRole) => Promise<void>;
  changeInviteRole: (invite: StoreInvite, role: InviteRole) => Promise<void>;
  removeMember: (member: StoreMember) => Promise<void>;
  cancelInvite: (invite: StoreInvite) => Promise<void>;
}

export const useMembersStore = create<MembersState>((set, get) => ({
  members: [],
  invites: [],
  is_loading: false,

  load: async (store_id) => {
    set({ is_loading: true });
    try {
      const user = useAuthStore.getState().user;
      const store = useAuthStore.getState().store;
      // Asegura que la dueña aparezca en la lista (backfill de tiendas previas).
      if (store && user) {
        await memberService
          .ensureOwnerMembership(store, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          })
          .catch(() => {});
      }
      const [members, invites] = await Promise.all([
        memberService.listMembers(store_id),
        memberService.listInvites(store_id),
      ]);
      set({ members, invites, is_loading: false });
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      set({ is_loading: false });
    }
  },

  invite: async (store_id, email, role) => {
    const auth = useAuthStore.getState();
    const invited_by = auth.user?.uid ?? "";
    const store_name = auth.store?.name ?? "Mi negocio";
    const invite = await memberService.invite(
      store_id,
      store_name,
      role,
      invited_by,
      email || undefined,
    );
    set((s) => ({ invites: [...s.invites, invite] }));
    return invite;
  },

  changeMemberRole: async (member, role) => {
    await memberService.changeMemberRole(member, role);
    set((s) => ({
      members: s.members.map((m) => (m.id === member.id ? { ...m, role } : m)),
    }));
  },

  changeInviteRole: async (invite, role) => {
    await memberService.changeInviteRole(invite, role);
    set((s) => ({
      invites: s.invites.map((i) => (i.id === invite.id ? { ...i, role } : i)),
    }));
  },

  removeMember: async (member) => {
    await memberService.removeMember(member);
    set((s) => ({ members: s.members.filter((m) => m.id !== member.id) }));
  },

  cancelInvite: async (invite) => {
    await memberService.cancelInvite(invite);
    set((s) => ({ invites: s.invites.filter((i) => i.id !== invite.id) }));
  },
}));
