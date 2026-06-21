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
import { colors, spacing, radius, typography, fontSize, fontFamilies } from "@/theme";
import type { CreateClientInput } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: CreateClientInput) => void;
  saving: boolean;
}

export function NewClientSheet({ visible, onClose, onCreate, saving }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    if (visible) {
      setName("");
      setPhone("");
      setNickname("");
    }
  }, [visible]);

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = () => {
    if (!canSave) return;
    const digits = phone.replace(/\D/g, "");
    onCreate({
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      phone: digits ? `+51${digits}` : undefined,
    });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={s.sheet}>
        <View style={s.handle} />

        <View style={s.header}>
          <Text style={s.title}>Nuevo cliente</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8} disabled={saving}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={s.preview}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>?</Text>
          </View>
          <View style={s.previewInfo}>
            <Text style={s.previewName}>{name.trim() || "Cliente sin nombre"}</Text>
            <Text style={s.previewSub}>{nickname.trim() || "sin apodo"}</Text>
          </View>
        </View>

        {/* Nombre */}
        <Text style={s.label}>
          Nombre completo <Text style={s.req}>*</Text>
        </Text>
        <TextInput
          style={s.input}
          placeholder="Ej. Rosa Mamani Quispe"
          placeholderTextColor={colors.inkSoft}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        {/* Teléfono */}
        <Text style={s.label}>
          Teléfono <Text style={s.hint}>(para enviar recordatorios)</Text>
        </Text>
        <View style={s.phoneRow}>
          <Text style={s.phonePrefix}>+51</Text>
          <TextInput
            style={s.phoneInput}
            placeholder="987 654 321"
            placeholderTextColor={colors.inkSoft}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          {phone.replace(/\D/g, "").length >= 9 && (
            <View style={s.waBadge}>
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              <Text style={s.waText}>WhatsApp</Text>
            </View>
          )}
        </View>

        {/* Apodo */}
        <Text style={s.label}>
          Apodo o referencia <Text style={s.hint}>(opcional)</Text>
        </Text>
        <TextInput
          style={s.input}
          placeholder="Ej. la del 2do piso"
          placeholderTextColor={colors.inkSoft}
          value={nickname}
          onChangeText={setNickname}
        />

        {/* Acciones */}
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
              <Text style={s.saveText}>Guardar cliente</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { ...typography.title, color: colors.ink },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E0A06E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontFamily: fontFamilies.display, fontSize: fontSize.lg },
  previewInfo: { gap: 2 },
  previewName: { ...typography.body, fontFamily: fontFamilies.display, color: colors.inkSoft, fontSize: fontSize.lg },
  previewSub: { ...typography.bodySm, color: colors.inkSoft },
  label: { ...typography.bodySm, fontFamily: fontFamilies.display, color: colors.ink, marginTop: spacing.sm },
  req: { color: colors.danger },
  hint: { fontFamily: fontFamilies.body, color: colors.inkSoft },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  phonePrefix: { ...typography.body, color: colors.inkMid },
  phoneInput: { flex: 1, fontSize: fontSize.md, color: colors.ink },
  waBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  waText: { ...typography.bodySm, color: "#25D366", fontFamily: fontFamilies.display },
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
