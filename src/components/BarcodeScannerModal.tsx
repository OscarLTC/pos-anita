import { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

interface Props {
  visible: boolean;
  onScanned: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScannerModal({ visible, onScanned, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const scanned_ref = useRef(false);

  useEffect(() => {
    if (visible) scanned_ref.current = false;
    if (visible && !permission?.granted) {
      requestPermission().then((result) => {
        if (!result.granted) {
          Alert.alert(
            "Permiso requerido",
            "Necesitas permitir el acceso a la cámara para escanear códigos.",
          );
          onClose();
        }
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {permission?.granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={({ data }) => {
                if (scanned_ref.current) return;
                scanned_ref.current = true;
                onScanned(data);
              }}
              barcodeScannerSettings={{
                barcodeTypes: [
                  "ean13",
                  "ean8",
                  "upc_a",
                  "upc_e",
                  "code128",
                  "code39",
                  "qr",
                ],
              }}
            />

            <View style={styles.overlay_top} />
            <View style={styles.overlay_bottom} />

            <View style={styles.frame_row}>
              <View style={styles.overlay_side} />
              <View style={styles.frame} />
              <View style={styles.overlay_side} />
            </View>

            <View style={styles.hint_container}>
              <Text style={styles.hint}>Apunta al código de barras</Text>
            </View>
          </>
        ) : (
          <View style={styles.no_permission}>
            <Text style={styles.no_permission_text}>
              Esperando permiso de cámara...
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.close_button} onPress={onClose}>
          <Text style={styles.close_text}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const FRAME_SIZE = 260;
const OVERLAY_COLOR = "rgba(0,0,0,0.55)";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay_top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: OVERLAY_COLOR,
  },
  overlay_bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "45%",
    backgroundColor: OVERLAY_COLOR,
  },
  frame_row: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    height: "15%",
    flexDirection: "row",
    justifyContent: "center",
  },
  overlay_side: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  frame: {
    width: FRAME_SIZE,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 12,
  },
  hint_container: {
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
    alignItems: "center",
    marginTop: FRAME_SIZE * 0.45 + 16,
  },
  hint: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.8,
  },
  no_permission: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  no_permission_text: {
    color: "#fff",
    fontSize: 15,
  },
  close_button: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  close_text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
