import { useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import { useRouter } from "expo-router";
import { useInventoryStore } from "@/stores/inventory.store";
import { useAuthStore } from "@/stores/auth.store";
import { ProductCard } from "@/components/ProductCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { useThemeStore, type AppColors } from "@/theme";

export default function InventoryScreen() {
  const router = useRouter();
  const { store_id } = useAuthStore();
  const { colors } = useThemeStore();
  const {
    categories,
    is_loading,
    error,
    search_query,
    selected_category_id,
    loadInventory,
    setSearchQuery,
    setSelectedCategory,
    archiveProduct,
    getFiltered,
    getLowStock,
  } = useInventoryStore();

  const [scanner_visible, setScannerVisible] = useState(false);
  const s = useMemo(() => makeStyles(colors), [colors]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Eliminar producto", `¿Eliminar "${name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => archiveProduct(id),
      },
    ]);
  };

  const handleBarcodeScanned = (code: string) => {
    setScannerVisible(false);
    setTimeout(() => {
      const { products } = useInventoryStore.getState();
      const matches = products.filter((p) => p.barcode === code);
      if (matches.length === 0) {
        Alert.alert(
          "No encontrado",
          `No hay productos con el código "${code}"`,
        );
      } else if (matches.length === 1) {
        router.push(`/(app)/inventory/${matches[0].id}`);
      } else {
        setSearchQuery(code);
      }
    }, 400);
  };

  useEffect(() => {
    if (store_id) loadInventory(store_id);
  }, [store_id]);

  const onRefresh = useCallback(() => {
    if (store_id) loadInventory(store_id);
  }, [store_id]);

  const filtered = getFiltered();
  const low_stock = getLowStock();

  if (is_loading && filtered.length === 0) {
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

  return (
    <View style={s.container}>
      <View style={s.search_container}>
        <TextInput
          style={s.search_input}
          placeholder="Buscar producto..."
          placeholderTextColor={colors.text4}
          value={search_query}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity
          style={s.scan_button}
          onPress={() => setScannerVisible(true)}
        >
          <Ionicons name="barcode-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <BarcodeScannerModal
        visible={scanner_visible}
        onScanned={handleBarcodeScanned}
        onClose={() => setScannerVisible(false)}
      />

      {low_stock.length > 0 && (
        <TouchableOpacity style={s.low_stock_banner}>
          <Text style={s.low_stock_text}>
            {low_stock.length} producto{low_stock.length > 1 ? "s" : ""} con
            stock bajo
          </Text>
        </TouchableOpacity>
      )}

      <CategoryFilter
        categories={categories}
        selected_id={selected_category_id}
        onSelect={setSelectedCategory}
      />

      <FlatList
        style={s.list}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push(`/(app)/inventory/${item.id}`)}
            onEdit={() =>
              router.push({
                pathname: "/(app)/inventory/new",
                params: { id: item.id },
              })
            }
            onDelete={() => handleDelete(item.id, item.name)}
          />
        )}
        contentContainerStyle={s.list_content}
        refreshControl={
          <RefreshControl refreshing={is_loading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.empty_text}>
              {search_query ? "Sin resultados" : "No hay productos aún"}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={s.fab}
        onPress={() => router.push("/(app)/inventory/new")}
      >
        <Text style={s.fab_text}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      flexDirection: "column",
      paddingHorizontal: 16,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    search_container: {
      paddingVertical: 10,
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
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
    low_stock_banner: {
      backgroundColor: c.low_stock_bg,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    low_stock_text: {
      fontSize: 13,
      color: c.low_stock_text,
      fontWeight: "500",
    },
    list: {
      flex: 1,
    },
    list_content: {
      paddingBottom: 100,
      flexGrow: 1,
    },
    empty: {
      paddingTop: 60,
      alignItems: "center",
    },
    empty_text: {
      fontSize: 15,
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
    scan_button: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: c.bg2,
      alignItems: "center",
      justifyContent: "center",
    },
    fab_text: {
      color: c.accent_text,
      fontSize: 28,
      lineHeight: 32,
    },
  });
