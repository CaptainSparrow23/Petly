import React, { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  AppState,
  AppStateStatus,
  StatusBar,
  Animated,
} from "react-native";
import { Timer, Hourglass } from "lucide-react-native";
import { DrawerActions } from "@react-navigation/native";
import { useFocusEffect, useNavigation } from "expo-router";
import { MenuButton } from "@/components/other/MenuButton";
import { SheetManager } from "react-native-actions-sheet";
import ConfirmStopModal from "../../components/focus/ConfirmStopModal";
import TimeTracker from "../../components/focus/TimeTracker";
import PetAnimation from "../../components/focus/PetAnimation";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { useLocalSearchParams } from "expo-router";

import { useSessionUploader, SessionActivity } from "@/hooks/useFocus";
import SessionEndModal from "@/components/focus/SessionEndModal";
import { getPetAnimationConfig } from "@/constants/animations";
import { CoralPalette } from "@/constants/colors";
import { 
  scheduleSessionCompleteNotification, 
  cancelSessionCompleteNotification 
} from "@/utils/notifications";
import * as Haptics from 'expo-haptics';

/**
 * Focus & Rest dashboard. Handles timer/countdown modes, session tracking, and
 * UI transitions into fullscreen when a focus session is running. All timer math,
 * upload logic, and feedback banners live here.
 */
