import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { soles, initials, avatarColor } from "@/lib/format";
import { apunteTitle, daysBadge, shortDate, type Apunte } from "@/lib/fiados";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { Client } from "@/types";

interface Props {
  client: Client | null;
  apuntes: Apunte[];
  frequent: boolean;
  onClose: () => void;
  onCobrar: () => void;
  onAvisar: () => void;
  onEdit: () => void;
}

export function ClientDetailSheet({
  client,
  apuntes,
  frequent,
  onClose,
  onCobrar,
  onAvisar,
  onEdit,
}: Props) {
  const sub = client
    ? [client.nickname ? `"${client.nickname}"` : null, client.phone]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <BottomSheet visible={!!client} onClose={onClose}>
      {client && (
        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.header}>
            <Text style={s.title}>Cliente</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <View style={s.profile}>
            <View style={[s.avatar, { backgroundColor: avatarColor(client.name) }]}>
              <Text style={s.avatarText}>{initials(client.name)}</Text>
            </View>
            <View style={s.profileInfo}>
              <Text style={s.name} numberOfLines={2}>
                {client.name}
              </Text>
              <TouchableOpacity
                style={s.subRow}
                onPress={onEdit}
                hitSlop={6}
                activeOpacity={0.6}
              >
                <Text style={s.sub} numberOfLines={1}>
                  {sub || "Agregar apodo o teléfono"}
                </Text>
                <Feather name="edit-2" size={13} color={colors.inkSoft} />
              </TouchableOpacity>
            </View>
            {frequent && (
              <View style={s.freqPill}>
                <Text style={s.freqText}>Frecuente</Text>
              </View>
            )}
          </View>

          <View style={s.card}>
            <View style={s.saldoRow}>
              <Text style={s.saldoLabel}>SALDO DEUDOR</Text>
              <Text style={s.saldoValue}>{soles(client.debt)}</Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity
                style={[s.cobrarBtn, client.debt <= 0 && s.btnDisabled]}
                onPress={onCobrar}
                disabled={client.debt <= 0}
                activeOpacity={0.85}
              >
                <Ionicons name="cash-outline" size={18} color={colors.primaryInk} />
                <Text style={s.cobrarText}>Cobrar abono</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.avisarBtn, !client.phone && s.btnDisabled]}
                onPress={onAvisar}
                disabled={!client.phone}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={s.avisarText}>Avisar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={s.histLabel}>
            HISTORIAL · {apuntes.length} {apuntes.length === 1 ? "APUNTE" : "APUNTES"}
          </Text>
          <ScrollView
            style={s.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
          >
            {apuntes.map(({ sale, abonado }) => (
              <View key={sale.id} style={s.apunte}>
                <View style={s.dayBadge}>
                  <Text style={s.dayBadgeText}>{daysBadge(sale.created_at)}</Text>
                </View>
                <View style={s.apunteInfo}>
                  <Text style={s.apunteTitle} numberOfLines={1}>
                    {apunteTitle(sale)}
                  </Text>
                  <Text style={s.apunteMeta} numberOfLines={1}>
                    {shortDate(sale.created_at)}
                    {abonado > 0 && (
                      <Text style={s.abonado}> · abonado {soles(abonado)}</Text>
                    )}
                  </Text>
                </View>
                <Text style={s.apunteAmount}>{soles(sale.total)}</Text>
              </View>
            ))}
            {apuntes.length === 0 && (
              <Text style={s.empty}>Este cliente aún no tiene apuntes.</Text>
            )}
          </ScrollView>
        </View>
      )}
    </BottomSheet>
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
    paddingBottom: spacing.xxl,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: { ...typography.title, color: colors.ink },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontFamily: fontFamilies.display, fontSize: fontSize.lg },
  profileInfo: { flex: 1, gap: 2 },
  name: {
    fontFamily: fontFamilies.display,
    fontSize: fontSize.lg,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  sub: { ...typography.bodySm, color: colors.inkSoft, flexShrink: 1 },
  freqPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.chipBg,
  },
  freqText: { ...typography.caption, color: colors.chipInk, fontFamily: fontFamilies.display },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.shadow,
  },
  saldoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saldoLabel: { ...typography.caption, color: colors.inkSoft, letterSpacing: 1 },
  saldoValue: {
    fontFamily: fontFamilies.display,
    fontSize: fontSize.xxl,
    color: colors.danger,
    letterSpacing: -0.5,
  },
  actions: { flexDirection: "row", gap: spacing.sm },
  cobrarBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  cobrarText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.primaryInk },
  avisarBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "#25D366",
  },
  avisarText: { ...typography.body, fontFamily: fontFamilies.display, color: "#fff" },
  btnDisabled: { opacity: 0.4 },
  histLabel: {
    ...typography.caption,
    color: colors.inkSoft,
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: { flexShrink: 1 },
  listContent: { gap: spacing.sm },
  apunte: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeText: { ...typography.caption, color: colors.inkMid, fontFamily: fontFamilies.display },
  apunteInfo: { flex: 1, gap: 2 },
  apunteTitle: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  apunteMeta: { ...typography.caption, color: colors.inkSoft },
  abonado: { color: colors.primary },
  apunteAmount: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  empty: {
    ...typography.body,
    color: colors.inkSoft,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
});
