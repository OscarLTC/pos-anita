import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useInventoryStore } from "@/stores/inventory.store";
import { useAuthStore } from "@/stores/auth.store";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import { CategoriesSheet } from "@/components/CategoriesSheet";
import { NewProductSheet } from "@/components/NewProductSheet";
import { soles, formatQty } from "@/lib/format";
import { withAlpha } from "@/lib/colors";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { Product } from "@/types";

const stockUnitWord = (unit: string) => (unit === "kg" ? "kg" : unit === "l" ? "L" : "unidades");

export default function InventoryScreen() {
  const router = useRouter();
  const { store } = useAuthStore();
  const { products, categories, loadInventory, is_loading } = useInventoryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [categoriesVisible, setCategoriesVisible] = useState(false);
  const [newProductVisible, setNewProductVisible] = useState(false);

  useEffect(() => {
    if (store?.id) loadInventory(store.id);
  }, [store?.id]);

  const active = useMemo(() => products.filter((p) => p.status !== "archived"), [products]);

  const inventoryValue = useMemo(
    () => active.reduce((sum, p) => sum + p.stock * p.cost_price, 0),
    [active],
  );
  const lowStockCount = useMemo(
    () => active.filter((p) => p.stock <= p.min_stock).length,
    [active],
  );

  const filtered = useMemo(
    () =>
      active.filter(
        (p) =>
          (!selectedCategoryId || p.category_id === selectedCategoryId) &&
          (!lowStockOnly || p.stock <= p.min_stock) &&
          (!searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode === searchQuery),
      ),
    [active, selectedCategoryId, lowStockOnly, searchQuery],
  );

  const handleBarcodeScanned = (code: string) => {
    setScannerVisible(false);
    setTimeout(() => {
      const match = active.find((p) => p.barcode === code);
      if (match) router.push(`/(app)/inventory/${match.id}`);
      else setSearchQuery(code);
    }, 400);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const category = categories.find((c) => c.id === item.category_id);
    const swatch = category?.color ?? "#929C94";
    const isLow = item.stock <= item.min_stock;

    return (
      <TouchableOpacity
        style={[s.card, isLow && s.cardLow]}
        activeOpacity={0.7}
        onPress={() => router.push(`/(app)/inventory/${item.id}`)}
      >
        <View style={[s.avatar, { backgroundColor: withAlpha(swatch, 0.2) }]}>
          <Text style={s.avatarIcon}>{category?.icon ?? "📦"}</Text>
        </View>

        <View style={s.cardInfo}>
          <Text style={s.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={s.cardMeta} numberOfLines={1}>
            {category?.name ?? "Sin categoría"} · {soles(item.sale_price)}
          </Text>
        </View>

        <View style={s.stockCol}>
          <Text style={[s.stockNum, isLow && s.stockNumLow]}>
            {formatQty(item.stock, item.unit)}
          </Text>
          <Text style={[s.stockUnit, isLow && s.stockUnitLow]}>
            {isLow ? "bajo" : stockUnitWord(item.unit)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>
            {active.length} PRODUCTOS · {categories.length} CATEGORÍAS
          </Text>
          <Text style={s.title}>Inventario</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => setCategoriesVisible(true)}>
          <Ionicons name="grid-outline" size={20} color={colors.ink} />
        </TouchableOpacity>
        <TouchableOpacity style={s.addBtn} onPress={() => setNewProductVisible(true)}>
          <Ionicons name="add" size={24} color={colors.primaryInk} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.stats}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>VALOR INVENTARIO</Text>
          <Text style={s.statValue}>{soles(inventoryValue)}</Text>
        </View>
        <TouchableOpacity
          style={[s.statCard, lowStockOnly && s.statCardActive]}
          activeOpacity={0.8}
          onPress={() => setLowStockOnly((v) => !v)}
        >
          <Text style={[s.statLabel, lowStockOnly && s.statLabelActive]}>STOCK BAJO</Text>
          <Text style={[s.statValue, lowStockOnly && s.statValueActive]}>
            {lowStockCount}{" "}
            <Text style={[s.statUnit, lowStockOnly && s.statValueActive]}>productos</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Buscador + escáner */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search" size={18} color={colors.inkSoft} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar en inventario"
            placeholderTextColor={colors.inkSoft}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity style={s.scanBtn} onPress={() => setScannerVisible(true)}>
          <Ionicons name="barcode-outline" size={22} color={colors.ink} />
        </TouchableOpacity>
      </View>

      {/* Chips */}
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

      {/* Lista */}
      {is_loading && active.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>
                {searchQuery || selectedCategoryId || lowStockOnly
                  ? "Sin resultados"
                  : "Agrega tu primer producto con +"}
              </Text>
            </View>
          }
        />
      )}

      <CategoriesSheet visible={categoriesVisible} onClose={() => setCategoriesVisible(false)} />
      <NewProductSheet visible={newProductVisible} onClose={() => setNewProductVisible(false)} />
      <BarcodeScannerModal
        visible={scannerVisible}
        onScanned={handleBarcodeScanned}
        onClose={() => setScannerVisible(false)}
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  eyebrow: { ...typography.caption, color: colors.inkSoft, letterSpacing: 0.8, marginBottom: 2 },
  title: { ...typography.display, fontSize: 30, color: colors.ink },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stats: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    ...shadows.shadow,
  },
  statCardActive: { backgroundColor: colors.danger, borderColor: colors.danger },
  statLabel: { ...typography.caption, color: colors.inkSoft, letterSpacing: 0.5 },
  statLabelActive: { color: "rgba(255,255,255,0.85)" },
  statValue: { fontFamily: fontFamilies.display, fontSize: fontSize.xl, color: colors.ink },
  statValueActive: { color: "#fff" },
  statUnit: { fontFamily: fontFamilies.body, fontSize: fontSize.sm, color: colors.inkSoft },
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
  searchInput: { flex: 1, fontSize: fontSize.md, color: colors.ink },
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
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { ...typography.bodySm, color: colors.inkMid },
  chipTextActive: { color: colors.surface, fontFamily: fontFamilies.display },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
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
  cardLow: { borderColor: withAlpha("#C04032", 0.5) },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: { fontSize: 22 },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  cardMeta: { ...typography.bodySm, color: colors.inkSoft },
  stockCol: { alignItems: "flex-end" },
  stockNum: { fontFamily: fontFamilies.display, fontSize: fontSize.lg, color: colors.ink },
  stockNumLow: { color: colors.danger },
  stockUnit: { ...typography.caption, color: colors.inkSoft },
  stockUnitLow: { color: colors.danger },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { ...typography.body, color: colors.inkSoft },
});
