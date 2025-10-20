import { ProfilePicture } from "@/components/other/ProfilePicture";
import { useGlobalContext } from "@/lib/global-provider";
import type { LucideIcon } from "lucide-react-native";
import { 
  ChevronRight, 
  LogOut, 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  Info,
  Settings as SettingsIcon,
  Moon,
  Globe
} from "lucide-react-native";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, Alert, ActivityIndicator } from "react-native";

interface SettingsItemProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  textColor?: string;
  logout?: boolean;
  isLoading?: boolean;
}

const SettingsItem = ({
  icon: Icon,
  title,
  logout = false,
  subtitle,
  onPress,
  showArrow = true,
  textColor = "#1f2937",
  isLoading = false
}: SettingsItemProps) => (
  <TouchableOpacity
    className="flex flex-row items-center py-4 px-4 bg-gray-50 border-b border-gray-100 last:border-b-0"
    onPress={onPress}
    activeOpacity={0.7}
    disabled={isLoading}
  >
    <View className="mr-3">
      {isLoading ? (
        <ActivityIndicator size="small" color="#ef4444" />
      ) : (
        <Icon size={22} color={!logout ? "#6b7280" : "#ef4444"} />
      )}
    </View>
    <View className="flex-1">
      <Text className="text-base font-rubik-medium" style={{ color: textColor }}>
        {title}
      </Text>
      {subtitle && (
        <Text className="text-sm font-rubik text-gray-500 mt-1">
          {subtitle}
        </Text>
      )}
    </View>
    {showArrow && <ChevronRight size={18} color="#9ca3af" />}
  </TouchableOpacity>
);

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <View className="mb-8 ">
    <Text className="text-sm font-rubik-medium text-gray-500 uppercase tracking-wide mb-3 px-4">
      {title}
    </Text>
    <View className="rounded-xl bg-gray-200 overflow-hidden shadow-sm border border-gray-200">
      {children}
    </View>
  </View>
);

const Settings = () => {
  const { userProfile, refetch, logout } = useGlobalContext();
  const [isLogoutConfirm, setIsLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!isLogoutConfirm) {
      // First press - show confirmation state
      setIsLogoutConfirm(true);
      // Reset after 3 seconds if they don't confirm
      setTimeout(() => {
        setIsLogoutConfirm(false);
      }, 3000);
      return;
    }

    // Second press - proceed with logout
    setIsLoggingOut(true);
    const success = await logout();
    if (success) {
      console.log("✅ Logged out successfully");
      // Refetch to update global state
      await refetch();
      // Use replace to clear the navigation stack and redirect to sign-in with logout flag
      router.replace({
        pathname: "/(auth)/sign-in",
        params: { loggedOut: "true" }
      });
    } else {
      console.log("❌ Logout failed");
      Alert.alert("Error", "An error occurred while logging out, please try again");
      setIsLoggingOut(false);
    }
    setIsLogoutConfirm(false);
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
      >

        <SettingsSection title="Account">
          <SettingsItem
            icon={User}
            title="Edit Profile"
            subtitle="Update your profile information"
            onPress={() => router.push("/settings/editProfile")}
          />
          <SettingsItem
            icon={Bell}
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={() => {
              Alert.alert("Coming Soon", "Notification settings will be available soon");
            }}
          />
        </SettingsSection>

        {/* Privacy & Security Section */}
        <SettingsSection title="Privacy & Security">
          <SettingsItem
            icon={Shield}
            title="Privacy"
            subtitle="Control your privacy settings"
            onPress={() => {
              Alert.alert("Coming Soon", "Privacy settings will be available soon");
            }}
          />
          <SettingsItem
            icon={SettingsIcon}
            title="Account Settings"
            subtitle="Manage account preferences"
            onPress={() => {
              Alert.alert("Coming Soon", "Account settings will be available soon");
            }}
          />
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection title="Preferences">
          <SettingsItem
            icon={Moon}
            title="Dark Mode"
            subtitle="Currently not available"
            onPress={() => {
              Alert.alert("Coming Soon", "Dark mode will be available in a future update");
            }}
          />
          <SettingsItem
            icon={Globe}
            title="Language"
            subtitle="English"
            onPress={() => {
              Alert.alert("Coming Soon", "Language settings will be available soon");
            }}
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title="Support">
          <SettingsItem
            icon={HelpCircle}
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => {
              Alert.alert("Help & Support", "For support, please contact us at support@petly.com");
            }}
          />
          <SettingsItem
            icon={Info}
            title="About"
            subtitle="App version and information"
            onPress={() => {
              Alert.alert("About Petly", "Petly v1.0.0\nA focus companion app with virtual pets");
            }}
          />
        </SettingsSection>

        {/* Logout Section */}
        <SettingsSection title="">
          <SettingsItem
            icon={LogOut}
            logout={true}
            title={isLoggingOut ? "Logging Out..." : isLogoutConfirm ? "Confirm" : "Log Out"}
            onPress={handleLogout}
            showArrow={false}
            textColor={isLogoutConfirm ? "#dc2626" : "#ef4444"}
            isLoading={isLoggingOut}
          />
        </SettingsSection>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
};

export default Settings;
