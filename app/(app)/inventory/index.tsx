import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useInventoryStore } from "@/stores/inventory.store";
import { useAuthStore } from "@/stores/auth.store";
import { ProductCard } from "@/components/ProductCard";
import { CategoryFilter } from "@/components/CategoryFilter";

export default function InventoryScreen() {
  const router = useRouter();
  const { store_id } = useAuthStore();
  const {
    categories,
    is_loading,
    error,
    search_query,
    selected_category_id,
    loadInventory,
    setSearchQuery,
    setSelectedCategory,
    getFiltered,
    getLowStock,
  } = useInventoryStore();

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error_text}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retry}>
          <Text style={styles.retry_text}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.search_container}>
        <TextInput
          style={styles.search_input}
          placeholder="Buscar producto..."
          placeholderTextColor="#aaa"
          value={search_query}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {low_stock.length > 0 && (
        <TouchableOpacity style={styles.low_stock_banner}>
          <Text style={styles.low_stock_text}>
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
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push(`/(app)/inventory/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list_content}
        refreshControl={
          <RefreshControl refreshing={is_loading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.empty_text}>
              {search_query ? "Sin resultados" : "No hay productos aún"}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(app)/inventory/new")}
      >
        <Text style={styles.fab_text}>+</Text>
      </TouchableOpacity>
    </View>
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
    gap: 12,
  },
  search_container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e8e8e8",
  },
  search_input: {
    height: 40,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111",
  },
  low_stock_banner: {
    backgroundColor: "#fff3f3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ffd0d0",
  },
  low_stock_text: {
    fontSize: 13,
    color: "#c0392b",
    fontWeight: "500",
  },
  list_content: {
    paddingBottom: 100,
  },
  empty: {
    paddingTop: 60,
    alignItems: "center",
  },
  empty_text: {
    fontSize: 15,
    color: "#aaa",
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
    borderColor: "#ddd",
  },
  retry_text: {
    fontSize: 14,
    color: "#111",
  },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  fab_text: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 32,
  },
});
