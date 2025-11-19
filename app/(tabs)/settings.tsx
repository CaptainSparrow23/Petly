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
} from "lucide-react-native";
import { router } from "expo-router";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { ProfilePicture } from "@/components/other/ProfilePicture";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

const CardSeparator = () => <View className="h-px bg-gray-100 mx-5" />;

type SectionCardProps = {
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  children: React.ReactNode;
};

const SectionCard = ({ title, icon: Icon, children }: SectionCardProps) => {
  const rows = React.Children.toArray(children);
  return (
    <View className="mb-6 rounded-3xl bg-white shadow-sm">
      <View className="flex-row items-center px-5 pt-5 pb-3">
        <View className="mr-2 rounded-full bg-white p-2">
          <Icon size={20} color="#191d31" />
        </View>
        <Text className="font-bold text-gray-900">{title}</Text>
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
    <Text className="text-base font-rubik text-gray-900">{label}</Text>
    <View className="flex-row items-center gap-2">
      {value && (
        <Text className="text-base font-rubik text-gray-600">{value}</Text>
      )}
      {onPress && <ChevronRight size={18} color="#9ca3af" />}
    </View>
  </TouchableOpacity>
);

type ToggleRowProps = {
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
};

const ToggleRow = ({ label, value, onValueChange }: ToggleRowProps) => (
  <View className="flex-row items-center justify-between px-5 py-4">
    <Text className="text-base font-rubik text-gray-900">{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#d1d5db", true: "#a5f3fc" }}
      thumbColor={value ? "#0ea5e9" : "#f9fafb"}
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
      className="mb-6 rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm"
      activeOpacity={0.7}
      onPress={() => router.push("/settings/editProfile")}
    >
      <View className="flex-row items-center">
        <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center">
          <ProfilePicture profileId={profileId} size={56} />
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-lg font-bold text-gray-900">
            {displayName}
          </Text>
          <Text className="text-base font-rubik text-gray-600">{email}</Text>
        </View>
        <ChevronRight size={20} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );
};

const Settings = () => {
  const { appSettings, updateAppSettings } = useGlobalContext();
  const [toggles, setToggles] = useState({
    rewardedAds: false,
    expandForest: false,
    arrangeTrees: true,
    hiddenFromRanking: false,
    allowFriendRequests: true,
    soundEffects: true,
    notifications: true,
  });

  const updateToggle = (key: keyof typeof toggles, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
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
      className="flex-1 bg-[#f3f4f6]"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <ProfileCard />

      <SectionCard title="Countdown & Timer" icon={Clock3}>
          <LinkRow
            label="App Allow List"
            value="Off"
            onPress={() =>
              Alert.alert(
                "Coming Soon",
                "App allow list will be available in a future update."
              )
            }
          />
          
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

      <SectionCard title="Insights Overview" icon={Clock}>
          <LinkRow label="First Day of the Week" value="Sunday" />
          <LinkRow label="Daily Start Time" value="00:00 (Default)" />
          <ToggleRow
            label="Display Focus Time in Hours"
            value={appSettings.displayFocusInHours}
            onValueChange={(val) => updateAppSettings({ displayFocusInHours: val })}
          />
      </SectionCard>

      <SectionCard title="Social and Friends" icon={Users}>
          <ToggleRow
            label="Hidden from Global Ranking"
            value={toggles.hiddenFromRanking}
            onValueChange={(val) => updateToggle("hiddenFromRanking", val)}
          />
            <ToggleRow
            label="Allow Friend Requests Sent Through Profile"
            value={toggles.allowFriendRequests}
            onValueChange={(val) => updateToggle("allowFriendRequests", val)}
            />
      </SectionCard>

       <SectionCard title="Sound and Notification" icon={Bell}>
          <ToggleRow
            label="Sound Effects"
            value={toggles.soundEffects}
            onValueChange={(val) => updateToggle("soundEffects", val)}
          />
            <ToggleRow
            label="Notifications"
            value={toggles.notifications}
            onValueChange={(val) => updateToggle("notifications", val)}
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
