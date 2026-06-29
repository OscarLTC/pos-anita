import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useMembersStore } from "@/stores/members.store";
import { initials, avatarColor } from "@/lib/format";
import { isValidEmail } from "@/lib/auth-errors";
import { ROLE_LABEL, ROLE_COLOR } from "@/lib/permissions";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { InviteRole, StoreInvite, StoreMember } from "@/types";

interface Props {
  onBack: () => void;
}

const displayName = (m: { name?: string; email: string }) =>
  m.name?.trim() || m.email.split("@")[0];

/** "Activo ahora", "Hace 12 min", "Hace 3 h", "Hace 2 d". */
function activeLabel(date?: Date): string {
  if (!date) return "Activo";
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 2) return "Activo ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}

export function UsersSheet({ onBack }: Props) {
  const user = useAuthStore((s) => s.user);
  const storeId = useAuthStore((s) => s.store?.id);

  const members = useMembersStore((s) => s.members);
  const invites = useMembersStore((s) => s.invites);
  const isLoading = useMembersStore((s) => s.is_loading);
  const load = useMembersStore((s) => s.load);
  const sendInvite = useMembersStore((s) => s.invite);
  const changeMemberRole = useMembersStore((s) => s.changeMemberRole);
  const changeInviteRole = useMembersStore((s) => s.changeInviteRole);
  const removeMember = useMembersStore((s) => s.removeMember);
  const cancelInvite = useMembersStore((s) => s.cancelInvite);

  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("cashier");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (storeId) load(storeId);
  }, [storeId, load]);

  const orderedMembers = useMemo(
    () =>
      [...members].sort((a, b) => {
        if (a.role === "owner") return -1;
        if (b.role === "owner") return 1;
        return a.joined_at.getTime() - b.joined_at.getTime();
      }),
    [members],
  );

  const totalCount = members.length + invites.length;
  const activeCount = members.length;

  const handleInvite = async () => {
    if (!storeId) return;
    const value = email.trim().toLowerCase();
    if (!isValidEmail(value)) {
      Alert.alert("Correo inválido", "Ingresa un correo válido.");
      return;
    }
    if (members.some((m) => m.email === value) || invites.some((i) => i.email === value)) {
      Alert.alert("Ya existe", "Ese correo ya es miembro o tiene una invitación pendiente.");
      return;
    }
    setSaving(true);
    try {
      await sendInvite(storeId, value, role);
      setEmail("");
      setRole("cashier");
      setInviting(false);
    } catch {
      Alert.alert("Error", "No se pudo enviar la invitación. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const memberMenu = useCallback(
    (m: StoreMember) => {
      const toRole: InviteRole = m.role === "cashier" ? "manager" : "cashier";
      Alert.alert(displayName(m), m.email, [
        {
          text: `Hacer ${ROLE_LABEL[toRole]}`,
          onPress: () => changeMemberRole(m, toRole).catch(() => {}),
        },
        {
          text: "Quitar de la tienda",
          style: "destructive",
          onPress: () =>
            Alert.alert("Quitar usuario", `¿Quitar a ${displayName(m)} de la tienda?`, [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Quitar",
                style: "destructive",
                onPress: () => removeMember(m).catch(() => {}),
              },
            ]),
        },
        { text: "Cerrar", style: "cancel" },
      ]);
    },
    [changeMemberRole, removeMember],
  );

  const inviteMenu = useCallback(
    (inv: StoreInvite) => {
      const toRole: InviteRole = inv.role === "cashier" ? "manager" : "cashier";
      Alert.alert(inv.email, "Invitación pendiente", [
        {
          text: `Hacer ${ROLE_LABEL[toRole]}`,
          onPress: () => changeInviteRole(inv, toRole).catch(() => {}),
        },
        {
          text: "Cancelar invitación",
          style: "destructive",
          onPress: () => cancelInvite(inv).catch(() => {}),
        },
        { text: "Cerrar", style: "cancel" },
      ]);
    },
    [changeInviteRole, cancelInvite],
  );

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      <TouchableOpacity style={s.back} onPress={onBack} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.inkMid} />
        <Text style={s.backText}>Cuenta</Text>
      </TouchableOpacity>

      <Text style={s.title}>Usuarios y permisos</Text>
      <Text style={s.subtitle}>
        {totalCount} {totalCount === 1 ? "miembro" : "miembros"} · {activeCount} activos
      </Text>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading && members.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <>
            {orderedMembers.map((m) => {
              const isYou = m.user_id === user?.uid;
              const canManage = m.role !== "owner" && !isYou;
              return (
                <View key={m.id} style={s.card}>
                  <View style={[s.avatar, { backgroundColor: avatarColor(m.email) }]}>
                    <Text style={s.avatarText}>{initials(displayName(m))}</Text>
                  </View>
                  <View style={s.cardInfo}>
                    <View style={s.nameRow}>
                      <Text style={s.name} numberOfLines={1}>
                        {displayName(m)}
                      </Text>
                      {isYou && (
                        <View style={s.youPill}>
                          <Text style={s.youText}>tú</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.email} numberOfLines={1}>
                      {m.email}
                    </Text>
                    <View style={s.metaRow}>
                      <View style={[s.roleChip, { backgroundColor: ROLE_COLOR[m.role] + "22" }]}>
                        <Text style={[s.roleText, { color: ROLE_COLOR[m.role] }]}>
                          {ROLE_LABEL[m.role].toUpperCase()}
                        </Text>
                      </View>
                      <Text style={s.status}>· {activeLabel(m.last_active_at)}</Text>
                    </View>
                  </View>
                  {canManage && (
                    <TouchableOpacity onPress={() => memberMenu(m)} hitSlop={8}>
                      <Ionicons name="ellipsis-horizontal" size={20} color={colors.inkSoft} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {invites.map((inv) => (
              <View key={inv.id} style={s.card}>
                <View style={[s.avatar, { backgroundColor: avatarColor(inv.email) }]}>
                  <Text style={s.avatarText}>{initials(inv.email.split("@")[0])}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.name} numberOfLines={1}>
                    {inv.email.split("@")[0]}
                  </Text>
                  <Text style={s.email} numberOfLines={1}>
                    {inv.email}
                  </Text>
                  <View style={s.metaRow}>
                    <View style={[s.roleChip, { backgroundColor: ROLE_COLOR[inv.role] + "22" }]}>
                      <Text style={[s.roleText, { color: ROLE_COLOR[inv.role] }]}>
                        {ROLE_LABEL[inv.role].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={s.statusPending}>· Invitación pendiente</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => inviteMenu(inv)} hitSlop={8}>
                  <Ionicons name="ellipsis-horizontal" size={20} color={colors.inkSoft} />
                </TouchableOpacity>
              </View>
            ))}

            {inviting ? (
              <View style={s.inviteCard}>
                <Text style={s.inviteTitle}>Invitar nuevo usuario</Text>
                <TextInput
                  style={s.input}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={colors.inkSoft}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={s.segment}>
                  {(["cashier", "manager"] as InviteRole[]).map((r) => {
                    const active = role === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[s.segmentBtn, active && s.segmentActive]}
                        onPress={() => setRole(r)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.segmentText, active && s.segmentTextActive]}>
                          {ROLE_LABEL[r]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={s.inviteActions}>
                  <TouchableOpacity
                    style={s.cancelBtn}
                    onPress={() => setInviting(false)}
                    disabled={saving}
                  >
                    <Text style={s.cancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.sendBtn, saving && s.sendDisabled]}
                    onPress={handleInvite}
                    disabled={saving}
                    activeOpacity={0.85}
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.primaryInk} />
                    ) : (
                      <Text style={s.sendText}>Enviar invitación</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={s.addBtn} onPress={() => setInviting(true)} activeOpacity={0.8}>
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={s.addText}>Invitar usuario</Text>
              </TouchableOpacity>
            )}

            <View style={s.legend}>
              <Text style={s.legendLine}>
                <Text style={s.legendRole}>Cajero</Text> puede vender, anotar fiados y cobrar abonos.
              </Text>
              <Text style={s.legendLine}>
                <Text style={s.legendRole}>Gerente</Text> además ve reportes y edita precios.
              </Text>
              <Text style={s.legendLine}>
                <Text style={s.legendRole}>Dueña</Text> tiene control total.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    flexShrink: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  back: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: spacing.sm },
  backText: { ...typography.body, color: colors.inkMid },
  title: { ...typography.display, fontSize: 26, color: colors.ink },
  subtitle: { ...typography.bodySm, color: colors.inkSoft, marginTop: 2, marginBottom: spacing.md },

  scroll: { flexShrink: 1 },
  scrollContent: { paddingBottom: spacing.lg, gap: spacing.sm },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.shadow,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontFamily: fontFamilies.display, fontSize: fontSize.sm },
  cardInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink, flexShrink: 1 },
  youPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.chipBg,
  },
  youText: { ...typography.caption, color: colors.chipInk, fontFamily: fontFamilies.display },
  email: { ...typography.bodySm, color: colors.inkSoft },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: 2 },
  roleChip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  roleText: { fontSize: 10, fontFamily: fontFamilies.display, letterSpacing: 0.5 },
  status: { ...typography.bodySm, color: colors.inkMid },
  statusPending: { ...typography.bodySm, color: colors.accentInk, opacity: 0.7 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
    backgroundColor: colors.chipBg,
  },
  addText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.primary },

  inviteCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.shadow,
  },
  inviteTitle: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  segmentActive: { backgroundColor: colors.surface, ...shadows.shadow },
  segmentText: { ...typography.bodySm, color: colors.inkMid },
  segmentTextActive: { fontFamily: fontFamilies.display, color: colors.ink },
  inviteActions: { flexDirection: "row", gap: spacing.md },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  sendBtn: {
    flex: 1.4,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.6 },
  sendText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.primaryInk },

  legend: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  legendLine: { ...typography.bodySm, color: colors.inkMid, lineHeight: 20 },
  legendRole: { fontFamily: fontFamilies.display, color: colors.ink },
});
