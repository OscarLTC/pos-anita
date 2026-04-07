import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useEffect } from "react";
import { useInventoryStore } from "@/stores/inventory.store";
import { useThemeStore, type AppColors } from "@/theme";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { products, categories } = useInventoryStore();
  const { colors } = useThemeStore();

  const product = products.find((p) => p.id === id);
  const category = categories.find((c) => c.id === product?.category_id);
  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (product) {
      navigation.setOptions({
        headerTitle: product.name,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/(app)/inventory/new", params: { id } })}
            hitSlop={8}
          >
            <Text style={{ fontSize: 15, color: colors.text, fontWeight: "500" }}>Editar</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [product, colors]);

  if (!product) {
    return (
      <View style={s.center}>
        <Text style={s.not_found}>Producto no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container}>
      <View style={s.header_section}>
        {category && (
          <View style={s.category_badge}>
            <Text style={s.category_text}>{category.icon}  {category.name}</Text>
          </View>
        )}
        <Text style={s.product_name}>{product.name}</Text>
        {product.barcode && (
          <Text style={s.barcode}>#{product.barcode}</Text>
        )}
      </View>

      <View style={s.prices_row}>
        <View style={s.price_card}>
          <Text style={s.price_label}>Precio venta</Text>
          <Text style={s.price_value}>S/ {product.sale_price.toFixed(2)}</Text>
        </View>
        <View style={s.price_card}>
          <Text style={s.price_label}>Precio costo</Text>
          <Text style={[s.price_value, s.price_secondary]}>
            S/ {product.cost_price.toFixed(2)}
          </Text>
        </View>
        <View style={s.price_card}>
          <Text style={s.price_label}>Margen</Text>
          <Text style={[s.price_value, s.price_margin]}>
            {((product.sale_price - product.cost_price) / product.sale_price * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.section_title}>Stock</Text>
        <View style={s.stock_row}>
          <View style={s.stock_card}>
            <Text style={s.stock_number}>{product.stock}</Text>
            <Text style={s.stock_label}>
              {product.unit === "unit" ? "unidades" : product.unit}
            </Text>
          </View>
          <View style={s.stock_card}>
            <Text style={s.stock_number}>{product.min_stock}</Text>
            <Text style={s.stock_label}>mínimo</Text>
          </View>
          {product.is_low_stock && (
            <View style={[s.stock_card, s.stock_card_alert]}>
              <Text style={s.stock_alert_text}>Stock bajo</Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.section_title}>Unidad de medida</Text>
        <Text style={s.detail_value}>
          {product.unit === "unit" ? "Unidad" : product.unit === "kg" ? "Kilogramo" : "Litro"}
        </Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    not_found: {
      color: c.text4,
      fontSize: 15,
    },
    header_section: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 16,
      gap: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border3,
    },
    category_badge: {
      alignSelf: "flex-start",
      backgroundColor: c.bg2,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    category_text: {
      fontSize: 12,
      color: c.text2,
      fontWeight: "500",
    },
    product_name: {
      fontSize: 22,
      fontWeight: "600",
      color: c.text,
    },
    barcode: {
      fontSize: 13,
      color: c.text4,
    },
    prices_row: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border3,
    },
    price_card: {
      flex: 1,
      alignItems: "center",
      gap: 4,
    },
    price_label: {
      fontSize: 11,
      color: c.text4,
    },
    price_value: {
      fontSize: 16,
      fontWeight: "600",
      color: c.text,
    },
    price_secondary: {
      color: c.text2,
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
      borderBottomColor: c.border3,
    },
    section_title: {
      fontSize: 13,
      color: c.text4,
      fontWeight: "500",
    },
    stock_row: {
      flexDirection: "row",
      gap: 10,
    },
    stock_card: {
      flex: 1,
      backgroundColor: c.bg3,
      borderRadius: 10,
      padding: 12,
      alignItems: "center",
      gap: 2,
    },
    stock_card_alert: {
      backgroundColor: c.low_stock_bg,
      justifyContent: "center",
    },
    stock_number: {
      fontSize: 22,
      fontWeight: "600",
      color: c.text,
    },
    stock_label: {
      fontSize: 11,
      color: c.text4,
    },
    stock_alert_text: {
      fontSize: 13,
      color: c.low_stock_text,
      fontWeight: "500",
    },
    detail_value: {
      fontSize: 15,
      color: c.text,
    },
  });
