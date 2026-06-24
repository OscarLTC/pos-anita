import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { CategoryFormSheet } from "@/components/CategoryFormSheet";
import { useAuthStore } from "@/stores/auth.store";
import { useInventoryStore } from "@/stores/inventory.store";
import { withAlpha } from "@/lib/colors";
import { colors, spacing, radius, typography, fontSize, fontFamilies } from "@/theme";
import type { Category, CreateCategoryInput } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type FormState = { mode: "new" } | { mode: "edit"; category: Category } | null;

export function CategoriesSheet({ visible, onClose }: Props) {
  const { store } = useAuthStore();
  const categories = useInventoryStore((s) => s.categories);
  const products = useInventoryStore((s) => s.products);
  const addCategory = useInventoryStore((s) => s.addCategory);
  const updateCategory = useInventoryStore((s) => s.updateCategory);
  const removeCategory = useInventoryStore((s) => s.removeCategory);

  const [form, setForm] = useState<FormState>(null);
  const [saving, setSaving] = useState(false);

  const countFor = (categoryId: string) =>
    products.filter((p) => p.category_id === categoryId).length;

  const handleSave = async (input: CreateCategoryInput) => {
    if (!store?.id) return;
    setSaving(true);
    try {
      if (form?.mode === "edit") {
        await updateCategory(form.category.id, input);
      } else {
        await addCategory(store.id, input);
      }
      setForm(null);
    } catch {
      Alert.alert("Error", "No se pudo guardar la categoría.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category: Category) => {
    const count = countFor(category.id);
    if (count > 0) {
      Alert.alert(
        "No se puede eliminar",
        `"${category.name}" tiene ${count} producto${count > 1 ? "s" : ""} asignado${count > 1 ? "s" : ""}. Reasígnalos antes de eliminar.`,
      );
      return;
    }
    Alert.alert("Eliminar categoría", `¿Eliminar "${category.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () =>
          removeCategory(category.id).catch(() => Alert.alert("Error", "No se pudo eliminar.")),
      },
    ]);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={s.sheet}>
        <View style={s.handle} />

        <View style={s.header}>
          <Text style={s.title}>Categorías</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>
        <Text style={s.subtitle}>
          Organiza tus productos. Los cambios se reflejan en Inventario y Venta.
        </Text>

        <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
          {categories.map((cat) => (
            <View key={cat.id} style={s.row}>
              <View style={[s.avatar, { backgroundColor: withAlpha(cat.color, 0.2) }]}>
                <Text style={s.avatarIcon}>{cat.icon}</Text>
              </View>
              <View style={s.info}>
                <Text style={s.name}>{cat.name}</Text>
                <Text style={s.count}>{countFor(cat.id)} productos</Text>
              </View>
              <TouchableOpacity
                onPress={() => setForm({ mode: "edit", category: cat })}
                hitSlop={8}
                style={s.iconBtn}
              >
                <Feather name="edit-2" size={18} color={colors.inkMid} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(cat)} hitSlop={8} style={s.iconBtn}>
                <FontAwesome6 name="trash-alt" size={18} color={colors.inkSoft} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={s.newBtn}
            onPress={() => setForm({ mode: "new" })}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={s.newBtnText}>Nueva categoría</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={s.doneBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={s.doneText}>Listo</Text>
        </TouchableOpacity>

        <CategoryFormSheet
          visible={form != null}
          initial={form?.mode === "edit" ? form.category : undefined}
          saving={saving}
          onClose={() => setForm(null)}
          onSave={handleSave}
        />
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sheet: {
    flexShrink: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { ...typography.title, color: colors.ink },
  subtitle: {
    ...typography.bodySm,
    color: colors.inkMid,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  list: { flexShrink: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: { fontSize: 20 },
  info: { flex: 1, gap: 2 },
  name: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  count: { ...typography.bodySm, color: colors.inkSoft },
  iconBtn: { padding: spacing.xs },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 48,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
    backgroundColor: colors.chipBg,
  },
  newBtnText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.primary },
  doneBtn: {
    height: 54,
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: { ...typography.display, fontSize: fontSize.lg, color: colors.primaryInk },
});
