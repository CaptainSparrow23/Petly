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
  const INITIAL_COUNTDOWN_SECONDS = 20 * 60; // 20 minutes
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_COUNTDOWN_SECONDS);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [confirmingStop, setConfirmingStop] = useState(false);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { loggedIn } = useLocalSearchParams();
  const { showBanner } = useGlobalContext();

  // focused-today accumulator
  const [totalFocusedSecondsToday, setTotalFocusedSecondsToday] = useState(0);
  const [focusDate, setFocusDate] = useState<string>(new Date().toDateString());

  useEffect(() => {
    if (loggedIn === 'true') showBanner('Successfully logged in', 'success');
  }, [loggedIn, showBanner]);

  // --- Derived tracker progress
  const progress =
    mode === "countdown" ? secondsLeft / HOUR_SECONDS : secondsElapsed / HOUR_SECONDS;

  // --- Start / Stop / Confirm handlers
  const clearTicker = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };
  const clearConfirmTimeout = () => {
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    confirmTimeoutRef.current = null;
  };

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

  const handleStart = () => {
    // guard: don't start countdown if set to 0
    if (mode === "countdown" && secondsLeft <= 0) {
      showBanner("Set a countdown above 0:00 to start.", "warning");
      return;
    }
    setRunning(true);
    setConfirmingStop(false);
    clearConfirmTimeout();
  };

  const handleStopPress = () => {
    // first press enters confirm state for a few seconds
    if (!confirmingStop) {
      setConfirmingStop(true);
      clearConfirmTimeout();
      confirmTimeoutRef.current = setTimeout(() => {
        // timeout ended → revert back to running/Stop
        setConfirmingStop(false);
      }, 3000);
      return;
    }
    // pressed while confirming → fully stop
    fullyStopAndReset("manual");
  };

  const handleStartStop = () => {
    if (running) {
      handleStopPress();
    } else {
      handleStart();
    }
  };

  // --- Handle ticking logic
  useEffect(() => {
    const tickFocus = () => {
      // reset accumulator if day changed
      const today = new Date().toDateString();
      if (today !== focusDate) {
        setFocusDate(today);
        setTotalFocusedSecondsToday(0);
      }
      setTotalFocusedSecondsToday((s) => s + 1);
    };

    clearTicker();
    if (!running) return;

    if (mode === "countdown") {
      intervalRef.current = setInterval(() => {
        tickFocus();
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // reaches zero during active session
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
      // Timer mode (count up)
      intervalRef.current = setInterval(() => {
        tickFocus();
        setSecondsElapsed((prev) => {
          if (prev >= HOUR_SECONDS) {
            // reached 60 mins during active session
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
  }, [running, mode, focusDate]);

  // --- Mode switch reset
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

  // --- Manual tracker control (only for countdown and when not running)
  const handleTrackerChange = (p: number) => {
    if (!running && mode === "countdown") {
      // Snap to 2-minute increments
      const snapped = Math.round((p * 60) / 2) * 2; // in minutes
      setSecondsLeft(snapped * 60);
    }
  };

  // --- Derived time display
  const secondsToShow = mode === "countdown" ? secondsLeft : secondsElapsed;
  const minutes = Math.floor(secondsToShow / 60);
  const seconds = Math.floor(secondsToShow % 60);

  // --- Tracker colors (blue for Study, purple for Rest)
  const isRest = activity === "Rest";
  const trackColor = isRest ? "#8b5cf6" : "#3b82f6";
  const trackBgColor = isRest ? "#e9d5ff" : "#bfdbfe";

  // --- Skye animation
  const skyeSource = useMemo(() => {
    if (!running) return Animations.skyeIdle; // skye.json
    return activity === "Study" ? Animations.skyeStudy : Animations.skyeRest;
  }, [running, activity]);

  // --- Info line below the top toggle (3 possible sentences)
  const infoText = useMemo(() => {
    if (!running) {
      const mins = Math.floor(totalFocusedSecondsToday / 60);
      return `You have focused for ${mins} minute${mins === 1 ? "" : "s"} today.`;
    }
    if (mode === "timer") {
      const mins = Math.floor(secondsElapsed / 60);
      return `Timer running — ${mins} min elapsed.`;
    }
    // countdown
    const minsRemaining = Math.ceil(secondsLeft / 60);
    return `Countdown running — ${minsRemaining} min remaining.`;
  }, [running, mode, totalFocusedSecondsToday, secondsElapsed, secondsLeft]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      clearTicker();
      clearConfirmTimeout();
    };
  }, []);

  return (
    <View className="flex-1 bg-white pt-14 relative">

      <Text className="absolute left-1/2 -translate-x-1/2 top-28 text-medium text-gray-800">{infoText}</Text>


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
        {/* Circle Tracker with Skye */}
        <TimeTracker
          progress={progress}
          onChange={handleTrackerChange}
          disabled={running || mode === "timer"}
          trackColor={trackColor}
          trackBgColor={trackBgColor}
          centerContent={
            <View style={{ width: '130%', height: '130%' }}>
              <LottieView source={skyeSource} autoPlay loop style={{ width: "100%", height: "100%" }} />
            </View>
          }
        />

        {/* Selector chip */}
        <View className="items-center mt-7">
          <TouchableOpacity
            className="flex-row items-center px-6 py-2 rounded-full border bg-blue-50 border-blue-100"
            onPress={() => setPickerOpen(true)}
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
            !running
              ? "bg-blue-600"
              : confirmingStop
              ? "bg-red-800"
              : "bg-red-500"
          } w-52 items-center py-4 mb-6 rounded-full`}
        >
          <Text className="text-white text-2xl font-semibold">
            {!running ? "Start" : confirmingStop ? "Confirm" : "Stop"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal component */}
      <ModePickerModal
        visible={pickerOpen}
        currentActivity={activity}
        onSelect={(newActivity) => {
          setActivity(newActivity);
          setPickerOpen(false);
        }}
      />
    </View>
  );
}
