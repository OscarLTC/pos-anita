import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useInventoryStore } from "@/stores/inventory.store";
import { useReportsStore } from "@/stores/reports.store";
import { useClientsStore } from "@/stores/clients.store";
import { SaleDetailSheet } from "@/components/SaleDetailSheet";
import { AccountSheet } from "@/components/AccountSheet";
import { buildSummary, type ReportPeriod, type ChartBar } from "@/lib/reports";
import { soles, initials, formatQty, unitShort } from "@/lib/format";
import { firstName, saleReceiptMessage } from "@/lib/fiados";
import { openWhatsApp } from "@/lib/whatsapp";
import { PAYMENT_UI } from "@/config/payment-methods";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { Sale } from "@/types";

const PERIODS: { id: ReportPeriod; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mes" },
];

const SALES_LABEL: Record<ReportPeriod, string> = {
  today: "VENTAS HOY",
  week: "VENTAS DE LA SEMANA",
  month: "VENTAS DEL MES",
};

const SALES_TITLE: Record<ReportPeriod, string> = {
  today: "TODAS LAS VENTAS DE HOY",
  week: "TODAS LAS VENTAS DE LA SEMANA",
  month: "TODAS LAS VENTAS DEL MES",
};

const MAX_SALES_ROWS = 50;

