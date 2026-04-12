import { useMemo, useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSalesStore } from "@/stores/sales.store";
import { saleService } from "@/services/firestore/sales";
import { useThemeStore, type AppColors } from "@/theme";
import type { Sale, PaymentType } from "@/types";

const PAYMENT_LABELS: Record<PaymentType, string> = {
  cash: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  card: "Tarjeta",
};

const PAYMENT_ICONS: Record<PaymentType, keyof typeof Ionicons.glyphMap> = {
  cash: "cash-outline",
  yape: "phone-portrait-outline",
  plin: "phone-portrait-outline",
  card: "card-outline",
};

const formatDateTime = (date: Date) =>
  date.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const { sales } = useSalesStore();

  const [sale, setSale] = useState<Sale | null>(sales.find((s) => s.id === id) ?? null);
  const [is_loading, setIsLoading] = useState(!sale);

  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Detalle de venta",
      headerStyle: { backgroundColor: colors.bg },
      headerTintColor: colors.text,
    });
  }, [colors]);

  useEffect(() => {
    if (sale || !id) return;
    setIsLoading(true);
    saleService
      .getById(id)
      .then((result) => setSale(result))
      .catch(() => setSale(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (is_loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (!sale) {
    return (
      <View style={s.center}>
        <Text style={s.not_found}>Venta no encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container}>
      <View style={s.header_section}>
        <View style={s.payment_badge}>
          <Ionicons name={PAYMENT_ICONS[sale.payment_type]} size={16} color={colors.text2} />
          <Text style={s.payment_label}>{PAYMENT_LABELS[sale.payment_type]}</Text>
        </View>
        <Text style={s.total}>S/ {sale.total.toFixed(2)}</Text>
        <Text style={s.date}>{formatDateTime(sale.created_at)}</Text>
        {sale.note && <Text style={s.note}>"{sale.note}"</Text>}
      </View>

      <View style={s.section}>
        <Text style={s.section_title}>
          {sale.items.length} {sale.items.length === 1 ? "producto" : "productos"}
        </Text>

        {sale.items.map((item, index) => (
          <View key={index} style={s.item_row}>
            <View style={s.item_info}>
              <Text style={s.item_name}>{item.product_name}</Text>
              <Text style={s.item_unit}>
                {item.quantity}{" "}
                {item.unit !== "unit" ? item.unit : item.quantity === 1 ? "unidad" : "unidades"} ×
                S/ {item.unit_price.toFixed(2)}
              </Text>
            </View>
            <Text style={s.item_subtotal}>S/ {item.subtotal.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={s.total_row}>
        <Text style={s.total_label}>Total</Text>
        <Text style={s.total_value}>S/ {sale.total.toFixed(2)}</Text>
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
      fontSize: 15,
      color: c.text4,
    },
    header_section: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 20,
      gap: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border3,
      alignItems: "flex-start",
    },
    payment_badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.bg2,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
    },
    payment_label: {
      fontSize: 13,
      color: c.text2,
      fontWeight: "500",
    },
    total: {
      fontSize: 32,
      fontWeight: "700",
      color: c.text,
    },
    date: {
      fontSize: 13,
      color: c.text3,
      textTransform: "capitalize",
    },
    note: {
      fontSize: 13,
      color: c.text3,
      fontStyle: "italic",
    },
    section: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    section_title: {
      fontSize: 12,
      fontWeight: "600",
      color: c.text4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    item_row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border3,
    },
    item_info: {
      flex: 1,
      gap: 2,
    },
    item_name: {
      fontSize: 15,
      fontWeight: "500",
      color: c.text,
    },
    item_unit: {
      fontSize: 12,
      color: c.text3,
    },
    item_subtotal: {
      fontSize: 15,
      fontWeight: "600",
      color: c.text,
      marginLeft: 12,
    },
    total_row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: 0.5,
      borderTopColor: c.border,
    },
    total_label: {
      fontSize: 16,
      fontWeight: "600",
      color: c.text,
    },
    total_value: {
      fontSize: 20,
      fontWeight: "700",
      color: c.text,
    },
  });
