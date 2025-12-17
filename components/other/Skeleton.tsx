import React from "react";
import { View, ViewStyle, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { CoralPalette } from "@/constants/colors";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: ViewStyle;
}

/**
 * Custom Skeleton component using app's CoralPalette colors.
 * Uses moti for smooth shimmer animation.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  radius = 8,
  style,
}) => {
  return (
    <MotiView
      from={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        type: "timing",
        duration: 800,
        loop: true,
      }}
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius: radius,
          backgroundColor: CoralPalette.border,
        },
        style,
      ]}
    />
  );
};

interface SkeletonGroupProps {
  show: boolean;
  children: React.ReactNode;
}

/**
 * Conditionally shows skeleton or actual content.
 */
export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  show,
  children,
}) => {
  if (show) {
    return <>{children}</>;
  }
  return null;
};

// Pre-built skeleton layouts for common use cases

/**
 * Skeleton for store tiles (2-column grid item)
 */
export const StoreTileSkeleton: React.FC<{ width: number }> = ({ width }) => (
  <View
    style={{
      width,
      backgroundColor: CoralPalette.surfaceAlt,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: CoralPalette.border,
    }}
  >
    {/* Image placeholder */}
    <Skeleton width="100%" height={width - 24} radius={12} />
    {/* Title */}
    <Skeleton width="70%" height={16} radius={4} style={{ marginTop: 12 }} />
    {/* Price */}
    <Skeleton width="40%" height={14} radius={4} style={{ marginTop: 8 }} />
  </View>
);

/**
 * Skeleton for friend list item
 */
export const FriendItemSkeleton: React.FC = () => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
    }}
  >
    {/* Avatar */}
    <Skeleton width={50} height={50} radius={25} />
    {/* Name and status */}
    <View style={{ marginLeft: 12, flex: 1 }}>
      <Skeleton width="60%" height={16} radius={4} />
      <Skeleton width="40%" height={12} radius={4} style={{ marginTop: 6 }} />
    </View>
  </View>
);

/**
 * Skeleton for accessory item in pets tab
 */
export const AccessoryItemSkeleton: React.FC = () => (
  <Skeleton width={90} height={90} radius={16} />
);

/**
 * Skeleton for Today's Focus card on insights page
 */
export const TodayFocusCardSkeleton: React.FC = () => (
  <View
    style={{
      width: "65%",
      backgroundColor: CoralPalette.surfaceAlt,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: CoralPalette.border,
    }}
  >
    <View style={{ alignItems: "flex-end" }}>
      <Skeleton width={100} height={16} radius={4} />
    </View>
    <View style={{ alignItems: "flex-end", marginTop: 8 }}>
      <Skeleton width={80} height={40} radius={8} />
    </View>
    <View style={{ alignItems: "flex-end", marginTop: 8 }}>
      <Skeleton width={120} height={14} radius={4} />
    </View>
  </View>
);

/**
 * Skeleton for Streak card on insights page
 */
export const StreakCardSkeleton: React.FC = () => (
  <View
    style={{
      width: "31%",
      backgroundColor: CoralPalette.surfaceAlt,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: CoralPalette.border,
      alignItems: "flex-end",
      justifyContent: "space-between",
    }}
  >
    <Skeleton width={70} height={14} radius={4} />
    <View style={{ alignItems: "flex-end", marginTop: 12 }}>
      <Skeleton width={50} height={48} radius={8} />
      <Skeleton width={70} height={12} radius={4} style={{ marginTop: 8 }} />
    </View>
  </View>
);

/**
 * Skeleton for Goals card on insights page
 */
