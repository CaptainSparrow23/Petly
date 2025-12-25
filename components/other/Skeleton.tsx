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
      backgroundColor: CoralPalette.white,
      borderRadius: 10,
      borderWidth: 3,
      borderColor: CoralPalette.primaryMuted,
      shadowColor: "#191d31",
      shadowOpacity: 0.15,
      shadowRadius: 2,
      shadowOffset: { width: 3, height: 5 },
      elevation: 10,
      overflow: "visible",
    }}
  >
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 9,
        left: 9,
        right: 9,
        bottom: 9,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: CoralPalette.yellowDark,
        borderRadius: 6,
        opacity: 0.55,
      }}
    />

    {/* Image placeholder - Top Section */}
    <View 
      style={{ 
        width: "100%",
        backgroundColor: CoralPalette.greyLighter,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 14,
        paddingBottom: 12,
        paddingHorizontal: 14,
        minHeight: 120,
        borderTopLeftRadius: 7,
        borderTopRightRadius: 7,
      }}
    >
      <Skeleton width={90} height={90} radius={8} />
    </View>
    {/* Content - Bottom Section */}
    <View 
      style={{ 
        backgroundColor: CoralPalette.white,
        paddingVertical: 12,
        paddingHorizontal: 14,
        alignItems: "center",
        borderBottomLeftRadius: 7,
        borderBottomRightRadius: 7,
      }}
    >
      {/* Title */}
      <Skeleton width="75%" height={15} radius={4} style={{ marginBottom: 8 }} />
      {/* Price */}
      <View 
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Skeleton width={50} height={16} radius={4} />
        <Skeleton width={20} height={20} radius={4} style={{ marginLeft: 6 }} />
      </View>
    </View>
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
 * Skeleton for pet card in pets tab
 */
export const PetCardSkeleton: React.FC = () => (
  <View
    style={{
      width: "48%",
      backgroundColor: CoralPalette.white,
      borderRadius: 12,
      padding: 14,
      shadowColor: "#191d31",
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 4,
      elevation: 6,
    }}
  >
    {/* Pet Image */}
    <View style={{ alignItems: "center", marginBottom: 10 }}>
      <Skeleton width={70} height={85} radius={8} />
    </View>
    {/* Name */}
    <Skeleton width="70%" height={16} radius={4} style={{ alignSelf: "center" }} />
    {/* Personality */}
    <Skeleton width="60%" height={11} radius={4} style={{ alignSelf: "center", marginTop: 6 }} />
  </View>
);

/**
 * Skeleton for Pet Summary Card in pets tab
 */
export const PetSummaryCardSkeleton: React.FC = () => (
  <View
    style={{
      backgroundColor: CoralPalette.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: CoralPalette.lightGrey,
      shadowColor: "#191d31",
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 4,
      elevation: 6,
    }}
  >
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <View style={{ flex: 1 }}>
        <Skeleton width={90} height={12} radius={4} />
        <Skeleton width={120} height={22} radius={4} style={{ marginTop: 6 }} />
        <Skeleton width={140} height={12} radius={4} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={55} height={65} radius={8} style={{ marginLeft: 8 }} />
    </View>
  </View>
);

/**
 * Full Pets Tab skeleton with summary card and pet grid
 */
export const PetsTabSkeleton: React.FC = () => (
  <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
    {/* Summary Card Skeleton */}
    <PetSummaryCardSkeleton />
    
    {/* Section Header */}
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <Skeleton width={120} height={16} radius={4} />
      <Skeleton width={70} height={22} radius={12} />
    </View>
    
    {/* Pet Cards Grid */}
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
      <PetCardSkeleton />
      <PetCardSkeleton />
    </View>
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
      <PetCardSkeleton />
      <PetCardSkeleton />
    </View>
  </View>
);

/**
 * Skeleton for Today's Focus card on insights page
 */
export const TodayFocusCardSkeleton: React.FC = () => (
  <View
    style={{
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: CoralPalette.primary,
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
      elevation: 12,
    }}
  >
    <View
      style={{
        width: "100%",
        backgroundColor: CoralPalette.primaryMuted,
        padding: 20,
        height: 150,
        position: "relative",
      }}
    >
      {/* Decorative circles - matching actual card */}
      <View
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "rgba(255,255,255,0.1)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -40,
          left: -20,
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />
      {/* Content */}
      <View style={{ zIndex: 1 }}>
        <Skeleton width={100} height={14} radius={4} style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
        <Skeleton width={120} height={36} radius={6} style={{ marginTop: 4, backgroundColor: "rgba(255,255,255,0.4)" }} />
        <Skeleton width={160} height={28} radius={14} style={{ marginTop: 8, backgroundColor: "rgba(255,255,255,0.25)" }} />
      </View>
    </View>
  </View>
);

/**
 * Skeleton for Companions page (pets copy)
 */
