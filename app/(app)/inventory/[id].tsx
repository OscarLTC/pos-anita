import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useEffect } from "react";
import { useInventoryStore } from "@/stores/inventory.store";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { products, categories } = useInventoryStore();

  const product = products.find((p) => p.id === id);
  const category = categories.find((c) => c.id === product?.category_id);

  useEffect(() => {
    if (product) {
      navigation.setOptions({
        headerTitle: product.name,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/(app)/inventory/new", params: { id } })}
            style={{ paddingHorizontal: 4 }}
          >
            <Text style={{ fontSize: 15, color: "#111", fontWeight: "500" }}>Editar</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [product]);

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.not_found}>Producto no encontrado</Text>
      </View>
    );
  }

  const margin_pct = (product.margin_pct ?? ((product.sale_price - product.cost_price) / product.sale_price) * 100);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header_section}>
        {category && (
          <View style={styles.category_badge}>
            <Text style={styles.category_text}>{category.icon}  {category.name}</Text>
          </View>
        )}
        <Text style={styles.product_name}>{product.name}</Text>
        {product.barcode && (
          <Text style={styles.barcode}>#{product.barcode}</Text>
        )}
      </View>

      <View style={styles.prices_row}>
        <View style={styles.price_card}>
          <Text style={styles.price_label}>Precio venta</Text>
          <Text style={styles.price_value}>S/ {product.sale_price.toFixed(2)}</Text>
        </View>
        <View style={styles.price_card}>
          <Text style={styles.price_label}>Precio costo</Text>
          <Text style={[styles.price_value, styles.price_secondary]}>
            S/ {product.cost_price.toFixed(2)}
          </Text>
        </View>
        <View style={styles.price_card}>
          <Text style={styles.price_label}>Margen</Text>
          <Text style={[styles.price_value, styles.price_margin]}>
            {((product.sale_price - product.cost_price) / product.sale_price * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.section_title}>Stock</Text>
        <View style={styles.stock_row}>
          <View style={styles.stock_card}>
            <Text style={styles.stock_number}>{product.stock}</Text>
            <Text style={styles.stock_label}>
              {product.unit === "unit" ? "unidades" : product.unit}
            </Text>
          </View>
          <View style={styles.stock_card}>
            <Text style={styles.stock_number}>{product.min_stock}</Text>
            <Text style={styles.stock_label}>mínimo</Text>
          </View>
          {product.is_low_stock && (
            <View style={[styles.stock_card, styles.stock_card_alert]}>
              <Text style={styles.stock_alert_text}>Stock bajo</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.section_title}>Unidad de medida</Text>
        <Text style={styles.detail_value}>
          {product.unit === "unit" ? "Unidad" : product.unit === "kg" ? "Kilogramo" : "Litro"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  not_found: {
    color: "#aaa",
    fontSize: 15,
  },
  header_section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  category_badge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  category_text: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
  product_name: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111",
  },
  barcode: {
    fontSize: 13,
    color: "#aaa",
  },
  prices_row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  price_card: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  price_label: {
    fontSize: 11,
    color: "#aaa",
  },
  price_value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  price_secondary: {
    color: "#555",
    fontWeight: "500",
  },
  price_margin: {
    color: "#27ae60",
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  section_title: {
    fontSize: 13,
    color: "#aaa",
    fontWeight: "500",
  },
  stock_row: {
    flexDirection: "row",
    gap: 10,
  },
  stock_card: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    gap: 2,
  },
  stock_card_alert: {
    backgroundColor: "#fff3f3",
    justifyContent: "center",
  },
  stock_number: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111",
  },
  stock_label: {
    fontSize: 11,
    color: "#aaa",
  },
  stock_alert_text: {
    fontSize: 13,
    color: "#e74c3c",
    fontWeight: "500",
  },
  detail_value: {
    fontSize: 15,
    color: "#111",
  },
});
