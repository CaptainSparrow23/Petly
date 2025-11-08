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
import LottieView from "lottie-react-native";
import ModePickerModal from "../../components/focus/ModePickerModal";
import ConfirmStopModal from "../../components/focus/ConfirmStopModal";
import TimeTracker from "../../components/focus/TimeTracker";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { useLocalSearchParams, useNavigation } from "expo-router";
import CoinBadge from "@/components/other/CoinBadge";
import { useSessionUploader } from "@/hooks/useFocus";

export default function IndexScreen() {
  const [mode, setMode] = useState<"timer" | "countdown">("countdown");
  const [activity, setActivity] = useState<"Study" | "Rest">("Study");
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
  const { showBanner, userProfile } = useGlobalContext();
  const navigation = useNavigation();

  const [dragging, setDragging] = useState(false);
  const [previewP, setPreviewP] = useState<number | null>(null);

  const { upload } = useSessionUploader();
  const sessionStartMsRef = useRef<number | null>(null);

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

  useEffect(() => {
    navigation.setOptions?.({ headerShown: !isFullscreen });
    Animated.timing(focusAnim, {
      toValue: isFullscreen ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isFullscreen, navigation, focusAnim]);

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
      }).catch(() => {});
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

  const handleStart = () => {
    if (mode === "countdown" && secondsLeft <= 0) {
      showBanner("Set a countdown above 0:00 to start.", "warning");
      return;
    }
    setRunning(true);
    if (!sessionStartMsRef.current) sessionStartMsRef.current = Date.now();
  };

  const handleStartStop = () => {
    if (running) setStopModalOpen(true);
    else handleStart();
  };

  // ticker
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

  // mode switch reset
  useEffect(() => {
    clearTicker();
    setRunning(false);
    if (mode === "countdown") setSecondsLeft(lastCountdownTargetSec);
    else setSecondsElapsed(0);
  }, [mode, lastCountdownTargetSec]);

  // background stop/upload
  useEffect(() => {
    const onState = (s: AppStateStatus) => {
      if (running && (s === "background" || s === "inactive")) {
        void fullyStopAndReset("app-closed");
      }
    };
    const sub = AppState.addEventListener("change", onState);
    return () => sub.remove();
  }, [running]);

  // tracker interaction
  const handleTrackerChange = (p: number) => {
    if (!running && mode === "countdown") {
      const SNAP_S = 300;
      const raw = p * TWO_HOUR_SECONDS;
      const next = Math.round(raw / SNAP_S) * SNAP_S;
      setSecondsLeft(next);
      setLastCountdownTargetSec(next);
    }
  };

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

  const skyeSource = useMemo(() => {
    if (!running) return "skye_idle";
    return activity === "Study" ? "skye_idle" : "skye_idle";
  }, [running, activity]); // Edit when rest and study animations are ready

  const infoText = useMemo(() => {
    if (!running)
      return `You have focused for ${userProfile?.timeActiveTodayMinutes} ${
        userProfile?.timeActiveTodayMinutes === 1 ? "minute" : "minutes"
      } today.`;
    if (mode === "timer") return "Timer mode helps you track your study sessions.";
    return "Countdown mode helps you stay disciplined with time.";
  }, [running, mode, userProfile?.timeActiveTodayMinutes]);

  const handleOpenPicker = () => {
    if (running) {
      showBanner("End your session before changing activity.", "error");
      return;
    }
    setPickerOpen(true);
  };

  const handleSelectActivity = (newActivity: "Study" | "Rest") => {
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
          <Text className="text-m text-gray-800">{infoText}</Text>
        </View>

        <TimeTracker
          progress={progress}
          onChange={handleTrackerChange}
          disabled={running || mode === "timer"}
          trackColor={trackColor}
          trackBgColor={trackBgColor}
          onPreviewProgress={setPreviewP}
          onDragStateChange={setDragging}
          centerContent={
            <View style={{ width: "130%", height: "130%" }} pointerEvents="none">

            </View>
          }
        />

        <View className="items-center mt-2">
          <TouchableOpacity
            className={`flex-row items-center px-6 py-2 rounded-full bg-gray-200 ${running ? "opacity-60" : ""}`}
            onPress={handleOpenPicker}
            disabled={running}
          >
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: activity === "Study" ? "#3b82f6" : "#8b5cf6" }}
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
          className={`${!running ? "bg-black-300" : "bg-red-500"} w-72 items-center py-4 mb-3 mt-2 rounded-full`}
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
