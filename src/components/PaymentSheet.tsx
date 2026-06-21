import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { PAYMENT_METHODS, type PaymentMethod } from "@/config/payment-methods";
import { soles } from "@/lib/format";
import { colors, spacing, radius, typography, fontSize, fontFamilies } from "@/theme";

interface Props {
  visible: boolean;
  total: number;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
  loading?: boolean;
}

export function PaymentSheet({ visible, total, onClose, onSelect, loading }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={s.sheet}>
        <View style={s.handle} />

        <View style={s.header}>
          <Text style={s.title}>¿Cómo pagan?</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <View style={s.totalWrap}>
          <Text style={s.totalLabel}>COBRAR</Text>
          <Text style={s.totalValue}>{soles(total)}</Text>
        </View>

        <View style={s.grid}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={s.card}
              activeOpacity={0.8}
              disabled={loading}
              onPress={() => onSelect(method)}
            >
              <View style={[s.badge, { backgroundColor: method.color }]}>
                <Text style={[s.badgeText, method.badgeDark && s.badgeTextDark]}>
                  {method.badge}
                </Text>
              </View>
              <Text style={s.cardLabel}>{method.label}</Text>
              <Text style={s.cardSub}>{method.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={s.overlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.overlayText}>Registrando venta…</Text>
          </View>
        )}
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surface,
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
  },
  title: { ...typography.title, color: colors.ink },
  totalWrap: { alignItems: "center", paddingVertical: spacing.lg },
  totalLabel: { ...typography.caption, color: colors.inkSoft, letterSpacing: 1.5 },
  totalValue: {
    fontFamily: fontFamilies.display,
    fontSize: 40,
    color: colors.ink,
    letterSpacing: -1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  card: {
    width: "47.8%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  badgeText: { color: "#fff", fontFamily: fontFamilies.display, fontSize: fontSize.md },
  badgeTextDark: { color: colors.ink },
  cardLabel: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  cardSub: { ...typography.caption, color: colors.inkSoft },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.xl,
  },
  overlayText: { ...typography.bodySm, color: colors.inkMid },
});
