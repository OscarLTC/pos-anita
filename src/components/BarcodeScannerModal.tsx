import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Modal,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { colors, spacing, radius, fontSize, fontFamilies } from "@/theme";

/** Resultado de resolver un código (lo provee el padre). */
export type ScanResult =
  | { status: "found"; icon: string; name: string; subtitle: string }
  | { status: "not_found"; code: string }
  | null;

interface Props {
  visible: boolean;
  onScanned: (code: string) => void;
  onClose: () => void;
  /** Si se provee, el escáner muestra una tarjeta de confirmación con este resultado. */
  result?: ScanResult;
  /** Acción del botón "Agregar" cuando hay un producto encontrado. */
  onAdd?: () => void;
  /** Descarta el resultado actual y reanuda el escaneo. */
  onScanAgain?: () => void;
}

const { width: SCREEN_W } = Dimensions.get("window");
const FRAME_W = Math.min(SCREEN_W * 0.78, 320);
const FRAME_H = 180;
const SCAN_COLOR = "#37C281";
const AVATAR_BG = "rgba(242,199,68,0.20)";

export function BarcodeScannerModal({
  visible,
  onScanned,
  onClose,
  result = null,
  onAdd,
  onScanAgain,
}: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const scannedRef = useRef(false);
  const prevResult = useRef<ScanResult>(result);
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scannedRef.current = false;
      setTorch(false);
      if (!permission?.granted) {
        requestPermission().then((res) => {
          if (!res.granted) {
            Alert.alert(
              "Permiso requerido",
              "Necesitas permitir el acceso a la cámara para escanear códigos.",
            );
            onClose();
          }
        });
      }
    }
  }, [visible]);

  // Reanuda el escaneo cuando el padre limpia un resultado previo.
  useEffect(() => {
    if (visible && prevResult.current != null && result == null) {
      scannedRef.current = false;
    }
    prevResult.current = result;
  }, [result, visible]);

  // Línea de escaneo animada (se oculta cuando hay un resultado).
  useEffect(() => {
    if (!visible) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [visible]);

  if (!visible) return null;

  const handleScan = ({ data }: { data: string }) => {
    if (scannedRef.current || result != null) return;
    scannedRef.current = true;
    onScanned(data);
  };

  const lineY = lineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, FRAME_H - 2] });

  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar style="light" />
      <View style={s.container}>
        {permission?.granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={torch}
              onBarcodeScanned={handleScan}
              barcodeScannerSettings={{
                barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"],
              }}
            />

            <View style={s.frameWrap} pointerEvents="none">
              <View style={s.frame}>
                <View style={[s.corner, s.cornerTL]} />
                <View style={[s.corner, s.cornerTR]} />
                <View style={[s.corner, s.cornerBL]} />
                <View style={[s.corner, s.cornerBR]} />
                {result == null && (
                  <Animated.View style={[s.scanLine, { transform: [{ translateY: lineY }] }]} />
                )}
              </View>
            </View>

            {/* Toque para reanudar cuando hay un resultado */}
            {result != null && (
              <TouchableWithoutFeedback onPress={onScanAgain}>
                <View style={StyleSheet.absoluteFill} />
              </TouchableWithoutFeedback>
            )}

            <View style={[s.headerSafe, { paddingTop: insets.top }]}>
              <View style={s.header}>
                <TouchableOpacity style={s.headerBtn} onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Escanear código</Text>
                <TouchableOpacity
                  style={[s.headerBtn, torch && s.headerBtnActive]}
                  onPress={() => setTorch((t) => !t)}
                  hitSlop={8}
                >
                  <Ionicons
                    name={torch ? "flash" : "flash-outline"}
                    size={20}
                    color={torch ? colors.ink : "#fff"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[s.bottomSafe, { paddingBottom: insets.bottom || spacing.md }]}>
              <View style={s.card}>{renderCard(result, onAdd)}</View>
            </View>
          </>
        ) : (
          <View style={s.center}>
            <Text style={s.dim}>Esperando permiso de cámara…</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

function renderCard(result: ScanResult, onAdd?: () => void) {
  if (result?.status === "found") {
    return (
      <View style={s.foundRow}>
        <View style={s.avatar}>
          <Text style={s.avatarIcon}>{result.icon}</Text>
        </View>
        <View style={s.foundInfo}>
          <Text style={s.foundName} numberOfLines={1}>
            {result.name}
          </Text>
          <Text style={s.foundSub} numberOfLines={1}>
            {result.subtitle}
          </Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={onAdd} activeOpacity={0.85}>
          <Text style={s.addBtnText}>Agregar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (result?.status === "not_found") {
    return (
      <View style={s.hintWrap}>
        <Text style={s.hintTitle}>Producto no encontrado</Text>
        <Text style={s.hintSub}>Código {result.code} · toca para escanear otro</Text>
      </View>
    );
  }

  return (
    <View style={s.hintWrap}>
      <Text style={s.hintTitle}>Apunta al código de barras</Text>
      <Text style={s.hintSub}>Detectando…</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0E0C" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  dim: { color: "rgba(255,255,255,0.7)", fontSize: fontSize.md },

  frameWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  frame: { width: FRAME_W, height: FRAME_H },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: SCAN_COLOR,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    position: "absolute",
    left: 6,
    right: 6,
    height: 2,
    borderRadius: 2,
    backgroundColor: SCAN_COLOR,
    shadowColor: SCAN_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },

  headerSafe: { position: "absolute", top: 0, left: 0, right: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnActive: { backgroundColor: colors.accent },
  headerTitle: { color: "#fff", fontFamily: fontFamilies.display, fontSize: fontSize.md },

  bottomSafe: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: "rgba(28,32,29,0.92)",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  hintWrap: { alignItems: "center", gap: 2 },
  hintTitle: { color: "#fff", fontFamily: fontFamilies.display, fontSize: fontSize.md },
  hintSub: { color: "rgba(255,255,255,0.55)", fontSize: fontSize.sm },

  foundRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: AVATAR_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: { fontSize: 22 },
  foundInfo: { flex: 1, gap: 2 },
  foundName: { color: "#fff", fontFamily: fontFamilies.display, fontSize: fontSize.md },
  foundSub: { color: "rgba(255,255,255,0.55)", fontSize: fontSize.sm },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
  },
  addBtnText: { color: colors.primaryInk, fontFamily: fontFamilies.display, fontSize: fontSize.sm },
});
