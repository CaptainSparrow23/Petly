import React, { useEffect } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useGlobalContext } from '@/lib/global-provider';

import ProgressRing from '@/components/focus/ProgressRing';
import PetAnimation from '@/components/focus/PetAnimation';
import {
  useFocusTimer,
  MODE_COLORS,
  MODE_LIGHT_COLORS,
  MODE_OPTIONS,
  PET_CIRCLE_SIZE,
} from '@/hooks/useFocus';

const Index = () => {
  const { loggedIn } = useLocalSearchParams();
  const { showBanner } = useGlobalContext();

  useEffect(() => {
    if (loggedIn === 'true') showBanner('Successfully logged in', 'success');
  }, [loggedIn, showBanner]);

  const {
    // state
    isRunning,
    isStopwatch,
    timerMode,
    mode,
    formattedTime,
    modePickerVisible,
    leaveConfirmVisible,
    hasPetAnimations,
    // animations
    angle,
    timerOpacity,
    timerScale,
    countdownButtonStyle,
    stopwatchButtonStyle,
    // actions
    handleTimerModePress,
    handleControlPress,
    setModePickerVisible,
    setLeaveConfirmVisible,
    handleLayout,
    panHandlers,
    setMode,
    confirmLeave,
    // pet
    catSource,
    catAnimationRef,
    catScale,
    catOffset,
    userProfile,
  } = useFocusTimer();

  return (
    <View className="flex-1 bg-white px-6">
      {/* Mode toggle */}
      <View className="absolute left-0 right-0 z-10 items-center" style={{ top: -35, pointerEvents: 'box-none' }}>
        <View className="flex-row items-center" style={{ pointerEvents: 'auto' }}>
          <Animated.View style={[countdownButtonStyle, { borderTopLeftRadius: 9999, borderBottomLeftRadius: 9999 }]}>
            <Pressable className="items-center justify-center px-4 py-3" onPress={() => handleTimerModePress('countdown')}>
              <MaterialCommunityIcons
                name={timerMode === 'countdown' ? 'timer-sand-full' : 'timer-sand-empty'}
                size={20}
                color="#fff"
              />
            </Pressable>
          </Animated.View>

          <Animated.View style={[stopwatchButtonStyle, { borderTopRightRadius: 9999, borderBottomRightRadius: 9999 }]}>
            <Pressable className="items-center justify-center px-4 py-3" onPress={() => handleTimerModePress('stopwatch')}>
              <MaterialCommunityIcons name={timerMode === 'stopwatch' ? 'timer' : 'timer-outline'} size={20} color="#fff" />
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {/* Status text */}
      <View className="absolute left-0 right-0 z-5 items-center" style={{ top: 112, pointerEvents: 'none' }}>
        <Text className="text-base font-medium text-slate-600">i will implement a route for this</Text>
      </View>

      {/* Bottom content */}
      <View className="flex-1 items-center justify-end pb-16">
        <View className="items-center justify-center">
          <View style={{ width: PET_CIRCLE_SIZE + 18 * 4, height: PET_CIRCLE_SIZE + 18 * 4 }} pointerEvents="none">
            <ProgressRing
              angle={angle}
              showProgress={timerMode === 'countdown'}
              color={MODE_COLORS[mode]}
              lightColor={MODE_LIGHT_COLORS[mode]}
            />
          </View>

          {timerMode === 'countdown' && (
            <View
              style={{ position: 'absolute', width: PET_CIRCLE_SIZE + 18 * 4, height: PET_CIRCLE_SIZE + 18 * 4 }}
              onLayout={handleLayout}
              {...panHandlers}
            >
              <View style={{ flex: 1 }} />
            </View>
          )}

          <PetAnimation
            hasPetAnimations={hasPetAnimations}
            catAnimationRef={catAnimationRef}
            catSource={catSource}
            isRunning={isRunning}
            catScale={catScale}
            catOffset={catOffset}
            userSelectedPet={userProfile?.selectedPet}
          />
        </View>

        {/* Mode pill */}
        <View className="items-center -mt-8">
          <Pressable
            className="flex-row items-center gap-2 rounded-full bg-gray-200 px-5 py-2"
            onPress={() => {
              if (!isRunning) setModePickerVisible(true);
            }}
            style={{ elevation: 2 }}
          >
            <View className="h-3 w-3 rounded-full" style={{ backgroundColor: MODE_COLORS[mode] }} />
            <Text className="font-medium">{mode}</Text>
          </Pressable>
        </View>

        {/* Time */}
        <Animated.View style={{ opacity: timerOpacity, transform: [{ scale: timerScale }] }}>
          <Text className="mt-8 mb-1 text-center font-medium text-slate-700" style={{ fontSize: 85 }}>
            {formattedTime}
          </Text>
        </Animated.View>

        {/* Start/Stop */}
        <Pressable
          className="mt-8 min-w-[180px] items-center rounded-full px-10 py-3.5 shadow-lg"
          style={{
            backgroundColor: isRunning ? '#f59e0b' : '#191d31',
            shadowColor: isRunning ? '#92400e' : '#191d31',
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
          onPress={handleControlPress}
        >
          <Text className="text-lg font-semibold text-white">
            {isRunning ? (isStopwatch ? 'Stop' : 'Leave') : 'Start'}
          </Text>
        </Pressable>
      </View>

      {/* Leave confirm */}
      <Modal transparent visible={leaveConfirmVisible} animationType="fade" onRequestClose={() => setLeaveConfirmVisible(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/40" onPress={() => setLeaveConfirmVisible(false)}>
          <Pressable className="w-72 rounded-3xl bg-white px-6 py-6 shadow-2xl" onPress={(e) => e.stopPropagation()}>
            <Text className="mb-4 text-center text-lg font-semibold text-slate-800">Are you sure?</Text>
            <Text className="mb-6 text-center text-sm text-slate-500">If you leave now your pet will be disappointed.</Text>
            <View className="flex-row justify-between gap-4">
              <Pressable className="flex-1 items-center rounded-full border border-slate-200 px-4 py-2" onPress={() => setLeaveConfirmVisible(false)}>
                <Text className="font-medium text-slate-600">Cancel</Text>
              </Pressable>
              <Pressable className="flex-1 items-center rounded-full bg-red-500 px-4 py-2 shadow" onPress={confirmLeave}>
                <Text className="font-medium text-white">Leave</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Mode picker */}
      <Modal transparent visible={modePickerVisible} animationType="fade" onRequestClose={() => setModePickerVisible(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/40" onPress={() => setModePickerVisible(false)}>
          <Pressable className="w-72 rounded-3xl bg-white px-5 py-5 shadow-2xl" onPress={(e) => e.stopPropagation()}>
            <Text className="mb-3 text-center text-base font-semibold text-slate-700">Select Mode</Text>
            <FlatList
              data={MODE_OPTIONS}
              keyExtractor={(item) => item}
              numColumns={2}
              columnWrapperStyle={{ gap: 10, marginBottom: 10 }}
              renderItem={({ item }) => (
                <Pressable
                  className={`items-center rounded-2xl border ${
                    mode === item ? 'border-blue-400 bg-blue-50' : 'border-slate-200'
                  }`}
                  style={{ flex: 1, paddingVertical: 18 }}
                  onPress={() => {
                    setMode(item);
                    setModePickerVisible(false);
                  }}
                >
                  <View className="mb-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MODE_COLORS[item] }} />
                  <Text className="text-sm font-medium text-slate-700">{item}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default Index;
