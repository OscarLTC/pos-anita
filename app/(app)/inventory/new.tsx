import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useInventoryStore } from "@/stores/inventory.store";
import { useAuthStore } from "@/stores/auth.store";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import { useThemeStore, type AppColors } from "@/theme";
import type { product_unit, CreateProductInput } from "@/types";

const UNITS: { label: string; value: product_unit }[] = [
  { label: "Unidad", value: "unit" },
  { label: "Kg", value: "kg" },
  { label: "Litro", value: "l" },
];

export default function ProductFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;

  const { store_id } = useAuthStore();
  const { colors } = useThemeStore();
  const { categories, products, addProduct, updateProduct } =
    useInventoryStore();

  const existing = isEdit ? products.find((p) => p.id === params.id) : null;

  const [name, setName] = useState(existing?.name ?? "");
  const [category_id, setCategoryId] = useState(
    existing?.category_id ?? categories[0]?.id ?? "",
  );
  const [unit, setUnit] = useState<product_unit>(existing?.unit ?? "unit");
  const [cost_price, setCostPrice] = useState(
    existing?.cost_price.toString() ?? "",
  );
  const [sale_price, setSalePrice] = useState(
    existing?.sale_price.toString() ?? "",
  );
  const [stock, setStock] = useState(existing?.stock.toString() ?? "");
  const [min_stock, setMinStock] = useState(
    existing?.min_stock.toString() ?? "",
  );
  const [barcode, setBarcode] = useState(existing?.barcode ?? "");
  const [scanner_visible, setScannerVisible] = useState(false);
  const [is_loading, setIsLoading] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  const margin = (() => {
    const cost = parseFloat(cost_price);
    const sale = parseFloat(sale_price);
    if (!cost || !sale || sale === 0) return null;
    return (((sale - cost) / sale) * 100).toFixed(1);
  })();

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Falta el nombre del producto");
    if (!cost_price || !sale_price)
      return Alert.alert("Falta precio de costo o venta");
    if (!isEdit && !stock) return Alert.alert("Falta el stock inicial");
    if (!category_id) return Alert.alert("Selecciona una categoría");

    const trimmed_barcode = barcode.trim();
    const input: CreateProductInput = {
      name: name.trim(),
      category_id,
      unit,
      cost_price: parseFloat(cost_price),
      sale_price: parseFloat(sale_price),
      stock: parseInt(stock || "0"),
      min_stock: parseInt(min_stock || "5"),
      ...(trimmed_barcode && { barcode: trimmed_barcode }),
    };

    setIsLoading(true);
    try {
      if (isEdit) {
        await updateProduct(params.id!, input);
      } else {
        await addProduct(store_id!, input);
      }
      router.back();
    } catch {
      Alert.alert("Error", "No se pudo guardar el producto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.section}>
          <Text style={s.label}>Nombre</Text>
          <TextInput
            style={s.input}
            placeholder="Ej: Coca-Cola 600ml"
            placeholderTextColor={colors.text4}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={s.section}>
          <Text style={s.label}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.chips_row}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    s.chip,
                    category_id === cat.id && s.chip_active,
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text
                    style={[
                      s.chip_text,
                      category_id === cat.id && s.chip_text_active,
                    ]}
                  >
                    {cat.icon} {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={s.section}>
          <Text style={s.label}>Unidad</Text>
          <View style={s.chips_row}>
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u.value}
                style={[s.chip, unit === u.value && s.chip_active]}
                onPress={() => setUnit(u.value)}
              >
                <Text
                  style={[
                    s.chip_text,
                    unit === u.value && s.chip_text_active,
                  ]}
                >
                  {u.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.row_2}>
          <View style={[s.section, { flex: 1 }]}>
            <Text style={s.label}>Precio costo (S/)</Text>
            <TextInput
              style={s.input}
              placeholder="0.00"
              placeholderTextColor={colors.text4}
              value={cost_price}
              onChangeText={setCostPrice}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[s.section, { flex: 1 }]}>
            <Text style={s.label}>Precio venta (S/)</Text>
            <TextInput
              style={s.input}
              placeholder="0.00"
              placeholderTextColor={colors.text4}
              value={sale_price}
              onChangeText={setSalePrice}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {margin !== null && (
          <View style={s.margin_preview}>
            <Text style={s.margin_text}>
              Margen: {margin}% — S/{" "}
              {(parseFloat(sale_price) - parseFloat(cost_price)).toFixed(2)} por
              unidad
            </Text>
          </View>
        )}

        <View style={s.row_2}>
          <View style={[s.section, { flex: 1 }]}>
            <Text style={s.label}>
              {isEdit ? "Stock" : "Stock inicial"}
            </Text>
            <TextInput
              style={s.input}
              placeholder="0"
              placeholderTextColor={colors.text4}
              value={stock}
              onChangeText={setStock}
              keyboardType="number-pad"
            />
          </View>
          <View style={[s.section, { flex: 1 }]}>
            <Text style={s.label}>Stock mínimo</Text>
            <TextInput
              style={s.input}
              placeholder="5"
              placeholderTextColor={colors.text4}
              value={min_stock}
              onChangeText={setMinStock}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.label}>Código de barras (opcional)</Text>
          <View style={s.barcode_row}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Escanear o escribir..."
              placeholderTextColor={colors.text4}
              value={barcode}
              onChangeText={setBarcode}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              style={s.scan_button}
              onPress={() => setScannerVisible(true)}
            >
              <Ionicons name="barcode-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <BarcodeScannerModal
          visible={scanner_visible}
          onScanned={(code) => {
            setBarcode(code);
            setScannerVisible(false);
          }}
          onClose={() => setScannerVisible(false)}
        />

        <TouchableOpacity
          style={[s.save_button, is_loading && s.save_button_disabled]}
          onPress={handleSave}
          disabled={is_loading}
        >
          {is_loading ? (
            <ActivityIndicator color={colors.accent_text} />
          ) : (
            <Text style={s.save_button_text}>
              {isEdit ? "Guardar cambios" : "Guardar producto"}
            </Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 120 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    section: {
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 8,
    },
    label: {
      fontSize: 13,
      color: c.text3,
      fontWeight: "500",
    },
    input: {
      height: 44,
      borderWidth: 0.5,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.bg4,
    },
    chips_row: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 0.5,
      borderColor: c.border,
    },
    chip_active: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    chip_text: {
      fontSize: 13,
      color: c.text2,
    },
    chip_text_active: {
      color: c.accent_text,
      fontWeight: "500",
    },
    row_2: {
      flexDirection: "row",
      gap: 12,
      paddingTop: 16,
    },
    margin_preview: {
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: c.margin_bg,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
    },
    margin_text: {
      fontSize: 13,
      color: c.margin_text,
      fontWeight: "500",
    },
    save_button: {
      marginHorizontal: 16,
      marginTop: 24,
      height: 50,
      backgroundColor: c.accent,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    save_button_disabled: {
      opacity: 0.6,
    },
    save_button_text: {
      color: c.accent_text,
      fontSize: 16,
      fontWeight: "500",
    },
    barcode_row: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    scan_button: {
      width: 44,
      height: 44,
      borderRadius: 10,
      borderWidth: 0.5,
      borderColor: c.border,
      backgroundColor: c.bg4,
      alignItems: "center",
      justifyContent: "center",
    },
  });
