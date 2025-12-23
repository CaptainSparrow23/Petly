import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Pressable, Text, View, FlatList, Image, TouchableOpacity, Dimensions, Platform } from "react-native";
import Constants from "expo-constants";
import { Edit, HandPlatterIcon, Hourglass, PenLine } from "lucide-react-native";
import SmoothPicker from "react-native-smooth-picker";
import { Picker } from "@react-native-picker/picker";
import * as Haptics from "expo-haptics";
import ActionSheet, {
  SheetProps,
  registerSheet,
  useSheetRef,
  SheetDefinition,
} from "react-native-actions-sheet";
import { CoralPalette } from "@/constants/colors";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { useStoreCatalog } from "@/hooks/useStore";
import images from "@/constants/images";
import CreateTagModal from "./CreateTagModal";
import RemoveTagModal from "./RemoveTagModal";
import { X } from "lucide-react-native";


interface Tag {
  id: string;
  label: string;
  color: string;
  activity: string; // The activity name (same as label for custom tags)
}

type TagSelectionPayload = {
  currentActivity: string; // The tag label (e.g., "Focus", "Work", "Study", "Rest")
  currentTimerValue: string; // Formatted timer like "20:00"
  currentTimerSeconds: number; // Current timer in seconds
  onSelect: (activity: string) => void; // Passes the tag label
  onTimeChange: (seconds: number) => void;
  onStart: () => void;
  onClosed?: () => void;
};


interface TimeSliderProps {
  currentSeconds: number;
  onTimeChange?: (seconds: number) => void;
  minMinutes: number;
  maxMinutes: number;
  stepMinutes: number;
}



