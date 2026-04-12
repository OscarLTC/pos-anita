import { useEffect, useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSalesStore, todayISO } from "@/stores/sales.store";
import { saleService } from "@/services/firestore/sales";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore, type AppColors } from "@/theme";
import type { Sale } from "@/types";

const formatTime = (date: Date) =>
  date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

const formatFullDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function RegisterScreen() {
  const router = useRouter();
  const { store } = useAuthStore();
  const { colors } = useThemeStore();
  const { register, is_loading, error, loadRegister, closeRegister } = useSalesStore();

  const [today_sales, setTodaySales] = useState<Sale[]>([]);
  const [sales_loading, setSalesLoading] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  const loadData = useCallback(async () => {
    if (!store?.id) return;
    loadRegister(store.id);
    setSalesLoading(true);
    saleService
      .getByDate(store.id, todayISO())
      .then(setTodaySales)
      .catch(() => setTodaySales([]))
      .finally(() => setSalesLoading(false));
  }, [store?.id]);

  useEffect(() => {
    loadData();
  }, [store?.id]);

  const handleClose = () => {
    Alert.alert(
      "Cerrar caja",
      "¿Confirmas que quieres cerrar la caja del día? No podrás reabrirla.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar caja",
          style: "destructive",
          onPress: async () => {
            if (!store?.id) return;
            try {
              await closeRegister(store.id);
            } catch {
              Alert.alert("Error", "No se pudo cerrar la caja.");
            }
          },
        },
      ],
    );
  };

  const today_str = todayISO();

  if (is_loading && !register) {
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
        <TouchableOpacity onPress={loadData} style={s.retry}>
          <Text style={s.retry_text}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={is_loading} onRefresh={loadData} />}
    >
      <View style={s.date_header}>
        <Text style={s.date_text}>{formatFullDate(today_str)}</Text>
        {register && (
          <View
            style={[s.status_badge, register.status === "open" ? s.status_open : s.status_closed]}
          >
            <Text
              style={[
                s.status_text,
                register.status === "open" ? s.status_open_text : s.status_closed_text,
              ]}
            >
              {register.status === "open" ? "Abierta" : "Cerrada"}
            </Text>
          </View>
        )}
      </View>

      {!register ? (
        <View style={s.empty_register}>
          <Ionicons name="cash-outline" size={48} color={colors.text4} />
          <Text style={s.empty_title}>Sin ventas hoy</Text>
          <Text style={s.empty_sub}>Las ventas del día aparecerán aquí.</Text>
          <TouchableOpacity style={s.new_sale_btn} onPress={() => router.push("/(app)/sales/new")}>
            <Ionicons name="add" size={18} color={colors.accent_text} />
            <Text style={s.new_sale_btn_text}>Nueva venta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={s.summary_row}>
            <View style={[s.summary_card, s.summary_card_main]}>
              <Text style={s.summary_card_label}>Total ventas</Text>
              <Text style={s.summary_card_value_main}>S/ {register.total_sales.toFixed(2)}</Text>
            </View>
            <View style={s.summary_card}>
              <Text style={s.summary_card_label}>N° ventas</Text>
              <Text style={s.summary_card_value}>{register.sales_count}</Text>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.section_title}>Por método de pago</Text>
            <View style={s.breakdown_grid}>
              <PaymentRow
                icon="cash-outline"
                label="Efectivo"
                amount={register.total_cash}
                colors={colors}
                s={s}
              />
              <PaymentRow
                icon="phone-portrait-outline"
                label="Yape"
                amount={register.total_yape}
                colors={colors}
                s={s}
              />
              <PaymentRow
                icon="phone-portrait-outline"
                label="Plin"
                amount={register.total_plin}
                colors={colors}
                s={s}
              />
              <PaymentRow
                icon="card-outline"
                label="Tarjeta"
                amount={register.total_card}
                colors={colors}
                s={s}
              />
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.section_title}>Horario</Text>
            <View style={s.time_row}>
              <Text style={s.time_label}>Apertura</Text>
              <Text style={s.time_value}>{formatTime(register.opened_at)}</Text>
            </View>
            {register.closed_at && (
              <View style={s.time_row}>
                <Text style={s.time_label}>Cierre</Text>
                <Text style={s.time_value}>{formatTime(register.closed_at)}</Text>
              </View>
            )}
          </View>

          <View style={s.section}>
            <Text style={s.section_title}>Ventas de hoy</Text>
            {sales_loading ? (
              <ActivityIndicator size="small" color={colors.text4} style={{ marginTop: 8 }} />
            ) : today_sales.length === 0 ? (
              <Text style={s.empty_sales}>Sin ventas registradas hoy</Text>
            ) : (
              today_sales.map((sale) => (
                <TouchableOpacity
                  key={sale.id}
                  style={s.sale_row}
                  onPress={() => router.push(`/(app)/sales/${sale.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={s.sale_row_left}>
                    <Text style={s.sale_time}>{formatTime(sale.created_at)}</Text>
                    <Text style={s.sale_meta}>
                      {sale.items.length} item{sale.items.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={s.sale_row_right}>
                    <Text style={s.sale_amount}>S/ {sale.total.toFixed(2)}</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.text4} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {register.status === "open" && (
            <TouchableOpacity style={s.close_btn} onPress={handleClose}>
              <Ionicons name="lock-closed-outline" size={18} color="#c0392b" />
              <Text style={s.close_btn_text}>Cerrar caja</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function PaymentRow({
  icon,
  label,
  amount,
  colors,
  s,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  amount: number;
  colors: AppColors;
  s: ReturnType<typeof makeStyles>;
}) {
  if (amount === 0) return null;
  return (
    <View style={s.breakdown_row}>
      <View style={s.breakdown_left}>
        <Ionicons name={icon} size={16} color={colors.text3} />
        <Text style={s.breakdown_label}>{label}</Text>
      </View>
      <Text style={s.breakdown_amount}>S/ {amount.toFixed(2)}</Text>
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
    date_header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    date_text: {
      fontSize: 14,
      fontWeight: "500",
      color: c.text2,
      textTransform: "capitalize",
      flex: 1,
    },
    status_badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    status_open: {
      backgroundColor: "#e8f8ef",
    },
    status_closed: {
      backgroundColor: c.bg2,
    },
    status_text: {
      fontSize: 12,
      fontWeight: "600",
    },
    status_open_text: {
      color: "#27ae60",
    },
    status_closed_text: {
      color: c.text3,
    },
    empty_register: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 12,
    },
    empty_title: {
      fontSize: 18,
      fontWeight: "600",
      color: c.text3,
    },
    empty_sub: {
      fontSize: 13,
      color: c.text4,
    },
    new_sale_btn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: c.accent,
      borderRadius: 12,
    },
    new_sale_btn_text: {
      fontSize: 15,
      fontWeight: "600",
      color: c.accent_text,
    },
    summary_row: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    summary_card: {
      flex: 1,
      backgroundColor: c.bg2,
      borderRadius: 12,
      padding: 14,
      gap: 6,
    },
    summary_card_main: {
      flex: 2,
      backgroundColor: c.accent,
    },
    summary_card_label: {
      fontSize: 11,
      color: c.text4,
      fontWeight: "500",
    },
    summary_card_value_main: {
      fontSize: 26,
      fontWeight: "700",
      color: c.accent_text,
    },
    summary_card_value: {
      fontSize: 26,
      fontWeight: "700",
      color: c.text,
    },
    section: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 8,
      gap: 8,
    },
    section_title: {
      fontSize: 12,
      fontWeight: "600",
      color: c.text4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    breakdown_grid: {
      gap: 2,
    },
    breakdown_row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border3,
    },
    breakdown_left: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    breakdown_label: {
      fontSize: 14,
      color: c.text2,
    },
    breakdown_amount: {
      fontSize: 15,
      fontWeight: "600",
      color: c.text,
    },
    time_row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border3,
    },
    time_label: {
      fontSize: 14,
      color: c.text3,
    },
    time_value: {
      fontSize: 14,
      fontWeight: "500",
      color: c.text,
    },
    empty_sales: {
      fontSize: 14,
      color: c.text4,
      paddingVertical: 8,
    },
    sale_row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border3,
    },
    sale_row_left: {
      gap: 2,
    },
    sale_time: {
      fontSize: 14,
      fontWeight: "500",
      color: c.text,
    },
    sale_meta: {
      fontSize: 12,
      color: c.text4,
    },
    sale_row_right: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    sale_amount: {
      fontSize: 15,
      fontWeight: "600",
      color: c.text,
    },
    close_btn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginHorizontal: 16,
      marginTop: 24,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#e74c3c",
    },
    close_btn_text: {
      fontSize: 15,
      fontWeight: "500",
      color: "#c0392b",
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
  });
