import React, { useEffect, useState } from "react";
import {
 Alert,
 ScrollView,
 Switch,
 Text,
 TouchableOpacity,
 View,
} from "react-native";
import {
 ChevronRight,
 Clock3,
 Info,
 Users,
 Bell,
 Clock,
 BarChart3,
} from "lucide-react-native";
import { router } from "expo-router";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { ProfilePicture } from "@/components/other/ProfilePicture";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { CoralPalette } from "@/constants/colors";
import Constants from "expo-constants";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

const CardSeparator = () => (
 <View
  className="h-px mx-5"
  style={{ backgroundColor: `${CoralPalette.border}55` }}
 />
);

type SectionCardProps = {
 title: string;
 icon: React.ComponentType<{ size?: number; color?: string }>;
 children: React.ReactNode;
};

const SectionCard = ({ title, icon: Icon, children }: SectionCardProps) => {
 const rows = React.Children.toArray(children);
 return (
  <View
   className="mb-6 rounded-3xl shadow-sm"
   style={{
    backgroundColor: CoralPalette.surfaceAlt,
    borderColor: CoralPalette.border,
    borderWidth: 1,
   }}
  >
   <View className="flex-row items-center px-5 pt-5 pb-3">
    <View
     className="mr-2 rounded-full p-2"
     style={{ backgroundColor: CoralPalette.surfaceAlt }}
    >
     <Icon size={20} color={CoralPalette.primary} />
    </View>
    <Text className="font-bold" style={{ color: CoralPalette.dark }}>
     {title}
    </Text>
   </View>
   <View className="pb-2">
    {rows.map((child, index) => (
     <React.Fragment key={index}>
      {child}
      {index < rows.length - 1 && <CardSeparator />}
     </React.Fragment>
    ))}
   </View>
  </View>
 );
};

type RowProps = {
 label: string;
 value?: string;
 onPress?: () => void;
};

const LinkRow = ({ label, value, onPress }: RowProps) => (
 <TouchableOpacity
  onPress={onPress}
  activeOpacity={onPress ? 0.7 : 1}
  className="flex-row items-center justify-between px-5 py-4"
 >
  <Text className="text-base " style={{ color: CoralPalette.dark }}>
   {label}
  </Text>
  <View className="flex-row items-center gap-2">
   {value && (
    <Text className="text-base " style={{ color: CoralPalette.mutedDark }}>
     {value}
    </Text>
   )}
   {onPress && <ChevronRight size={18} color={CoralPalette.mutedDark} />}
  </View>
 </TouchableOpacity>
);

type ToggleRowProps = {
 label: string;
 value: boolean;
 onValueChange: (val: boolean) => void;
 disabled?: boolean;
};

const ToggleRow = ({ label, value, onValueChange, disabled }: ToggleRowProps) => (
 <View className="flex-row items-center justify-between px-5 py-4">
  <Text className="text-base " style={{ color: CoralPalette.dark }}>
   {label}
  </Text>
  <Switch
   value={value}
   onValueChange={onValueChange}
  disabled={disabled}
   trackColor={{ false: "#d1d5db", true: CoralPalette.primaryLight }}
   thumbColor={value ? CoralPalette.primary : "#f9fafb"}
  />
 </View>
);

const ProfileCard = () => {
 const { userProfile } = useGlobalContext();
 const displayName = userProfile?.displayName || "Petly Explorer";
 const email = userProfile?.email || "No email on file";
 const profileId = userProfile?.profileId || 1;

 return (
  <TouchableOpacity
   className="mb-6 rounded-3xl px-5 py-5 shadow-sm"
   style={{
    backgroundColor: CoralPalette.surfaceAlt,
    borderColor: CoralPalette.border,
    borderWidth: 1,
   }}
   activeOpacity={0.7}
   onPress={() => router.push("/settings/editProfile")}
  >
   <View className="flex-row items-center">
    <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center">
     <ProfilePicture profileId={profileId} size={56} />
    </View>
    <View className="ml-4 flex-1">
     <Text className="text-lg font-bold" style={{ color: CoralPalette.dark }}>
      {displayName}
     </Text>
     <Text className="text-base " style={{ color: CoralPalette.mutedDark }}>
      {email}
     </Text>
    </View>
    <ChevronRight size={20} color={CoralPalette.mutedDark} />
   </View>
  </TouchableOpacity>
 );
};

