import { useEffect, useState } from "react";
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
import { BottomSheet } from "@/components/BottomSheet";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import { useAuthStore } from "@/stores/auth.store";
import { useInventoryStore } from "@/stores/inventory.store";
import { withAlpha } from "@/lib/colors";
import { colors, spacing, radius, typography, fontSize, fontFamilies } from "@/theme";
import type { CreateProductInput, Product, ProductUnit } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Si se provee, el sheet edita ese producto; si no, crea uno nuevo. */
  product?: Product | null;
}

export function NewProductSheet({ visible, onClose, product }: Props) {
  const { store } = useAuthStore();
  const categories = useInventoryStore((s) => s.categories);
  const addProduct = useInventoryStore((s) => s.addProduct);
  const updateProduct = useInventoryStore((s) => s.updateProduct);

  const isEdit = !!product;

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [unit, setUnit] = useState<ProductUnit>("unit");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(product?.name ?? "");
    setCategoryId(product?.category_id ?? null);
    setUnit(product ? (product.unit === "unit" ? "unit" : "kg") : "unit");
    setCost(product ? String(product.cost_price) : "");
    setPrice(product ? String(product.sale_price) : "");
    setStock(product ? String(product.stock) : "");
    setBarcode(product?.barcode ?? "");
    setCatOpen(false);
  }, [visible, product?.id]);

  const selectedCat = categories.find((c) => c.id === categoryId);

  const handleSave = async () => {
    if (!store?.id) return;
    if (!name.trim()) return Alert.alert("Falta el nombre del producto");
    if (!categoryId) return Alert.alert("Selecciona una categoría");
    if (!cost || !price) return Alert.alert("Falta el costo o el precio de venta");
    if (!isEdit && !stock) return Alert.alert("Falta el stock inicial");

    const input: CreateProductInput = {
      name: name.trim(),
      category_id: categoryId,
      unit,
      cost_price: parseFloat(cost),
      sale_price: parseFloat(price),
      stock: parseInt(stock || "0", 10),
      min_stock: product?.min_stock ?? 5,
      ...(barcode.trim() && { barcode: barcode.trim() }),
    };

    setSaving(true);
    try {
      if (isEdit && product) await updateProduct(product.id, input);
      else await addProduct(store.id, input);
      onClose();
    } catch {
      Alert.alert("Error", "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={s.sheet}>
        <View style={s.handle} />

        <View style={s.header}>
          <Text style={s.title}>{isEdit ? "Editar producto" : "Nuevo producto"}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8} disabled={saving}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={s.scroll}
        >
          <TouchableOpacity
            style={s.scanBox}
            onPress={() => setScannerVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="barcode-outline"
              size={22}
              color={barcode ? colors.primary : colors.inkMid}
            />
            <View style={s.scanTextWrap}>
              <Text style={[s.scanTitle, barcode && { color: colors.primary }]}>
                {barcode ? `Código ${barcode}` : "Escanear código"}
              </Text>
              <Text style={s.scanSub}>
                {barcode ? "toca para cambiar" : "autocompleta datos del producto"}
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={s.label}>Nombre del producto</Text>
          <TextInput
            style={s.input}
            placeholder="Ej. Arroz Costeño 5kg"
            placeholderTextColor={colors.inkSoft}
            value={name}
            onChangeText={setName}
            autoCapitalize="sentences"
          />

          <Text style={s.label}>Categoría</Text>
          <TouchableOpacity
            style={s.select}
            onPress={() => setCatOpen((o) => !o)}
            activeOpacity={0.8}
          >
            <Text style={[s.selectText, !selectedCat && { color: colors.inkSoft }]}>
              {selectedCat
                ? `${selectedCat.icon}  ${selectedCat.name}`
                : "Selecciona una categoría"}
            </Text>
            <Ionicons
              name={catOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.inkSoft}
            />
          </TouchableOpacity>
          {catOpen && (
            <View style={s.options}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={s.option}
                    onPress={() => {
                      setCategoryId(cat.id);
                      setCatOpen(false);
                    }}
                  >
                    <View style={[s.optionSwatch, { backgroundColor: withAlpha(cat.color, 0.25) }]}>
                      <Text>{cat.icon}</Text>
                    </View>
                    <Text style={s.optionText}>{cat.name}</Text>
                    {categoryId === cat.id && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={s.label}>Se vende por</Text>
          <View style={s.unitRow}>
            <TouchableOpacity
              style={[s.unitCard, unit === "unit" && s.unitCardActive]}
              onPress={() => setUnit("unit")}
              activeOpacity={0.8}
            >
              <Text style={[s.unitTitle, unit === "unit" && s.unitTitleActive]}>Unidad</Text>
              <Text style={s.unitSub}>pieza, lata, paquete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.unitCard, unit !== "unit" && s.unitCardActive]}
              onPress={() => setUnit("kg")}
              activeOpacity={0.8}
            >
              <Text style={[s.unitTitle, unit !== "unit" && s.unitTitleActive]}>Peso</Text>
              <Text style={s.unitSub}>por kilo</Text>
            </TouchableOpacity>
          </View>

          <View style={s.priceRow}>
            <View style={s.priceCol}>
              <Text style={s.label}>Costo</Text>
              <TextInput
                style={s.input}
                placeholder="0.00"
                placeholderTextColor={colors.inkSoft}
                value={cost}
                onChangeText={setCost}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={s.priceCol}>
              <Text style={s.label}>Precio venta</Text>
              <TextInput
                style={s.input}
                placeholder="0.00"
                placeholderTextColor={colors.inkSoft}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={s.priceCol}>
              <Text style={s.label}>Stock</Text>
              <TextInput
                style={s.input}
                placeholder="0"
                placeholderTextColor={colors.inkSoft}
                value={stock}
                onChangeText={setStock}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={s.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, saving && s.saveDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={colors.primaryInk} />
              ) : (
                <Text style={s.saveText}>{isEdit ? "Guardar cambios" : "Guardar producto"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BarcodeScannerModal
          visible={scannerVisible}
          onScanned={(code) => {
            setBarcode(code);
            setScannerVisible(false);
          }}
          onClose={() => setScannerVisible(false)}
        />
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sheet: {
    flexShrink: 1,
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
    marginBottom: spacing.md,
  },
  title: { ...typography.title, color: colors.ink },
  scanBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  scanTextWrap: { flex: 1, gap: 2 },
  scanTitle: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  scanSub: { ...typography.caption, color: colors.inkSoft },
  scroll: { flexShrink: 1 },
  label: {
    ...typography.bodySm,
    fontFamily: fontFamilies.display,
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  select: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
  },
  selectText: { ...typography.body, color: colors.ink },
  options: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSwatch: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { flex: 1, ...typography.body, color: colors.ink },
  unitRow: { flexDirection: "row", gap: spacing.md },
  unitCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  unitCardActive: { borderColor: colors.primary, backgroundColor: colors.chipBg },
  unitTitle: { ...typography.body, fontFamily: fontFamilies.display, color: colors.inkMid },
  unitTitleActive: { color: colors.primary },
  unitSub: { ...typography.caption, color: colors.inkSoft },
  priceRow: { flexDirection: "row", gap: spacing.sm },
  priceCol: { flex: 1 },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
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
