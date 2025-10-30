import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Timer, Hourglass } from "lucide-react-native";
import LottieView from "lottie-react-native";
import ModePickerModal from "../../components/focus/ModePickerModal";
import ConfirmStopModal from "../../components/focus/ConfirmStopModal";
import TimeTracker from "../../components/focus/TimeTracker";
import { Animations } from "../../constants/animations";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { useLocalSearchParams } from "expo-router";
import CoinBadge from "@/components/other/CoinBadge";

export default function IndexScreen() {
  const [mode, setMode] = useState<"timer" | "countdown">("countdown");
  const [activity, setActivity] = useState<"Study" | "Rest">("Study");
  const [pickerOpen, setPickerOpen] = useState(false);

  // 1 full rotation = 2 hours
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

  useEffect(() => {
    if (loggedIn === "true") showBanner("Successfully logged in", "success");
  }, [loggedIn, showBanner]);

  const progress =
    mode === "countdown" ? secondsLeft / TWO_HOUR_SECONDS : secondsElapsed / TWO_HOUR_SECONDS;

  const clearTicker = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const fullyStopAndReset = (reason?: "timer-max" | "countdown-zero" | "manual") => {
    clearTicker();
    setRunning(false);

    if (mode === "countdown") {
      setSecondsLeft(lastCountdownTargetSec);
    } else {
      setSecondsElapsed(0);
    }

    if (reason === "timer-max") {
      showBanner("Timer reached 2:00:00 — session ended.", "success");
    } else if (reason === "countdown-zero") {
      showBanner("Countdown finished — session ended.", "success");
    } else if (reason === "manual") {
      showBanner("Session stopped.", "info");
    }
  };

  const handleStart = () => {
    if (mode === "countdown" && secondsLeft <= 0) {
      showBanner("Set a countdown above 0:00 to start.", "warning");
      return;
    }
    setRunning(true);
  };

  const handleStartStop = () => {
    if (running) {
      setStopModalOpen(true);
    } else {
      handleStart();
    }
  };

  // ticking logic (2h cap for timer)
  useEffect(() => {
    clearTicker();
    if (!running) return;

    if (mode === "countdown") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            fullyStopAndReset("countdown-zero");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      intervalRef.current = setInterval(() => {
        setSecondsElapsed((prev) => {
          if (prev >= TWO_HOUR_SECONDS) {
            fullyStopAndReset("timer-max");
            return TWO_HOUR_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return clearTicker;
  }, [running, mode, lastCountdownTargetSec]);

  // switching modes → reset but keep sticky target for countdown
  useEffect(() => {
    clearTicker();
    setRunning(false);
    if (mode === "countdown") {
      setSecondsLeft(lastCountdownTargetSec);
    } else {
      setSecondsElapsed(0);
    }
  }, [mode, lastCountdownTargetSec]);

  const secondsToShow = mode === "countdown" ? secondsLeft : secondsElapsed;

  // when user sets a new countdown via tracker, remember it
  const handleTrackerChange = (p: number) => {
    if (!running && mode === "countdown") {
      const SNAP_S = 300; // 5 minutes
      const raw = p * TWO_HOUR_SECONDS;
      const next = Math.round(raw / SNAP_S) * SNAP_S;
      setSecondsLeft(next);
      setLastCountdownTargetSec(next);
    }
  };

  // preview while dragging (maps 0..1 → 2h)
  const displaySeconds = useMemo(() => {
    if (dragging && previewP != null) {
      return Math.round(previewP * TWO_HOUR_SECONDS);
    }
    return secondsToShow;
  }, [dragging, previewP, secondsToShow]);

  const hours = Math.floor(displaySeconds / 3600);
  const minutes = Math.floor((displaySeconds % 3600) / 60);
  const seconds = Math.floor(displaySeconds % 60);

  const hh = Math.min(hours, 99).toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");
  const showHours = displaySeconds >= 3600; 


  const isRest = activity === "Rest";
  const trackColor = isRest ? "#8b5cf6" : "#3b82f6";
  const trackBgColor = isRest ? "#e9d5ff" : "#bfdbfe";

  const skyeSource = useMemo(() => {
    if (!running) return Animations.skyeIdle;
    return activity === "Study" ? Animations.skyeStudy : Animations.skyeRest;
  }, [running, activity]);

  const infoText = useMemo(() => {
    if (!running) return `You have focused for ${userProfile?.timeActiveToday} minutes today.`;
    if (mode === "timer") return "Timer mode helps you track your study sessions.";
    return "Countdown mode helps you stay disciplined with time.";
  }, [running, mode, userProfile?.timeActiveToday]);

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
      {/* Top info line */}
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

      {/* Bottom section */}
      <View className="flex-1 items-center justify-end pb-8">
        <TimeTracker
          progress={progress} // 0..1 of two hours
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

        {/* Activity chip */}
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

        {/* Time text — horizontal, fixed width, no jitter */}
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
            {showHours ? "00:00:00" : "00:00"}
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
            {showHours ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`}
          </Text>
        </View>

        {/* Start / Stop */}
        <TouchableOpacity
          onPress={handleStartStop}
          className={`${!running ? "bg-blue-600" : "bg-red-500"} w-52 items-center py-4 mb-6 rounded-full`}
        >
          <Text className="text-white text-2xl font-semibold">{!running ? "Start" : "Stop"}</Text>
        </TouchableOpacity>
      </View>

      {/* Study/Rest picker */}
      <ModePickerModal visible={pickerOpen} currentActivity={activity} onSelect={handleSelectActivity} />

      {/* Stop confirmation modal */}
      <ConfirmStopModal
        visible={stopModalOpen}
        onCancel={() => setStopModalOpen(false)}
        onConfirm={() => {
          setStopModalOpen(false);
          fullyStopAndReset("manual");
        }}
      />
    </View>
  );
}
