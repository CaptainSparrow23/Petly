import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Timer, Hourglass } from "lucide-react-native";
import LottieView from "lottie-react-native";
import ModePickerModal from "../../components/focus/ModePickerModal";
import TimeTracker from "../../components/focus/TimeTracker";
import { Animations } from "../../constants/animations";
import { useGlobalContext } from "@/lib/global-provider";
import { useLocalSearchParams } from "expo-router";

export default function IndexScreen() {
  const [mode, setMode] = useState<"timer" | "countdown">("countdown");
  const [activity, setActivity] = useState<"Study" | "Rest">("Study");
  const [pickerOpen, setPickerOpen] = useState(false);
  const HOUR_SECONDS = 3600;
  const INITIAL_COUNTDOWN_SECONDS = 20 * 60;
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_COUNTDOWN_SECONDS);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [confirmingStop, setConfirmingStop] = useState(false);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { loggedIn } = useLocalSearchParams();
  const { showBanner } = useGlobalContext();
  const [dragging, setDragging] = useState(false);
  const [previewP, setPreviewP] = useState<number | null>(null);

  // show success on login navigation
  useEffect(() => {
    if (loggedIn === "true") showBanner("Successfully logged in", "success");
  }, [loggedIn, showBanner]);

  const progress =
    mode === "countdown" ? secondsLeft / HOUR_SECONDS : secondsElapsed / HOUR_SECONDS;

  // stop and clear the ticking interval
  const clearTicker = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  // clear the confirm timeout
  const clearConfirmTimeout = () => {
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    confirmTimeoutRef.current = null;
  };

  // fully stop session and reset numbers, then banner
  const fullyStopAndReset = (reason?: "timer-max" | "countdown-zero" | "manual") => {
    clearTicker();
    setRunning(false);
    setConfirmingStop(false);
    clearConfirmTimeout();

    if (mode === "countdown") {
      setSecondsLeft(INITIAL_COUNTDOWN_SECONDS);
    } else {
      setSecondsElapsed(0);
    }

    if (reason === "timer-max") {
      showBanner("Timer reached 60:00 — session ended.", "success");
    } else if (reason === "countdown-zero") {
      showBanner("Countdown finished — session ended.", "success");
    } else {
      showBanner("Session stopped.", "info");
    }
  };

  // start a session (with guard for 0:00 countdown)
  const handleStart = () => {
    if (mode === "countdown" && secondsLeft <= 0) {
      showBanner("Set a countdown above 0:00 to start.", "warning");
      return;
    }
    setRunning(true);
    setConfirmingStop(false);
    clearConfirmTimeout();
  };

  // stop press → enter confirm window, second press confirms stop
  const handleStopPress = () => {
    if (!confirmingStop) {
      setConfirmingStop(true);
      clearConfirmTimeout();
      confirmTimeoutRef.current = setTimeout(() => {
        setConfirmingStop(false);
      }, 3000);
      return;
    }
    fullyStopAndReset("manual");
  };

  // main CTA handler
  const handleStartStop = () => {
    if (running) {
      handleStopPress();
    } else {
      handleStart();
    }
  };

  // ticking logic for timer/countdown
  useEffect(() => {
    clearTicker();
    if (!running) return;

    if (mode === "countdown") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearTicker();
            setRunning(false);
            setConfirmingStop(false);
            clearConfirmTimeout();
            showBanner("Countdown finished — session ended.", "success");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      intervalRef.current = setInterval(() => {
        setSecondsElapsed((prev) => {
          if (prev >= HOUR_SECONDS) {
            clearTicker();
            setRunning(false);
            setConfirmingStop(false);
            clearConfirmTimeout();
            showBanner("Timer reached 60:00 — session ended.", "success");
            return HOUR_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return clearTicker;
  }, [running, mode]);

  // when switching mode (timer/countdown), reset numbers
  useEffect(() => {
    clearTicker();
    setRunning(false);
    setConfirmingStop(false);
    clearConfirmTimeout();
    if (mode === "countdown") {
      setSecondsLeft(INITIAL_COUNTDOWN_SECONDS);
    } else {
      setSecondsElapsed(0);
    }
  }, [mode]);

  const secondsToShow = mode === "countdown" ? secondsLeft : secondsElapsed;

  // commit tracker changes (already snapped by TimeTracker)
  const handleTrackerChange = (p: number) => {
    if (!running && mode === "countdown") {
      setSecondsLeft(Math.round(p * HOUR_SECONDS));
    }
  };

  // choose whether to show live or snapped preview time
  const displaySeconds = useMemo(() => {
    if (dragging && previewP != null) {
      const minutesSnap = Math.round(previewP * 60);
      return minutesSnap * 60;
    }
    return secondsToShow;
  }, [dragging, previewP, secondsToShow]);

  const minutes = Math.floor(displaySeconds / 60);
  const seconds = Math.floor(displaySeconds % 60);
  const isRest = activity === "Rest";
  const trackColor = isRest ? "#8b5cf6" : "#3b82f6";
  const trackBgColor = isRest ? "#e9d5ff" : "#bfdbfe";

  // choose Skye animation based on state
  const skyeSource = useMemo(() => {
    if (!running) return Animations.skyeIdle;
    return activity === "Study" ? Animations.skyeStudy : Animations.skyeRest;
  }, [running, activity]);

  // pick a static info line
  const infoText = useMemo(() => {
    if (!running) return "You have focused for 15 minutes today.";
    if (mode === "timer") return "Timer mode helps you track your study sessions.";
    return "Countdown mode helps you stay disciplined with time.";
  }, [running, mode]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      clearTicker();
      clearConfirmTimeout();
    };
  }, []);

  // guard: block opening the Study/Rest picker if a session is running
  const handleOpenPicker = () => {
    if (running) {
      showBanner("End your session before changing activity.", "error");
      return;
    }
    setPickerOpen(true);
  };

  // guard: block changing Study/Rest while running (extra safety)
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
      <Text className="text-m text-gray-800 absolute top-28 left-1/2 -translate-x-1/2">
        {infoText}
      </Text>

      {/* Segmented toggle at top */}
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
          progress={progress}
          onChange={handleTrackerChange}
          disabled={running || mode === "timer"}
          trackColor={trackColor}
          trackBgColor={trackBgColor}
          onPreviewProgress={setPreviewP}
          onDragStateChange={setDragging}
          centerContent={
            <View style={{ width: "130%", height: "130%" }}>
              <LottieView source={skyeSource} autoPlay loop style={{ width: "100%", height: "100%" }} />
            </View>
          }
        />

        {/* Activity chip (blocked during session) */}
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

        {/* Timer text */}
        <Text className="text-8xl tracking-widest mb-4 mt-20">
          {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
        </Text>

        {/* Start / Stop / Confirm Button */}
        <TouchableOpacity
          onPress={handleStartStop}
          className={`${
            !running ? "bg-blue-600" : confirmingStop ? "bg-red-800" : "bg-red-500"
          } w-52 items-center py-4 mb-6 rounded-full`}
        >
          <Text className="text-white text-2xl font-semibold">
            {!running ? "Start" : confirmingStop ? "Confirm" : "Stop"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Study/Rest picker */}
      <ModePickerModal
        visible={pickerOpen}
        currentActivity={activity}
        onSelect={handleSelectActivity}
      />
    </View>
  );
}
