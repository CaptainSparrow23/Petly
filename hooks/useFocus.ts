import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, GestureResponderEvent, LayoutChangeEvent, PanResponder } from 'react-native';
import {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import Constants from 'expo-constants';
import { Animations } from '@/constants/animations';
import { useGlobalContext } from '@/lib/global-provider';

export const MODE_COLORS = {
  Study: '#0ea5e9',
  Work: '#f59e0b',
  Break: '#22c55e',
  Rest: '#a855f7',
} as const;

export const MODE_LIGHT_COLORS = {
  Study: '#e0f2fe',
  Work: '#ffedd5',
  Break: '#dcfce7',
  Rest: '#f3e8ff',
} as const;

export const MODE_OPTIONS = ['Study', 'Work', 'Break', 'Rest'] as const;
export type ModeKey = (typeof MODE_OPTIONS)[number];
export type TimerMode = 'countdown' | 'stopwatch';

const PET_ANIMATIONS = {
  Skye: {
    Idle: Animations.skyeIdle,
    Study: Animations.skyeStudy,
    Work: Animations.skyeWork,
    Break: Animations.skyeBreak,
    Rest: Animations.skyeRest,
  },
  Lancelot: {
    Idle: Animations.lancelotIdle,
    Study: Animations.lancelotStudy,
    Work: Animations.lancelotWork,
    Break: Animations.lancelotBreak,
    Rest: Animations.lancelotRest,
  },
} as const;

type PetName = keyof typeof PET_ANIMATIONS;

type PetPoseStyle = {
  idleScale: number;
  runningScale: number;
  idleOffset?: { x?: number; y?: number };
  runningOffset?: { x?: number; y?: number };
};

const DEFAULT_PET_STYLES: Record<'Idle' | ModeKey, PetPoseStyle> = {
  Idle: { idleScale: 1.2, runningScale: 1, idleOffset: { x: -2 } },
  Study: { idleScale: 0.8, runningScale: 0.65 },
  Work: { idleScale: 0.82, runningScale: 0.7 },
  Break: { idleScale: 1.5, runningScale: 0.75 },
  Rest: {
    idleScale: 0.8,
    runningScale: 0.8,
    idleOffset: { x: -36, y: 38 },
    runningOffset: { x: -36, y: 38 },
  },
};

const PET_ANIMATION_STYLES: Record<PetName, Record<'Idle' | ModeKey, PetPoseStyle>> = {
  Skye: DEFAULT_PET_STYLES,
  Lancelot: {
    Idle: { idleScale: 0.6, runningScale: 0.95, idleOffset: { x: 0, y: 6 }, runningOffset: { x: -4, y: 4 } },
    Study: { idleScale: 0.85, runningScale: 0.7, idleOffset: { x: -4, y: 8 }, runningOffset: { x: -4, y: 6 } },
    Work: { idleScale: 0.9, runningScale: 0.72, idleOffset: { x: -6, y: 10 }, runningOffset: { x: -6, y: 8 } },
    Break: { idleScale: 1.4, runningScale: 1, idleOffset: { x: 5, y: 20 }, runningOffset: { x: 5, y: 16 } },
    Rest: { idleScale: 0.85, runningScale: 0.6, idleOffset: { x: -30, y: 40 }, runningOffset: { x: -10, y: -70 } },
  },
};


const minutesToSeconds = (minutes: number) => minutes * 60;

// sizes exported so the screen/components align
const SLIDER_SIZE = Math.min(Dimensions.get('window').height / 1.8, 440);
export const PET_CIRCLE_SIZE = SLIDER_SIZE - 18 * 4;


interface SessionData {
  startTime: number;
  endTime?: number;
  duration?: number;
  userId?: string;
  mode?: string;
}

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

async function saveFocusTimeToBackend(
  userId: string,
  duration: number,
  mode: string | undefined,
  startTime?: number,
  endTime?: number,
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/focus/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, duration, mode, startTime, endTime }),
    });
    if (!response.ok) throw new Error(`Failed to save focus time: ${response.statusText}`);

  } catch (error) {
    console.error('❌ Failed to save focus time to database:', error);
    throw error;
  }
}

