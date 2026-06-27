import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { soles, unitShort } from "@/lib/format";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { Product } from "@/types";

interface Props {
  product: Product | null;
  initial_quantity?: number;
  onConfirm: (product: Product, quantity: number) => void;
  onClose: () => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

export function WeightInputModal({ product, initial_quantity, onConfirm, onClose }: Props) {
  const [input, setInput] = useState("");
  // Conserva el último producto para poder animar la salida cuando product pasa a null.
  const [display, setDisplay] = useState<Product | null>(product);

  useEffect(() => {
    if (product) {
      setDisplay(product);
      setInput(initial_quantity ? String(initial_quantity) : "");
    }
  }, [product?.id, initial_quantity]);

  const p = display;
  const unit = p ? unitShort(p.unit) : "kg"; // "kg" | "L"
  const unitWord = p?.unit === "l" ? "litro" : "kilo";
  const price = p?.sale_price ?? 0;
  const quantity = parseFloat(input) || 0;
  const total = quantity * price;
  const isValid = quantity > 0;
  const quickValues = [0.25, 0.5, 1, 2];

  const handleKey = (key: (typeof KEYS)[number]) => {
    setInput((prev) => {
      if (key === "back") return prev.slice(0, -1);
      if (key === ".") {
        if (prev.includes(".")) return prev;
        return prev === "" ? "0." : prev + ".";
      }
      // Limita a 3 decimales
      const dot = prev.indexOf(".");
      if (dot >= 0 && prev.length - dot > 3) return prev;
      return prev + key;
    });
  };

  const handleConfirm = () => {
    if (isValid && p) onConfirm(p, parseFloat(quantity.toFixed(3)));
  };

  return (
    <BottomSheet visible={!!product} onClose={onClose}>
      {p && (
        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.header}>
            <Text style={s.title}>{initial_quantity ? "Editar peso" : "Agregar peso"}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <View style={s.productRow}>
            <Text style={s.productName} numberOfLines={1}>
              {p.name}
            </Text>
            <Text style={s.productPrice}>
              {soles(price)} por {unitWord}
            </Text>
          </View>

          <View style={s.display}>
            <Text style={s.displayLabel}>PESO</Text>
            <Text style={s.displayValue}>
              {input || "0"} <Text style={s.displayUnit}>{unit}</Text>
            </Text>
            <Text style={s.displayTotal}>= {soles(total)}</Text>
          </View>

          <View style={s.quickRow}>
            {quickValues.map((v) => (
              <TouchableOpacity key={v} style={s.quickChip} onPress={() => setInput(String(v))}>
                <Text style={s.quickChipText}>
                  {v} {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.keypad}>
            {KEYS.map((key) => (
              <TouchableOpacity
                key={key}
                style={s.key}
                onPress={() => handleKey(key)}
                activeOpacity={0.6}
              >
                {key === "back" ? (
                  <Ionicons name="backspace-outline" size={24} color={colors.ink} />
                ) : (
                  <Text style={s.keyText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.confirmBtn, !isValid && s.confirmDisabled]}
            onPress={handleConfirm}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <Text style={s.confirmText}>
              {initial_quantity ? "Actualizar" : "Agregar"}
              {isValid ? `  ${quantity} ${unit} · ${soles(total)}` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
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
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  productName: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink, flex: 1 },
  productPrice: { ...typography.bodySm, color: colors.inkMid },
  display: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: 2,
    ...shadows.shadow,
  },
  displayLabel: { ...typography.caption, color: colors.inkSoft, letterSpacing: 1 },
  displayValue: {
    fontFamily: fontFamilies.display,
    fontSize: 44,
    color: colors.ink,
    letterSpacing: -1,
  },
  displayUnit: { fontSize: 22, color: colors.inkMid },
  displayTotal: { ...typography.bodySm, color: colors.inkMid },
  quickRow: { flexDirection: "row", gap: spacing.sm },
  quickChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  quickChipText: { ...typography.bodySm, color: colors.inkMid },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  key: {
    width: "31.5%",
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { fontFamily: fontFamilies.display, fontSize: fontSize.xl, color: colors.ink },
  confirmBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  confirmDisabled: { opacity: 0.5 },
  confirmText: { ...typography.display, fontSize: fontSize.md, color: colors.primaryInk },
});
