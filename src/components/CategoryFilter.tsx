import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import type { Category } from "@/types";
import { useInventoryStore } from "@/stores/inventory.store";

interface Props {
  categories: Category[];
  selected_id: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryFilter({ categories, selected_id, onSelect }: Props) {
  const router = useRouter();
  const { products, removeCategory } = useInventoryStore();

  const handleLongPress = (cat: Category) => {
    Alert.alert(cat.name, undefined, [
      {
        text: "Editar",
        onPress: () =>
          router.push({
            pathname: "/(app)/inventory/categories/new",
            params: { id: cat.id, name: cat.name, icon: cat.icon },
          }),
      },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => confirmDelete(cat),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const confirmDelete = (cat: Category) => {
    const count = products.filter((p) => p.category_id === cat.id).length;
    if (count > 0) {
      Alert.alert(
        "No se puede eliminar",
        `"${cat.name}" tiene ${count} producto${count > 1 ? "s" : ""} asignado${count > 1 ? "s" : ""}. Reasígnalos antes de eliminar.`,
      );
      return;
    }
    Alert.alert("Eliminar categoría", `¿Eliminar "${cat.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => removeCategory(cat.id),
      },
    ]);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        style={[styles.chip, !selected_id && styles.chip_active]}
        onPress={() => onSelect(null)}
      >
        <Text
          style={[styles.chip_text, !selected_id && styles.chip_text_active]}
        >
          Todos
        </Text>
      </TouchableOpacity>

      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.chip, selected_id === cat.id && styles.chip_active]}
          onPress={() => onSelect(selected_id === cat.id ? null : cat.id)}
          onLongPress={() => handleLongPress(cat)}
          delayLongPress={400}
        >
          <Text
            style={[
              styles.chip_text,
              selected_id === cat.id && styles.chip_text_active,
            ]}
          >
            {cat.icon} {cat.name}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.chip_add}
        onPress={() => router.push("/(app)/inventory/categories/new")}
      >
        <Text style={styles.chip_add_text}>+</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  chip_active: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  chip_text: {
    fontSize: 13,
    color: "#555",
  },
  chip_text_active: {
    color: "#fff",
    fontWeight: "500",
  },
  chip_add: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  chip_add_text: {
    fontSize: 18,
    color: "#888",
    lineHeight: 22,
  },
});
