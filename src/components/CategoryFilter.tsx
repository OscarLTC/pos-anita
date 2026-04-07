import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
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
import { useThemeStore, type AppColors } from "@/theme";

interface Props {
  categories: Category[];
  selected_id: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryFilter({ categories, selected_id, onSelect }: Props) {
  const router = useRouter();
  const { products, removeCategory } = useInventoryStore();
  const { colors } = useThemeStore();
  const s = useMemo(() => makeStyles(colors), [colors]);

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
      style={s.scroll}
      contentContainerStyle={s.container}
    >
      <TouchableOpacity
        style={[s.chip, !selected_id && s.chip_active]}
        onPress={() => onSelect(null)}
      >
        <Text style={[s.chip_text, !selected_id && s.chip_text_active]}>
          Todos
        </Text>
      </TouchableOpacity>

      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[s.chip, selected_id === cat.id && s.chip_active]}
          onPress={() => onSelect(selected_id === cat.id ? null : cat.id)}
          onLongPress={() => handleLongPress(cat)}
          delayLongPress={400}
        >
          <Text
            style={[
              s.chip_text,
              selected_id === cat.id && s.chip_text_active,
            ]}
          >
            {cat.icon} {cat.name}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={s.chip_add}
        onPress={() => router.push("/(app)/inventory/categories/new")}
      >
        <Ionicons name="add" size={20} color={colors.text3} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
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
    chip_add: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 0.5,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
  });
