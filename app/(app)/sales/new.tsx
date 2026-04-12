import { useState, useMemo, useCallback } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useInventoryStore } from "@/stores/inventory.store";
import { useSalesStore } from "@/stores/sales.store";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore, type AppColors } from "@/theme";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import type { PaymentType, Product } from "@/types";

type CartItem = { product: Product; quantity: number };

const PAYMENT_OPTIONS: {
  type: PaymentType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { type: "cash", label: "Efectivo", icon: "cash-outline" },
  { type: "yape", label: "Yape", icon: "phone-portrait-outline" },
  { type: "plin", label: "Plin", icon: "phone-portrait-outline" },
  { type: "card", label: "Tarjeta", icon: "card-outline" },
];

export default function NewSaleScreen() {
  const router = useRouter();
  const { store } = useAuthStore();
  const { colors } = useThemeStore();
  const { products, categories } = useInventoryStore();
  const { createSale } = useSalesStore();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search_query, setSearchQuery] = useState("");
  const [selected_category_id, setSelectedCategoryId] = useState<string | null>(null);
  const [payment_type, setPaymentType] = useState<PaymentType>("cash");
  const [note, setNote] = useState("");
  const [show_cart, setShowCart] = useState(true);
  const [is_saving, setIsSaving] = useState(false);
  const [scanner_visible, setScannerVisible] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  const filtered_products = useMemo(() => {
    return products.filter(
      (p) =>
        p.status === "active" &&
        (!selected_category_id || p.category_id === selected_category_id) &&
        (!search_query ||
          p.name.toLowerCase().includes(search_query.toLowerCase()) ||
          p.barcode === search_query),
    );
  }, [products, selected_category_id, search_query]);

  const cart_total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0),
    [cart],
  );

  const cart_count = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const getCartQty = useCallback(
    (product_id: string) => cart.find((i) => i.product.id === product_id)?.quantity ?? 0,
    [cart],
  );

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setShowCart(true);
  }, []);

  const decreaseQty = useCallback((product_id: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.product.id === product_id);
      if (!item) return prev;
      if (item.quantity <= 1) return prev.filter((i) => i.product.id !== product_id);
      return prev.map((i) =>
        i.product.id === product_id ? { ...i, quantity: i.quantity - 1 } : i,
      );
    });
  }, []);

  const removeFromCart = useCallback((product_id: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== product_id));
  }, []);

  const handleBarcodeScanned = (code: string) => {
    setScannerVisible(false);
    setTimeout(() => {
      const match = products.find((p) => p.barcode === code && p.status === "active");
      if (match) {
        addToCart(match);
        setSearchQuery("");
      } else {
        setSearchQuery(code);
      }
    }, 400);
  };

  const handleSave = async () => {
    if (!store?.id) return;
    if (cart.length === 0)
      return Alert.alert("Carrito vacío", "Agrega productos antes de registrar.");

    setIsSaving(true);
    try {
      await createSale(store.id, {
        items: cart.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          unit: item.product.unit,
          quantity: item.quantity,
          unit_price: item.product.sale_price,
          subtotal: item.product.sale_price * item.quantity,
        })),
        total: cart_total,
        payment_type,
        note: note.trim() || undefined,
      });
      router.back();
    } catch {
      Alert.alert("Error", "No se pudo registrar la venta. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => {
      const qty = getCartQty(item.id);
      const category = categories.find((c) => c.id === item.category_id);

      return (
        <View style={s.product_row}>
          <View style={s.product_info}>
            {category && (
              <Text style={s.product_category}>
                {category.icon} {category.name}
              </Text>
            )}
            <Text style={s.product_name}>{item.name}</Text>
            <Text style={s.product_price}>S/ {item.sale_price.toFixed(2)}</Text>
          </View>
          <View style={s.product_controls}>
            {qty > 0 ? (
              <View style={s.qty_controls}>
                <TouchableOpacity style={s.qty_btn} onPress={() => decreaseQty(item.id)}>
                  <Ionicons name="remove" size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={s.qty_text}>{qty}</Text>
                <TouchableOpacity style={s.qty_btn} onPress={() => addToCart(item)}>
                  <Ionicons name="add" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.add_btn} onPress={() => addToCart(item)}>
                <Ionicons name="add" size={20} color={colors.accent_text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [cart, categories, colors, s],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={s.container}>
        <View style={s.search_row}>
          <TextInput
            style={s.search_input}
            placeholder="Buscar producto..."
            placeholderTextColor={colors.text4}
            value={search_query}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          <TouchableOpacity style={s.scan_btn} onPress={() => setScannerVisible(true)}>
            <Ionicons name="barcode-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <BarcodeScannerModal
          visible={scanner_visible}
          onScanned={handleBarcodeScanned}
          onClose={() => setScannerVisible(false)}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.category_scroll}
          contentContainerStyle={s.category_row}
        >
          <TouchableOpacity
            style={[s.chip, !selected_category_id && s.chip_active]}
            onPress={() => setSelectedCategoryId(null)}
          >
            <Text style={[s.chip_text, !selected_category_id && s.chip_text_active]}>Todos</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[s.chip, selected_category_id === cat.id && s.chip_active]}
              onPress={() => setSelectedCategoryId(selected_category_id === cat.id ? null : cat.id)}
            >
              <Text style={[s.chip_text, selected_category_id === cat.id && s.chip_text_active]}>
                {cat.icon} {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          style={s.list}
          data={filtered_products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          extraData={cart}
          contentContainerStyle={filtered_products.length === 0 ? s.list_empty_wrap : undefined}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.empty_text}>
                {search_query ? "Sin resultados" : "No hay productos disponibles"}
              </Text>
            </View>
          }
        />

        {cart.length > 0 && (
          <View style={s.cart_section}>
            <TouchableOpacity
              style={s.cart_header}
              onPress={() => setShowCart((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={s.cart_header_left}>
                <Ionicons name="cart-outline" size={18} color={colors.text} />
                <Text style={s.cart_header_text}>
                  Carrito ({cart_count} {cart_count === 1 ? "item" : "items"})
                </Text>
              </View>
              <View style={s.cart_header_right}>
                <Text style={s.cart_total_preview}>S/ {cart_total.toFixed(2)}</Text>
                <Ionicons
                  name={show_cart ? "chevron-down" : "chevron-up"}
                  size={16}
                  color={colors.text3}
                />
              </View>
            </TouchableOpacity>

            {show_cart && (
              <>
                <ScrollView style={s.cart_items} nestedScrollEnabled>
                  {cart.map((item) => (
                    <View key={item.product.id} style={s.cart_item}>
                      <View style={s.cart_item_info}>
                        <Text style={s.cart_item_name} numberOfLines={1}>
                          {item.product.name}
                        </Text>
                        <Text style={s.cart_item_sub}>
                          {item.quantity} × S/ {item.product.sale_price.toFixed(2)}
                        </Text>
                      </View>
                      <View style={s.cart_item_right}>
                        <Text style={s.cart_item_subtotal}>
                          S/ {(item.product.sale_price * item.quantity).toFixed(2)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeFromCart(item.product.id)}
                          hitSlop={8}
                        >
                          <Ionicons name="close-circle" size={18} color={colors.text4} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <TextInput
                    style={s.note_input}
                    placeholder="Nota (opcional)..."
                    placeholderTextColor={colors.text4}
                    value={note}
                    onChangeText={setNote}
                    multiline
                  />
                </ScrollView>

                <View style={s.payment_row}>
                  {PAYMENT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.type}
                      style={[s.payment_chip, payment_type === opt.type && s.payment_chip_active]}
                      onPress={() => setPaymentType(opt.type)}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={14}
                        color={payment_type === opt.type ? colors.accent_text : colors.text3}
                      />
                      <Text
                        style={[
                          s.payment_chip_text,
                          payment_type === opt.type && s.payment_chip_text_active,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[s.confirm_btn, is_saving && s.confirm_btn_disabled]}
              onPress={handleSave}
              disabled={is_saving}
            >
              {is_saving ? (
                <ActivityIndicator color={colors.accent_text} />
              ) : (
                <Text style={s.confirm_btn_text}>Registrar venta · S/ {cart_total.toFixed(2)}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    search_row: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    search_input: {
      flex: 1,
      height: 40,
      backgroundColor: c.bg2,
      borderRadius: 10,
      paddingHorizontal: 14,
      fontSize: 15,
      color: c.text,
    },
    scan_btn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: c.bg2,
      alignItems: "center",
      justifyContent: "center",
    },
    category_scroll: {
      flexGrow: 0,
    },
    category_row: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 0.5,
      borderColor: c.border,
      backgroundColor: c.bg,
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
    list: {
      flex: 1,
    },
    list_empty_wrap: {
      flexGrow: 1,
    },
    product_row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border3,
    },
    product_info: {
      flex: 1,
      gap: 2,
    },
    product_category: {
      fontSize: 11,
      color: c.text4,
    },
    product_name: {
      fontSize: 15,
      fontWeight: "500",
      color: c.text,
    },
    product_price: {
      fontSize: 13,
      color: c.text2,
    },
    product_controls: {
      marginLeft: 12,
    },
    qty_controls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    qty_btn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: c.bg2,
      alignItems: "center",
      justifyContent: "center",
    },
    qty_text: {
      fontSize: 15,
      fontWeight: "600",
      color: c.text,
      width: 28,
      textAlign: "center",
    },
    add_btn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 60,
    },
    empty_text: {
      fontSize: 15,
      color: c.text4,
    },
    cart_section: {
      borderTopWidth: 0.5,
      borderTopColor: c.border,
      backgroundColor: c.bg,
      maxHeight: 380,
    },
    cart_header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    cart_header_left: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    cart_header_text: {
      fontSize: 14,
      fontWeight: "600",
      color: c.text,
    },
    cart_header_right: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    cart_total_preview: {
      fontSize: 16,
      fontWeight: "700",
      color: c.text,
    },
    cart_items: {
      maxHeight: 160,
      borderTopWidth: 0.5,
      borderTopColor: c.border3,
    },
    cart_item: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border3,
    },
    cart_item_info: {
      flex: 1,
      gap: 2,
    },
    cart_item_name: {
      fontSize: 14,
      fontWeight: "500",
      color: c.text,
    },
    cart_item_sub: {
      fontSize: 12,
      color: c.text3,
    },
    cart_item_right: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginLeft: 8,
    },
    cart_item_subtotal: {
      fontSize: 14,
      fontWeight: "600",
      color: c.text,
    },
    note_input: {
      marginHorizontal: 16,
      marginVertical: 8,
      fontSize: 13,
      color: c.text,
      borderWidth: 0.5,
      borderColor: c.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: c.bg4,
      minHeight: 32,
    },
    payment_row: {
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 16,
      paddingBottom: 10,
      paddingTop: 4,
    },
    payment_chip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: c.border,
      backgroundColor: c.bg2,
    },
    payment_chip_active: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    payment_chip_text: {
      fontSize: 11,
      fontWeight: "500",
      color: c.text3,
    },
    payment_chip_text_active: {
      color: c.accent_text,
    },
    confirm_btn: {
      marginHorizontal: 16,
      marginBottom: 12,
      height: 50,
      backgroundColor: c.accent,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    confirm_btn_disabled: {
      opacity: 0.6,
    },
    confirm_btn_text: {
      color: c.accent_text,
      fontSize: 16,
      fontWeight: "600",
    },
  });
