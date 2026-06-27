import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { soles, formatQty, movementTime } from "@/lib/format";
import { PAYMENT_UI } from "@/config/payment-methods";
import { colors, spacing, radius, typography, fontFamilies, shadows } from "@/theme";
import type { Sale } from "@/types";

interface Props {
  sale: Sale | null;
  /** Ícono/color de categoría para cada producto. */
  iconFor: (productId: string) => { emoji: string; color: string };
  voiding: boolean;
  onClose: () => void;
  onReprint: () => void;
  onVoid: () => void;
  /** Si se define, muestra el botón verde de WhatsApp (ventas fiadas con teléfono). */
  onSend?: () => void;
  sendLabel?: string;
}

export function SaleDetailSheet({
  sale,
  iconFor,
  voiding,
  onClose,
  onReprint,
  onVoid,
  onSend,
  sendLabel = "Enviar",
}: Props) {
  const pay = sale ? PAYMENT_UI[sale.payment_type] : null;
  const itemCount = sale?.items.length ?? 0;
  const isCredit = sale?.payment_type === "credit";

  return (
    <BottomSheet visible={!!sale} onClose={onClose}>
      {sale && pay && (
        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.header}>
            <Text style={s.title}>Detalle de venta</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <View style={s.hero}>
            <Text style={s.eyebrow}>VENTA · {movementTime(sale.created_at).toUpperCase()}</Text>
            <Text style={s.amount}>{soles(sale.total)}</Text>
            <View style={s.payBadge}>
              <View style={[s.payDot, { backgroundColor: pay.color }]} />
              <Text style={s.payLabel}>
                {pay.label}
                {isCredit && sale.client_name ? (
                  <Text style={s.payClient}> · {sale.client_name}</Text>
                ) : null}
              </Text>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardLabel}>
              {itemCount > 0 ? `${itemCount} ${itemCount === 1 ? "ÍTEM" : "ÍTEMS"}` : "SIN ÍTEMS"}
            </Text>

            <ScrollView style={s.items} showsVerticalScrollIndicator={false}>
              {sale.items.map((item, i) => {
                const ic = iconFor(item.product_id);
                return (
                  <View key={`${item.product_id}-${i}`} style={s.itemRow}>
                    <View style={[s.itemIcon, { backgroundColor: ic.color + "22" }]}>
                      <Text style={s.itemEmoji}>{ic.emoji}</Text>
                    </View>
                    <View style={s.itemInfo}>
                      <Text style={s.itemName} numberOfLines={1}>
                        {item.product_name}
                      </Text>
                      <Text style={s.itemMeta}>
                        {formatQty(item.quantity, item.unit)} {item.unit === "unit" ? "u" : item.unit}{" "}
                        × {soles(item.unit_price)}
                      </Text>
                    </View>
                    <Text style={s.itemSubtotal}>{soles(item.subtotal)}</Text>
                  </View>
                );
              })}
              {sale.note && itemCount === 0 && <Text style={s.note}>"{sale.note}"</Text>}
            </ScrollView>

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TOTAL</Text>
              <Text style={s.totalValue}>{soles(sale.total)}</Text>
            </View>
          </View>

          <View style={s.actions}>
            <TouchableOpacity style={s.reprintBtn} onPress={onReprint} activeOpacity={0.85}>
              <Ionicons name="receipt-outline" size={18} color={colors.ink} />
              <Text style={s.reprintText}>Reimprimir</Text>
            </TouchableOpacity>
            {onSend && (
              <TouchableOpacity style={s.sendBtn} onPress={onSend} activeOpacity={0.85}>
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={s.sendText} numberOfLines={1}>
                  {sendLabel}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={s.voidBtn}
            onPress={onVoid}
            disabled={voiding}
            activeOpacity={0.7}
          >
            {voiding ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Text style={s.voidText}>Anular venta</Text>
            )}
          </TouchableOpacity>
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

  hero: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  eyebrow: { ...typography.caption, color: colors.inkSoft, letterSpacing: 1 },
  amount: {
    fontFamily: fontFamilies.display,
    fontSize: 44,
    color: colors.ink,
    letterSpacing: -1,
  },
  payBadge: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  payDot: { width: 10, height: 10, borderRadius: 5 },
  payLabel: { ...typography.body, color: colors.inkMid },
  payClient: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.shadow,
  },
  cardLabel: {
    ...typography.caption,
    color: colors.inkSoft,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  items: { flexShrink: 1 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  itemEmoji: { fontSize: 18 },
  itemInfo: { flex: 1, gap: 1 },
  itemName: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  itemMeta: { ...typography.bodySm, color: colors.inkSoft },
  itemSubtotal: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  note: { ...typography.body, color: colors.inkSoft, fontStyle: "italic", paddingVertical: spacing.sm },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  totalLabel: { ...typography.caption, color: colors.inkSoft, letterSpacing: 1 },
  totalValue: { fontFamily: fontFamilies.display, fontSize: 22, color: colors.ink },

  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  reprintBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  reprintText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  sendBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: "#25D366",
  },
  sendText: { ...typography.body, fontFamily: fontFamilies.display, color: "#fff" },
  voidBtn: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  voidText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.danger },
});
