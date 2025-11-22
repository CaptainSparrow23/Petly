import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";

const FONT = { fontFamily: "Nunito" };

interface GoalsCardProps {
  todayTotalMinutes?: number;
  currentWeekTotal?: number;
  dailyGoal?: number;
  weeklyGoal?: number;
  onUpdateGoals?: (dailyGoalMinutes: number, weeklyGoalMinutes: number) => Promise<boolean>;
}

export default function GoalsCard({
  todayTotalMinutes = 0,
  currentWeekTotal = 0,
  dailyGoal = 120,
  weeklyGoal = 600,
  onUpdateGoals,
}: GoalsCardProps) {
  const { appSettings } = useGlobalContext();
  const showHours = appSettings.displayFocusInHours;
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // picker values (you can tweak these ranges/steps)
  const dailyOptions = useMemo(() => {
    const arr: number[] = [];
    for (let m = 15; m <= 240; m += 15) arr.push(m);
    return arr;
  }, []);
  const weeklyOptions = useMemo(() => {
    const arr: number[] = [];
    for (let m = 60; m <= 1800; m += 30) arr.push(m); // up to 30h in mins
    return arr;
  }, []);

  const [dailySelected, setDailySelected] = useState(dailyGoal);
  const [weeklySelected, setWeeklySelected] = useState(weeklyGoal);

  const todayMinutes = todayTotalMinutes;

  const dailyProgress = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));
  const weeklyProgress = Math.min(100, Math.round((currentWeekTotal / weeklyGoal) * 100));

  const formatMinutesLabel = (minutes: number) => {
    if (!showHours) return `${minutes} mins`;
    const hours = minutes / 60;
    if (hours >= 10) return `${hours.toFixed(0)} hrs`;
    return `${hours.toFixed(1)} hrs`;
  };

  const handleEditPress = () => {
    setDailySelected(dailyGoal);
    setWeeklySelected(weeklyGoal);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const daily = Number(dailySelected);
    const weekly = Number(weeklySelected);

    if (!daily || daily <= 0) {
      Alert.alert('Invalid Input', 'Please choose a valid daily goal.');
      return;
    }
    if (!weekly || weekly <= 0) {
      Alert.alert('Invalid Input', 'Please choose a valid weekly goal.');
      return;
    }
    if (!onUpdateGoals) return;

    setSaving(true);
    try {
      await onUpdateGoals(daily, weekly);
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to update goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderProgress = (
    label: string,
    targetLabel: string,
    progressPercent: number,
    accent: string
  ) => (
    <View className="mt-6">
      <View className="flex-row justify-between items-center">
        <Text style={[{ color: CoralPalette.mutedDark }, FONT]}>{label}</Text>
        <Text style={[{ color: CoralPalette.dark, fontWeight: "600" }, FONT]}>{targetLabel}</Text>
      </View>
      <View
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: `${CoralPalette.border}55` }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${progressPercent}%`, backgroundColor: accent }}
        />
      </View>
      <Text className="mt-2 text-xs" style={[{ color: CoralPalette.mutedDark }, FONT]}>
        {progressPercent}% complete
      </Text>
    </View>
  );

  return (
    <>
      <View
        className="rounded-3xl p-5 mt-2"
        style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
      >
        <View className="flex-row justify-between items-center">
          <Text style={[{ color: CoralPalette.dark, fontSize: 16, fontWeight: "700" }, FONT]}>Goals</Text>
          <TouchableOpacity
            onPress={handleEditPress}
                        className="rounded-full px-3 py-1"
                        style={{ backgroundColor: `${CoralPalette.primaryLight}55` }}
                        activeOpacity={0.85}
          >
            <Text className="text-sm font-medium" style={[{ color: CoralPalette.primary }, FONT]}>
              Edit Goals
            </Text>
          </TouchableOpacity>
        </View>

        {renderProgress("Daily focus goal", formatMinutesLabel(dailyGoal), dailyProgress, CoralPalette.primary)}
        {renderProgress("Weekly focus goal", formatMinutesLabel(weeklyGoal), weeklyProgress, CoralPalette.primaryMuted)}
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => !saving && setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View
            className="rounded-3xl p-6 w-[85%] max-w-md"
            style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
          >
            <Text className="text-xl font-bold mb-6" style={[{ color: CoralPalette.dark }, FONT]}>
              Edit Goals
            </Text>

            {/* Daily wheel */}
            <View className="mb-6">
              <Text className="text-sm mb-2" style={[{ color: CoralPalette.mutedDark }, FONT]}>
                Daily Focus Goal
              </Text>
              <View
                className="rounded-2xl overflow-hidden"
                style={{ borderColor: CoralPalette.border, borderWidth: 1 }}
              >
                <Picker
                  enabled={!saving}
                  selectedValue={dailySelected}
                  onValueChange={(v) => setDailySelected(v)}
                  style={{ color: CoralPalette.dark }}
                  itemStyle={Platform.select({
                    ios: { height: 180, color: CoralPalette.dark, fontFamily: "Nunito" },
                  })}
                >
                  {dailyOptions.map((m) => (
                    <Picker.Item key={m} label={`${m} mins`} value={m} color={CoralPalette.dark} />
                  ))}
                </Picker>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm mb-2" style={[{ color: CoralPalette.mutedDark }, FONT]}>
                Weekly Focus Goal
              </Text>
              <View
                className="rounded-2xl overflow-hidden"
                style={{ borderColor: CoralPalette.border, borderWidth: 1 }}
              >
                <Picker
                  enabled={!saving}
                  selectedValue={weeklySelected}
                  onValueChange={(v) => setWeeklySelected(v)}
                  style={{ color: CoralPalette.dark }}
                  itemStyle={Platform.select({
                    ios: { height: 180, color: CoralPalette.dark, fontFamily: "Nunito" },
                  })}
                >
                  {weeklyOptions.map((m) => (
                    <Picker.Item key={m} label={`${m} mins`} value={m} color={CoralPalette.dark} />
                  ))}
                </Picker>
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-xl py-3 items-center"
                style={{ backgroundColor: `${CoralPalette.border}55` }}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text className="text-base font-medium" style={[{ color: CoralPalette.mutedDark }, FONT]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 rounded-xl py-3 items-center"
                style={{ backgroundColor: CoralPalette.primary }}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-medium text-white" style={FONT}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
