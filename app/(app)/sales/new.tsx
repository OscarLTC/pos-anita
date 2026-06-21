import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore, cartRawTotal } from "@/stores/cart.store";
import { useSalesStore } from "@/stores/sales.store";
import { useAuthStore } from "@/stores/auth.store";
import { WeightInputModal } from "@/components/WeightInputModal";
import { soles, formatQty } from "@/lib/format";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { PaymentType, Product } from "@/types";

const PAYMENT_OPTIONS: {
  type: PaymentType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { type: "cash", label: "Efectivo", icon: "cash-outline" },
  { type: "yape", label: "Yape", icon: "phone-portrait-outline" },
  { type: "plin", label: "Plin", icon: "phone-portrait-outline" },
  { type: "card", label: "Tarjeta", icon: "card-outline" },
];

const roundToCash = (amount: number) => Math.round(amount * 10) / 10;

export default function CheckoutScreen() {
  const router = useRouter();
  const { store } = useAuthStore();
  const { createSale } = useSalesStore();
  const items = useCartStore((s) => s.items);
  const setWeight = useCartStore((s) => s.setWeight);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);

  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [weightModal, setWeightModal] = useState<{ product: Product; qty: number } | null>(null);

  const rawTotal = cartRawTotal(items);
  const appliesRounding = useMemo(
    () => store?.rounding_methods?.includes(paymentType) ?? false,
    [store?.rounding_methods, paymentType],
  );
  const effectiveTotal = useMemo(
    () =>
      appliesRounding
        ? items.reduce((sum, i) => sum + roundToCash(i.product.sale_price * i.quantity), 0)
        : rawTotal,
    [appliesRounding, items, rawTotal],
  );

  const handleSave = async () => {
    if (!store?.id || items.length === 0) return;
    setIsSaving(true);
    try {
      await createSale(store.id, {
        items: items.map((item) => {
          const raw = item.product.sale_price * item.quantity;
          return {
            product_id: item.product.id,
            product_name: item.product.name,
            unit: item.product.unit,
            quantity: item.quantity,
            unit_price: item.product.sale_price,
            subtotal: parseFloat((appliesRounding ? roundToCash(raw) : raw).toFixed(2)),
          };
        }),
        total: parseFloat(effectiveTotal.toFixed(2)),
        payment_type: paymentType,
        note: note.trim() || undefined,
      });
      clear();
      router.replace("/(app)/sales");
    } catch {
      Alert.alert("Error", "No se pudo registrar la venta. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={s.emptyWrap}>
        <Ionicons name="cart-outline" size={48} color={colors.inkSoft} />
        <Text style={s.emptyText}>Tu carrito está vacío</Text>
        <TouchableOpacity style={s.emptyBtn} onPress={() => router.replace("/(app)/sales")}>
          <Text style={s.emptyBtnText}>Ir a vender</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Items */}
        <View style={s.section}>
          {items.map((item) => {
            const isWeight = item.product.unit !== "unit";
            const raw = item.product.sale_price * item.quantity;
            const subtotal = appliesRounding ? roundToCash(raw) : raw;

            return (
              <View key={item.product.id} style={s.itemRow}>
                <View style={s.itemInfo}>
                  <Text style={s.itemName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={s.itemSub}>
                    {isWeight
                      ? `${formatQty(item.quantity, item.product.unit)} ${item.product.unit === "kg" ? "kg" : "L"} × ${soles(item.product.sale_price)}`
                      : `${item.quantity} × ${soles(item.product.sale_price)}`}
                  </Text>
                </View>

                <View style={s.itemRight}>
                  {isWeight ? (
                    <TouchableOpacity
                      onPress={() => setWeightModal({ product: item.product, qty: item.quantity })}
                      hitSlop={8}
                    >
                      <Text style={[s.itemSubtotal, s.editable]}>{soles(subtotal)}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={s.itemSubtotal}>{soles(subtotal)}</Text>
                  )}
                  <TouchableOpacity onPress={() => remove(item.product.id)} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={colors.inkSoft} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Nota */}
        <TextInput
          style={s.note}
          placeholder="Nota (opcional)"
          placeholderTextColor={colors.inkSoft}
          value={note}
          onChangeText={setNote}
          multiline
        />

        {/* Método de pago */}
        <Text style={s.label}>Método de pago</Text>
        <View style={s.payments}>
          {PAYMENT_OPTIONS.map((opt) => {
            const active = paymentType === opt.type;
            return (
              <TouchableOpacity
                key={opt.type}
                style={[s.payChip, active && s.payChipActive]}
                onPress={() => setPaymentType(opt.type)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={opt.icon}
                  size={16}
                  color={active ? colors.primaryInk : colors.inkMid}
                />
                <Text style={[s.payChipText, active && s.payChipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Total + confirmar */}
      <View style={s.footer}>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>{soles(effectiveTotal)}</Text>
        </View>
        <TouchableOpacity
          style={[s.confirmBtn, isSaving && s.confirmDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.primaryInk} />
          ) : (
            <Text style={s.confirmText}>Registrar venta</Text>
          )}
        </TouchableOpacity>
      </View>

      <WeightInputModal
        product={weightModal?.product ?? null}
        initial_quantity={weightModal?.qty}
        onConfirm={(product, quantity) => {
          setWeight(product, quantity);
          setWeightModal(null);
        }}
        onClose={() => setWeightModal(null)}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  itemSub: { ...typography.bodySm, color: colors.inkMid },
  itemRight: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginLeft: spacing.sm },
  itemSubtotal: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  editable: {
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
    color: colors.inkMid,
  },
  note: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.ink,
    minHeight: 44,
  },
  label: { ...typography.bodySm, color: colors.inkMid },
  payments: { flexDirection: "row", gap: spacing.sm },
  payChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  payChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  payChipText: { ...typography.caption, color: colors.inkMid },
  payChipTextActive: { color: colors.primaryInk, fontFamily: fontFamilies.display },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.shadowLg,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  totalLabel: { ...typography.body, color: colors.inkMid },
  totalValue: { ...typography.title, color: colors.ink },
  confirmBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDisabled: { opacity: 0.6 },
  confirmText: { ...typography.display, fontSize: fontSize.lg, color: colors.primaryInk },
  emptyWrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: { ...typography.body, color: colors.inkMid },
  emptyBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  emptyBtnText: { ...typography.display, fontSize: fontSize.md, color: colors.primaryInk },
});
