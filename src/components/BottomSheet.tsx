import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Modal,
  View,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type LayoutChangeEvent,
} from "react-native";
import { BlurView } from "expo-blur";

const BLUR_INTENSITY = 10;
const BACKDROP_COLOR = "rgba(14,20,16,0.28)";

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet con animación correcta: el backdrop hace *fade* y el panel
 * hace *slide* desde abajo (en vez de que todo el modal suba junto).
 * Se mantiene montado durante la animación de salida.
 */
export function BottomSheet({ visible, onClose, children }: Props) {
  const [rendered, setRendered] = useState(visible);
  const [height, setHeight] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
    } else if (rendered) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [visible]);

  useEffect(() => {
    if (rendered && visible && height > 0) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [rendered, visible, height]);

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== height) setHeight(h);
  };

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [height || 1000, 0],
  });

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: progress }]}>
          <BlurView intensity={BLUR_INTENSITY} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: BACKDROP_COLOR }]} />
          </TouchableWithoutFeedback>
        </Animated.View>

        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Animated.View onLayout={onLayout} style={{ transform: [{ translateY }] }}>
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  kav: { justifyContent: "flex-end" },
});
