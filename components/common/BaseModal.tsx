import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  ViewStyle,
  StyleProp,
} from "react-native";
import { X } from "lucide-react-native";
import { CoralPalette } from "@/constants/colors";

const FONT = { fontFamily: "Nunito" };

export type ModalAnimationType = "scale" | "slide" | "fade";

export type BaseModalProps = {
  /** Whether the modal is visible */
  visible: boolean;
  /** Called when the modal should close (backdrop tap, X button, back button) */
  onClose: () => void;
  /** Modal content */
  children: React.ReactNode;
  /** Optional title - if provided, renders a header with title and close button */
  title?: string;
  /** Animation type: 'scale' (default), 'slide' (from bottom), or 'fade' */
  animationType?: ModalAnimationType;
  /** Whether tapping the backdrop closes the modal (default: true) */
  closeOnBackdropPress?: boolean;
  /** Custom close button component - if provided, replaces the default X button */
  closeButton?: React.ReactNode;
  /** Whether to show the close button in the header (default: true if title is provided) */
  showCloseButton?: boolean;
  /** Custom styles for the modal container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Custom styles for the modal content wrapper */
  contentStyle?: StyleProp<ViewStyle>;
  /** Backdrop opacity (default: 0.5) */
  backdropOpacity?: number;
};

export default function BaseModal({
  visible,
  onClose,
  children,
  title,
  animationType = "scale",
  closeOnBackdropPress = true,
  closeButton,
  showCloseButton = true,
  containerStyle,
  contentStyle,
  backdropOpacity = 0.5,
}: BaseModalProps) {
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const visibleRef = useRef(visible);

  useEffect(() => {
    visibleRef.current = visible;
    anim.stopAnimation();

    if (visible) {
      setMounted(true);
      if (animationType === "fade") {
        Animated.timing(anim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !visibleRef.current) {
          setMounted(false);
        }
      });
    }
  }, [visible, anim, animationType]);

  // Backdrop animation
  const backdropAnimatedOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, backdropOpacity],
  });

  // Content animation based on type
  const getContentTransform = () => {
    switch (animationType) {
      case "slide":
        return {
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [height, 0],
              }),
            },
          ],
          opacity: anim,
        };
      case "fade":
        return {
          opacity: anim,
        };
      case "scale":
      default:
        return {
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1],
              }),
            },
          ],
          opacity: anim,
        };
    }
  };

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose();
    }
  };

  if (!mounted) return null;

  const renderCloseButton = () => {
    if (!showCloseButton) return null;
    if (closeButton) return closeButton;
    return (
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <X size={24} color={CoralPalette.mutedDark} />
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#000",
          opacity: backdropAnimatedOpacity,
        }}
      />

      {/* Touchable backdrop area */}
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <View
          style={[
            {
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 16,
            },
            containerStyle,
          ]}
        >
          {/* Modal content - prevent propagation */}
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ width: '100%', alignItems: 'center' }}>
            <Animated.View
              style={[
                {
                  backgroundColor: CoralPalette.greyLighter,
                  borderRadius: 16,
                  padding: 20,
                  width: "100%",
                  maxWidth: 400,
                },
                getContentTransform(),
                contentStyle,
              ]}
            >
              {/* Header with title and close button */}
              {title && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={[
                      {
                        fontSize: 18,
                        fontWeight: "700",
                        color: CoralPalette.dark,
                      },
                      FONT,
                    ]}
                  >
                    {title}
                  </Text>
                  {renderCloseButton()}
                </View>
              )}

              {/* Children content */}
              {children}
            </Animated.View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
