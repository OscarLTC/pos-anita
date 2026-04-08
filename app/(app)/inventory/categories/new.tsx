import { useMemo, useState } from "react";
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
import { useThemeStore, type AppColors } from "@/theme";

export default function CategoryFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    icon?: string;
  }>();
  const isEdit = !!params.id;

  const { store } = useAuthStore();
  const { colors } = useThemeStore();
  const { addCategory, updateCategory } = useInventoryStore();

  const [name, setName] = useState(params.name ?? "");
  const [icon, setIcon] = useState(params.icon ?? "🛒");
  const [is_loading, setIsLoading] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  const handleSave = async () => {
    if (!store?.id) return Alert.alert("Error", "Sesión inválida. Vuelve a iniciar sesión.");
    if (!name.trim()) return Alert.alert("Falta el nombre de la categoría");

    setIsLoading(true);
    try {
      if (isEdit && params.id) {
        await updateCategory(params.id, { name: name.trim(), icon });
      } else {
        await addCategory(store.id, { name: name.trim(), icon });
      }
      router.back();
    } catch {
      Alert.alert("Error", "No se pudo guardar la categoría");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.icon_section}>
        <Text style={s.icon_label}>Ícono</Text>
        <TextInput
          style={s.icon_input}
          value={icon}
          onChangeText={setIcon}
          maxLength={8}
        />
        <Text style={s.icon_hint}>Escribe un emoji desde el teclado</Text>
      </View>

      <View style={s.name_section}>
        <Text style={s.label}>Nombre</Text>
        <TextInput
          style={s.input}
          placeholder="Ej: Bebidas"
          placeholderTextColor={colors.text4}
          value={name}
          onChangeText={setName}
          autoFocus={!isEdit}
        />
      </View>

      <TouchableOpacity
        style={[s.save_button, is_loading && s.save_button_disabled]}
        onPress={handleSave}
        disabled={is_loading}
      >
        {is_loading ? (
          <ActivityIndicator color={colors.accent_text} />
        ) : (
          <Text style={s.save_button_text}>
            {isEdit ? "Guardar cambios" : "Crear categoría"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
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
      color: c.text3,
      fontWeight: "500",
    },
    icon_input: {
      fontSize: 52,
      textAlign: "center",
      width: 90,
      height: 90,
      borderWidth: 0.5,
      borderColor: c.border2,
      borderRadius: 20,
      backgroundColor: c.bg4,
    },
    icon_hint: {
      fontSize: 12,
      color: c.text4,
    },
    name_section: {
      gap: 8,
    },
    label: {
      fontSize: 13,
      color: c.text3,
      fontWeight: "500",
    },
    input: {
      height: 44,
      borderWidth: 0.5,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.bg4,
    },
    save_button: {
      height: 50,
      backgroundColor: c.accent,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    save_button_disabled: {
      opacity: 0.6,
    },
    save_button_text: {
      color: c.accent_text,
      fontSize: 16,
      fontWeight: "500",
    },
  });
