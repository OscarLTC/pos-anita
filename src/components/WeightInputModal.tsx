import { useState, useEffect, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useThemeStore, type AppColors } from "@/theme";
import type { Product } from "@/types";

interface Props {
  product: Product | null;
  initial_quantity?: number;
  onConfirm: (product: Product, quantity: number) => void;
  onClose: () => void;
}

export function WeightInputModal({ product, initial_quantity, onConfirm, onClose }: Props) {
  const { colors } = useThemeStore();
  const [mode, setMode] = useState<"quantity" | "amount">("quantity");
  const [input, setInput] = useState("");

  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (product) {
      setMode("quantity");
      setInput(initial_quantity ? String(initial_quantity) : "");
    }
  }, [product?.id, initial_quantity]);

  if (!product) return null;

  const unit_label = product.unit === "kg" ? "kg" : "L";
  const unit_price = product.sale_price;

  const parsed = parseFloat(input.replace(",", ".")) || 0;
  const quantity = mode === "quantity" ? parsed : unit_price > 0 ? parsed / unit_price : 0;
  const total = quantity * unit_price;
  const is_valid = quantity > 0;

  const handleConfirm = () => {
    if (is_valid) onConfirm(product, parseFloat(quantity.toFixed(3)));
  };

  const switchMode = (next: "quantity" | "amount") => {
    setMode(next);
    setInput("");
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={s.card}>
          {/* Producto */}
          <Text style={s.product_name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={s.unit_price}>
            S/ {unit_price.toFixed(2)} por {unit_label}
          </Text>

          {/* Toggle modo */}
          <View style={s.toggle_row}>
            <TouchableOpacity
              style={[s.toggle_btn, mode === "quantity" && s.toggle_active]}
              onPress={() => switchMode("quantity")}
            >
              <Text style={[s.toggle_text, mode === "quantity" && s.toggle_text_active]}>
                Por {unit_label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggle_btn, mode === "amount" && s.toggle_active]}
              onPress={() => switchMode("amount")}
            >
              <Text style={[s.toggle_text, mode === "amount" && s.toggle_text_active]}>
                Por S/
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={s.input_row}>
            {mode === "amount" && <Text style={s.input_affix}>S/</Text>}
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              keyboardType="decimal-pad"
              autoFocus
              placeholder={mode === "quantity" ? "0.000" : "0.00"}
              placeholderTextColor={colors.text4}
              selectTextOnFocus
            />
            {mode === "quantity" && <Text style={s.input_affix}>{unit_label}</Text>}
          </View>

          {/* Preview */}
          <View style={s.preview}>
            {is_valid ? (
              <Text style={s.preview_text}>
                {quantity.toFixed(3)} {unit_label} × S/ {unit_price.toFixed(2)}{" "}
                <Text style={s.preview_total}>= S/ {total.toFixed(2)}</Text>
              </Text>
            ) : (
              <Text style={s.preview_empty}>
                Ingresa {mode === "quantity" ? `la cantidad en ${unit_label}` : "el monto en soles"}
              </Text>
            )}
          </View>

          {/* Acciones */}
          <View style={s.actions}>
            <TouchableOpacity style={s.cancel_btn} onPress={onClose}>
              <Text style={s.cancel_text}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.confirm_btn, !is_valid && s.confirm_btn_disabled]}
              onPress={handleConfirm}
              disabled={!is_valid}
            >
              <Text style={s.confirm_text}>
                {initial_quantity ? "Actualizar" : "Agregar"}
                {is_valid ? ` · S/ ${total.toFixed(2)}` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    card: {
      width: "88%",
      backgroundColor: c.bg,
      borderRadius: 16,
      padding: 20,
      gap: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    product_name: {
      fontSize: 17,
      fontWeight: "600",
      color: c.text,
    },
    unit_price: {
      fontSize: 13,
      color: c.text3,
      marginTop: -8,
    },
    toggle_row: {
      flexDirection: "row",
      backgroundColor: c.bg2,
      borderRadius: 10,
      padding: 3,
      gap: 3,
    },
    toggle_btn: {
      flex: 1,
      paddingVertical: 7,
      borderRadius: 8,
      alignItems: "center",
    },
    toggle_active: {
      backgroundColor: c.bg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    toggle_text: {
      fontSize: 13,
      fontWeight: "500",
      color: c.text3,
    },
    toggle_text_active: {
      color: c.text,
    },
    input_row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.bg2,
      borderRadius: 12,
      paddingHorizontal: 14,
      gap: 6,
    },
    input_affix: {
      fontSize: 20,
      fontWeight: "500",
      color: c.text3,
    },
    input: {
      flex: 1,
      fontSize: 32,
      fontWeight: "600",
      color: c.text,
      paddingVertical: 12,
      textAlign: "center",
    },
    preview: {
      alignItems: "center",
      minHeight: 20,
    },
    preview_text: {
      fontSize: 13,
      color: c.text3,
    },
    preview_total: {
      fontWeight: "600",
      color: c.text,
    },
    preview_empty: {
      fontSize: 13,
      color: c.text4,
      fontStyle: "italic",
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 4,
    },
    cancel_btn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 10,
      alignItems: "center",
      borderWidth: 0.5,
      borderColor: c.border,
    },
    cancel_text: {
      fontSize: 15,
      color: c.text2,
      fontWeight: "500",
    },
    confirm_btn: {
      flex: 2,
      paddingVertical: 13,
      borderRadius: 10,
      alignItems: "center",
      backgroundColor: c.accent,
    },
    confirm_btn_disabled: {
      opacity: 0.4,
    },
    confirm_text: {
      fontSize: 15,
      color: c.accent_text,
      fontWeight: "600",
    },
  });
