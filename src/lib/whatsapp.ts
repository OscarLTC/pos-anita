import { Alert, Linking } from "react-native";

/**
 * Abre WhatsApp con el mensaje ya escrito. Intenta el esquema nativo y cae a
 * wa.me; captura el error para no dejar promesas sin manejar.
 */
export async function openWhatsApp(phone: string, message: string): Promise<void> {
  const digits = phone.replace(/\D/g, "");
  const text = encodeURIComponent(message);
  const urls = [
    `whatsapp://send?phone=${digits}&text=${text}`,
    `https://wa.me/${digits}?text=${text}`,
  ];
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      continue;
    }
  }
  Alert.alert("WhatsApp", "No se pudo abrir WhatsApp. Verifica que esté instalado.");
}
