import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

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
    } catch (e) {
      Alert.alert('Error', 'Failed to update goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <View className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
        <View className="flex-row justify-between">
          <Text className="text-m text-gray-700">Goals</Text>
          <TouchableOpacity onPress={handleEditPress}>
            <Text className="text-sm p-2 bg-white border border-gray-200 text-black-300 rounded-xl">
              Edit Goals
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-700">Daily focus goal</Text>
            <Text className="text-sm text-gray-600">{dailyGoal} mins</Text>
          </View>
          <View className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <View className="h-full rounded-full" style={{ width: `${dailyProgress}%`, backgroundColor: '#191d31' }} />
          </View>
          <Text className="mt-2 text-xs text-gray-600">{dailyProgress}% complete</Text>
        </View>

        <View className="mt-5">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-700">Weekly focus goal</Text>
            <Text className="text-sm text-gray-600">{weeklyGoal} mins</Text>
          </View>
          <View className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <View className="h-full rounded-full" style={{ width: `${weeklyProgress}%`, backgroundColor: '#191d31' }} />
          </View>
          <Text className="mt-2 text-xs text-gray-600">{weeklyProgress}% complete</Text>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => !saving && setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-3xl p-6 w-[85%] max-w-md">
            <Text className="text-xl font-rubik-bold text-gray-900 mb-6">Edit Goals</Text>

            {/* Daily wheel */}
            <View className="mb-6">
              <Text className="text-sm text-gray-700 mb-2">Daily Focus Goal</Text>
              <View className="border border-gray-300 rounded-2xl overflow-hidden">
                <Picker
                  enabled={!saving}
                  selectedValue={dailySelected}
                  onValueChange={(v) => setDailySelected(v)}
                  itemStyle={Platform.select({ ios: { height: 180 } })}
                >
                  {dailyOptions.map((m) => (
                    <Picker.Item key={m} label={`${m} mins`} value={m} />
                  ))}
                </Picker>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm text-gray-700 mb-2">Weekly Focus Goal</Text>
              <View className="border border-gray-300 rounded-2xl overflow-hidden">
                <Picker
                  enabled={!saving}
                  selectedValue={weeklySelected}
                  onValueChange={(v) => setWeeklySelected(v)}
                  itemStyle={Platform.select({ ios: { height: 180 } })}
                >
                  {weeklyOptions.map((m) => (
                    <Picker.Item key={m} label={`${m} mins`} value={m} />
                  ))}
                </Picker>
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-xl py-3 items-center"
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text className="text-base font-rubik-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 rounded-xl py-3 items-center"
                style={{ backgroundColor: '#191d31' }}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="white" /> : <Text className="text-base font-rubik-medium text-white">Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
