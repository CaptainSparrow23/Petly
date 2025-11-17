import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  AppState,
  AppStateStatus,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { Timer, Hourglass } from "lucide-react-native";
import ModePickerModal from "../../components/focus/ModePickerModal";
import ConfirmStopModal from "../../components/focus/ConfirmStopModal";
import TimeTracker from "../../components/focus/TimeTracker";
import PetAnimation from "../../components/focus/PetAnimation";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { useLocalSearchParams, useNavigation } from "expo-router";
import CoinBadge from "@/components/other/CoinBadge";
import { useSessionUploader } from "@/hooks/useFocus";
import { getPetAnimation } from "@/constants/animations";

/**
 * Focus & Rest dashboard. Handles timer/countdown modes, session tracking, and
 * UI transitions into fullscreen when a focus session is running. All timer math,
 * upload logic, and feedback banners live here.
 */
export default function IndexScreen() {
  // UI mode/timer state
  const [mode, setMode] = useState<"timer" | "countdown">("countdown");
  const [activity, setActivity] = useState<"Focus" | "Rest">("Focus");
  const [pickerOpen, setPickerOpen] = useState(false);

  const TWO_HOUR_SECONDS = 2 * 60 * 60;
  const INITIAL_COUNTDOWN_SECONDS = 20 * 60;

  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_COUNTDOWN_SECONDS);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [lastCountdownTargetSec, setLastCountdownTargetSec] = useState(INITIAL_COUNTDOWN_SECONDS);

  const { loggedIn } = useLocalSearchParams();
  const { showBanner, userProfile, refetchUserProfile } = useGlobalContext();
  const navigation = useNavigation();

  // Tracker drag state for previewing countdown adjustments
  const [dragging, setDragging] = useState(false);
  const [previewP, setPreviewP] = useState<number | null>(null);

  const { upload } = useSessionUploader();
  const sessionStartMsRef = useRef<number | null>(null);

  // We keep pointer refs so uploads always use the last persisted time
  const lastLeftRef = useRef(secondsLeft);
  const lastElapsedRef = useRef(secondsElapsed);
  useEffect(() => { lastLeftRef.current = secondsLeft; }, [secondsLeft]);
  useEffect(() => { lastElapsedRef.current = secondsElapsed; }, [secondsElapsed]);

  useEffect(() => {
    if (loggedIn === "true") showBanner("Successfully logged in", "success");
  }, [loggedIn, showBanner]);

  const progress =
    mode === "countdown" ? secondsLeft / TWO_HOUR_SECONDS : secondsElapsed / TWO_HOUR_SECONDS;

  const clearTicker = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  // Fullscreen controls what hides and what nudges
  const isFullscreen = running;

  // Simple animation driver
  const focusAnim = useRef(new Animated.Value(0)).current;
  const topFade = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const topSlideY = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -24] });
  const contentTranslateY = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] });
  const idleTrackerOpacity = useRef(new Animated.Value(1)).current;
  const activeTrackerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions?.({ headerShown: !isFullscreen });
    Animated.timing(focusAnim, {
      toValue: isFullscreen ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isFullscreen, navigation, focusAnim]);


  useEffect(() => {
    const duration = 300;
    const animation = Animated.parallel([
      Animated.timing(idleTrackerOpacity, {
        toValue: running ? 0 : 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(activeTrackerOpacity, {
        toValue: running ? 1 : 0,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [running, idleTrackerOpacity, activeTrackerOpacity]);

  /**
   * Stops a session, posts it to the backend, and resets the UI.
   * Handles all exit reasons (timer done, manual stop, background, etc.).
   */
  const fullyStopAndReset = async (
    reason?: "timer-max" | "countdown-zero" | "manual" | "app-closed"
  ) => {
    const end = new Date();
    const elapsedSec =
      mode === "timer"
        ? Math.max(0, lastElapsedRef.current)
        : Math.max(0, lastCountdownTargetSec - lastLeftRef.current);
    const startMs = sessionStartMsRef.current ?? end.getTime() - elapsedSec * 1000;

    if (elapsedSec > 0 && userProfile?.userId) {
      await upload({
        userId: String(userProfile.userId),
        activity,
        startTs: new Date(startMs).toISOString(),
        durationSec: Math.floor(elapsedSec),
      })
        .then(() => refetchUserProfile().catch(() => {}))
        .catch(() => {});
    }

    clearTicker();
    setRunning(false);
    if (mode === "countdown") setSecondsLeft(lastCountdownTargetSec);
    else setSecondsElapsed(0);
    sessionStartMsRef.current = null;

    if (reason === "timer-max") showBanner("Timer reached 2:00:00 — session ended.", "success");
    else if (reason === "countdown-zero") showBanner("Countdown finished — session ended.", "success");
    else if (reason === "manual") showBanner("Session stopped.", "info");
    else if (reason === "app-closed") showBanner("Session saved on app close.", "info");
  };

  /**
   * Ensures a session can only start with a valid countdown value.
   */
  const handleStart = () => {
    if (mode === "countdown" && secondsLeft <= 0) {
      showBanner("Set a countdown above 0:00 to start.", "warning");
      return;
    }
    setRunning(true);
    if (!sessionStartMsRef.current) sessionStartMsRef.current = Date.now();
  };

  /**
   * Central start/stop handler, wired to both Start button and confirmation modals.
   */
  const handleStartStop = () => {
    if (running) setStopModalOpen(true);
    else handleStart();
  };

  // Main timer ticker: updates either the countdown or stopwatch every second
  useEffect(() => {
    clearTicker();
    if (!running) return;

    if (mode === "countdown") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            void fullyStopAndReset("countdown-zero");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      intervalRef.current = setInterval(() => {
        setSecondsElapsed((prev) => {
          if (prev >= TWO_HOUR_SECONDS) {
            void fullyStopAndReset("timer-max");
            return TWO_HOUR_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return clearTicker;
  }, [running, mode, lastCountdownTargetSec]);

  // Whenever timer vs countdown switches, stop everything and reset displayed time
  useEffect(() => {
    clearTicker();
    setRunning(false);
    if (mode === "countdown") setSecondsLeft(lastCountdownTargetSec);
    else setSecondsElapsed(0);
  }, [mode, lastCountdownTargetSec]);

  // If the app backgrounds during a run, we automatically close and upload the session
  useEffect(() => {
    const onState = (s: AppStateStatus) => {
      if (running && (s === "background" || s === "inactive")) {
        void fullyStopAndReset("app-closed");
      }
    };
    const sub = AppState.addEventListener("change", onState);
    return () => sub.remove();
  }, [running]);

  // Countdown scrubber helpers
  const handleTrackerChange = (p: number) => {
    if (!running && mode === "countdown") {
      const SNAP_S = 300;
      const raw = p * TWO_HOUR_SECONDS;
      const next = Math.round(raw / SNAP_S) * SNAP_S;
      setSecondsLeft(next);
      setLastCountdownTargetSec(next);
    }
  };
  const handleDragStateChange = (dragState: boolean) => {
    setDragging(dragState);
  };
  const handlePreviewProgress = (p: number) => {
    setPreviewP(p);
  };

  // Derived display values for the digital clock
  const secondsToShow = mode === "countdown" ? secondsLeft : secondsElapsed;
  const displaySeconds = useMemo(() => {
    if (dragging && previewP != null) {
      const TWO_HOUR_SECONDS = 2 * 60 * 60;
      return Math.round(previewP * TWO_HOUR_SECONDS);
    }
    return secondsToShow;
  }, [dragging, previewP, secondsToShow]);

  const totalMinutes = Math.floor(displaySeconds / 60);
  const seconds = Math.floor(displaySeconds % 60);
  const mm = totalMinutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");

  const isRest = activity === "Rest";
  const trackColor = isRest ? "#8b5cf6" : "#3b82f6";
  const trackBgColor = isRest ? "#e9d5ff" : "#bfdbfe";

  const idleAnimationSource = getPetAnimation(userProfile?.selectedPet, "idle");
  const focusAnimationSource = getPetAnimation(userProfile?.selectedPet, "focus");
  const restAnimationSource = getPetAnimation(userProfile?.selectedPet, "rest");

  const idleAnimationView = (
    <PetAnimation
      source={idleAnimationSource}
      containerStyle={{ marginTop: 20 }}
      animationStyle={{ width: "230%", height: "230%" }}
    />
  );

  const focusAnimationView = (
    <PetAnimation source={focusAnimationSource} containerStyle={{ paddingLeft: 28 }} />
  );

  const restAnimationView = (
    <PetAnimation
      source={restAnimationSource}
      containerStyle={{ marginTop: 10, marginLeft: 10 }}
      animationStyle={{ width: "120%", height: "120%" }}
    />
  );

  const activeAnimationView = isRest ? restAnimationView : focusAnimationView;
  const activeAnimationLayer =
    activeAnimationView ? (
      <Animated.View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity: activeTrackerOpacity }}
      >
        {activeAnimationView}
      </Animated.View>
    ) : null;

  const infoText = useMemo(() => {
    if (!running)
      return `You have focused for ${userProfile?.timeActiveTodayMinutes} ${
        userProfile?.timeActiveTodayMinutes === 1 ? "min" : "mins"
      } today.`;
    if (activity === "Focus") return "Work hard and stay focused!";
    return "Getting some rest...";
  }, [running, activity, userProfile?.timeActiveTodayMinutes]);

  const handleOpenPicker = () => {
    if (running) {
      showBanner("End your session before changing activity.", "error");
      return;
    }
    setPickerOpen(true);
  };

  const handleSelectActivity = (newActivity: "Focus" | "Rest") => {
    if (running) {
      showBanner("End your session before changing activity.", "error");
      setPickerOpen(false);
      return;
    }
    setActivity(newActivity);
    setPickerOpen(false);
  };

  return (
    <View className="flex-1 bg-white relative">
      {/* Status bar hidden only in fullscreen */}
      <StatusBar hidden={isFullscreen} animated />

      {/* Coins:
          - Normal mode: render as-is (no wrapper, no transform).
          - Fullscreen: render inside Animated.View that fades/slides it out. */}
      {!isFullscreen ? (
        <CoinBadge />
      ) : (
        <Animated.View style={{ opacity: topFade, transform: [{ translateY: topSlideY }] }} pointerEvents="none">
          <CoinBadge />
        </Animated.View>
      )}

      {/* Toggle:
          - Normal mode: original element unchanged.
          - Fullscreen: animated clone that fades/slides up. */}
      {!isFullscreen ? (
        <View className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 flex-row w-22 rounded-full bg-gray-200 overflow-hidden">
          <TouchableOpacity
            onPress={() => setMode("countdown")}
            disabled={running}
            className={`w-12 items-center py-2 ${mode === "countdown" ? "bg-black-300" : "bg-transparent"} ${running ? "opacity-60" : ""}`}
          >
            <Hourglass size={20} color={mode === "countdown" ? "#ffffff" : "#191d31"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode("timer")}
            disabled={running}
            className={`w-12 items-center py-2 ${mode === "timer" ? "bg-black-300" : "bg-transparent"} ${running ? "opacity-60" : ""}`}
          >
            <Timer size={20} color={mode === "timer" ? "#ffffff" : "#191d31"} />
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            opacity: topFade,
            transform: [{ translateY: topSlideY }],
          }}
          pointerEvents="none"
        >
          <View className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 flex-row w-22 rounded-full bg-gray-200 overflow-hidden">
            <TouchableOpacity
              onPress={() => setMode("countdown")}
              disabled
              className={`w-12 items-center py-2 ${mode === "countdown" ? "bg-black-300" : "bg-transparent"} opacity-60`}
            >
              <Hourglass size={20} color={mode === "countdown" ? "#ffffff" : "#191d31"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode("timer")}
              disabled
              className={`w-12 items-center py-2 ${mode === "timer" ? "bg-black-300" : "bg-transparent"} opacity-60`}
            >
              <Timer size={20} color={mode === "timer" ? "#ffffff" : "#191d31"} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Main content — nudge up only in fullscreen */}
      <Animated.View
        style={{ flex: 1, transform: [{ translateY: contentTranslateY }] }}
        className="items-center justify-end pb-8"
      >
        <View className="mb-[12%]">
          <Text className="text-lg">{infoText}</Text>
        </View>

        <View style={{ width: 350, height: 350 }} className="items-center justify-center">
          {activeAnimationLayer}
          <Animated.View style={{ width: "100%", height: "100%", opacity: idleTrackerOpacity }}>
            <TimeTracker
              progress={progress}
              onChange={handleTrackerChange}
          disabled={running || mode === "timer"}
          showHandle={mode === "countdown"}
              trackColor={trackColor}
              trackBgColor={trackBgColor}
              onPreviewProgress={handlePreviewProgress}
              onDragStateChange={handleDragStateChange}
              centerContent={idleAnimationView}
            />
          </Animated.View>
        </View>

        <View className="items-center mt-6 -mb-6">
          <TouchableOpacity
            className={`flex-row items-center px-6 py-2 rounded-full bg-gray-200 ${running ? "opacity-60" : ""}`}
            onPress={handleOpenPicker}
            disabled={running}
          >
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: activity === "Focus" ? "#3b82f6" : "#8b5cf6" }}
            />
            <Text className="text-base font-medium text-gray-800">{activity}</Text>
          </TouchableOpacity>
        </View>

        <View className="w-full items-center justify-center mt-[12%] mb-4 relative">
          <Text
            className="text-7xl tracking-widest opacity-0"
            style={{
              ...(Platform.OS === "ios" ? { fontVariant: ["tabular-nums"] as any } : {}),
              fontFamily: Platform.select({ ios: undefined, android: "monospace", default: undefined }),
              includeFontPadding: false,
              lineHeight: 88,
            }}
          >
            00:00
          </Text>

          <Text
            className="text-7xl tracking-widest text-gray-900 absolute left-0 right-0 text-center"
            selectable={false}
            style={{
              ...(Platform.OS === "ios" ? { fontVariant: ["tabular-nums"] as any } : {}),
              fontFamily: Platform.select({ ios: undefined, android: "monospace", default: undefined }),
              includeFontPadding: false,
              lineHeight: 88,
            }}
          >
            {`${mm}:${ss}`}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleStartStop}
          className={`${!running ? "bg-black-300" : "bg-yellow-400"} w-48 items-center py-4 mb-6 mt-2 rounded-full`}
        >
          <Text className="text-white text-2xl font-semibold">{!running ? "Start" : "Stop"}</Text>
        </TouchableOpacity>
      </Animated.View>

      <ModePickerModal
        visible={pickerOpen}
        currentActivity={activity}
        onSelect={setActivity}
        onClose={() => setPickerOpen(false)}
      />

      <ConfirmStopModal
        visible={stopModalOpen}
        onCancel={() => setStopModalOpen(false)}
        onConfirm={() => {
          setStopModalOpen(false);
          void fullyStopAndReset("manual");
        }}
      />
    </View>
  );
}
