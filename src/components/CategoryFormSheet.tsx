import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { CATEGORY_COLORS, withAlpha } from "@/lib/colors";
import { colors, spacing, radius, typography, fontSize, fontFamilies } from "@/theme";
import type { CreateCategoryInput } from "@/types";

interface Props {
  visible: boolean;
  initial?: { name: string; icon: string; color: string };
  saving: boolean;
  onClose: () => void;
  onSave: (input: CreateCategoryInput) => void;
}

export function CategoryFormSheet({ visible, initial, saving, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🛒");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? "");
      setIcon(initial?.icon ?? "🛒");
      setColor(initial?.color ?? CATEGORY_COLORS[0]);
    }
  }, [visible]);

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ name: name.trim(), icon: icon.trim() || "🛒", color });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={s.sheet}>
        <View style={s.handle} />

        <View style={s.header}>
          <Text style={s.title}>{initial ? "Editar categoría" : "Nueva categoría"}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8} disabled={saving}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <Text style={s.label}>Nombre</Text>
        <View style={s.nameRow}>
          <TextInput
            style={[s.emojiInput, { backgroundColor: withAlpha(color, 0.2) }]}
            value={icon}
            onChangeText={setIcon}
            maxLength={4}
            selectTextOnFocus
          />
          <TextInput
            style={s.nameInput}
            placeholder="Ej. Bebidas"
            placeholderTextColor={colors.inkSoft}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <Text style={s.label}>Color</Text>
        <View style={s.swatches}>
          {CATEGORY_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[s.swatch, { backgroundColor: c }, color === c && s.swatchActive]}
              onPress={() => setColor(c)}
            >
              {color === c && <Ionicons name="checkmark" size={16} color="#fff" />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.cancelBtn} onPress={onClose} disabled={saving}>
            <Text style={s.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.saveBtn, !canSave && s.saveDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={colors.primaryInk} />
            ) : (
              <Text style={s.saveText}>{initial ? "Guardar" : "Crear categoría"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
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
  nameRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  emojiInput: {
    width: 52,
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    textAlign: "center",
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  nameInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  label: {
    ...typography.bodySm,
    fontFamily: fontFamilies.display,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchActive: { borderWidth: 2, borderColor: colors.ink },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  saveBtn: {
    flex: 1.4,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveDisabled: { opacity: 0.5 },
  saveText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.primaryInk },
});
