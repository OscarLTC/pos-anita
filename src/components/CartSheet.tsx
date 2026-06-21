import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore, cartRawTotal } from "@/stores/cart.store";
import { useInventoryStore } from "@/stores/inventory.store";
import { BottomSheet } from "@/components/BottomSheet";
import { WeightInputModal } from "@/components/WeightInputModal";
import { soles, unitLabel, unitShort, formatQty } from "@/lib/format";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { Product } from "@/types";

const AVATAR_BG = "rgba(242,199,68,0.20)";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartSheet({ visible, onClose, onCheckout }: Props) {
  const items = useCartStore((s) => s.items);
  const addUnit = useCartStore((s) => s.addUnit);
  const decreaseUnit = useCartStore((s) => s.decreaseUnit);
  const setWeight = useCartStore((s) => s.setWeight);
  const remove = useCartStore((s) => s.remove);
  const categories = useInventoryStore((s) => s.categories);
  const [weightEdit, setWeightEdit] = useState<{ product: Product; qty: number } | null>(null);

  const total = cartRawTotal(items);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={s.sheet}>
        <View style={s.handle} />

        <View style={s.header}>
          <Text style={s.title}>Carrito ({items.length})</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
          {items.map((item) => {
            const { product, quantity } = item;
            const icon = categories.find((c) => c.id === product.category_id)?.icon ?? "📦";
            const isWeight = product.unit !== "unit";
            const subtotal = product.sale_price * quantity;

            return (
              <View key={product.id} style={s.row}>
                <View style={s.avatar}>
                  <Text style={s.avatarIcon}>{icon}</Text>
                </View>

                <View style={s.info}>
                  <Text style={s.name} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={s.sub}>
                    {soles(product.sale_price)} {unitLabel(product.unit)}
                  </Text>
                </View>

                {isWeight ? (
                  <View style={s.weightControl}>
                    <TouchableOpacity
                      style={s.weightPill}
                      onPress={() => setWeightEdit({ product, qty: quantity })}
                      activeOpacity={0.7}
                    >
                      <Text style={s.weightPillText}>
                        {formatQty(quantity, product.unit)} {unitShort(product.unit)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => remove(product.id)} hitSlop={6}>
                      <Ionicons name="close-circle" size={20} color={colors.inkSoft} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={s.stepper}>
                    <TouchableOpacity
                      style={s.stepBtn}
                      onPress={() => decreaseUnit(product.id)}
                      hitSlop={6}
                    >
                      <Ionicons name="remove" size={16} color={colors.ink} />
                    </TouchableOpacity>
                    <Text style={s.stepQty}>{quantity}</Text>
                    <TouchableOpacity
                      style={s.stepBtn}
                      onPress={() => addUnit(product)}
                      hitSlop={6}
                    >
                      <Ionicons name="add" size={16} color={colors.ink} />
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={s.subtotal}>{soles(subtotal)}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>TOTAL</Text>
          <Text style={s.totalValue}>{soles(total)}</Text>
        </View>

        <TouchableOpacity style={s.cobrarBtn} onPress={onCheckout} activeOpacity={0.85}>
          <Text style={s.cobrarText}>Cobrar {soles(total)}</Text>
        </TouchableOpacity>

        <WeightInputModal
          product={weightEdit?.product ?? null}
          initial_quantity={weightEdit?.qty}
          onConfirm={(product, quantity) => {
            setWeight(product, quantity);
            setWeightEdit(null);
          }}
          onClose={() => setWeightEdit(null)}
        />
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
    marginBottom: spacing.sm,
  },
  title: { ...typography.title, color: colors.ink },
  list: { maxHeight: 360 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: AVATAR_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  name: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  sub: { ...typography.bodySm, color: colors.inkSoft },
  weightControl: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  weightPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.chipBg,
  },
  weightPillText: { ...typography.bodySm, fontFamily: fontFamilies.display, color: colors.chipInk },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepQty: {
    minWidth: 18,
    textAlign: "center",
    fontFamily: fontFamilies.display,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  subtotal: {
    minWidth: 64,
    textAlign: "right",
    ...typography.body,
    fontFamily: fontFamilies.display,
    color: colors.ink,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  totalLabel: { ...typography.caption, color: colors.inkSoft, letterSpacing: 1 },
  totalValue: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  cobrarBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cobrarText: { ...typography.display, fontSize: fontSize.lg, color: colors.primaryInk },
});
