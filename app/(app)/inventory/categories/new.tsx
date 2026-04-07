import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useInventoryStore } from "@/stores/inventory.store";
import { useAuthStore } from "@/stores/auth.store";

export default function CategoryFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; icon?: string }>();
  const isEdit = !!params.id;

  const { store_id } = useAuthStore();
  const { addCategory, updateCategory } = useInventoryStore();

  const [name, setName] = useState(params.name ?? "");
  const [icon, setIcon] = useState(params.icon ?? "🛒");
  const [is_loading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Falta el nombre de la categoría");

    setIsLoading(true);
    try {
      if (isEdit) {
        await updateCategory(params.id!, { name: name.trim(), icon });
      } else {
        await addCategory(store_id!, { name: name.trim(), icon });
      }
      router.back();
    } catch {
      Alert.alert("Error", "No se pudo guardar la categoría");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.icon_section}>
        <Text style={styles.icon_label}>Ícono</Text>
        <TextInput
          style={styles.icon_input}
          value={icon}
          onChangeText={setIcon}
          maxLength={8}
        />
        <Text style={styles.icon_hint}>Escribe un emoji desde el teclado</Text>
      </View>

      <View style={styles.name_section}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Bebidas"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
          autoFocus={!isEdit}
        />
      </View>

      <TouchableOpacity
        style={[styles.save_button, is_loading && styles.save_button_disabled]}
        onPress={handleSave}
        disabled={is_loading}
      >
        {is_loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.save_button_text}>
            {isEdit ? "Guardar cambios" : "Crear categoría"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 20,
  },
  icon_section: {
    alignItems: "center",
    gap: 8,
  },
  icon_label: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  icon_input: {
    fontSize: 52,
    textAlign: "center",
    width: 90,
    height: 90,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    backgroundColor: "#fafafa",
  },
  icon_hint: {
    fontSize: 12,
    color: "#bbb",
  },
  name_section: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  input: {
    height: 44,
    borderWidth: 0.5,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#fafafa",
  },
  save_button: {
    height: 50,
    backgroundColor: "#111",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  save_button_disabled: {
    opacity: 0.6,
  },
  save_button_text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
