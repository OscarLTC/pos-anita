import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import type { Category } from "@/types";

interface Props {
  categories: Category[];
  selected_id: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryFilter({ categories, selected_id, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
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
        >
          <Text
            style={[
              styles.chip_text,
              selected_id === cat.id && styles.chip_text_active,
            ]}
          >
            {cat.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
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
});