const Settings = () => {
 const {
  appSettings,
  updateAppSettings,
  userProfile,
  updateUserProfile,
  showBanner,
 } = useGlobalContext();
 const [toggles, setToggles] = useState({
  rewardedAds: false,
  expandForest: false,
  arrangeTrees: true,
  hiddenFromRanking: false,
  allowFriendRequests: true,
 });
 const [isUpdatingFriendSetting, setIsUpdatingFriendSetting] = useState(false);

 const updateToggle = (key: keyof typeof toggles, value: boolean) => {
  setToggles((prev) => ({ ...prev, [key]: value }));
 };

 useEffect(() => {
  setToggles((prev) => ({
   ...prev,
   allowFriendRequests:
    userProfile?.allowFriendRequests ?? true,
  }));
 }, [userProfile?.allowFriendRequests]);

 const handleAllowFriendRequestsChange = async (value: boolean) => {
  if (isUpdatingFriendSetting) return;
  if (!userProfile?.userId || !API_BASE_URL) {
   return;
  }
  setToggles((prev) => ({ ...prev, allowFriendRequests: value }));
  setIsUpdatingFriendSetting(true);
  try {
   const response = await fetch(
    `${API_BASE_URL}/api/user/update_profile/${userProfile.userId}`,
    {
     method: "PUT",
     headers: {
      "Content-Type": "application/json",
     },
        body: JSON.stringify({
          allowFriendRequests: value,
          profileId: userProfile.profileId ?? undefined,
        }),
    }
   );

   if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Failed to update preference");
   }

   updateUserProfile({ allowFriendRequests: value });
  } catch (error) {
   setToggles((prev) => ({
    ...prev,
    allowFriendRequests: userProfile?.allowFriendRequests ?? true,
   }));
   const message =
    error instanceof Error
     ? error.message
     : "Failed to update preference";
   showBanner({ title: message, preset: "error", haptic: "error" });
  } finally {
   setIsUpdatingFriendSetting(false);
  }
 };

 useEffect(() => {
  const tag = "petly-keep-screen-on";
  if (appSettings.keepScreenOn) {
   activateKeepAwakeAsync(tag).catch((err) =>
    console.warn("Failed to activate keep-awake", err)
   );
  } else {
   deactivateKeepAwake(tag).catch(() => {});
  }
  return () => {
   deactivateKeepAwake(tag).catch(() => {});
  };
 }, [appSettings.keepScreenOn]);

 return (
  <ScrollView
   className="flex-1"
   style={{ backgroundColor: CoralPalette.surface }}
   showsVerticalScrollIndicator={false}
   contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
  >
   <ProfileCard />

   <SectionCard title="Countdown & Timer" icon={Clock3}>
     
     <ToggleRow
      label="Keep Screen On"
      value={appSettings.keepScreenOn}
      onValueChange={(val) => updateAppSettings({ keepScreenOn: val })}
     />
     <ToggleRow
      label="Extend Session Limit to 3 hours"
      value={appSettings.extendSessionLimit}
      onValueChange={(val) => updateAppSettings({ extendSessionLimit: val })}
     />
   </SectionCard>

   <SectionCard title="Insights Overview" icon={BarChart3}>
     <ToggleRow
      label="Display Focus Time in Hours"
      value={appSettings.displayFocusInHours}
      onValueChange={(val) => updateAppSettings({ displayFocusInHours: val })}
     />
   </SectionCard>

   <SectionCard title="Social and Friends" icon={Users}>
      <ToggleRow
      label="Allow Friend Requests"
    value={toggles.allowFriendRequests}
    onValueChange={handleAllowFriendRequestsChange}
    disabled={isUpdatingFriendSetting}
      />
   </SectionCard>

    <SectionCard title="Sound and Notification" icon={Bell}>
     <ToggleRow
      label="Vibrations"
      value={appSettings.vibrations}
      onValueChange={(val) => updateAppSettings({ vibrations: val })}
     />
      <ToggleRow
      label="Notifications"
      value={appSettings.notifications}
      onValueChange={(val) => updateAppSettings({ notifications: val })}
      />
   </SectionCard>


   <SectionCard title="Support" icon={Info}>
     <LinkRow
      label="Help & Support"
      onPress={() =>
       Alert.alert(
        "Help & Support",
        "Need help? Reach us at support@petly.com."
       )
      }
     />
     <LinkRow
      label="About Petly"
      onPress={() =>
       Alert.alert("About Petly", "Version 1.0.0 • Your focus companion")
      }
     />
   </SectionCard>
  </ScrollView>
 );
};

export default Settings;
