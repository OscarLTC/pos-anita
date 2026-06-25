import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useInventoryStore } from "@/stores/inventory.store";
import { useAuthStore } from "@/stores/auth.store";
import { useSalesStore } from "@/stores/sales.store";
import { useClientsStore } from "@/stores/clients.store";
import { useCartStore, cartRawTotal, cartTotal, roundToCash } from "@/stores/cart.store";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import { WeightInputModal } from "@/components/WeightInputModal";
import { CartSheet } from "@/components/CartSheet";
import { PaymentSheet } from "@/components/PaymentSheet";
import { SuccessSheet } from "@/components/SuccessSheet";
import { FiarSheet } from "@/components/FiarSheet";
import { NewClientSheet } from "@/components/NewClientSheet";
import type { PaymentMethod } from "@/config/payment-methods";
import { soles, unitLabel } from "@/lib/format";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { Client, CreateClientInput, PaymentType, Product, SaleItem } from "@/types";
import { withAlpha } from "@/lib/colors";

type SuccessInfo =
  | { kind: "sale"; total: number; label: string }
  | { kind: "fiar"; total: number; clientName: string; phone?: string; newDebt: number };

const AVATAR_BG = "rgba(242,199,68,0.20)"; // accent suave (amarillo)

export default function VenderScreen() {
  const { store } = useAuthStore();
  const { products, categories, is_loading } = useInventoryStore();
  const createSale = useSalesStore((s) => s.createSale);

  const items = useCartStore((s) => s.items);
  const addUnit = useCartStore((s) => s.addUnit);
  const setWeight = useCartStore((s) => s.setWeight);
  const clearCart = useCartStore((s) => s.clear);

  const addClient = useClientsStore((s) => s.addClient);
  const applyDebt = useClientsStore((s) => s.applyDebt);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scan, setScan] = useState<{ product: Product } | { notFound: string } | null>(null);
  const [cartVisible, setCartVisible] = useState(false);
  const [weightModal, setWeightModal] = useState<{ product: Product; qty?: number } | null>(null);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  // Fiar
  const [fiarVisible, setFiarVisible] = useState(false);
  const [newClientVisible, setNewClientVisible] = useState(false);
  const [registeringClientId, setRegisteringClientId] = useState<string | null>(null);
  const [savingClient, setSavingClient] = useState(false);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.status === "active" &&
          (!selectedCategoryId || p.category_id === selectedCategoryId) &&
          (!searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode === searchQuery),
      ),
    [products, selectedCategoryId, searchQuery],
  );

  const cartCount = items.length;
  const cartAmount = cartRawTotal(items);

  const handleProductPress = (product: Product) => {
    if (product.unit !== "unit") {
      const current = items.find((i) => i.product.id === product.id)?.quantity;
      setWeightModal({ product, qty: current });
    } else {
      addUnit(product);
    }
  };

  const handleBarcodeScanned = (code: string) => {
    const match = products.find((p) => p.barcode === code && p.status === "active");
    setScan(match ? { product: match } : { notFound: code });
  };

  const closeScanner = () => {
    setScannerVisible(false);
    setScan(null);
  };

  const handleScanAdd = () => {
    if (!scan || !("product" in scan)) return;
    const product = scan.product;
    if (product.unit !== "unit") {
      // Productos por peso: cierra el escáner y abre el modal de peso (con un
      // pequeño delay para no presentar dos modales nativos a la vez en iOS).
      const qty = items.find((i) => i.product.id === product.id)?.quantity;
      closeScanner();
      setTimeout(() => setWeightModal({ product, qty }), 350);
    } else {
      addUnit(product);
      setScan(null); // sigue escaneando
    }
  };

  const scanResult = !scan
    ? null
    : "product" in scan
      ? {
          status: "found" as const,
          icon: categories.find((c) => c.id === scan.product.category_id)?.icon ?? "📦",
          name: scan.product.name,
          subtitle: `${soles(scan.product.sale_price)} · stock ${scan.product.stock}`,
        }
      : { status: "not_found" as const, code: scan.notFound };

  // --- Flujo de cobro ---
  const openPayment = () => {
    setCheckoutTotal(cartRawTotal(items));
    setCartVisible(false);
    setTimeout(() => setPaymentVisible(true), 320);
  };

  const saleItems = (applies: boolean): SaleItem[] =>
    items.map((item) => {
      const raw = item.product.sale_price * item.quantity;
      return {
        product_id: item.product.id,
        product_name: item.product.name,
        unit: item.product.unit,
        quantity: item.quantity,
        unit_price: item.product.sale_price,
        subtotal: parseFloat((applies ? roundToCash(raw) : raw).toFixed(2)),
      };
    });

  const handleSelectMethod = async (method: PaymentMethod) => {
    if (method.kind === "credit") {
      setPaymentVisible(false);
      setTimeout(() => setFiarVisible(true), 320);
      return;
    }
    if (!store?.id || items.length === 0) return;

    const paymentType = method.id as PaymentType;
    const applies = store.rounding_methods?.includes(paymentType) ?? false;
    const effective = cartTotal(items, applies);

    setRegistering(true);
    try {
      await createSale(store.id, {
        items: saleItems(applies),
        total: parseFloat(effective.toFixed(2)),
        payment_type: paymentType,
      });
      clearCart();
      setPaymentVisible(false);
      setTimeout(() => setSuccess({ kind: "sale", total: effective, label: method.label }), 320);
    } catch {
      Alert.alert("Error", "No se pudo registrar la venta. Intenta de nuevo.");
    } finally {
      setRegistering(false);
    }
  };

  // Registra una venta a crédito (fiado) al cliente dado.
  const doFiar = async (client: Client) => {
    if (!store?.id || items.length === 0) return;
    const total = cartRawTotal(items);
    await createSale(store.id, {
      items: saleItems(false),
      total: parseFloat(total.toFixed(2)),
      payment_type: "credit",
      client_id: client.id,
      client_name: client.name,
    });
    applyDebt(client.id, total);
    clearCart();
    setFiarVisible(false);
    setNewClientVisible(false);
    const newDebt = client.debt + total;
    setTimeout(
      () =>
        setSuccess({ kind: "fiar", total, clientName: client.name, phone: client.phone, newDebt }),
      320,
    );
  };

  const handleSelectClient = async (client: Client) => {
    setRegisteringClientId(client.id);
    try {
      await doFiar(client);
    } catch {
      Alert.alert("Error", "No se pudo registrar el fiado. Intenta de nuevo.");
    } finally {
      setRegisteringClientId(null);
    }
  };

  const handleCreateClient = async (input: CreateClientInput) => {
    if (!store?.id) return;
    setSavingClient(true);
    try {
      const client = await addClient(store.id, input);
      await doFiar(client);
    } catch {
      Alert.alert("Error", "No se pudo guardar el cliente. Intenta de nuevo.");
    } finally {
      setSavingClient(false);
    }
  };

  const sendWhatsApp = (info: Extract<SuccessInfo, { kind: "fiar" }>) => {
    if (!info.phone) return;
    const msg =
      `Hola ${info.clientName}, te anoté ${soles(info.total)} en la libreta` +
      `${store?.name ? ` de ${store.name}` : ""}. Tu deuda total es ${soles(info.newDebt)}. ¡Gracias!`;
    Linking.openURL(
      `https://wa.me/${info.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`,
    );
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const category = categories.find((c) => c.id === item.category_id);
    const swatch = category?.color ?? "#929C94";
    const qty = items.find((i) => i.product.id === item.id)?.quantity ?? 0;
    const lowStock = item.stock <= item.min_stock;
    const isWeight = item.unit !== "unit";

    return (
      <TouchableOpacity style={s.card} activeOpacity={0.7} onPress={() => handleProductPress(item)}>
        <View style={[s.avatar, { backgroundColor: withAlpha(swatch, 0.2) }]}>
          <Text style={s.avatarIcon}>{category?.icon ?? "📦"}</Text>
          {qty > 0 && (
            <View style={s.qtyBadge}>
              <Text style={s.qtyBadgeText}>{isWeight ? "✓" : qty}</Text>
            </View>
          )}
        </View>

        <View style={s.cardInfo}>
          <Text style={s.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={s.cardMetaRow}>
            {lowStock && (
              <Ionicons name="warning" size={12} color={colors.danger} style={s.warnIcon} />
            )}
            <Text style={[s.cardMeta, lowStock && s.cardMetaLow]} numberOfLines={1}>
              stock {item.stock}
              {category ? ` · ${category.name}` : ""}
            </Text>
          </View>
        </View>

        <Text style={s.cardPrice}>
          {soles(item.sale_price)}
          {isWeight && <Text style={s.cardPriceUnit}> {unitLabel(item.unit)}</Text>}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.eyebrow}>PUNTO DE VENTA</Text>
        <Text style={s.title}>Vender</Text>
      </View>

      {/* Buscador + escáner */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search" size={18} color={colors.inkSoft} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar producto"
            placeholderTextColor={colors.inkSoft}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity style={s.scanBtn} onPress={() => setScannerVisible(true)}>
          <Ionicons name="barcode-outline" size={22} color={colors.ink} />
        </TouchableOpacity>
      </View>

      {/* Filtro de categorías */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips}
        >
          <Chip
            label="Todos"
            active={!selectedCategoryId}
            onPress={() => setSelectedCategoryId(null)}
          />
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              label={`${cat.icon} ${cat.name}`}
              active={selectedCategoryId === cat.id}
              onPress={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Lista de productos */}
      {is_loading && filtered.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          extraData={items}
          contentContainerStyle={[
            s.listContent,
            { paddingBottom: cartCount > 0 ? 88 : spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>
                {searchQuery ? "Sin resultados" : "No hay productos disponibles"}
              </Text>
            </View>
          }
        />
      )}

      {/* Barra Ver carrito */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={s.cartBar}
          activeOpacity={0.9}
          onPress={() => setCartVisible(true)}
        >
          <View style={s.cartCountBadge}>
            <Text style={s.cartCountText}>{cartCount}</Text>
          </View>
          <Text style={s.cartBarLabel}>Ver carrito</Text>
          <Text style={s.cartBarTotal}>{soles(cartAmount)}</Text>
        </TouchableOpacity>
      )}

      <CartSheet
        visible={cartVisible}
        onClose={() => setCartVisible(false)}
        onCheckout={openPayment}
      />

      <PaymentSheet
        visible={paymentVisible}
        total={checkoutTotal}
        onClose={() => setPaymentVisible(false)}
        onSelect={handleSelectMethod}
        loading={registering}
      />

      <FiarSheet
        visible={fiarVisible}
        onClose={() => setFiarVisible(false)}
        onSelectClient={handleSelectClient}
        onNewClient={() => {
          setFiarVisible(false);
          setTimeout(() => setNewClientVisible(true), 320);
        }}
        loadingClientId={registeringClientId}
      />

      <NewClientSheet
        visible={newClientVisible}
        onClose={() => setNewClientVisible(false)}
        onCreate={handleCreateClient}
        saving={savingClient}
      />

      <SuccessSheet
        visible={!!success}
        title={success?.kind === "fiar" ? "¡Anotado en la libreta!" : "¡Venta realizada!"}
        subtitle={
          success?.kind === "fiar" ? (
            <Text>
              Fiaste <Text style={s.successStrong}>{soles(success.total)}</Text> a{" "}
              {success.clientName}
            </Text>
          ) : success ? (
            <Text>
              <Text style={s.successStrong}>{soles(success.total)}</Text> cobrado en {success.label}
            </Text>
          ) : null
        }
        onWhatsApp={
          success?.kind === "fiar" && success.phone ? () => sendWhatsApp(success) : undefined
        }
        onDone={() => setSuccess(null)}
      />

      <BarcodeScannerModal
        visible={scannerVisible}
        onScanned={handleBarcodeScanned}
        onClose={closeScanner}
        result={scanResult}
        onAdd={handleScanAdd}
        onScanAgain={() => setScan(null)}
      />
      <WeightInputModal
        product={weightModal?.product ?? null}
        initial_quantity={weightModal?.qty}
        onConfirm={(product, quantity) => {
          setWeight(product, quantity);
          setWeightModal(null);
        }}
        onClose={() => setWeightModal(null)}
      />
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[s.chip, active && s.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.inkSoft,
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    ...typography.display,
    fontSize: 30,
    color: colors.ink,
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    ...typography.bodySm,
    color: colors.inkMid,
  },
  chipTextActive: {
    color: colors.surface,
    fontFamily: fontFamilies.display,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...shadows.shadow,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: AVATAR_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: {
    fontSize: 22,
  },
  qtyBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  qtyBadgeText: {
    color: colors.primaryInk,
    fontSize: 10,
    fontFamily: fontFamilies.display,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    ...typography.body,
    fontFamily: fontFamilies.display,
    color: colors.ink,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  warnIcon: {
    marginTop: 1,
  },
  cardMeta: {
    ...typography.bodySm,
    color: colors.inkSoft,
  },
  cardMetaLow: {
    color: colors.danger,
  },
  cardPrice: {
    ...typography.body,
    fontFamily: fontFamilies.display,
    color: colors.ink,
    marginLeft: spacing.sm,
  },
  cardPriceUnit: {
    ...typography.caption,
    fontFamily: fontFamilies.body,
    color: colors.inkSoft,
  },
  successStrong: { fontFamily: fontFamilies.display, color: colors.ink },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { ...typography.body, color: colors.inkSoft },
  cartBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.sm,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    ...shadows.shadowLg,
  },
  cartCountBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  cartCountText: {
    color: colors.primaryInk,
    fontFamily: fontFamilies.display,
    fontSize: fontSize.sm,
  },
  cartBarLabel: {
    flex: 1,
    marginLeft: spacing.md,
    color: colors.primaryInk,
    fontFamily: fontFamilies.display,
    fontSize: fontSize.md,
  },
  cartBarTotal: {
    color: colors.primaryInk,
    fontFamily: fontFamilies.display,
    fontSize: fontSize.lg,
  },
});
