import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { ProductWithMeta } from "@/types";

interface Props {
  product: ProductWithMeta;
  onPress: () => void;
}

export function ProductCard({ product, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <View style={styles.meta}>
          <View style={styles.category_badge}>
            <Text style={styles.category_text}>{product.category.name}</Text>
          </View>
          <View
            style={[
              styles.stock_badge,
              product.is_low_stock && styles.stock_badge_low,
            ]}
          >
            <View
              style={[
                styles.stock_dot,
                product.is_low_stock && styles.stock_dot_low,
              ]}
            />
            <Text
              style={[
                styles.stock_text,
                product.is_low_stock && styles.stock_text_low,
              ]}
            >
              {product.stock} {product.unit === "unit" ? "uds" : product.unit}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.price}>S/ {product.sale_price.toFixed(2)}</Text>
        <Text style={styles.margin}>
          {(product.margin * 100).toFixed(0)}% margen
        </Text>
      </View>
    </TouchableOpacity>
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
  stock_badge_low: {},
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
});