export default function IndexScreen() {
  // UI mode/timer state
  const [mode, setMode] = useState<"timer" | "countdown">("countdown");
  const [activity, setActivity] = useState<string>("Focus");

  const INITIAL_COUNTDOWN_SECONDS = 20 * 60;
  const GRACE_SECONDS = 10;

  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_COUNTDOWN_SECONDS);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const graceRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [graceLeft, setGraceLeft] = useState(0);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [lastCountdownTargetSec, setLastCountdownTargetSec] = useState(INITIAL_COUNTDOWN_SECONDS);
  const [previewSeconds, setPreviewSeconds] = useState<number | null>(null);
  const lastPreviewSnap = useRef<number | null>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  const { loggedIn } = useLocalSearchParams();
  const { showBanner, userProfile, refetchUserProfile, appSettings } = useGlobalContext();
  const navigation = useNavigation();
  // Tracker drag state for previewing countdown adjustments
  const [sessionSummary, setSessionSummary] = useState<{
    visible: boolean;
    coinsAwarded: number;
    xpAwarded: number;
    friendshipXpAwarded: number;
    durationSec: number;
    activity: SessionActivity;
  }>({
    visible: false,
    coinsAwarded: 0,
    xpAwarded: 0,
    friendshipXpAwarded: 0,
    durationSec: 0,
    activity: "Focus",
  });
  


  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View style={{ marginLeft: 3, opacity: running ? 0.4 : 1 }}>
          <MenuButton />
        </View>
      ),
    });
  }, [navigation, running]);

  useEffect(() => {
    refetchUserProfile().catch((err) => {
      console.error("❌ Failed to refetch profile on focus screen mount:", err);
    } );
  }, [refetchUserProfile]);

  const { upload } = useSessionUploader();
  const sessionStartMsRef = useRef<number | null>(null);
  const closeSessionSummary = useCallback(() => {
    setSessionSummary({
      visible: false,
      coinsAwarded: 0,
      xpAwarded: 0,
      friendshipXpAwarded: 0,
      durationSec: 0,
      activity: "Focus",
    });
  }, []);

  // We keep pointer refs so uploads always use the last persisted time
  const lastLeftRef = useRef(secondsLeft);
  const lastElapsedRef = useRef(secondsElapsed);
  useEffect(() => { lastLeftRef.current = secondsLeft; }, [secondsLeft]);
  useEffect(() => { lastElapsedRef.current = secondsElapsed; }, [secondsElapsed]);

  useEffect(() => {
    if (loggedIn === "true") {
      showBanner({
        title: "Successfully logged in",
        preset: "done",
        haptic: "success",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);
  const maxSessionSeconds = appSettings.extendSessionLimit ? 3 * 60 * 60 : 2 * 60 * 60;

  const progress =
    mode === "countdown" ? secondsLeft / maxSessionSeconds : secondsElapsed / maxSessionSeconds;
  const isRest = activity === "Rest";

  // Get the selected tag from userProfile
  const selectedTag = useMemo(() => {
    if (userProfile?.tagList && Array.isArray(userProfile.tagList) && userProfile.tagList.length > 0) {
      // First try to find by selectedTag ID
      if (userProfile.selectedTag) {
        const tagById = userProfile.tagList.find((tag: any) => tag.id === userProfile.selectedTag);
        if (tagById) return tagById;
      }
      // Fallback to matching by activity label
      const tagByLabel = userProfile.tagList.find((tag: any) => tag.label === activity);
      if (tagByLabel) return tagByLabel;
      // Fallback to first tag
      return userProfile.tagList[0];
    }
    // Default tags if no tagList
    const defaultTags = [
      { id: "focus", label: "Focus", color: CoralPalette.primary },
      { id: "rest", label: "Rest", color: "#9AA587" },
      { id: "work", label: "Work", color: CoralPalette.green },
      { id: "study", label: "Study", color: CoralPalette.blue },
    ];
    return defaultTags.find(tag => tag.label === activity) || defaultTags[0];
  }, [userProfile?.tagList, userProfile?.selectedTag, activity]);
  const trackColor = CoralPalette.primary;
  const trackBgColor = "rgba(255,255,255,0.5)";
  const centerFillColor = CoralPalette.greyVeryLight;
  const countdownInvalid = mode === "countdown" && secondsLeft <= 0;

  const clearTicker = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const clearGraceTimer = () => {
    if (graceRef.current) clearInterval(graceRef.current);
    graceRef.current = null;
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
    let xpEarned = 0;
    if (elapsedSec > 0 && userProfile?.userId) {
      try {
        const awarded = await upload({
          userId: String(userProfile.userId),
          activity,
          tagId: selectedTag?.id ?? null,
          startTs: new Date(startMs).toISOString(),
          endTs: end.toISOString(),
          durationSec: Math.floor(elapsedSec),
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London",
        });
        coinsEarned = awarded?.coinsAwarded ?? 0;
        xpEarned = awarded?.xpAwarded ?? 0;
        console.log("✅ Session uploaded successfully");
        void refetchUserProfile().catch((err) => {
          console.error("❌ Failed to refetch profile:", err);
        });
      } catch (err) {
        console.error("❌ Failed to upload session:", err);
      }
    }

    // Reset all state first to ensure clean state
    clearTicker();
    clearGraceTimer();
    setGraceLeft(0);
    setStopModalOpen(false);
    setRunning(false);
    // Cancel the session complete notification (in case stopped manually)
    void cancelSessionCompleteNotification();
    if (mode === "countdown") setSecondsLeft(lastCountdownTargetSec);
    else setSecondsElapsed(0);
    sessionStartMsRef.current = null;

    // Ensure sessionSummary is reset before potentially setting it again
    setSessionSummary({
      visible: false,
      coinsAwarded: 0,
      xpAwarded: 0,
      friendshipXpAwarded: 0,
      durationSec: 0,
      activity: "Focus",
    });

    // Only show session summary if there was meaningful time elapsed
    if (elapsedSec > 0) {
      // Use setTimeout to ensure state updates are processed and modals don't conflict
      setTimeout(() => {
        setSessionSummary({
          visible: true,
          coinsAwarded: coinsEarned,
          xpAwarded: xpEarned,
          friendshipXpAwarded: userProfile?.selectedPet ? xpEarned : 0,
          durationSec: elapsedSec,
          activity,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 100);
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
    
    // Schedule notification for when session completes (countdown mode only)
    if (mode === "countdown" && secondsLeft > 0) {
      void scheduleSessionCompleteNotification(secondsLeft, activity);
    }

    // start 10s grace window
    setGraceLeft(GRACE_SECONDS);
    clearGraceTimer();
    graceRef.current = setInterval(() => {
      setGraceLeft((prev) => {
        if (prev <= 1) {
          clearGraceTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelDuringGrace = () => {
    clearTicker();
    clearGraceTimer();
    setGraceLeft(0);
    setRunning(false);
    setStopModalOpen(false);
    void cancelSessionCompleteNotification();
    if (mode === "countdown") setSecondsLeft(lastCountdownTargetSec);
    else setSecondsElapsed(0);
    sessionStartMsRef.current = null;
  };

  /**
   * Central start/stop handler, wired to both Start button and confirmation modals.
   */
  const handleStartStop = () => {
    if (running) {
      if (graceLeft > 0) cancelDuringGrace();
      else setStopModalOpen(true);
    } else handleStart();
  };

  // Immediate haptic when tapping mode pills (only if it will change).
  const handleModePressIn = useCallback(
    (targetMode: "timer" | "countdown") => {
      if (running) return;
      if (mode === targetMode) return;
      if (!appSettings.vibrations) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    },
    [running, mode, appSettings.vibrations]
  );

  // Trigger haptic immediately when tapping Start (only if it will start).
  const handleStartPressIn = useCallback(() => {
    // Check conditions first, but trigger haptic immediately if valid
    if (!running && !(mode === "countdown" && secondsLeft <= 0) && appSettings.vibrations) {
      // Fire haptic immediately without await/catch to minimize delay
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [running, mode, secondsLeft, appSettings.vibrations]);

  // Trigger haptic immediately when tapping Cancel (during grace period).
  const handleCancelPressIn = useCallback(() => {
    if (running && graceLeft > 0 && appSettings.vibrations) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [running, graceLeft, appSettings.vibrations]);

  // Trigger haptic immediately when tapping Give up (after grace period).
  const handleGiveUpPressIn = useCallback(() => {
    if (running && graceLeft === 0 && appSettings.vibrations) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
    }
  }, [running, graceLeft, appSettings.vibrations]);

  // Button press animation handlers
  const handleButtonPressIn = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [buttonScale]);

  const handleButtonPressOut = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [buttonScale]);

  // Main timer ticker: updates either the countdown or stopwatch every second
  useEffect(() => {
    clearTicker();
    if (!running) return;

    if (mode === "countdown") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            lastLeftRef.current = 0; // Update ref before stop so elapsed calculation is accurate
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

  // Sync timer when app returns to foreground (timer continues in real time while backgrounded)
  useEffect(() => {
    const appStateRef = { current: AppState.currentState };
    
    const onState = (nextState: AppStateStatus) => {
      // When app comes to foreground, cancel the notification since user is now in app
      if (
        running &&
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        // Cancel notification - user is now in app, they'll see completion naturally
        void cancelSessionCompleteNotification();
      }

      // Only act when coming BACK to active from background/inactive
      if (
        running &&
        sessionStartMsRef.current &&
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        const now = Date.now();
        const realElapsedSec = Math.floor((now - sessionStartMsRef.current) / 1000);

        if (mode === "countdown") {
          const newSecondsLeft = Math.max(0, lastCountdownTargetSec - realElapsedSec);
          if (newSecondsLeft <= 0) {
            // Countdown would have finished while backgrounded
            lastLeftRef.current = 0;
            void fullyStopAndReset("countdown-zero");
          } else {
            setSecondsLeft(newSecondsLeft);
          }
        } else {
          // Timer mode
          if (realElapsedSec >= maxSessionSeconds) {
            // Timer hit max while backgrounded
            void fullyStopAndReset("timer-max");
          } else {
            setSecondsElapsed(realElapsedSec);
          }
        }
      }
      appStateRef.current = nextState;
    };

    const sub = AppState.addEventListener("change", onState);
    return () => sub.remove();
  }, [running, mode, lastCountdownTargetSec, maxSessionSeconds]);

  // Countdown scrubber helpers
  // TimeTracker already handles snapping to 5-minute intervals on release, so we just convert progress to seconds
  const handleTrackerChange = (p: number) => {
    if (!running && mode === "countdown") {
      const next = Math.round(p * maxSessionSeconds);
      setSecondsLeft(next);
      setLastCountdownTargetSec(next);
    }
  };
  const handlePreviewProgress = (progress: number | null) => {
    if (progress == null) {
      if (lastPreviewSnap.current != null) {
        setSecondsLeft(lastPreviewSnap.current);
        setLastCountdownTargetSec(lastPreviewSnap.current);
      }
      setPreviewSeconds(null);
      lastPreviewSnap.current = null;
      return;
    }
    const SNAP_S = 300;
    const raw = progress * maxSessionSeconds;
    const next = raw < SNAP_S ? 0 : Math.round(raw / SNAP_S) * SNAP_S;
  
    lastPreviewSnap.current = next;
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

  // Calculate focus value: 0 = not running, 1 = laptop, 3 = pot_and_stove/cello_artisan
  const focusValue = useMemo(() => {
    if (!running) return 0;
    const gadget = userProfile?.selectedGadget;
    if (gadget === "gadget_laptop") return 1;
    if (gadget === "gadget_pot_and_stove") return 2;
    if (gadget === "gadget_cello_artisan") return 3;
    return 1; // Default to laptop animation if no gadget selected
  }, [running, userProfile?.selectedGadget]);

  const petAnimationView = petAnimationConfig ? (
    <PetAnimation
      source={petAnimationConfig.source}
      stateMachineName={petAnimationConfig.stateMachineName}
      focusInputName={petAnimationConfig.focusInputName}
      focusValue={focusValue}
      selectedHat={userProfile?.selectedHat}
      selectedCollar={userProfile?.selectedCollar}
      containerStyle={{ marginTop: 20, marginLeft: 5 }}
      animationStyle={{ width: "68%", height: "68%" }}
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
    if (activity === "Rest") return "Getting some rest...";
    return `Working on ${activity}...`;
  }, [running, activity, dailyFocusLabel]);

  const handleOpenPicker = () => {
    if (running) {
      showBanner("End your session before changing activity.", "error");
      return;
    }
    const displaySeconds = previewSeconds ?? secondsToShow;
    const totalMinutes = Math.floor(displaySeconds / 60);
    const seconds = Math.floor(displaySeconds % 60);
    const mm = totalMinutes.toString().padStart(2, "0");
    const ss = seconds.toString().padStart(2, "0");
    const timerDisplay = `${mm}:${ss}`;
    
    void SheetManager.show("tag-selection", {
      payload: {
        currentActivity: activity,
        currentTimerValue: timerDisplay,
        currentTimerSeconds: displaySeconds,
        onSelect: setActivity,
        onTimeChange: (newSeconds: number) => {
          if (mode === "countdown") {
            setSecondsLeft(newSeconds);
            setLastCountdownTargetSec(newSeconds);
          }
        },
        onStart: handleStart,
        onClosed: () => {},
      },
    });
  };


  return (
    <View className="flex-1 relative" style={{ backgroundColor: CoralPalette.primaryMuted }}>
      <StatusBar hidden={false} animated />

      <View
        className="absolute -top-14 left-1/2 -translate-x-1/2 z-10 flex-row rounded-full overflow-hidden"
        style={{
          backgroundColor: CoralPalette.greyVeryLight,
          borderColor: CoralPalette.border,
          borderWidth: 1,
          
        }}
      >
        <TouchableOpacity
          onPress={() => setMode("countdown")}
          onPressIn={() => handleModePressIn("countdown")}
          disabled={running}
          className="w-12 items-center py-3.5"
          style={{ backgroundColor: mode === "countdown" ? CoralPalette.primary : CoralPalette.greyVeryLight, opacity: running ? 0.6 : 1 }}
        >
          <Hourglass size={16} color={mode === "countdown" ? "#ffffff" : CoralPalette.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode("timer")}
          onPressIn={() => handleModePressIn("timer")}
          disabled={running}
          className="w-12 items-center py-3.5"
          style={{ backgroundColor: mode === "timer" ? CoralPalette.primary : CoralPalette.greyVeryLight, opacity: running ? 0.6 : 1 }}
        >
          <Timer size={16} color={mode === "timer" ? "#ffffff" : CoralPalette.primary} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 mt-20 items-center justify-evenly">
        <Text className="text-lg" style={{ color: CoralPalette.greyVeryLight, fontFamily: "Nunito" }}>
          {infoText}
        </Text>

        <View className="w-[75%] mt-10 aspect-square items-center justify-center">
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

        <View className="items-center mt-4 justify-center">
          <TouchableOpacity
            className={`flex-row items-center px-4 py-2 rounded-full ${running ? "opacity-60" : ""}`}
            onPress={handleOpenPicker}
            disabled={running}
            style={{
              backgroundColor: CoralPalette.greyVeryLight,
  
             
            }}
          >
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{
                backgroundColor: selectedTag?.color || CoralPalette.primary,
              }}
            />
            <Text
              className="text-sm font-semibold"
              style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}
            >
              {selectedTag?.label || activity}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="w-full items-center justify-center relative">
          <Text
            className="text-8xl tracking-widest opacity-0"
            style={{
              ...(Platform.OS === "ios" ? { fontVariant: ["tabular-nums"] as any } : {}),
              fontFamily: "Nunito",
              includeFontPadding: false,
              lineHeight: 120,
              fontSize: 90,
              color: CoralPalette.greyVeryLight,
            }}
          >
            00:00
          </Text>

          <Text
          className="tracking-widest absolute left-0 right-0 text-center"
            selectable={false}
            style={{
              ...(Platform.OS === "ios" ? { fontVariant: ["tabular-nums"] as any } : {}),
              fontFamily: "Nunito",
              fontWeight: "100",
              includeFontPadding: false,
              lineHeight: 120,
              fontSize: 90,
              color: CoralPalette.greyVeryLight,
            }}
          >
            {`${mm}:${ss}`}
          </Text>
        </View>

        <Animated.View
          style={{
            transform: [{ scale: buttonScale }],
          }}
        >
          <TouchableOpacity
            onPress={handleStartStop}
            onPressIn={(e) => {
              handleStartPressIn();
              handleCancelPressIn();
              handleGiveUpPressIn();
              handleButtonPressIn();
            }}
            onPressOut={handleButtonPressOut}
            disabled={!running && countdownInvalid}
            className="w-40 items-center py-3 mb-5 rounded-xl"
            style={{
              backgroundColor: CoralPalette.primary,
              opacity: running ? 0.9 : countdownInvalid ? 0.6 : 1,
              shadowColor: CoralPalette.primaryDark,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 1,
              elevation: 0,
            }}
            activeOpacity={1}
          >
            <Text
              className="text-lg text-white font-semibold shadow-lg"
              style={{ fontFamily: "Nunito" }}
            >
              {!running
                ? "Start"
                : graceLeft > 0
                ? `Cancel (${graceLeft})`
                : "Give up"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

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
        xpAwarded={sessionSummary.xpAwarded}
        friendshipXpAwarded={sessionSummary.friendshipXpAwarded}
        durationMinutes={Math.floor(sessionSummary.durationSec / 60)}
        activity={sessionSummary.activity}
        onClose={closeSessionSummary}
      />
    </View>
  );
}
