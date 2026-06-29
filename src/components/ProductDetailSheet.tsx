import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { useAuthStore } from "@/stores/auth.store";
import { useInventoryStore } from "@/stores/inventory.store";
import { stockMovementService } from "@/services/firestore/stock-movements";
import { soles, movementTime } from "@/lib/format";
import { withAlpha } from "@/lib/colors";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { Product, StockMovement, StockMovementType } from "@/types";

const QUICK_ADDS = [1, 6, 12, 24];

const MOVEMENT_LABEL: Record<StockMovementType, string> = {
  sale: "Venta",
  restock: "Reposición",
  adjustment: "Ajuste",
};

interface Props {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
  /** Si es false (cajero), oculta editar precios y eliminar; deja ver y ajustar stock. */
  canEdit?: boolean;
}

export function ProductDetailSheet({ visible, product, onClose, onEdit, canEdit = true }: Props) {
  const { store } = useAuthStore();
  const categories = useInventoryStore((s) => s.categories);
  const adjustStock = useInventoryStore((s) => s.adjustStock);
  const archiveProduct = useInventoryStore((s) => s.archiveProduct);

  // Conserva el último producto para animar la salida.
  const [display, setDisplay] = useState<Product | null>(product);
  const [stock, setStock] = useState(0);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const busy = saving || deleting;

  useEffect(() => {
    if (!product || !store?.id) return;
    setDisplay(product);
    setStock(product.stock);
    setSaving(false);
    setDeleting(false);
    setLoadingMov(true);
    stockMovementService
      .getRecentForProduct(store.id, product.id)
      .then(setMovements)
      .catch(() => setMovements([]))
      .finally(() => setLoadingMov(false));
  }, [product?.id]);

  const p = display;
  const category = p ? categories.find((c) => c.id === p.category_id) : undefined;
  const color = category?.color ?? "#929C94";
  const margin = p && p.sale_price > 0 ? (p.sale_price - p.cost_price) / p.sale_price : 0;
  const minMargin = p?.min_margin ?? store?.default_min_margin ?? 0.2;
  const lowMargin = margin < minMargin;
  const dirty = !!p && stock !== p.stock;

  const handleDelete = () => {
    if (!p) return;
    Alert.alert(
      "Eliminar producto",
      `¿Eliminar "${p.name}"? Dejará de aparecer en inventario y venta.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await archiveProduct(p.id);
              onClose();
            } catch {
              Alert.alert("Error", "No se pudo eliminar el producto.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (!p) return;
    if (!dirty) return onClose();
    setSaving(true);
    try {
      await adjustStock(p, stock - p.stock);
      onClose();
    } catch {
      setStock(p.stock);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {p && (
        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.header}>
            <Text style={s.title}>Producto</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} disabled={busy}>
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <View style={s.productRow}>
            <TouchableOpacity onPress={() => onEdit(p)} activeOpacity={0.8} disabled={!canEdit}>
              <View style={[s.avatar, { backgroundColor: withAlpha(color, 0.2) }]}>
                <Text style={s.avatarIcon}>{category?.icon ?? "📦"}</Text>
              </View>
              {canEdit && (
                <View style={s.editBadge}>
                  <Feather name="edit-2" size={11} color={colors.primaryInk} />
                </View>
              )}
            </TouchableOpacity>
            <View style={s.productInfo}>
              <Text style={s.productName} numberOfLines={1}>
                {p.name}
              </Text>
              <View style={s.chipsRow}>
                <View style={s.chip}>
                  <Text style={s.chipText}>{category?.name ?? "Sin categoría"}</Text>
                </View>
                {!!p.barcode && (
                  <View style={s.chip}>
                    <Text style={s.chipText}>cód {p.barcode}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <ScrollView
            style={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.card}>
              <Text style={s.cardLabel}>STOCK ACTUAL</Text>
              <View style={s.stepperRow}>
                <TouchableOpacity
                  style={[s.stepBtn, stock <= 0 && s.stepBtnDisabled]}
                  onPress={() => setStock((v) => Math.max(0, v - 1))}
                  disabled={stock <= 0}
                >
                  <Ionicons name="remove" size={22} color={colors.ink} />
                </TouchableOpacity>
                <Text style={s.stockBig}>{stock}</Text>
                <TouchableOpacity style={s.stepBtn} onPress={() => setStock((v) => v + 1)}>
                  <Ionicons name="add" size={22} color={colors.ink} />
                </TouchableOpacity>
              </View>
              <Text style={s.minStock}>Aviso a stock {p.min_stock}</Text>
              <View style={s.quickRow}>
                {QUICK_ADDS.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={s.quickBtn}
                    onPress={() => setStock((v) => v + q)}
                  >
                    <Text style={s.quickText}>+{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardLabel}>PRECIOS</Text>
              <View style={s.pricesRow}>
                <View style={s.priceItem}>
                  <Text style={s.priceCaption}>Costo</Text>
                  <Text style={s.priceValue}>{soles(p.cost_price)}</Text>
                </View>
                <View style={s.priceItem}>
                  <Text style={s.priceCaption}>Venta</Text>
                  <Text style={s.priceValue}>{soles(p.sale_price)}</Text>
                </View>
                <View style={s.priceItem}>
                  <Text style={s.priceCaption}>Margen</Text>
                  <Text
                    style={[s.marginValue, { color: lowMargin ? colors.danger : colors.success }]}
                  >
                    {Math.round(margin * 100)}%
                  </Text>
                </View>
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardLabel}>ÚLTIMOS MOVIMIENTOS</Text>
              {loadingMov ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
              ) : movements.length === 0 ? (
                <Text style={s.emptyMov}>Aún no hay movimientos</Text>
              ) : (
                movements.map((m) => {
                  const positive = m.delta > 0;
                  return (
                    <View key={m.id} style={s.movRow}>
                      <View style={[s.movIcon, positive && s.movIconUp]}>
                        <Ionicons
                          name={positive ? "arrow-up" : "arrow-down"}
                          size={14}
                          color={positive ? colors.success : colors.inkMid}
                        />
                      </View>
                      <View style={s.movInfo}>
                        <Text style={s.movLabel}>{MOVEMENT_LABEL[m.type]}</Text>
                        <Text style={s.movTime}>{movementTime(m.created_at)}</Text>
                      </View>
                      <Text style={[s.movDelta, positive && { color: colors.success }]}>
                        {positive ? "+" : ""}
                        {m.delta}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>

          <View style={s.footer}>
            {canEdit && (
              <TouchableOpacity
                style={[s.editBtn, busy && s.saveDisabled]}
                onPress={() => onEdit(p)}
                disabled={busy}
              >
                <Feather name="edit-2" size={16} color={colors.ink} />
                <Text style={s.editText}>Editar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.saveBtn, busy && s.saveDisabled]}
              onPress={handleSave}
              disabled={busy}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={colors.primaryInk} />
              ) : (
                <Text style={s.saveText}>Guardar cambios</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Eliminar — acción destructiva terciaria, solo para quien edita precios. */}
          {canEdit && (
            <TouchableOpacity
              style={s.deleteBtn}
              onPress={handleDelete}
              disabled={busy}
              activeOpacity={0.7}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <>
                  <FontAwesome6 name="trash-alt" size={16} color={colors.danger} />
                  <Text style={s.deleteText}>Eliminar producto</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
    paddingBottom: spacing.xl,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { ...typography.title, color: colors.ink },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: { fontSize: 26 },
  editBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bg,
  },
  productInfo: { flex: 1, gap: spacing.xs },
  productName: { ...typography.title, fontSize: fontSize.xl, color: colors.ink },
  chipsRow: { flexDirection: "row", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  chipText: { ...typography.caption, color: colors.inkMid },
  scroll: { flexShrink: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.shadow,
  },
  cardLabel: {
    ...typography.caption,
    color: colors.inkSoft,
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnDisabled: { opacity: 0.4 },
  stockBig: {
    fontFamily: fontFamilies.display,
    fontSize: 44,
    color: colors.ink,
    letterSpacing: -1,
  },
  minStock: { ...typography.bodySm, color: colors.inkSoft, marginTop: spacing.sm },
  quickRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  quickBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  quickText: { ...typography.bodySm, fontFamily: fontFamilies.display, color: colors.ink },
  pricesRow: { flexDirection: "row", justifyContent: "space-between" },
  priceItem: { gap: 4 },
  priceCaption: { ...typography.bodySm, color: colors.inkMid },
  priceValue: { fontFamily: fontFamilies.display, fontSize: fontSize.lg, color: colors.ink },
  marginValue: { fontFamily: fontFamilies.display, fontSize: fontSize.lg },
  movRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  movIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  movIconUp: { backgroundColor: colors.chipBg },
  movInfo: { flex: 1, gap: 1 },
  movLabel: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  movTime: { ...typography.caption, color: colors.inkSoft },
  movDelta: { fontFamily: fontFamilies.display, fontSize: fontSize.md, color: colors.ink },
  emptyMov: { ...typography.bodySm, color: colors.inkSoft, paddingVertical: spacing.md },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 44,
    marginTop: spacing.sm,
  },
  deleteText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.danger },
  footer: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  editBtn: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  editText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  saveBtn: {
    flex: 1.4,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveDisabled: { opacity: 0.5 },
  saveText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.primaryInk },
});
