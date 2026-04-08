import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import type { Category } from "@/types";
import { useThemeStore, type AppColors } from "@/theme";

interface Props {
  categories: Category[];
  selected_id: string | null;
  onSelect: (id: string | null) => void;
  onLongPressCategory: (cat: Category) => void;
  onAddCategory: () => void;
}

export function CategoryFilter({
  categories,
  selected_id,
  onSelect,
  onLongPressCategory,
  onAddCategory,
}: Props) {
  const { colors } = useThemeStore();
  const s = useMemo(() => makeStyles(colors), [colors]);

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
          onLongPress={() => onLongPressCategory(cat)}
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

      <TouchableOpacity style={s.chip_add} onPress={onAddCategory}>
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
