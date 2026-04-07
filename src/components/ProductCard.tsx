import { useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import type { ProductWithMeta } from "@/types";
import { useThemeStore, type AppColors } from "@/theme";

interface Props {
  product: ProductWithMeta;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProductCard({ product, onPress, onEdit, onDelete }: Props) {
  const swipeable_ref = useRef<Swipeable>(null);
  const { colors } = useThemeStore();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const close = () => swipeable_ref.current?.close();

  const renderRightActions = () => (
    <View style={s.actions}>
      <TouchableOpacity
        style={s.action_edit}
        onPress={() => {
          close();
          onEdit();
        }}
      >
        <Ionicons name="pencil-outline" size={20} color="#fff" />
        <Text style={s.action_text}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={s.action_delete}
        onPress={() => {
          close();
          onDelete();
        }}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={s.action_text}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable
      ref={swipeable_ref}
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      <TouchableOpacity
        style={s.container}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={s.left}>
          <Text style={s.name} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={s.meta}>
            <View style={s.category_badge}>
              <Text style={s.category_text}>
                {product.category?.icon} {product.category?.name}
              </Text>
            </View>
            <View style={s.stock_badge}>
              <View
                style={[
                  s.stock_dot,
                  product.is_low_stock && s.stock_dot_low,
                ]}
              />
              <Text
                style={[
                  s.stock_text,
                  product.is_low_stock && s.stock_text_low,
                ]}
              >
                {product.stock} {product.unit === "unit" ? "uds" : product.unit}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.right}>
          <Text style={s.price}>S/ {product.sale_price.toFixed(2)}</Text>
          <Text style={s.margin}>
            {(product.margin * 100).toFixed(0)}% margen
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border3,
      backgroundColor: c.bg,
    },
    left: {
      flex: 1,
      gap: 6,
    },
    name: {
      fontSize: 15,
      fontWeight: "500",
      color: c.text,
    },
    meta: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    category_badge: {
      backgroundColor: c.bg2,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 20,
    },
    category_text: {
      fontSize: 11,
      color: c.text2,
      fontWeight: "500",
    },
    stock_badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    stock_dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#2ecc71",
    },
    stock_dot_low: {
      backgroundColor: "#c0392b",
    },
    stock_text: {
      fontSize: 12,
      color: "#2ecc71",
    },
    stock_text_low: {
      color: "#c0392b",
    },
    right: {
      alignItems: "flex-end",
      gap: 2,
    },
    price: {
      fontSize: 15,
      fontWeight: "600",
      color: c.text,
    },
    margin: {
      fontSize: 11,
      color: c.text4,
    },
    actions: {
      flexDirection: "row",
    },
    action_edit: {
      backgroundColor: "#3498db",
      justifyContent: "center",
      alignItems: "center",
      width: 72,
      gap: 4,
    },
    action_delete: {
      backgroundColor: "#e74c3c",
      justifyContent: "center",
      alignItems: "center",
      width: 72,
      gap: 4,
    },
    action_text: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "600",
    },
  });