export default function ReportesScreen() {
  const { store, logout } = useAuthStore();
  const storeId = store?.id;

  const sales = useReportsStore((s) => s.sales);
  const isLoading = useReportsStore((s) => s.is_loading);
  const load = useReportsStore((s) => s.load);
  const voidSale = useReportsStore((s) => s.voidSale);

  const products = useInventoryStore((s) => s.products);
  const categories = useInventoryStore((s) => s.categories);

  const clients = useClientsStore((s) => s.clients);
  const loadClients = useClientsStore((s) => s.loadClients);

  const [period, setPeriod] = useState<ReportPeriod>("today");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [voiding, setVoiding] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!storeId) return;
      load(storeId);
      loadClients(storeId);
    }, [storeId, load, loadClients]),
  );

  // Cliente de la venta abierta (para enviar el recibo del fiado por WhatsApp).
  const detailClient = detailSale?.client_id
    ? (clients.find((c) => c.id === detailSale.client_id) ?? null)
    : null;

  const summary = useMemo(() => buildSummary(sales, period), [sales, period]);

  // Mapa producto → ícono/color de su categoría (para "Más vendidos").
  const iconFor = useCallback(
    (productId: string): { emoji: string; color: string } => {
      const p = products.find((x) => x.id === productId);
      const cat = p ? categories.find((c) => c.id === p.category_id) : undefined;
      return { emoji: cat?.icon ?? "📦", color: cat?.color ?? colors.inkSoft };
    },
    [products, categories],
  );

  const onRefresh = useCallback(() => {
    if (storeId) load(storeId);
  }, [storeId, load]);

  const confirmVoid = (sale: Sale) => {
    Alert.alert(
      "Anular venta",
      `¿Anular esta venta de ${soles(sale.total)}? Se devolverá el stock` +
        (sale.payment_type === "credit" ? " y se descontará la deuda del cliente." : "."),
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Anular",
          style: "destructive",
          onPress: async () => {
            setVoiding(true);
            try {
              await voidSale(sale);
              setDetailSale(null);
            } catch {
              Alert.alert("Error", "No se pudo anular la venta. Intenta de nuevo.");
            } finally {
              setVoiding(false);
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: () => logout() },
    ]);
  };

  const topToShow = showAllProducts ? summary.topProducts : summary.topProducts.slice(0, 5);
  const salesToShow = summary.sales.slice(0, MAX_SALES_ROWS);

  const fiadoTitle = period === "today" ? "FIADO DEL DÍA" : "FIADO";
  const peakTitle = period === "today" ? "HORA PICO" : "DÍA PICO";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>TUS VENTAS</Text>
          <Text style={s.title}>Reportes</Text>
        </View>
        <TouchableOpacity
          style={s.avatar}
          onPress={() => setAccountOpen(true)}
          activeOpacity={0.85}
        >
          <Text style={s.avatarText}>{initials(store?.name ?? "Mi Tienda")}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabs}>
        {PERIODS.map((p) => {
          const active = p.id === period;
          return (
            <TouchableOpacity
              key={p.id}
              style={[s.tab, active && s.tabActive]}
              onPress={() => setPeriod(p.id)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, active && s.tabTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading && sales.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Tarjeta principal: total + variación + gráfico */}
          <View style={s.card}>
            <View style={s.salesHead}>
              <Text style={s.cardLabel}>{SALES_LABEL[period]}</Text>
              {summary.deltaPct != null && (
                <View style={[s.delta, summary.deltaPct < 0 && s.deltaDown]}>
                  <Ionicons
                    name={summary.deltaPct < 0 ? "arrow-down" : "arrow-up"}
                    size={11}
                    color={summary.deltaPct < 0 ? colors.danger : colors.primary}
                  />
                  <Text style={[s.deltaText, summary.deltaPct < 0 && s.deltaTextDown]}>
                    {summary.deltaPct >= 0 ? "+" : ""}
                    {Math.round(summary.deltaPct * 100)}%
                  </Text>
                </View>
              )}
            </View>
            <Text style={s.bigValue}>{soles(summary.total)}</Text>
            <BarChart bars={summary.chart} />
          </View>

          {summary.count === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="bar-chart-outline" size={36} color={colors.inkSoft} />
              <Text style={s.emptyText}>Aún no hay ventas en este período</Text>
            </View>
          ) : (
            <>
              {/* Stats 2x2 */}
              <View style={s.statsGrid}>
                <Stat title="TRANSACCIONES" value={String(summary.count)} sub="ventas" />
                <Stat title="TICKET PROMEDIO" value={soles(summary.avgTicket)} sub="por venta" />
                <Stat title={fiadoTitle} value={soles(summary.credit)} sub="por cobrar" danger />
                <Stat title={peakTitle} value={summary.peakLabel ?? "—"} sub="mayor venta" />
              </View>

              {/* Métodos de pago */}
              {summary.payments.length > 0 && (
                <View style={s.card}>
                  <Text style={s.cardLabel}>MÉTODOS DE PAGO</Text>
                  <View style={s.stack}>
                    {summary.payments.map((p) => (
                      <View
                        key={p.type}
                        style={{
                          flex: p.pct,
                          backgroundColor: PAYMENT_UI[p.type].color,
                        }}
                      />
                    ))}
                  </View>
                  <View style={s.payList}>
                    {summary.payments.map((p) => (
                      <View key={p.type} style={s.payRow}>
                        <View style={[s.payDot, { backgroundColor: PAYMENT_UI[p.type].color }]} />
                        <Text style={s.payLabel}>{PAYMENT_UI[p.type].label}</Text>
                        <Text style={s.payPct}>{Math.round(p.pct * 100)}%</Text>
                        <Text style={s.payAmount}>{soles(p.amount)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Más vendidos */}
              {summary.topProducts.length > 0 && (
                <View style={s.card}>
                  <View style={s.salesHead}>
                    <Text style={s.cardLabel}>MÁS VENDIDOS</Text>
                    {summary.topProducts.length > 5 && (
                      <TouchableOpacity onPress={() => setShowAllProducts((v) => !v)}>
                        <Text style={s.link}>{showAllProducts ? "Ver menos" : "Ver todo"}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {topToShow.map((p, i) => {
                    const ic = iconFor(p.product_id);
                    return (
                      <View key={p.product_id} style={s.topRow}>
                        <Text style={s.rank}>{i + 1}</Text>
                        <View style={[s.prodIcon, { backgroundColor: ic.color + "22" }]}>
                          <Text style={s.prodEmoji}>{ic.emoji}</Text>
                        </View>
                        <View style={s.topInfo}>
                          <Text style={s.topName} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <Text style={s.topSub}>
                            {formatQty(p.quantity, p.unit)} {unitShort(p.unit)} vendidas
                          </Text>
                        </View>
                        <Text style={s.topAmount}>{soles(p.amount)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Todas las ventas */}
              <View style={s.card}>
                <View style={s.salesHead}>
                  <Text style={s.cardLabel}>{SALES_TITLE[period]}</Text>
                  <Text style={s.hint}>toca para detalle</Text>
                </View>
                {salesToShow.map((sale) => (
                  <TouchableOpacity
                    key={sale.id}
                    style={s.saleRow}
                    activeOpacity={0.7}
                    onPress={() => setDetailSale(sale)}
                  >
                    <View
                      style={[s.payDot, { backgroundColor: PAYMENT_UI[sale.payment_type].color }]}
                    />
                    <Text style={s.saleTime}>
                      {sale.created_at.toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <Text style={s.saleMethod}>{PAYMENT_UI[sale.payment_type].label}</Text>
                    <Text style={s.saleItems}>
                      {sale.items.length || 1} {sale.items.length === 1 ? "ítem" : "ítems"}
                    </Text>
                    <Text style={s.saleAmount}>{soles(sale.total)}</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.inkSoft} />
                  </TouchableOpacity>
                ))}
                {summary.sales.length > MAX_SALES_ROWS && (
                  <Text style={s.moreNote}>
                    Mostrando {MAX_SALES_ROWS} de {summary.sales.length} ventas
                  </Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <SaleDetailSheet
        sale={detailSale}
        iconFor={iconFor}
        voiding={voiding}
        onClose={() => setDetailSale(null)}
        onReprint={() =>
          Alert.alert("Próximamente", "La reimpresión de tickets estará disponible pronto.")
        }
        onVoid={() => detailSale && confirmVoid(detailSale)}
        onSend={
          detailSale && detailClient?.phone
            ? () => openWhatsApp(detailClient.phone!, saleReceiptMessage(detailSale, store?.name))
            : undefined
        }
        sendLabel={detailClient ? `Enviar a ${firstName(detailClient.name)}` : "Enviar"}
      />

      <AccountSheet
        visible={accountOpen}
        onClose={() => setAccountOpen(false)}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
}

function Stat({
  title,
  value,
  sub,
  danger,
}: {
  title: string;
  value: string;
  sub: string;
  danger?: boolean;
}) {
  return (
    <View style={s.stat}>
      <Text style={s.statTitle}>{title}</Text>
      <Text style={[s.statValue, danger && s.statValueDanger]}>{value}</Text>
      <Text style={s.statSub}>{sub}</Text>
    </View>
  );
}

function BarChart({ bars }: { bars: ChartBar[] }) {
  const max = Math.max(0, ...bars.map((b) => b.value));
  return (
    <View style={s.chart}>
      <View style={s.chartBars}>
        {bars.map((b, i) => {
          const ratio = max > 0 ? b.value / max : 0;
          return (
            <View key={`${b.label}-${i}`} style={s.barCol}>
              <View
                style={[
                  s.bar,
                  {
                    height: `${Math.max(ratio * 100, b.value > 0 ? 8 : 3)}%`,
                    backgroundColor: colors.primary,
                    opacity: 0.35 + ratio * 0.65,
                  },
                  b.value === 0 && s.barEmpty,
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={s.chartLabels}>
        {bars.map((b, i) => (
          <Text key={`${b.label}-${i}-l`} style={s.barLabel} numberOfLines={1}>
            {b.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  eyebrow: { ...typography.caption, color: colors.inkSoft, letterSpacing: 1, marginBottom: 2 },
  title: { ...typography.display, fontSize: 30, color: colors.ink },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.accentInk, fontFamily: fontFamilies.display, fontSize: fontSize.sm },

  tabs: {
    flexDirection: "row",
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  tabActive: { backgroundColor: colors.surface, ...shadows.shadow },
  tabText: { ...typography.bodySm, fontFamily: fontFamilies.body, color: colors.inkMid },
  tabTextActive: { fontFamily: fontFamilies.display, color: colors.ink },

  scroll: { padding: spacing.lg, paddingBottom: 120, gap: spacing.md },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.shadow,
  },
  cardLabel: { ...typography.caption, color: colors.inkSoft, letterSpacing: 1 },

  salesHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { ...typography.bodySm, fontFamily: fontFamilies.display, color: colors.primary },
  hint: { ...typography.caption, color: colors.inkSoft },

  delta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.chipBg,
  },
  deltaDown: { backgroundColor: "rgba(192,64,50,0.10)" },
  deltaText: { ...typography.caption, fontFamily: fontFamilies.display, color: colors.primary },
  deltaTextDown: { color: colors.danger },

  bigValue: {
    fontFamily: fontFamilies.display,
    fontSize: 40,
    color: colors.ink,
    letterSpacing: -1,
    marginTop: 2,
    marginBottom: spacing.md,
  },

  chart: { gap: spacing.xs },
  chartBars: { flexDirection: "row", alignItems: "flex-end", height: 80, gap: 3 },
  barCol: { flex: 1, height: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 3, minHeight: 3 },
  barEmpty: { backgroundColor: colors.surfaceMuted, opacity: 1 },
  chartLabels: { flexDirection: "row", gap: 3 },
  barLabel: {
    flex: 1,
    textAlign: "center",
    ...typography.caption,
    fontSize: 9,
    color: colors.inkSoft,
  },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  stat: {
    flexGrow: 1,
    flexBasis: "47%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 2,
    ...shadows.shadow,
  },
  statTitle: { ...typography.caption, color: colors.inkSoft, letterSpacing: 0.5 },
  statValue: { fontFamily: fontFamilies.display, fontSize: fontSize.xl, color: colors.ink },
  statValueDanger: { color: colors.danger },
  statSub: { ...typography.caption, color: colors.inkSoft },

  stack: {
    flexDirection: "row",
    height: 10,
    borderRadius: radius.pill,
    overflow: "hidden",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: 2,
  },
  payList: { gap: spacing.sm, marginTop: spacing.xs },
  payRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  payDot: { width: 10, height: 10, borderRadius: 5 },
  payLabel: { ...typography.body, color: colors.ink, flex: 1 },
  payPct: { ...typography.bodySm, color: colors.inkSoft, width: 44, textAlign: "right" },
  payAmount: {
    ...typography.body,
    fontFamily: fontFamilies.display,
    color: colors.ink,
    width: 88,
    textAlign: "right",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rank: { ...typography.body, color: colors.inkSoft, width: 16, textAlign: "center" },
  prodIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  prodEmoji: { fontSize: 18 },
  topInfo: { flex: 1, gap: 1 },
  topName: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  topSub: { ...typography.bodySm, color: colors.inkSoft },
  topAmount: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },

  saleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  saleTime: { ...typography.bodySm, color: colors.inkMid, width: 60 },
  saleMethod: { ...typography.body, color: colors.ink, flex: 1 },
  saleItems: { ...typography.bodySm, color: colors.inkSoft },
  saleAmount: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  moreNote: {
    ...typography.caption,
    color: colors.inkSoft,
    textAlign: "center",
    paddingTop: spacing.md,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.shadow,
  },
  emptyText: { ...typography.body, color: colors.inkSoft },
});
