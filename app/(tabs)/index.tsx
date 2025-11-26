import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  AppState,
  AppStateStatus,
  StatusBar,
} from "react-native";
import { Timer, Hourglass } from "lucide-react-native";
import ModePickerModal from "../../components/focus/ModePickerModal";
import ConfirmStopModal from "../../components/focus/ConfirmStopModal";
import TimeTracker from "../../components/focus/TimeTracker";
import PetAnimation from "../../components/focus/PetAnimation";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { useLocalSearchParams } from "expo-router";
import CoinBadge from "@/components/other/CoinBadge";
import { useSessionUploader, SessionActivity } from "@/hooks/useFocus";
import SessionEndModal from "@/components/focus/SessionEndModal";
import { getPetAnimationConfig } from "@/constants/animations";
import { CoralPalette } from "@/constants/colors";

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

  const INITIAL_COUNTDOWN_SECONDS = 20 * 60;

  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_COUNTDOWN_SECONDS);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [lastCountdownTargetSec, setLastCountdownTargetSec] = useState(INITIAL_COUNTDOWN_SECONDS);
  const [previewSeconds, setPreviewSeconds] = useState<number | null>(null);

  const { loggedIn } = useLocalSearchParams();
  const { showBanner, userProfile, refetchUserProfile, appSettings } = useGlobalContext();
  // Tracker drag state for previewing countdown adjustments
  const [sessionSummary, setSessionSummary] = useState<{
    visible: boolean;
    coinsAwarded: number;
    durationSec: number;
    activity: SessionActivity;
  }>({
    visible: false,
    coinsAwarded: 0,
    durationSec: 0,
    activity: "Focus",
  });

  const { upload } = useSessionUploader();
  const sessionStartMsRef = useRef<number | null>(null);
  const closeSessionSummary = useCallback(() => {
    setSessionSummary((prev) => ({ ...prev, visible: false }));
  }, []);

  // We keep pointer refs so uploads always use the last persisted time
  const lastLeftRef = useRef(secondsLeft);
  const lastElapsedRef = useRef(secondsElapsed);
  useEffect(() => { lastLeftRef.current = secondsLeft; }, [secondsLeft]);
  useEffect(() => { lastElapsedRef.current = secondsElapsed; }, [secondsElapsed]);

  useEffect(() => {
    if (loggedIn === "true") showBanner("Successfully logged in", "success");
  }, [loggedIn, showBanner]);
  const maxSessionSeconds = appSettings.extendSessionLimit ? 3 * 60 * 60 : 2 * 60 * 60;

  const progress =
    mode === "countdown" ? secondsLeft / maxSessionSeconds : secondsElapsed / maxSessionSeconds;
  const isRest = activity !== "Focus";
  const trackColor = CoralPalette.primary;
  const trackBgColor = "rgba(255,255,255,0.5)";
  const centerFillColor = CoralPalette.surface;

  const clearTicker = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

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

    let coinsEarned = 0;
    if (elapsedSec > 0 && userProfile?.userId) {
      try {
        const awarded = await upload({
          userId: String(userProfile.userId),
          activity,
          startTs: new Date(startMs).toISOString(),
          durationSec: Math.floor(elapsedSec),
        });
        coinsEarned = awarded ?? 0;
        console.log("✅ Session uploaded successfully");
        void refetchUserProfile().catch((err) => {
          console.error("❌ Failed to refetch profile:", err);
        });
      } catch (err) {
        console.error("❌ Failed to upload session:", err);
      }
    }

    clearTicker();
    setRunning(false);
    if (mode === "countdown") setSecondsLeft(lastCountdownTargetSec);
    else setSecondsElapsed(0);
    sessionStartMsRef.current = null;

    if (elapsedSec > 0) {
      setSessionSummary({
        visible: true,
        coinsAwarded: coinsEarned,
        durationSec: elapsedSec,
        activity,
      });
    } else if (reason === "app-closed") {
      showBanner("Session saved on app close.", "info");
    }
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
          if (prev >= maxSessionSeconds) {
            void fullyStopAndReset("timer-max");
            return maxSessionSeconds;
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

  useEffect(() => {
    if (lastCountdownTargetSec > maxSessionSeconds) {
      setLastCountdownTargetSec(maxSessionSeconds);
      if (mode === "countdown") {
        setSecondsLeft(maxSessionSeconds);
      }
    }
  }, [lastCountdownTargetSec, maxSessionSeconds, mode]);

  // If the app backgrounds during a run, we automatically close and upload the session
  useEffect(() => {
    const onState = (s: AppStateStatus) => {
      if (running && (s === "background" || s === "inactive")) {
        void fullyStopAndReset("app-closed");
      }
    };
    const sub = AppState.addEventListener("change", onState);
    return () => sub.remove();
  }, [running, fullyStopAndReset]);

  // Countdown scrubber helpers
  const handleTrackerChange = (p: number) => {
    if (!running && mode === "countdown") {
      const SNAP_S = 300;
      const raw = p * maxSessionSeconds;
      const next = Math.round(raw / SNAP_S) * SNAP_S;
      setSecondsLeft(next);
      setLastCountdownTargetSec(next);
    }
  };
  const handlePreviewProgress = (progress: number | null) => {
    if (progress == null) {
      setPreviewSeconds(null);
      return;
    }
    const SNAP_S = 300;
    const raw = progress * maxSessionSeconds;
    const next = Math.round(raw / SNAP_S) * SNAP_S;
    setPreviewSeconds(next);
  };
  const secondsToShow = mode === "countdown" ? secondsLeft : secondsElapsed;

  const displaySeconds = previewSeconds ?? secondsToShow;
  const totalMinutes = Math.floor(displaySeconds / 60);
  const seconds = Math.floor(displaySeconds % 60);
  const mm = totalMinutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");

  const petAnimationConfig = useMemo(
    () => getPetAnimationConfig(userProfile?.selectedPet),
    [userProfile?.selectedPet]
  );

  const petAnimationView = petAnimationConfig ? (
    <PetAnimation
      source={petAnimationConfig.source}
      stateMachineName={petAnimationConfig.stateMachineName}
      focusInputName={petAnimationConfig.focusInputName}
      isFocus={running}
      containerStyle={{ marginTop: 15, marginLeft: 5 }}
      animationStyle={{ width: "70%", height: "70%" }}
    />
  ) : null;
  const animationCenterContent = (
    <View pointerEvents="none" style={{ width: "100%", height: "100%" }}>
      {petAnimationView}
    </View>
  );
  const dailyFocusLabel = useCallback(() => {
    const minutes = userProfile?.timeActiveTodayMinutes ?? 0;
    if (appSettings.displayFocusInHours) {
      const hours = minutes / 60;
      const formatted = hours >= 10 ? hours.toFixed(0) : hours.toFixed(1);
      const unit = hours === 1 ? "hour" : "hours";
      return `${formatted} ${unit}`;
    }
    const unit = minutes === 1 ? "min" : "mins";
    return `${minutes} ${unit}`;
  }, [userProfile?.timeActiveTodayMinutes, appSettings.displayFocusInHours]);

  const infoText = useMemo(() => {
    if (!running) return `You have focused for ${dailyFocusLabel()} today.`;
    if (activity === "Focus") return "Work hard and stay focused!";
    return "Getting some rest...";
  }, [running, activity, dailyFocusLabel]);

  const handleOpenPicker = () => {
    if (running) {
      showBanner("End your session before changing activity.", "error");
      return;
    }
    setPickerOpen(true);
  };


  return (
    <View className="flex-1 relative" style={{ backgroundColor: CoralPalette.primaryMuted }}>
      <StatusBar hidden={false} animated />

      <CoinBadge />

      <View
        className="absolute -top-14 left-1/2 -translate-x-1/2 z-10 flex-row rounded-full overflow-hidden"
        style={{
          backgroundColor: CoralPalette.surfaceAlt,
          borderColor: CoralPalette.border,
          borderWidth: 1,
        }}
      >
        <TouchableOpacity
          onPress={() => setMode("countdown")}
          disabled={running}
          className="w-16 items-center py-3"
          style={{ backgroundColor: mode === "countdown" ? CoralPalette.primary : "transparent", opacity: running ? 0.6 : 1 }}
        >
          <Hourglass size={20} color={mode === "countdown" ? "#ffffff" : CoralPalette.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode("timer")}
          disabled={running}
          className="w-16 items-center py-3"
          style={{ backgroundColor: mode === "timer" ? CoralPalette.primary : "transparent", opacity: running ? 0.6 : 1 }}
        >
          <Timer size={20} color={mode === "timer" ? "#ffffff" : CoralPalette.primary} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-end pb-8">
        <View className="mb-[15%]">
          <Text className="text-lg" style={{ color: CoralPalette.white, fontFamily: "Nunito" }}>
            {infoText}
          </Text>
        </View>

        <View style={{ width: 360, height: 360 }} className="items-center justify-center">
          <TimeTracker
            progress={progress}
            onChange={handleTrackerChange}
            disabled={running || mode === "timer"}
            showHandle={mode === "countdown" && !running && !stopModalOpen}
            trackColor={trackColor}
            trackBgColor={trackBgColor}
            onPreviewProgress={handlePreviewProgress}
            centerContent={animationCenterContent}
            centerFillColor={centerFillColor}
            maxSeconds={maxSessionSeconds}
            hideRing={running}
          />
        </View>

        <View className="items-center mt-10 -mb-6">
          <TouchableOpacity
            className={`flex-row items-center px-4 py-2 rounded-full ${running ? "opacity-60" : ""}`}
            onPress={handleOpenPicker}
            disabled={running}
            style={{
              backgroundColor: CoralPalette.surfaceAlt,
              borderColor: CoralPalette.border,
              borderWidth: 1,
            }}
          >
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{
                backgroundColor: isRest ? "#9AA587" : CoralPalette.primary,
              }}
            />
            <Text
              className="text-sm font-semibold"
              style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}
            >
              {activity}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="w-full items-center justify-center mt-10 relative">
          <Text
            className="text-8xl tracking-widest opacity-0 color-secondary-500"
            style={{
              ...(Platform.OS === "ios" ? { fontVariant: ["tabular-nums"] as any } : {}),
              fontFamily: "Nunito",
              includeFontPadding: false,
              lineHeight: 120,
            }}
          >
            00:00
          </Text>

          <Text
            className="tracking-widest text-white absolute left-0 right-0 text-center"
            selectable={false}
            style={{
              ...(Platform.OS === "ios" ? { fontVariant: ["tabular-nums"] as any } : {}),
              fontFamily: "Nunito",
              fontWeight: "100",
              includeFontPadding: false,
              lineHeight: 120,
              fontSize: 90,
            }}
          >
            {`${mm}:${ss}`}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleStartStop}
          className="w-40 items-center py-3 mb-10 mt-2 rounded-full shadow-sm opacity-100"
          style={{
            backgroundColor: CoralPalette.primary,
            opacity: running ? 0.9 : 1,
          }}
        >
          <Text
            className="text-xl text-white font-semibold shadow-lg"
            style={{ fontFamily: "Nunito" }}
          >
            {!running ? "Start" : "Give up"}
          </Text>
        </TouchableOpacity>
      </View>

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

      <SessionEndModal
        visible={sessionSummary.visible}
        coinsAwarded={sessionSummary.coinsAwarded}
        durationMinutes={Math.floor(sessionSummary.durationSec / 60)}
        activity={sessionSummary.activity}
        onClose={closeSessionSummary}
      />
    </View>
  );
}
