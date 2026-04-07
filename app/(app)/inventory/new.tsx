import { useState } from "react";
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
import { useRouter } from "expo-router";
import { useInventoryStore } from "@/stores/inventory.store";
import { useAuthStore } from "@/stores/auth.store";
import type { product_unit, CreateProductInput } from "@/types";

const UNITS: { label: string; value: product_unit }[] = [
  { label: "Unidad", value: "unit" },
  { label: "Kg", value: "kg" },
  { label: "Litro", value: "l" },
];

export default function NewProductScreen() {
  const router = useRouter();
  const { store_id } = useAuthStore();
  const { categories, addProduct } = useInventoryStore();

  const [name, setName] = useState("");
  const [category_id, setCategoryId] = useState(categories[0]?.id ?? "");
  const [unit, setUnit] = useState<product_unit>("unit");
  const [cost_price, setCostPrice] = useState("");
  const [sale_price, setSalePrice] = useState("");
  const [stock, setStock] = useState("");
  const [min_stock, setMinStock] = useState("");
  const [barcode, setBarcode] = useState("");
  const [is_loading, setIsLoading] = useState(false);

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
    if (!stock) return Alert.alert("Falta el stock inicial");
    if (!category_id) return Alert.alert("Selecciona una categoría");

    const input: CreateProductInput = {
      name: name.trim(),
      category_id,
      unit,
      cost_price: parseFloat(cost_price),
      sale_price: parseFloat(sale_price),
      stock: parseInt(stock),
      min_stock: parseInt(min_stock || "5"),
      barcode: barcode.trim() || undefined,
    };

    setIsLoading(true);
    try {
      await addProduct(store_id!, input);
      router.back();
    } catch {
      Alert.alert("Error", "No se pudo guardar el producto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Coca-Cola 600ml"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips_row}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.chip,
                  category_id === cat.id && styles.chip_active,
                ]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text
                  style={[
                    styles.chip_text,
                    category_id === cat.id && styles.chip_text_active,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Unidad</Text>
        <View style={styles.chips_row}>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u.value}
              style={[styles.chip, unit === u.value && styles.chip_active]}
              onPress={() => setUnit(u.value)}
            >
              <Text
                style={[
                  styles.chip_text,
                  unit === u.value && styles.chip_text_active,
                ]}
              >
                {u.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row_2}>
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.label}>Precio costo (S/)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#aaa"
            value={cost_price}
            onChangeText={setCostPrice}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.label}>Precio venta (S/)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#aaa"
            value={sale_price}
            onChangeText={setSalePrice}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {margin !== null && (
        <View style={styles.margin_preview}>
          <Text style={styles.margin_text}>
            Margen: {margin}% — S/{" "}
            {(parseFloat(sale_price) - parseFloat(cost_price)).toFixed(2)} por
            unidad
          </Text>
        </View>
      )}

      <View style={styles.row_2}>
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.label}>Stock inicial</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#aaa"
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
          />
        </View>
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.label}>Stock mínimo</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            placeholderTextColor="#aaa"
            value={min_stock}
            onChangeText={setMinStock}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Código de barras (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Escanear o escribir..."
          placeholderTextColor="#aaa"
          value={barcode}
          onChangeText={setBarcode}
          keyboardType="number-pad"
        />
      </View>

      <TouchableOpacity
        style={[styles.save_button, is_loading && styles.save_button_disabled]}
        onPress={handleSave}
        disabled={is_loading}
      >
        {is_loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.save_button_text}>Guardar producto</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  input: {
    height: 44,
    borderWidth: 0.5,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#fafafa",
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
    borderColor: "#ddd",
  },
  chip_active: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  chip_text: {
    fontSize: 13,
    color: "#555",
  },
  chip_text_active: {
    color: "#fff",
    fontWeight: "500",
  },
  row_2: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  margin_preview: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#f0faf5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  margin_text: {
    fontSize: 13,
    color: "#27ae60",
    fontWeight: "500",
  },
  save_button: {
    marginHorizontal: 16,
    marginTop: 24,
    height: 50,
    backgroundColor: "#111",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  save_button_disabled: {
    opacity: 0.6,
  },
  save_button_text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