class SessionTracker {
  private currentSession: SessionData | null = null;

  startSession(userId?: string, mode?: string): void {
    const startTime = Date.now();
    this.currentSession = { startTime, userId, mode };
    console.log(`📚 Focus session started`);
    console.log(`⏰ Start time: ${new Date(startTime).toLocaleTimeString()}`);
    if (userId) console.log(`👤 User ID: ${userId}`);
  }

  async endSession(): Promise<void> {
    if (!this.currentSession) {
      console.log('⚠️ No active session to end');
      return;
    }

    const endTime = Date.now();
    const duration = endTime - this.currentSession.startTime;
    const durationMinutes = Math.floor(duration / (1000 * 60));
    const durationSeconds = Math.floor((duration % (1000 * 60)) / 1000);

    this.currentSession.endTime = endTime;
    this.currentSession.duration = duration;

    console.log(`\n🎯 FOCUS SESSION COMPLETE`);
    console.log(`⏰ Duration: ${durationMinutes}m ${durationSeconds}s`);
    console.log(`🕐 Start: ${new Date(this.currentSession.startTime).toLocaleTimeString()}`);
    console.log(`🕕 End: ${new Date(endTime).toLocaleTimeString()}`);

    if (this.currentSession.userId) {
      try {
        console.log(`💾 Saving focus time to database...`);
        await saveFocusTimeToBackend(
          this.currentSession.userId,
          duration,
          this.currentSession.mode,
          this.currentSession.startTime,
          endTime,
        );
      } catch (error) {
        console.error('❌ Failed to save focus time:', error);
      }
    } else {
      console.log(`⚠️ No user ID available - focus time not saved`);
    }

    console.log(`\n`);
    this.currentSession = null;
  }

  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }
}

const sessionTracker = new SessionTracker();

/* ------------------------------ the hook ------------------------------ */