export const CompanionsPageSkeleton: React.FC = () => (
  <ScrollView style={{ flex: 1, backgroundColor: CoralPalette.beigeSoft }}>
    <View style={{ padding: 16 }}>
      {/* Main card */}
      <View
        style={{
          backgroundColor: CoralPalette.white,
          borderRadius: 10,
          padding: 18,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View
            style={{
              width: 160,
              height: 180,
              borderRadius: 10,
              backgroundColor: CoralPalette.beigePaper,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Skeleton width={120} height={120} radius={12} />
          </View>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Skeleton width="70%" height={18} radius={6} />
            <Skeleton width="45%" height={14} radius={6} style={{ marginTop: 10 }} />
            <Skeleton width="55%" height={14} radius={6} style={{ marginTop: 8 }} />
            <Skeleton width="40%" height={14} radius={6} style={{ marginTop: 8 }} />
          </View>
        </View>

        {/* Stats panel */}
        <View style={{ marginTop: 16, backgroundColor: CoralPalette.white, borderRadius: 16, padding: 12 }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: idx === 3 ? 0 : 10,
              }}
            >
              <Skeleton width={120} height={14} radius={6} />
              <Skeleton width={60} height={14} radius={6} />
            </View>
          ))}
        </View>

        {/* My Companions section */}
        <View style={{ marginTop: 18 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Skeleton width={140} height={18} radius={6} />
            <Skeleton width={22} height={22} radius={11} />
          </View>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 10,
                  borderWidth: 3,
                  borderColor: CoralPalette.beigePaper,
                  padding: 12,
                  backgroundColor: CoralPalette.beigePaper,
                  alignItems: "center",
                }}
              >
                <Skeleton width={60} height={60} radius={8} style={{ backgroundColor: CoralPalette.greyLighter }} />
                <Skeleton width="100%" height={8} radius={6} style={{ marginTop: 10 }} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  </ScrollView>
);

/**
 * Skeleton for Streak card on insights page
 */
export const StreakCardSkeleton: React.FC = () => (
  <View
    style={{
      width: "31%",
      backgroundColor: CoralPalette.white,
      borderRadius: 5,
      padding: 16,
      borderWidth: 1,
      borderColor: CoralPalette.lightGrey,
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
 * Skeleton for Goals card on insights page (two cards side by side)
 */
export const GoalsCardSkeleton: React.FC = () => (
  <View style={{ flexDirection: "row", gap: 12 }}>
    {/* Daily Goal Card Skeleton - Green theme */}
    <View
      style={{
        flex: 1,
        backgroundColor: "#FAFFFE",
        borderRadius: 20,
        padding: 18,
        alignItems: "center",
      }}
    >
      <Skeleton width={70} height={12} radius={4} style={{ backgroundColor: `${CoralPalette.green}30` }} />
      <Skeleton width={90} height={10} radius={4} style={{ marginTop: 4, backgroundColor: CoralPalette.greyLight }} />
      <Skeleton width={110} height={110} radius={55} style={{ marginTop: 14, backgroundColor: "#E8F5E9" }} />
      <Skeleton width={70} height={24} radius={12} style={{ marginTop: 14, backgroundColor: `${CoralPalette.green}25` }} />
    </View>
    {/* Weekly Goal Card Skeleton - Purple theme */}
    <View
      style={{
        flex: 1,
        backgroundColor: "#FDFAFF",
        borderRadius: 20,
        padding: 18,
        alignItems: "center",
      }}
    >
      <Skeleton width={80} height={12} radius={4} style={{ backgroundColor: `${CoralPalette.purple}30` }} />
      <Skeleton width={100} height={10} radius={4} style={{ marginTop: 4, backgroundColor: CoralPalette.greyLight }} />
      <Skeleton width={110} height={110} radius={55} style={{ marginTop: 14, backgroundColor: "#F3E8FF" }} />
      <Skeleton width={70} height={24} radius={12} style={{ marginTop: 14, backgroundColor: `${CoralPalette.purple}25` }} />
    </View>
  </View>
);

/**
 * Skeleton for Focus Chart on insights page
 */
export const FocusChartSkeleton: React.FC = () => (
  <View
    style={{
      backgroundColor: CoralPalette.white,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: `${CoralPalette.blue}20`,
      overflow: "hidden",
    }}
  >
    {/* Header */}
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: CoralPalette.greyLight,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Skeleton width={40} height={40} radius={12} style={{ backgroundColor: `${CoralPalette.blue}15` }} />
        <View style={{ marginLeft: 12 }}>
          <Skeleton width={160} height={16} radius={4} />
          <Skeleton width={100} height={12} radius={4} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton width={90} height={36} radius={10} style={{ backgroundColor: `${CoralPalette.blue}12` }} />
    </View>
    {/* Chart area */}
    <View style={{ padding: 16, paddingTop: 8 }}>
      <View style={{ height: 250, justifyContent: "flex-end" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", height: 200 }}>
          {[60, 90, 40, 120, 80, 100, 70, 50].map((h, i) => (
            <Skeleton key={i} width={20} height={h} radius={4} style={{ backgroundColor: `${CoralPalette.blue}20` }} />
          ))}
        </View>
      </View>
    </View>
  </View>
);

/**
 * Skeleton for Tag Distribution Chart on insights page
 */
export const TagDistributionChartSkeleton: React.FC = () => (
  <View
    style={{
      backgroundColor: CoralPalette.white,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: `${CoralPalette.purple}20`,
      overflow: "hidden",
    }}
  >
    {/* Header */}
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: CoralPalette.greyLight,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Skeleton width={40} height={40} radius={12} style={{ backgroundColor: `${CoralPalette.purple}15` }} />
        <View style={{ marginLeft: 12 }}>
          <Skeleton width={140} height={16} radius={4} />
          <Skeleton width={100} height={12} radius={4} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton width={90} height={36} radius={10} style={{ backgroundColor: `${CoralPalette.purple}12` }} />
    </View>
    {/* Chart area - pie chart */}
    <View style={{ padding: 16, paddingTop: 0 }}>
      <View style={{ height: 260, alignItems: "center", justifyContent: "center" }}>
        <Skeleton width={200} height={200} radius={100} style={{ backgroundColor: `${CoralPalette.purple}15` }} />
      </View>
      {/* Legend area */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 8,
          marginTop: 8,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: CoralPalette.greyLight,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width={80} height={28} radius={14} />
        ))}
      </View>
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
