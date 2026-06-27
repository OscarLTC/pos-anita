import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth.store";
import { colors, spacing, radius, typography, fontSize, fontFamilies } from "@/theme";

interface Props {
  /** Vuelve a la hoja Cuenta. */
  onBack: () => void;
}

const soon = () => Alert.alert("Próximamente", "La carga del logo estará disponible pronto.");

/**
 * Contenido de "Datos del negocio". Se renderiza dentro del mismo BottomSheet de la
 * hoja Cuenta (cambio de página, no un segundo modal) para evitar apilar modales.
 */
export function BusinessInfoSheet({ onBack }: Props) {
  const store = useAuthStore((s) => s.store);
  const updateStore = useAuthStore((s) => s.updateStore);

  const [name, setName] = useState(store?.name ?? "");
  const [ruc, setRuc] = useState(store?.ruc ?? "");
  const [phone, setPhone] = useState(store?.phone ?? "");
  const [address, setAddress] = useState(store?.address ?? "");
  const [district, setDistrict] = useState(store?.district ?? "");
  const [open, setOpen] = useState(store?.open_time ?? "");
  const [close, setClose] = useState(store?.close_time ?? "");
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updateStore({
        name: name.trim(),
        ruc: ruc.trim(),
        phone: phone.trim(),
        address: address.trim(),
        district: district.trim(),
        open_time: open.trim(),
        close_time: close.trim(),
      });
      onBack();
    } catch {
      Alert.alert("Error", "No se pudieron guardar los datos. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

        <TouchableOpacity style={s.back} onPress={onBack} hitSlop={8} disabled={saving}>
          <Ionicons name="chevron-back" size={20} color={colors.inkMid} />
          <Text style={s.backText}>Cuenta</Text>
        </TouchableOpacity>

        <Text style={s.title}>Datos del negocio</Text>
        <Text style={s.subtitle}>Se imprimen en cada boleta y aparecen en WhatsApp.</Text>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.logoRow}>
            <View style={s.logo}>
              <Ionicons name="storefront" size={28} color={colors.primaryInk} />
            </View>
            <View style={s.logoInfo}>
              <Text style={s.logoTitle}>Logo del negocio</Text>
              <Text style={s.logoHint}>PNG, máx 2 MB</Text>
              <View style={s.logoActions}>
                <TouchableOpacity style={s.logoBtn} onPress={soon} activeOpacity={0.8}>
                  <Text style={s.logoBtnText}>Cambiar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={soon} hitSlop={6} activeOpacity={0.7}>
                  <Text style={s.logoRemove}>Quitar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Field label="Nombre comercial" required>
            <TextInput
              style={s.input}
              placeholder="Ej. Bodega Doña Rosa"
              placeholderTextColor={colors.inkSoft}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </Field>

          <View style={s.row}>
            <Field label="RUC / DNI" style={s.half}>
              <TextInput
                style={s.input}
                placeholder="10456712345"
                placeholderTextColor={colors.inkSoft}
                value={ruc}
                onChangeText={setRuc}
                keyboardType="number-pad"
              />
            </Field>
            <Field label="Teléfono" style={s.half}>
              <TextInput
                style={s.input}
                placeholder="+51 987 654 321"
                placeholderTextColor={colors.inkSoft}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </Field>
          </View>

          <Field label="Dirección">
            <TextInput
              style={s.input}
              placeholder="Ej. Av. Los Cipreses 442"
              placeholderTextColor={colors.inkSoft}
              value={address}
              onChangeText={setAddress}
              autoCapitalize="words"
            />
          </Field>

          <Field label="Distrito">
            <TextInput
              style={s.input}
              placeholder="Ej. San Juan de Lurigancho"
              placeholderTextColor={colors.inkSoft}
              value={district}
              onChangeText={setDistrict}
              autoCapitalize="words"
            />
          </Field>

          <Field label="Horario de atención" hint="Aparece en recordatorios">
            <View style={s.hoursRow}>
              <TextInput
                style={[s.input, s.hourInput]}
                placeholder="06:30"
                placeholderTextColor={colors.inkSoft}
                value={open}
                onChangeText={setOpen}
                keyboardType="numbers-and-punctuation"
                textAlign="center"
              />
              <Text style={s.hoursSep}>a</Text>
              <TextInput
                style={[s.input, s.hourInput]}
                placeholder="21:30"
                placeholderTextColor={colors.inkSoft}
                value={close}
                onChangeText={setClose}
                keyboardType="numbers-and-punctuation"
                textAlign="center"
              />
            </View>
          </Field>
        </ScrollView>

        <TouchableOpacity
          style={[s.saveBtn, !canSave && s.saveDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryInk} />
          ) : (
            <Text style={s.saveText}>Guardar cambios</Text>
          )}
        </TouchableOpacity>
    </View>
  );
}

function Field({
  label,
  required,
  hint,
  style,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  style?: object;
  children: React.ReactNode;
}) {
  return (
    <View style={[s.field, style]}>
      <View style={s.labelRow}>
        <Text style={s.label}>
          {label}
          {required && <Text style={s.req}> *</Text>}
        </Text>
        {hint && <Text style={s.labelHint}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    flexShrink: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  back: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: spacing.sm },
  backText: { ...typography.body, color: colors.inkMid },
  title: { ...typography.display, fontSize: 26, color: colors.ink },
  subtitle: { ...typography.bodySm, color: colors.inkSoft, marginTop: 2, marginBottom: spacing.md },

  scroll: { flexShrink: 1 },
  scrollContent: { paddingBottom: spacing.lg, gap: spacing.md },

  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xs },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoInfo: { flex: 1, gap: 2 },
  logoTitle: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  logoHint: { ...typography.caption, color: colors.inkSoft },
  logoActions: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.xs },
  logoBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  logoBtnText: { ...typography.bodySm, fontFamily: fontFamilies.display, color: colors.ink },
  logoRemove: { ...typography.bodySm, fontFamily: fontFamilies.display, color: colors.danger },

  field: { gap: spacing.xs },
  row: { flexDirection: "row", gap: spacing.md },
  half: { flex: 1 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { ...typography.bodySm, fontFamily: fontFamilies.display, color: colors.ink },
  req: { color: colors.danger },
  labelHint: { ...typography.caption, color: colors.inkSoft },
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
  hoursRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  hourInput: { flex: 1 },
  hoursSep: { ...typography.body, color: colors.inkMid },

  saveBtn: {
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  saveDisabled: { opacity: 0.5 },
  saveText: { ...typography.display, fontSize: fontSize.lg, color: colors.primaryInk },
});
