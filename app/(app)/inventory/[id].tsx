import { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useInventoryStore } from "@/stores/inventory.store";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore, type AppColors } from "@/theme";
import { priceHistoryService } from "@/services/firestore/price-history";
import type { PriceHistory } from "@/types";

const formatDate = (date: Date) =>
  date.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });

const calcMargin = (sale: number, cost: number) => (sale > 0 ? ((sale - cost) / sale) * 100 : 0);

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { products, categories } = useInventoryStore();
  const { store } = useAuthStore();
  const { colors } = useThemeStore();

  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [history_loading, setHistoryLoading] = useState(true);

  const product = products.find((p) => p.id === id);
  const category = categories.find((c) => c.id === product?.category_id);
  const is_low_stock = product ? product.stock <= product.min_stock : false;
  const is_low_margin = product
    ? calcMargin(product.sale_price, product.cost_price) <
      (product.min_margin ?? store?.default_min_margin ?? 0.2) * 100
    : false;
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

  useEffect(() => {
    if (!id || !store?.id) return;
    priceHistoryService
      .getByProduct(id, store.id)
      .then(setHistory)
      .catch((err) => {
        console.error("Error cargando historial:", err);
        setHistory([]);
      })
      .finally(() => setHistoryLoading(false));
  }, [id]);

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
            <Text style={s.category_text}>
              {category.icon} {category.name}
            </Text>
          </View>
        )}
        <Text style={s.product_name}>{product.name}</Text>
        {product.barcode && <Text style={s.barcode}>#{product.barcode}</Text>}
      </View>

      <View style={s.prices_row}>
        <View style={s.price_card}>
          <Text style={s.price_label}>Precio venta</Text>
          <Text style={s.price_value}>S/ {product.sale_price.toFixed(2)}</Text>
        </View>
        <View style={s.price_card}>
          <Text style={s.price_label}>Precio costo</Text>
          <Text style={[s.price_value, s.price_secondary]}>S/ {product.cost_price.toFixed(2)}</Text>
        </View>
        <View style={s.price_card}>
          <Text style={s.price_label}>Margen</Text>
          <Text style={[s.price_value, is_low_margin ? s.price_margin_low : s.price_margin]}>
            {calcMargin(product.sale_price, product.cost_price).toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.section_title}>Stock</Text>
        <View style={s.stock_row}>
          <View style={s.stock_card}>
            <Text style={s.stock_number}>{product.stock}</Text>
            <Text style={s.stock_label}>{product.unit === "unit" ? "unidades" : product.unit}</Text>
          </View>
          <View style={s.stock_card}>
            <Text style={s.stock_number}>{product.min_stock}</Text>
            <Text style={s.stock_label}>mínimo</Text>
          </View>
          {is_low_stock && (
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

      <View style={s.section}>
        <Text style={s.section_title}>Historial de precios</Text>

        {history_loading ? (
          <ActivityIndicator size="small" color={colors.text4} />
        ) : history.length === 0 ? (
          <Text style={s.history_empty}>Sin cambios de precio registrados</Text>
        ) : (
          history.map((entry) => {
            const old_margin = calcMargin(entry.old_sale_price, entry.old_cost_price);
            const new_margin = calcMargin(entry.new_sale_price, entry.new_cost_price);
            const margin_delta = new_margin - old_margin;
            const cost_changed = entry.old_cost_price !== entry.new_cost_price;
            const sale_changed = entry.old_sale_price !== entry.new_sale_price;

            return (
              <View key={entry.id} style={s.history_entry}>
                <Text style={s.history_date}>{formatDate(entry.changed_at)}</Text>

                {cost_changed && (
                  <Text style={s.history_line}>
                    Costo: S/ {entry.old_cost_price.toFixed(2)}{" "}
                    <Text style={s.history_arrow}>→</Text> S/ {entry.new_cost_price.toFixed(2)}
                  </Text>
                )}

                {sale_changed && (
                  <Text style={s.history_line}>
                    Venta: S/ {entry.old_sale_price.toFixed(2)}{" "}
                    <Text style={s.history_arrow}>→</Text> S/ {entry.new_sale_price.toFixed(2)}
                  </Text>
                )}

                <Text style={[s.history_margin, margin_delta >= 0 ? s.margin_up : s.margin_down]}>
                  Margen {old_margin.toFixed(1)}% → {new_margin.toFixed(1)}% (
                  {margin_delta >= 0 ? "+" : ""}
                  {margin_delta.toFixed(1)}%)
                </Text>

                {entry.note && <Text style={s.history_note}>"{entry.note}"</Text>}
              </View>
            );
          })
        )}
      </View>

      <View style={{ height: 40 }} />
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
    price_margin_low: {
      color: "#c0392b",
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
    history_empty: {
      fontSize: 14,
      color: c.text4,
    },
    history_entry: {
      gap: 4,
      paddingVertical: 10,
      borderTopWidth: 0.5,
      borderTopColor: c.border,
    },
    history_date: {
      fontSize: 12,
      color: c.text4,
      fontWeight: "500",
    },
    history_line: {
      fontSize: 14,
      color: c.text2,
    },
    history_arrow: {
      color: c.text4,
    },
    history_margin: {
      fontSize: 13,
      fontWeight: "500",
    },
    margin_up: {
      color: "#27ae60",
    },
    margin_down: {
      color: "#e74c3c",
    },
    history_note: {
      fontSize: 12,
      color: c.text4,
      fontStyle: "italic",
    },
  });