const TagSelectionSheet = ({
  sheetId,
  payload,
}: SheetProps<"tag-selection">) => {
  const sheetRef = useSheetRef(sheetId);
  const { userProfile, updateUserProfile, showBanner, appSettings } = useGlobalContext();
  const [isUpdatingGadget, setIsUpdatingGadget] = useState(false);
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);
  const [isPlusButtonPressed, setIsPlusButtonPressed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showRemoveTagModal, setShowRemoveTagModal] = useState(false);
  const [tagToRemove, setTagToRemove] = useState<Tag | null>(null);

  const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

  // Generate time options (5 to 120 minutes, or up to 180 if extendSessionLimit is enabled)
  const maxMinutes = appSettings?.extendSessionLimit ? 180 : 120;
  const timeOptions = useMemo(() => {
    const options: number[] = [];
    for (let i = 5; i <= maxMinutes; i += 5) {
      options.push(i);
    }
    return options;
  }, [maxMinutes]);

  // Get current selected time in minutes
  const currentMinutes = useMemo(() => {
    const seconds = payload?.currentTimerSeconds ?? 20 * 60;
    return Math.floor(seconds / 60);
  }, [payload?.currentTimerSeconds]);

  // Find closest time option to current time (for initial value)
  const initialTimeOption = useMemo(() => {
    const closest = timeOptions.reduce((prev, curr) =>
      Math.abs(curr - currentMinutes) < Math.abs(prev - currentMinutes) ? curr : prev
    );
    return closest;
  }, [timeOptions, currentMinutes]);

  // Use local state for selected time option so it doesn't snap back
  const [selectedTimeOption, setSelectedTimeOption] = useState(initialTimeOption);

  // Update local state when initial value changes (e.g., when sheet reopens)
  useEffect(() => {
    setSelectedTimeOption(initialTimeOption);
  }, [initialTimeOption]);

  // Format selected time for display (MM:SS)
  const displayTime = useMemo(() => {
    const totalMinutes = selectedTimeOption;
    const minutes = Math.floor(totalMinutes);
    const seconds = 0; // Always show :00 for picker
    const mm = minutes.toString().padStart(2, "0");
    const ss = seconds.toString().padStart(2, "0");
    return `${mm}:${ss}`;
  }, [selectedTimeOption]);

  // Get tags from userProfile, fallback to defaults
  const availableTags: Tag[] = useMemo(() => {
    if (userProfile?.tagList && Array.isArray(userProfile.tagList) && userProfile.tagList.length > 0) {
      return userProfile.tagList.map((tag: any) => ({
        id: tag.id,
        label: tag.label,
        color: tag.color,
        activity: tag.activity || tag.label, // Fallback to label if activity is missing
      }));
    }
    // Default tags
    return [
      { id: "focus", label: "Focus", color: CoralPalette.primary, activity: "Focus" },
      { id: "rest", label: "Rest", color: "#9AA587", activity: "Rest" },
      { id: "work", label: "Work", color: CoralPalette.green, activity: "Work" },
      { id: "study", label: "Study", color: CoralPalette.blue, activity: "Study" },
    ];
  }, [userProfile?.tagList]);

  const { catalog } = useStoreCatalog(
    userProfile
      ? {
          ownedGadgets: userProfile.ownedGadgets,
        }
      : null
  );

  // Filter for owned gadgets only
  const ownedGadgets = useMemo(() => {
    if (!userProfile?.ownedGadgets) return [];
    return catalog.filter(
      (item) =>
        item.category === "Gadget" &&
        userProfile.ownedGadgets.includes(item.id)
    );
  }, [catalog, userProfile?.ownedGadgets]);

  const handleSelectGadget = useCallback(
    async (gadgetId: string) => {
      if (isUpdatingGadget || gadgetId === userProfile?.selectedGadget) return;

      if (!userProfile?.userId || !API_BASE_URL) {
        showBanner("Unable to update gadget. Please try again.", "error");
        return;
      }

      setIsUpdatingGadget(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/pets/update_accessories/${userProfile.userId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              selectedGadget: gadgetId,
            }),
          }
        );
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to update gadget");
        }

        updateUserProfile({ selectedGadget: gadgetId });
      } catch (error) {
        console.error("Failed to update gadget:", error);
        showBanner("Could not update gadget. Please try again.", "error");
      } finally {
        setIsUpdatingGadget(false);
      }
    },
    [
      userProfile?.userId,
      userProfile?.selectedGadget,
      isUpdatingGadget,
      updateUserProfile,
      showBanner,
    ]
  );

  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Update local state when payload changes - find tag by label or use saved selectedTag
  useEffect(() => {
    if (availableTags.length > 0) {
      // First, try to use saved selectedTag from user profile
      if (userProfile?.selectedTag) {
        const savedTag = availableTags.find(tag => tag.id === userProfile.selectedTag);
        if (savedTag) {
          setSelectedTagId(savedTag.id);
          return;
        }
      }
      
      // Otherwise, try to match by current activity label
      if (payload?.currentActivity) {
        const matchingTag = availableTags.find(tag => tag.label === payload.currentActivity);
        if (matchingTag) {
          setSelectedTagId(matchingTag.id);
          return;
        }
      }
      
      // Fallback to first tag
      if (!selectedTagId) {
        setSelectedTagId(availableTags[0].id);
      }
    }
  }, [payload?.currentActivity, availableTags, userProfile?.selectedTag]);

  const handleSelect = useCallback(
    async (tag: Tag) => {
      setSelectedTagId(tag.id);
      // Pass the tag's label as the activity name
      payload?.onSelect(tag.label);
      
      // Save selected tag to user profile
      if (userProfile?.userId && tag.id !== userProfile?.selectedTag) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/pets/update_accessories/${userProfile.userId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                selectedTag: tag.id,
              }),
            }
          );
          const json = await res.json();
          if (res.ok && json?.success) {
            updateUserProfile({ selectedTag: tag.id });
          }
        } catch (error) {
          console.error("Failed to update selected tag:", error);
          showBanner("Could not update tag. Please try again.", "error");
        
        }
      }
      // Don't close on tag select, only on start
    },
    [payload, userProfile?.userId, userProfile?.selectedTag, API_BASE_URL, updateUserProfile]
  );

  const handleStart = useCallback(() => {
    payload?.onStart();
    void sheetRef.current?.hide();
  }, [payload, sheetRef]);

  const handleRemoveTag = useCallback(
    async () => {
      if (!tagToRemove || !userProfile?.userId || !API_BASE_URL) {
        return;
      }

      setIsUpdatingTags(true);
      try {
        // Remove the tag from the list
        const updatedTags = availableTags.filter(tag => tag.id !== tagToRemove.id);

        // If the removed tag was selected, select the first remaining tag
        if (selectedTagId === tagToRemove.id && updatedTags.length > 0) {
          const newSelectedTag = updatedTags[0];
          setSelectedTagId(newSelectedTag.id);
          payload?.onSelect(newSelectedTag.label);
          
          // Update selected tag in profile
          try {
            const tagRes = await fetch(
              `${API_BASE_URL}/api/pets/update_accessories/${userProfile.userId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  selectedTag: newSelectedTag.id,
                }),
              }
            );
            const tagJson = await tagRes.json();
            if (tagRes.ok && tagJson?.success) {
              updateUserProfile({ selectedTag: newSelectedTag.id });
            }
          } catch (error) {
            console.error("Failed to update selected tag:", error);
          }
        } else if (selectedTagId === tagToRemove.id) {
          // No tags left, clear selection
          setSelectedTagId(null);
          updateUserProfile({ selectedTag: null });
        }

        // Update tag list in backend
        const res = await fetch(`${API_BASE_URL}/api/user/tags/${userProfile.userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tagList: updatedTags,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to remove tag");
        }

        updateUserProfile({ 
          tagList: updatedTags.map(tag => ({
            id: tag.id,
            label: tag.label,
            color: tag.color,
            activity: tag.activity,
          }))
        });

        showBanner("Tag removed successfully", "success");
        setShowRemoveTagModal(false);
        setTagToRemove(null);
        setIsEditMode(false);
      } catch (error) {
        console.error("Failed to remove tag:", error);
        showBanner("Could not remove tag. Please try again.", "error");
      } finally {
        setIsUpdatingTags(false);
      }
    },
    [tagToRemove, userProfile?.userId, API_BASE_URL, availableTags, selectedTagId, payload, updateUserProfile, showBanner]
  );

  const MAX_TAGS = 5;

  const handleCreateTag = useCallback(
    async (tagName: string, color: string) => {
      if (!userProfile?.userId || !API_BASE_URL) {
        showBanner("Unable to create tag. Please try again.", "error");
        return;
      }

      if (availableTags.length >= MAX_TAGS) {
        showBanner(`Maximum of ${MAX_TAGS} tags allowed.`, "error");
        return;
      }

      setIsUpdatingTags(true);
      try {
        // Generate unique ID for new tag
        const newTagId = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newTag: Tag = {
          id: newTagId,
          label: tagName,
          color: color,
          activity: tagName, // Set activity to the tag's label so each tag represents a different activity
        };

        const updatedTags: Tag[] = [...availableTags, newTag];

        const res = await fetch(`${API_BASE_URL}/api/user/tags/${userProfile.userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tagList: updatedTags,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to create tag");
        }

        updateUserProfile({ 
          tagList: updatedTags.map(tag => ({
            id: tag.id,
            label: tag.label,
            color: tag.color,
            activity: tag.activity,
          }))
        });
        
        // Auto-select the newly created tag
        setSelectedTagId(newTagId);
        payload?.onSelect(newTag.label);
        
        // Save selected tag to profile
        try {
          const tagRes = await fetch(
            `${API_BASE_URL}/api/pets/update_accessories/${userProfile.userId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                selectedTag: newTagId,
              }),
            }
          );
          const tagJson = await tagRes.json();
          if (tagRes.ok && tagJson?.success) {
            updateUserProfile({ selectedTag: newTagId });
          }
        } catch (error) {
          console.error("Failed to save selected tag:", error);
        }
        
        showBanner("Tag created successfully", "success");
      } catch (error) {
        console.error("Failed to create tag:", error);
        showBanner("Could not create tag. Please try again.", "error");
      } finally {
        setIsUpdatingTags(false);
      }
    },
    [userProfile?.userId, API_BASE_URL, availableTags, updateUserProfile, showBanner, payload, setSelectedTagId]
  );

  const selectedTag = useMemo(() => {
    if (selectedTagId) {
      return availableTags.find((tag) => tag.id === selectedTagId);
    }
    // Fallback to first tag
    return availableTags[0] || null;
  }, [availableTags, selectedTagId]);

  return (
    <ActionSheet
      id={sheetId}
      ref={sheetRef}
      gestureEnabled={false}
      closeOnPressBack
      onClose={payload?.onClosed}
      indicatorStyle={{ width: 48, backgroundColor: "#e5e7eb" }}
      containerStyle={{ 
        backgroundColor: CoralPalette.primaryMuted,
      }}
      safeAreaInsets={{ top: 0, left: 0, right: 0, bottom: 0}}
    >
      <View style={{ width: "100%" }}>
        {/* Fake indicator/drag handle */}
        <View
          style={{
            width: "100%",
            alignItems: "center",
            paddingTop: 8,
            paddingBottom: 0,
          }}
        >
          <View
            style={{
              width: 50,
              height: 6,
              borderRadius: 2,
              backgroundColor: CoralPalette.white,
              opacity: 0.4,
            }}
          />
        </View>

        <View 
        style={{ 
          width: "100%", 
          paddingHorizontal: 15,
          marginTop: 20,
          paddingTop: 15,
          paddingBottom: 20,
      


          minHeight: 200,
          backgroundColor: CoralPalette.white, // Reserve space to prevent layout shift
        }}
      >
        <View className="w-full flex-row items-center justify-between mb-3" style={{ paddingLeft: 8 }}>
          <Text
            className="text-lg font-semibold"
            style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}
          >
            Tag
          </Text>
          <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)}>
            {isEditMode ? (
              <X size={20} color={CoralPalette.mutedDark} />
            ) : (
              <PenLine size={18} color={CoralPalette.mutedDark} />
            )}
          </TouchableOpacity>
        </View>

        <FlatList
          data={availableTags}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 15, paddingLeft: 8, paddingRight: 8, paddingTop: 6 }}
          initialNumToRender={availableTags.length}
          removeClippedSubviews={false}
          ListHeaderComponent={
            availableTags.length >= MAX_TAGS ? null : (
              <Pressable
                onPress={() => setShowCreateTagModal(true)}
                onPressIn={() => setIsPlusButtonPressed(true)}
                onPressOut={() => setIsPlusButtonPressed(false)}
                className="flex-row items-center justify-center rounded-lg"
                style={{
                  backgroundColor: isPlusButtonPressed ? CoralPalette.greyLight : CoralPalette.white,
                  borderWidth: 1,
                  borderColor: CoralPalette.greyLight,
                  minWidth: 35,
                  width: 35,
                  minHeight: 35,
                  height: 35,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  className="text-2xl font-medium"
                  style={{
                    color: CoralPalette.dark,
                    fontFamily: "Nunito",
                  }}
                >
                  +
                </Text>
              </Pressable>
            )
          }
          renderItem={({ item }) => {
              const isSelected = selectedTagId === item.id;
              return (
                <View style={{ position: "relative" }}>
                  <Pressable
                    onPress={() => {
                      if (isEditMode) {
                        setTagToRemove(item);
                        setShowRemoveTagModal(true);
                      } else {
                        handleSelect(item);
                      }
                    }}
                    className="flex-row items-center justify-center gap-2 py-1 px-1 rounded-lg"
                    style={{
                      backgroundColor: isSelected
                        ? CoralPalette.greyLight
                        : CoralPalette.white,
                      minWidth: 90,
                      width: 90,
                      minHeight: 35,
                      borderWidth: 1,
                      borderColor: CoralPalette.greyLight,
                      height: 35,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <Text
                      className="text-base font-medium"
                      style={{
                        color: CoralPalette.dark,
                        fontFamily: "Nunito",
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                  {isEditMode && (
                    <TouchableOpacity
                      onPress={() => {
                        setTagToRemove(item);
                        setShowRemoveTagModal(true);
                      }}
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: CoralPalette.grey,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <X size={14} color={CoralPalette.white} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />

        {/* Focus Time Section */}
        <View className="w-full items-start mt-5" style={{ paddingLeft: 8 }}>
          <Text
            className="text-lg font-semibold"
            style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}
          >
            Focused Time
          </Text>
          <View
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: CoralPalette.white,
              width: "100%",
            }}
          >
            <Picker
              selectedValue={selectedTimeOption}
              onValueChange={(itemValue: number) => {
                setSelectedTimeOption(itemValue);
                if (appSettings?.vibrations) {
                  void Haptics.selectionAsync().catch(() => {});
                }
                if (payload?.onTimeChange) {
                  payload.onTimeChange(itemValue * 60);
                }
              }}
              style={{
                color: CoralPalette.dark,
                width: "100%",
              }}
              itemStyle={
                Platform.OS === "ios"
                  ? {
                      height: 120,
                      color: CoralPalette.dark,
                      fontFamily: "Nunito",
                    }
                  : {
                      color: CoralPalette.dark,
                      fontFamily: "Nunito",
                    }
              }
            >
              {timeOptions.map((minutes) => (
                <Picker.Item
                  key={minutes}
                  label={`${minutes} min`}
                  value={minutes}
                  color={CoralPalette.dark}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View className="w-full items-start mb-2 -mt-4" style={{ paddingLeft: 8 }}>
          <Text
            className="text-lg font-semibold"
            style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}
          >
            Item
          </Text>
        </View>

        <View style={{ minHeight: 80}}> 
          <FlatList
            data={ownedGadgets}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ width: "100%", gap: 12, paddingLeft: 8 }}
            initialNumToRender={ownedGadgets.length}
            removeClippedSubviews={false}
            renderItem={({ item }) => {
              const isSelected = item.id === userProfile?.selectedGadget;
              return (
                <Pressable
                  onPress={() => handleSelectGadget(item.id)}
                  disabled={isUpdatingGadget}
                  className="items-center justify-center rounded-xl p-3"
                  style={{
                    backgroundColor: isSelected
                      ? CoralPalette.greyLighter
                      : CoralPalette.white,
                    minWidth: 80,
                    opacity: 1,
                    borderWidth: 1,
                    borderColor: CoralPalette.greyLight,
                  }}
                >
                  <Image
                    source={
                      images[item.id as keyof typeof images] ?? images.lighting
                    }
                    resizeMode="contain"
                    style={{ width: 50, height: 50, marginBottom: 2 }}
                  />
                </Pressable>
              );
            }}
          ListEmptyComponent={
            <Text
              className="text-sm text-center py-4"
              style={{
                color: CoralPalette.mutedDark,
                fontFamily: "Nunito",
              }}
            >
              No gadgets owned
            </Text>
          }
          />
        </View>
        </View>

        {/* Bottom Start Section */}
      <View
        style={{
          width: "100%",
          height: 120,
          paddingHorizontal: 30,
          paddingTop: 30,

          paddingBottom: 50,
     

       
          backgroundColor: CoralPalette.surfaceAlt,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 0,
        }}
      >
        {/* Left: Selected Pet Image */}
        <View
          style={{
            width: 75,
            height:  75,
            borderRadius: 99,
            backgroundColor: CoralPalette.white,
            borderWidth: 3,
            borderColor: CoralPalette.primaryMuted,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {userProfile?.selectedPet ? (
            <Image
              source={
                images[userProfile?.selectedPet as keyof typeof images] ??
                images.lighting
              }
              resizeMode="contain"
              style={{ width: 45, height: 45 }}
            />
          ) : null}
        </View>

        {/* Center: Timer and Tag */}
        <View style={{ flex: 1, marginLeft: 12, alignItems: "flex-start" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Hourglass size={16} color={CoralPalette.mutedDark} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: CoralPalette.dark,
                fontFamily: "Nunito",
              }}
            >
              {displayTime}
            </Text>
          </View>
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 4, marginLeft: 4 }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: selectedTag?.color || CoralPalette.primary,
                marginRight: 8,
              }}
            />
            <Text
              style={{
                fontSize: 14,
                color: CoralPalette.mutedDark,
                fontFamily: "Nunito",
              }}
            >
              {selectedTag?.label || "Focus"}
            </Text>
          </View>
        </View>

        {/* Right: Start Button */}
        <TouchableOpacity
          onPress={handleStart}
          style={{
            backgroundColor: CoralPalette.primary,
            paddingHorizontal: 24,
            paddingVertical: 5,
            borderRadius: 12,
            minHeight: 40,
            
            minWidth: 100,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: CoralPalette.primaryDark,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 1,
            elevation: 0,
          }}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: CoralPalette.white,
              fontFamily: "Nunito",
            }}
          >
            Start
          </Text>
        </TouchableOpacity>
        </View>

        <CreateTagModal
          visible={showCreateTagModal}
          onClose={() => setShowCreateTagModal(false)}
          onCreate={handleCreateTag}
        />
        <RemoveTagModal
          visible={showRemoveTagModal}
          onClose={() => {
            setShowRemoveTagModal(false);
            setTagToRemove(null);
          }}
          onConfirm={handleRemoveTag}
          tagName={tagToRemove?.label || ""}
        />
      </View>
    </ActionSheet>
  );
};

registerSheet("tag-selection", TagSelectionSheet);

// Extend the library's sheet registry with our payload types.
declare module "react-native-actions-sheet" {
  interface Sheets {
    "tag-selection": SheetDefinition<{ payload: TagSelectionPayload }>;
  }
}

export {};