export const GoalsCardSkeleton: React.FC = () => (
  <View
    style={{
      backgroundColor: CoralPalette.surfaceAlt,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: CoralPalette.border,
      marginTop: 8,
    }}
  >
    {/* Header */}
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Skeleton width={60} height={18} radius={4} />
      <Skeleton width={70} height={30} radius={15} />
    </View>
    {/* Daily goal */}
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Skeleton width={100} height={14} radius={4} />
        <Skeleton width={60} height={14} radius={4} />
      </View>
      <Skeleton width="100%" height={10} radius={5} style={{ marginTop: 8 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
        <Skeleton width={80} height={12} radius={4} />
        <Skeleton width={40} height={12} radius={4} />
      </View>
    </View>
    {/* Weekly goal */}
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Skeleton width={110} height={14} radius={4} />
        <Skeleton width={60} height={14} radius={4} />
      </View>
      <Skeleton width="100%" height={10} radius={5} style={{ marginTop: 8 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
        <Skeleton width={80} height={12} radius={4} />
        <Skeleton width={40} height={12} radius={4} />
      </View>
    </View>
  </View>
);

/**
 * Skeleton for Focus Chart on insights page
 */
export const FocusChartSkeleton: React.FC = () => (
  <View
    style={{
      backgroundColor: CoralPalette.surfaceAlt,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: CoralPalette.border,
      marginTop: 16,
    }}
  >
    {/* Header row */}
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Skeleton width={180} height={18} radius={4} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Skeleton width={30} height={30} radius={15} />
        <Skeleton width={100} height={30} radius={15} />
        <Skeleton width={30} height={30} radius={15} />
      </View>
    </View>
    {/* Total time */}
    <View style={{ alignItems: "flex-end", marginTop: 12 }}>
      <Skeleton width={100} height={24} radius={4} />
    </View>
    {/* Chart area */}
    <View style={{ marginTop: 16, height: 180, justifyContent: "flex-end" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", height: 150 }}>
        {[60, 90, 40, 120, 80, 100, 70, 50].map((h, i) => (
          <Skeleton key={i} width={20} height={h} radius={4} />
        ))}
      </View>
    </View>
    {/* Mode tabs */}
    <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16, gap: 8 }}>
      <Skeleton width={60} height={28} radius={14} />
      <Skeleton width={60} height={28} radius={14} />
      <Skeleton width={60} height={28} radius={14} />
    </View>
  </View>
);

/**
 * Skeleton for Profile page
 */
export const ProfileSkeleton: React.FC = () => (
  <SafeAreaView style={{ flex: 1, backgroundColor: CoralPalette.surface }}>
    {/* Header skeleton */}
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: CoralPalette.surface,
      }}
    >
      <Skeleton width={30} height={30} radius={4} />
      <Skeleton width={100} height={20} radius={4} />
      <Skeleton width={24} height={24} radius={4} />
    </View>

    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ backgroundColor: CoralPalette.surface }}
    >
      {/* Profile Header Section */}
      <View style={{ paddingHorizontal: 20, marginTop: 16, paddingBottom: 8, alignItems: "center" }}>
        <Skeleton width={98} height={98} radius={49} />
        <Skeleton width={150} height={20} radius={4} style={{ marginTop: 8 }} />
        <Skeleton width={120} height={14} radius={4} style={{ marginTop: 4 }} />
      </View>

      {/* Quick Stats Row */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
              <Skeleton width={25} height={25} radius={4} />
              <Skeleton width={40} height={28} radius={4} style={{ marginLeft: 8 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Level Progress Section */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View
          style={{
            backgroundColor: CoralPalette.white,
            borderWidth: 1,
            borderColor: CoralPalette.surfaceAlt,
            borderRadius: 10,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Skeleton width={100} height={16} radius={4} />
              <Skeleton width={180} height={10} radius={4} style={{ marginTop: 4 }} />
            </View>
            <Skeleton width={48} height={48} radius={24} />
          </View>
          <Skeleton width="100%" height={12} radius={6} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <Skeleton width={120} height={12} radius={4} />
            <Skeleton width={80} height={12} radius={4} />
          </View>
        </View>
      </View>

      {/* Overview Section */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Skeleton width={80} height={14} radius={4} style={{ marginLeft: 8, marginBottom: 16 }} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {[1, 2].map((i) => (
            <View
              key={i}
              style={{
                width: "47%",
                backgroundColor: CoralPalette.white,
                borderWidth: 1,
                borderColor: CoralPalette.white,
                borderRadius: 10,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Skeleton width={20} height={20} radius={4} />
                <Skeleton width={100} height={14} radius={4} style={{ marginLeft: 8 }} />
              </View>
              <Skeleton width={60} height={28} radius={4} style={{ marginLeft: 4 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Achievements Section */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <Skeleton width={100} height={14} radius={4} style={{ marginLeft: 8 }} />
          <Skeleton width={18} height={18} radius={4} />
        </View>
        <View
          style={{
            backgroundColor: CoralPalette.white,
            borderWidth: 1,
            borderColor: CoralPalette.white,
            borderRadius: 10,
            padding: 24,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Skeleton width={120} height={16} radius={4} />
        </View>
      </View>

      {/* Collection Section */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <Skeleton width={100} height={14} radius={4} style={{ marginLeft: 8 }} />
          <Skeleton width={18} height={18} radius={4} />
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: CoralPalette.white,
                borderWidth: 1,
                borderColor: CoralPalette.white,
                borderRadius: 10,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Skeleton width={20} height={20} radius={4} />
                <Skeleton width={60} height={14} radius={4} style={{ marginLeft: 8 }} />
              </View>
              <Skeleton width={40} height={36} radius={4} style={{ marginLeft: 4 }} />
              <Skeleton width={50} height={12} radius={4} style={{ marginLeft: 4, marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Pet Friendships Section */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <Skeleton width={140} height={14} radius={4} style={{ marginLeft: 8 }} />
          <Skeleton width={18} height={18} radius={4} />
        </View>
        <View
          style={{
            backgroundColor: CoralPalette.white,
            borderWidth: 4,
            borderColor: CoralPalette.purpleLighter,
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 10,
          }}
        >
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ alignItems: "center", width: 100 }}>
                <Skeleton width={80} height={80} radius={40} />
                <Skeleton width={70} height={14} radius={4} style={{ marginTop: 8 }} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
);

export default Skeleton;
