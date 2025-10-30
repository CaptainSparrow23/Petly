import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Platform, AppState, AppStateStatus } from "react-native";
import { Timer, Hourglass } from "lucide-react-native";
import LottieView from "lottie-react-native";
import ModePickerModal from "../../components/focus/ModePickerModal";
import ConfirmStopModal from "../../components/focus/ConfirmStopModal";
import TimeTracker from "../../components/focus/TimeTracker";
import { Animations } from "../../constants/animations";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { useLocalSearchParams } from "expo-router";
import CoinBadge from "@/components/other/CoinBadge";
import { useSessionUploader } from "@/hooks/useFocus";

export default function IndexScreen() {
  const [mode, setMode] = useState<"timer" | "countdown">("countdown");
  const [activity, setActivity] = useState<"Study" | "Rest">("Study");
  const [pickerOpen, setPickerOpen] = useState(false);

  const TWO_HOUR_SECONDS = 2 * 60 * 60; // 7200
  const INITIAL_COUNTDOWN_SECONDS = 20 * 60;

  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_COUNTDOWN_SECONDS);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [lastCountdownTargetSec, setLastCountdownTargetSec] = useState(INITIAL_COUNTDOWN_SECONDS);

  const { loggedIn } = useLocalSearchParams();
  const { showBanner, userProfile } = useGlobalContext();

  const [dragging, setDragging] = useState(false);
  const [previewP, setPreviewP] = useState<number | null>(null);

  // upload hook
  const { upload } = useSessionUploader();

  // track actual session start wall time (ms) for precise start/end
  const sessionStartMsRef = useRef<number | null>(null);

  // capture latest counters in refs so stop logic can read pre-reset values
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

  // core stop -> compute elapsed, upload, then reset UI
  const fullyStopAndReset = async (reason?: "timer-max" | "countdown-zero" | "manual" | "app-closed") => {
    const end = new Date();

    // compute elapsed seconds from what actually happened on-screen
    const elapsedSec =
      mode === "timer"
        ? Math.max(0, lastElapsedRef.current)
        : Math.max(0, lastCountdownTargetSec - lastLeftRef.current);

    // if we don't have a start timestamp, infer from elapsed (still correct)
    const startMs =
      sessionStartMsRef.current ?? end.getTime() - elapsedSec * 1000;

    // only upload if there is meaningful time
    if (elapsedSec > 0 && userProfile?.userId) {
      await upload({
        userId: String(userProfile.userId),
        activity,
        startTs: new Date(startMs).toISOString(),
        durationSec: Math.floor(elapsedSec),
      }).catch(() => {
        // don't block UX on network failures
      });
    }

    clearTicker();
    setRunning(false);

    if (mode === "countdown") {
      setSecondsLeft(lastCountdownTargetSec);
    } else {
      setSecondsElapsed(0);
    }
    sessionStartMsRef.current = null;

    if (reason === "timer-max") {
      showBanner("Timer reached 2:00:00 — session ended.", "success");
    } else if (reason === "countdown-zero") {
      showBanner("Countdown finished — session ended.", "success");
    } else if (reason === "manual") {
      showBanner("Session stopped.", "info");
    } else if (reason === "app-closed") {
      showBanner("Session saved on app close.", "info");
    }
  };

  const handleStart = () => {
    if (mode === "countdown" && secondsLeft <= 0) {
      showBanner("Set a countdown above 0:00 to start.", "warning");
      return;
    }
    setRunning(true);
    if (!sessionStartMsRef.current) {
      sessionStartMsRef.current = Date.now();
    }
  };

  const handleStartStop = () => {
    if (running) {
      setStopModalOpen(true);
    } else {
      handleStart();
    }
  };

  // ticker (with auto-stop at countdown 0 or timer 2h)
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

  // mode switch: keep your original behavior (reset counters, keep sticky countdown target)
  useEffect(() => {
    clearTicker();
    setRunning(false);
    if (mode === "countdown") {
      setSecondsLeft(lastCountdownTargetSec);
    } else {
      setSecondsElapsed(0);
    }
    // keep sessionStartMsRef clear; a new start will set it
  }, [mode, lastCountdownTargetSec]);

  // app background/close -> stop and upload
  useEffect(() => {
    const onState = (s: AppStateStatus) => {
      if (running && (s === "background" || s === "inactive")) {
        void fullyStopAndReset("app-closed");
      }
    };
    const sub = AppState.addEventListener("change", onState);
    return () => sub.remove();
  }, [running]);

  // tracker interactions
  const handleTrackerChange = (p: number) => {
    if (!running && mode === "countdown") {
      const SNAP_S = 300; // 5 min
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
    if (!running) return Animations.skyeIdle;
    return activity === "Study" ? Animations.skyeStudy : Animations.skyeRest;
  }, [running, activity]);

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
    <View className="flex-1 bg-white pt-14 relative">
      <CoinBadge />

      <View className="absolute top-28 left-1/2 -translate-x-1/2">
        <Text className="text-m text-gray-800">{infoText}</Text>
      </View>

      <View className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 flex-row w-28 border border-blue-200 rounded-full bg-blue-50 overflow-hidden">
        <TouchableOpacity
          onPress={() => setMode("countdown")}
          className={`w-14 items-center py-2.5 ${mode === "countdown" ? "bg-blue-600" : "bg-transparent"}`}
        >
          <Hourglass size={22} color={mode === "countdown" ? "#ffffff" : "#1d4ed8"} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode("timer")}
          className={`w-14 items-center py-2.5 ${mode === "timer" ? "bg-blue-600" : "bg-transparent"}`}
        >
          <Timer size={22} color={mode === "timer" ? "#ffffff" : "#1d4ed8"} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-end pb-8">
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
              <LottieView source={skyeSource} autoPlay loop style={{ width: "100%", height: "100%" }} />
            </View>
          }
        />

        <View className="items-center mt-4">
          <TouchableOpacity
            className="flex-row items-center px-6 py-2 rounded-full border bg-blue-50 border-blue-100"
            onPress={handleOpenPicker}
          >
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: activity === "Study" ? "#3b82f6" : "#8b5cf6" }}
            />
            <Text className="text-base font-medium text-gray-800">{activity}</Text>
          </TouchableOpacity>
        </View>

        <View className="w-full items-center justify-center mt-20 mb-4 relative">
          <Text
            className="text-8xl tracking-widest opacity-0"
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
            className="text-8xl tracking-widest text-gray-900 absolute left-0 right-0 text-center"
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
          className={`${!running ? "bg-blue-600" : "bg-red-500"} w-52 items-center py-4 mb-6 rounded-full`}
        >
          <Text className="text-white text-2xl font-semibold">{!running ? "Start" : "Stop"}</Text>
        </TouchableOpacity>
      </View>

      <ModePickerModal visible={pickerOpen} currentActivity={activity} onSelect={handleSelectActivity} />

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
