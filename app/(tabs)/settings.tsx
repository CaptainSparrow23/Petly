import { ProfilePicture } from "@/components/other/ProfilePicture";
import { useGlobalContext } from "@/lib/GlobalProvider";
import type { LucideIcon } from "lucide-react-native";
import { 
  ChevronRight, 
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
import React from "react";
import { ScrollView, Text, TouchableOpacity, View, Alert } from "react-native";

interface SettingsItemProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  textColor?: string;
}

const SettingsItem = ({
  icon: Icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  textColor = "#1f2937"
}: SettingsItemProps) => (
  <TouchableOpacity
    className="flex flex-row items-center py-4 px-4 bg-gray-50"
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View className="mr-3">
      <Icon size={22} color="#6b7280" />
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

const Separator = () => (
  <View className="h-px bg-gray-200 mx-4" />
);

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection = ({ title, children }: SettingsSectionProps) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <View className="mb-8 ">
      <Text className="text-sm font-rubik-medium text-gray-500 uppercase tracking-wide mb-3 px-4">
        {title}
      </Text>
      <View className="rounded-xl bg-gray-200 overflow-hidden shadow-sm border border-gray-200">
        {childrenArray.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < childrenArray.length - 1 && <Separator />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const Settings = () => {
  const { userProfile, refetch } = useGlobalContext();

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

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
};

export default Settings;
