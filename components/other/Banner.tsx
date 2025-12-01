import React, { useEffect } from "react";
import { View, Text, Animated } from "react-native";
import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { CoralPalette } from "@/constants/colors";

type BannerType = "success" | "error" | "info" | "warning";

interface BannerProps {
  message: string;
  type?: BannerType;
  visible: boolean;
  onHide?: () => void;
  duration?: number;
}

const bannerConfig: Record<
  BannerType,
  { icon: LucideIcon; bgColor: string; iconColor: string; textColor: string }
> = {
  success: {
    icon: CheckCircle,
    bgColor: CoralPalette.primary,
    iconColor: CoralPalette.white,
    textColor: CoralPalette.white,
  },
  error: {
    icon: XCircle,
    bgColor: "#C73F3C",
    iconColor: CoralPalette.white,
    textColor: CoralPalette.white,
  },
  warning: {
    icon: AlertCircle,
    bgColor: CoralPalette.primaryLight,
    iconColor: CoralPalette.dark,
    textColor: CoralPalette.dark,
  },
  info: {
    icon: Info,
    bgColor: CoralPalette.primaryMuted,
    iconColor: CoralPalette.white,
    textColor: CoralPalette.white,
  },
};

export const Banner: React.FC<BannerProps> = ({
  message,
  type = "info",
  visible,
  onHide,
  duration = 3000,
}) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const config = bannerConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideBanner();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onHide) {
        onHide();
      }
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <View
        style={{
          backgroundColor: config.bgColor,
          paddingVertical: 16,
          paddingHorizontal: 16,
          paddingTop: 60, // Account for status bar
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Icon size={24} color={config.iconColor} />
        <Text
          style={{
            color: config.textColor,
            fontSize: 16,
            fontWeight: "500",
            marginLeft: 12,
            textAlign: "center",
          }}
          className="font-medium"
        >
          {message}
        </Text>
        {/* Spacer to balance the icon on the left */}
        <View style={{ width: 24, marginLeft: 12 }} />
      </View>
    </Animated.View>
  );
};
