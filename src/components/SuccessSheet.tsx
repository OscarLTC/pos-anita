import { type ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { colors, spacing, radius, typography, fontSize, fontFamilies } from "@/theme";

interface Props {
  visible: boolean;
  title: string;
  subtitle: ReactNode;
  onDone: () => void;
  /** Si se provee, muestra el botón "Enviar comprobante por WhatsApp". */
  onWhatsApp?: () => void;
}

export function SuccessSheet({ visible, title, subtitle, onDone, onWhatsApp }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onDone}>
      <View style={s.sheet}>
        <View style={s.handle} />

        <View style={s.checkCircle}>
          <Ionicons name="checkmark" size={40} color={colors.primary} />
        </View>

        <Text style={s.title}>{title}</Text>
        <Text style={s.sub}>{subtitle}</Text>

        {onWhatsApp && (
          <TouchableOpacity style={s.waBtn} onPress={onWhatsApp} activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={s.waText}>Enviar comprobante por WhatsApp</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={s.btn} onPress={onDone} activeOpacity={0.85}>
          <Text style={s.btnText}>Listo</Text>
        </TouchableOpacity>
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
    alignItems: "center",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.chipBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...typography.title, color: colors.ink, marginBottom: spacing.xs, textAlign: "center" },
  sub: { ...typography.body, color: colors.inkMid, marginBottom: spacing.xl, textAlign: "center" },
  waBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    width: "100%",
    height: 48,
    backgroundColor: "#25D366",
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  waText: { color: "#fff", fontFamily: fontFamilies.display, fontSize: fontSize.sm },
  btn: {
    width: "100%",
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { ...typography.display, fontSize: fontSize.lg, color: colors.primaryInk },
});
