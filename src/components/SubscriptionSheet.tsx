import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useInventoryStore } from "@/stores/inventory.store";
import { useMembersStore } from "@/stores/members.store";
import { useClientsStore } from "@/stores/clients.store";
import { saleService } from "@/services/firestore/sales";
import { FREE_LIMITS, PRO_PLAN, monthYearLabel } from "@/config/plans";
import { periodRange } from "@/lib/reports";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";

interface Props {
  onBack: () => void;
}

export function SubscriptionSheet({ onBack }: Props) {
  const store = useAuthStore((s) => s.store);
  const storeId = store?.id;

  const products = useInventoryStore((s) => s.products);
  const members = useMembersStore((s) => s.members);
  const invites = useMembersStore((s) => s.invites);
  const loadMembers = useMembersStore((s) => s.load);
  const clients = useClientsStore((s) => s.clients);
  const loadClients = useClientsStore((s) => s.loadClients);

  const [salesMonth, setSalesMonth] = useState<number | null>(null);

  useEffect(() => {
    if (!storeId) return;
    loadMembers(storeId);
    loadClients(storeId);
    const { start, end } = periodRange("month");
    saleService
      .countByRange(storeId, start, end)
      .then(setSalesMonth)
      .catch(() => setSalesMonth(null));
  }, [storeId, loadMembers, loadClients]);

  const usage = useMemo(
    () => [
      { label: "Productos", value: products.filter((p) => p.status !== "archived").length, limit: FREE_LIMITS.products },
      { label: "Usuarios", value: members.length + invites.length, limit: FREE_LIMITS.users },
      { label: "Ventas/mes", value: salesMonth ?? 0, limit: FREE_LIMITS.sales_month },
      { label: "Clientes con fiado", value: clients.filter((c) => c.debt > 0).length, limit: FREE_LIMITS.fiado_clients },
    ],
    [products, members, invites, salesMonth, clients],
  );

  const since = store?.created_at ? monthYearLabel(store.created_at) : "";

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      <TouchableOpacity style={s.back} onPress={onBack} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.inkMid} />
        <Text style={s.backText}>Cuenta</Text>
      </TouchableOpacity>

      <Text style={s.title}>Suscripción</Text>
      <Text style={s.subtitle}>Tu plan actual y opciones</Text>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan actual */}
        <View style={s.card}>
          <View style={s.planHead}>
            <Text style={s.eyebrow}>PLAN ACTUAL</Text>
            {!!since && (
              <View style={s.sincePill}>
                <Text style={s.sinceText}>desde {since}</Text>
              </View>
            )}
          </View>
          <Text style={s.planName}>Gratis</Text>

          <View style={s.usageList}>
            {usage.map((u) => {
              const atLimit = u.value >= u.limit;
              const ratio = u.limit > 0 ? Math.min(1, u.value / u.limit) : 0;
              return (
                <View key={u.label} style={s.usageRow}>
                  <View style={s.usageTop}>
                    <Text style={s.usageLabel}>{u.label}</Text>
                    <Text style={[s.usageValue, atLimit && s.usageValueDanger]}>
                      {u.value} / {u.limit}
                    </Text>
                  </View>
                  <View style={s.track}>
                    <View
                      style={[
                        s.fill,
                        { width: `${ratio * 100}%`, backgroundColor: atLimit ? colors.danger : colors.primary },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Caserita Pro */}
        <View style={s.proCard}>
          <View style={s.proHead}>
            <View style={s.recoPill}>
              <Text style={s.recoText}>Recomendado</Text>
            </View>
            <View style={s.priceWrap}>
              <Text style={s.price}>S/ {PRO_PLAN.price}</Text>
              <Text style={s.priceUnit}>/mes</Text>
            </View>
          </View>

          <Text style={s.proName}>{PRO_PLAN.name}</Text>
          <Text style={s.proTagline}>{PRO_PLAN.tagline}</Text>

          <View style={s.features}>
            {PRO_PLAN.features.map((f) => (
              <View key={f} style={s.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={s.tryBtn}
            onPress={() =>
              Alert.alert("Próximamente", "La suscripción a Caserita Pro estará disponible pronto.")
            }
            activeOpacity={0.85}
          >
            <Text style={s.tryText}>Probar {PRO_PLAN.trialDays} días gratis</Text>
          </TouchableOpacity>
          <Text style={s.tryNote}>Sin tarjeta. Cancela cuando quieras.</Text>
        </View>

        <Text style={s.footer}>
          ¿Tienes varias bodegas o más de {FREE_LIMITS.users} cajeros? Hablemos del{" "}
          <Text
            style={s.footerLink}
            onPress={() =>
              Alert.alert("Plan Negocio", "Escríbenos para un plan a la medida. Muy pronto.")
            }
          >
            plan Negocio
          </Text>
          .
        </Text>
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
  scrollContent: { paddingBottom: spacing.lg, gap: spacing.md },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.shadow,
  },
  planHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { ...typography.caption, color: colors.inkSoft, letterSpacing: 1 },
  sincePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  sinceText: { ...typography.caption, color: colors.inkMid },
  planName: {
    fontFamily: fontFamilies.display,
    fontSize: fontSize.xxl,
    color: colors.ink,
    letterSpacing: -0.5,
    marginTop: 2,
    marginBottom: spacing.md,
  },

  usageList: { gap: spacing.md },
  usageRow: { gap: spacing.xs },
  usageTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  usageLabel: { ...typography.body, color: colors.ink },
  usageValue: { ...typography.bodySm, fontFamily: fontFamilies.display, color: colors.inkMid },
  usageValueDanger: { color: colors.danger },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 3 },

  proCard: {
    backgroundColor: "rgba(242,199,68,0.14)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(242,199,68,0.5)",
    padding: spacing.lg,
  },
  proHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  recoPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(242,199,68,0.35)",
  },
  recoText: { ...typography.caption, color: "#7A5E00", fontFamily: fontFamilies.display },
  priceWrap: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  price: { fontFamily: fontFamilies.display, fontSize: fontSize.xxl, color: colors.ink, letterSpacing: -0.5 },
  priceUnit: { ...typography.bodySm, color: colors.inkMid },

  proName: { fontFamily: fontFamilies.display, fontSize: fontSize.xl, color: colors.ink, marginTop: spacing.sm },
  proTagline: { ...typography.bodySm, color: colors.inkMid, marginBottom: spacing.md },

  features: { gap: spacing.sm, marginBottom: spacing.lg },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureText: { ...typography.body, color: colors.ink, flex: 1 },

  tryBtn: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  tryText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.accentInk, fontSize: fontSize.md },
  tryNote: { ...typography.caption, color: colors.inkSoft, textAlign: "center", marginTop: spacing.sm },

  footer: {
    ...typography.bodySm,
    color: colors.inkSoft,
    textAlign: "center",
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  footerLink: { fontFamily: fontFamilies.display, color: colors.ink },
});
