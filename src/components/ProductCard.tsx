import { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import type { ProductWithMeta } from "@/types";

interface Props {
  product: ProductWithMeta;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProductCard({ product, onPress, onEdit, onDelete }: Props) {
  const swipeable_ref = useRef<Swipeable>(null);

  const close = () => swipeable_ref.current?.close();

  const renderRightActions = () => (
    <View style={styles.actions}>
      <TouchableOpacity
        style={styles.action_edit}
        onPress={() => { close(); onEdit(); }}
      >
        <Text style={styles.action_text}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.action_delete}
        onPress={() => { close(); onDelete(); }}
      >
        <Text style={styles.action_text}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable ref={swipeable_ref} renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.left}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={styles.meta}>
            <View style={styles.category_badge}>
              <Text style={styles.category_text}>
                {product.category?.icon} {product.category?.name}
              </Text>
            </View>
            <View style={styles.stock_badge}>
              <View style={[styles.stock_dot, product.is_low_stock && styles.stock_dot_low]} />
              <Text style={[styles.stock_text, product.is_low_stock && styles.stock_text_low]}>
                {product.stock} {product.unit === "unit" ? "uds" : product.unit}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={styles.price}>S/ {product.sale_price.toFixed(2)}</Text>
          <Text style={styles.margin}>{(product.margin * 100).toFixed(0)}% margen</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  left: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111",
  },
  meta: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  category_badge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  category_text: {
    fontSize: 11,
    color: "#555",
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
    color: "#111",
  },
  margin: {
    fontSize: 11,
    color: "#aaa",
  },
  actions: {
    flexDirection: "row",
  },
  action_edit: {
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  action_delete: {
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  action_text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