export const useFocusTimer = () => {
  const { userProfile, showBanner } = useGlobalContext();

  const [timerMode, setTimerMode] = useState<TimerMode>('countdown');
  const [isRunning, setIsRunning] = useState(false);

  const hasPetAnimations = useMemo(
    () => !!(userProfile?.selectedPet && Object.prototype.hasOwnProperty.call(PET_ANIMATIONS, userProfile.selectedPet)),
    [userProfile?.selectedPet]
  );

  const activePetName = useMemo<PetName>(
    () => (hasPetAnimations && userProfile?.selectedPet ? (userProfile.selectedPet as PetName) : 'Skye'),
    [hasPetAnimations, userProfile?.selectedPet]
  );

  const petAnimations = PET_ANIMATIONS[activePetName];
  const idleAnimation = petAnimations.Idle;
  const modeAnimations = useMemo(
    () => ({ Study: petAnimations.Study, Work: petAnimations.Work, Break: petAnimations.Break, Rest: petAnimations.Rest }),
    [petAnimations]
  );
  const petStyles = PET_ANIMATION_STYLES[activePetName] ?? DEFAULT_PET_STYLES;
  const [selectedMinutes, setSelectedMinutes] = useState<number>(20);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(minutesToSeconds(20));
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [sessionMinutes, setSessionMinutes] = useState<number>(20);
  const [mode, setModeState] = useState<ModeKey>('Study');
  const [modePickerVisible, setModePickerVisible] = useState(false);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const layoutRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const previousStepRef = useRef<number>(4); // 20 minutes / 5-minute steps
  const angle = useSharedValue(60); // (20/120)*360
  const timerOpacity = useSharedValue(1);
  const timerScale = useSharedValue(1);
  const countdownButtonOpacity = useSharedValue(1);
  const stopwatchButtonOpacity = useSharedValue(0);
  const [catSource, setCatSource] = useState(idleAnimation);
  const catAnimationRef = useRef<LottieView>(null);
  const isStopwatch = timerMode === 'stopwatch';

  const handleTimerModePress = useCallback(
    (nextMode: TimerMode) => {
      if (timerMode === nextMode) return;
      if (isRunning) {
        showBanner('Leave the session to change mode', 'warning');
        return;
      }

      if (nextMode === 'countdown') {
        countdownButtonOpacity.value = withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) });
        stopwatchButtonOpacity.value = withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) });
      } else {
        countdownButtonOpacity.value = withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) });
        stopwatchButtonOpacity.value = withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) });
      }

      timerOpacity.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
      timerScale.value = withTiming(0.8, { duration: 200, easing: Easing.out(Easing.ease) });

      setTimeout(() => {
        setTimerMode(nextMode);

        if (nextMode === 'countdown') {
          const defaultSeconds = minutesToSeconds(20);
          setSelectedMinutes(20);
          setSessionMinutes(20);
          setRemainingSeconds(defaultSeconds);
          previousStepRef.current = 4;
          angle.value = withTiming(60, { duration: 800, easing: Easing.out(Easing.cubic) });
        } else {
          setSelectedMinutes(0);
          setSessionMinutes(0);
          setRemainingSeconds(0);
          setElapsedSeconds(0);
          previousStepRef.current = 0;
          angle.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
        }

        timerOpacity.value = withTiming(1, { duration: 300, easing: Easing.in(Easing.ease) });
        timerScale.value = withTiming(1, { duration: 300, easing: Easing.in(Easing.ease) });
      }, 200);
    },
    [isRunning, timerMode, angle, timerOpacity, timerScale, countdownButtonOpacity, stopwatchButtonOpacity, showBanner]
  );

  useEffect(() => {
    const nextSource = isRunning ? modeAnimations[mode] : idleAnimation;
    if (catSource !== nextSource) {
      setCatSource(nextSource);
      catAnimationRef.current?.reset();
      catAnimationRef.current?.play();
    }
  }, [catSource, idleAnimation, isRunning, mode, modeAnimations]);

  useEffect(() => {
    return () => {
      if (sessionTracker.getCurrentSession()) {
        sessionTracker.endSession().catch(console.error);
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    layoutRef.current = { width, height };
  }, []);

  const updateFromGesture = useCallback(
    (event: GestureResponderEvent) => {
      if (isRunning || isStopwatch) return;
      const { width, height } = layoutRef.current;
      if (!width || !height) return;

      const { locationX, locationY } = event.nativeEvent;
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = locationX - centerX;
      const dy = locationY - centerY;

      let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angleDeg < 0) angleDeg += 360;
      const normalizedAngle = angleDeg % 360;

      const rawStep = normalizedAngle / 15;
      let nextStep = Math.round(rawStep);
      nextStep = Math.min(Math.max(nextStep, 0), 24);

      const prevStep = previousStepRef.current ?? nextStep;
      const nearStartThreshold = 15;
      const nearEndThreshold = 360 - 15;
      const halfwaySteps = 24 / 2;

      if (prevStep <= 1 && normalizedAngle >= nearEndThreshold) nextStep = 0;
      else if (prevStep >= 24 - 1 && normalizedAngle <= nearStartThreshold) nextStep = 24;
      else if (normalizedAngle >= 360 - 15 / 2) nextStep = 24;

      if (prevStep === 24 && rawStep < halfwaySteps) nextStep = 24;
      if (prevStep === 0 && rawStep > halfwaySteps) nextStep = 0;

      previousStepRef.current = nextStep;
      const nextMinutes = nextStep * 5;
      setSelectedMinutes(nextMinutes);
      setRemainingSeconds(minutesToSeconds(nextMinutes));
      setSessionMinutes(nextMinutes);
    },
    [isRunning, isStopwatch]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isRunning && !isStopwatch,
        onMoveShouldSetPanResponder: () => !isRunning && !isStopwatch,
        onPanResponderGrant: updateFromGesture,
        onPanResponderMove: updateFromGesture,
      }),
    [isRunning, isStopwatch, updateFromGesture]
  );

  const handleControlPress = useCallback(() => {
    if (isRunning) {
      setLeaveConfirmVisible(true);
      return;
    }

    if (timerMode === 'countdown') {
      if (selectedMinutes === 0) {
        showBanner('Please select a time greater than 0 minutes', 'error');
        return;
      }
      const startingSeconds = minutesToSeconds(selectedMinutes);
      setRemainingSeconds(startingSeconds);
      setSessionMinutes(selectedMinutes);
      previousStepRef.current = selectedMinutes / 5;
    } else {
      setElapsedSeconds(0);
      setSessionMinutes(0);
      setRemainingSeconds(0);
      previousStepRef.current = 0;
    }

    setIsRunning(true);
    sessionTracker.startSession(userProfile?.userId, mode);

    setCatSource(modeAnimations[mode]);
    catAnimationRef.current?.reset();
    catAnimationRef.current?.play();

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (timerMode === 'countdown') {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            sessionTracker.endSession().catch(console.error);
            setIsRunning(false);
            setSelectedMinutes(0);
            setSessionMinutes(0);
            previousStepRef.current = 0;
            setCatSource(idleAnimation);
            catAnimationRef.current?.reset();
            catAnimationRef.current?.play();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);
  }, [isRunning, mode, selectedMinutes, timerMode, userProfile?.userId, idleAnimation, modeAnimations, showBanner]);

  const totalSessionSeconds = sessionMinutes * 60;
  const progressMinutes = useMemo(() => {
    if (isRunning && sessionMinutes > 0) return (remainingSeconds / totalSessionSeconds) * sessionMinutes;
    return selectedMinutes;
  }, [isRunning, remainingSeconds, selectedMinutes, sessionMinutes, totalSessionSeconds]);

  const progressRatio = sessionMinutes === 0 ? 0 : progressMinutes / 120;
  const targetAngle = Math.min(Math.max(progressRatio, 0), 1) * 360;

  useEffect(() => {
    angle.value = withTiming(targetAngle, { duration: isRunning ? 240 : 80, easing: Easing.out(Easing.quad) });
  }, [angle, isRunning, targetAngle]);

  const currentCatStyleKey: 'Idle' | ModeKey = catSource === idleAnimation ? 'Idle' : mode;
  const catConfig = petStyles[currentCatStyleKey] ?? DEFAULT_PET_STYLES[currentCatStyleKey];
  const catScale = isRunning ? catConfig.runningScale : catConfig.idleScale;
  const catOffset = isRunning ? catConfig.runningOffset : catConfig.idleOffset;

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formattedTime = useMemo(() => {
    if (isStopwatch) return formatTime(elapsedSeconds);
    const displaySeconds = isRunning ? remainingSeconds : minutesToSeconds(selectedMinutes);
    return formatTime(displaySeconds);
  }, [elapsedSeconds, isRunning, isStopwatch, remainingSeconds, selectedMinutes]);

  const countdownButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(countdownButtonOpacity.value, [0, 1], ['#9CA3AF', '#191d31']),
  }));

  const stopwatchButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(stopwatchButtonOpacity.value, [0, 1], ['#9CA3AF', '#191d31']),
  }));

  const setMode = (m: ModeKey) => {
    if (isRunning) {
      showBanner('Leave the session to change mode', 'warning');
      return;
    }
    setModeState(m);
  };

  const confirmLeave = () => {
    setLeaveConfirmVisible(false);
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerMode === 'countdown') {
      previousStepRef.current = selectedMinutes / 5;
      const currentSeconds = minutesToSeconds(selectedMinutes);
      setRemainingSeconds(currentSeconds);
      setSessionMinutes(selectedMinutes);
    } else {
      previousStepRef.current = 0;
      setElapsedSeconds(0);
      setRemainingSeconds(0);
      setSessionMinutes(0);
    }
    setCatSource(idleAnimation);
    catAnimationRef.current?.reset();
    catAnimationRef.current?.play();
    sessionTracker.endSession().catch(console.error);
  };

  return {
    // public state
    userProfile,
    isRunning,
    isStopwatch,
    timerMode,
    mode,
    formattedTime,
    modePickerVisible,
    leaveConfirmVisible,
    hasPetAnimations,

    // animated/shared
    angle,
    timerOpacity,
    timerScale,
    countdownButtonStyle,
    stopwatchButtonStyle,

    // pet visuals
    catSource,
    catAnimationRef,
    catScale,
    catOffset,

    // actions
    handleTimerModePress,
    handleControlPress,
    setModePickerVisible,
    setLeaveConfirmVisible,
    handleLayout,
    panHandlers: panResponder.panHandlers,
    setMode,
    confirmLeave,
  };
};
