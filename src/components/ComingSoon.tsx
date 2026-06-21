import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography, fontSize } from "@/theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
};

/** Placeholder para secciones aún sin diseñar. */
export function ComingSoon({ icon, title, description }: Props) {
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.center}>
        <View style={s.badge}>
          <Ionicons name={icon} size={32} color={colors.primary} />
        </View>
        <Text style={s.title}>{title}</Text>
        <Text style={s.desc}>{description ?? "Esta sección estará disponible pronto."}</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.chipBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.ink,
    textAlign: "center",
  },
  desc: {
    ...typography.body,
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.inkMid,
    textAlign: "center",
  },
});
