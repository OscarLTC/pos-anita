import { useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSalesStore } from "@/stores/sales.store";
import { useAuthStore } from "@/stores/auth.store";
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

const groupByDate = (sales: Sale[]) => {
  const groups: { title: string; data: Sale[] }[] = [];
  const map = new Map<string, Sale[]>();

  for (const sale of sales) {
    const key = sale.created_at.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(sale);
  }

  map.forEach((data, title) => groups.push({ title, data }));
  return groups;
};

export default function SalesScreen() {
  const router = useRouter();
  const { store } = useAuthStore();
  const { colors } = useThemeStore();
  const { sales, is_loading, error, loadSales } = useSalesStore();
  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (store?.id) loadSales(store.id);
  }, [store?.id]);

  const onRefresh = useCallback(() => {
    if (store?.id) loadSales(store.id);
  }, [store?.id]);

  if (is_loading && sales.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.error_text}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={s.retry}>
          <Text style={s.retry_text}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const groups = groupByDate(sales);

  return (
    <View style={s.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.title}
        refreshControl={<RefreshControl refreshing={is_loading} onRefresh={onRefresh} />}
        contentContainerStyle={s.list_content}
        renderItem={({ item: group }) => (
          <View>
            <Text style={s.group_title}>{group.title}</Text>
            {group.data.map((sale) => (
              <TouchableOpacity
                key={sale.id}
                style={s.sale_card}
                onPress={() => router.push(`/(app)/sales/${sale.id}`)}
                activeOpacity={0.7}
              >
                <View style={s.sale_left}>
                  <View style={s.payment_icon_wrap}>
                    <Ionicons
                      name={PAYMENT_ICONS[sale.payment_type]}
                      size={18}
                      color={colors.text2}
                    />
                  </View>
                  <View style={s.sale_info}>
                    <Text style={s.sale_time}>
                      {sale.created_at.toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <Text style={s.sale_meta}>
                      {sale.items.length} item{sale.items.length !== 1 ? "s" : ""} ·{" "}
                      {PAYMENT_LABELS[sale.payment_type]}
                    </Text>
                  </View>
                </View>
                <View style={s.sale_right}>
                  <Text style={s.sale_total}>S/ {sale.total.toFixed(2)}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.text4} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={48} color={colors.text4} />
            <Text style={s.empty_text}>Sin ventas registradas</Text>
            <Text style={s.empty_sub}>Registra tu primera venta con el botón +</Text>
          </View>
        }
      />

      <TouchableOpacity style={s.fab} onPress={() => router.push("/(app)/sales/new")}>
        <Ionicons name="add" size={28} color={colors.accent_text} />
      </TouchableOpacity>
    </View>
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
      gap: 12,
    },
    list_content: {
      paddingBottom: 100,
      flexGrow: 1,
    },
    group_title: {
      fontSize: 12,
      fontWeight: "600",
      color: c.text4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 8,
    },
    sale_card: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border3,
    },
    sale_left: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    payment_icon_wrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.bg2,
      alignItems: "center",
      justifyContent: "center",
    },
    sale_info: {
      gap: 2,
    },
    sale_time: {
      fontSize: 15,
      fontWeight: "500",
      color: c.text,
    },
    sale_meta: {
      fontSize: 12,
      color: c.text3,
    },
    sale_right: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    sale_total: {
      fontSize: 16,
      fontWeight: "600",
      color: c.text,
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 12,
    },
    empty_text: {
      fontSize: 16,
      fontWeight: "500",
      color: c.text3,
    },
    empty_sub: {
      fontSize: 13,
      color: c.text4,
    },
    error_text: {
      fontSize: 15,
      color: "#c0392b",
    },
    retry: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    retry_text: {
      fontSize: 14,
      color: c.text,
    },
    fab: {
      position: "absolute",
      bottom: 28,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
  });
