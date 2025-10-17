import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Dimensions,
  FlatList,
  GestureResponderEvent,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  SharedValue,
} from 'react-native-reanimated'
import LottieView from 'lottie-react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Animations } from '@/constants/animations'
import { sessionTracker } from '@/hooks/focus'
import { useWeeklyFocusData } from '@/hooks/account'
import { useGlobalContext } from '@/lib/global-provider'

const MODE_COLORS = {
  Study: '#0ea5e9',
  Work: '#f59e0b',
  Break: '#22c55e',
  Rest: '#a855f7',
} as const

const MODE_ANIMATIONS = {
  Study: Animations.catStudy,
  Work: Animations.catWork,
  Break: Animations.catBreak,
  Rest: Animations.catRest,
} as const

type ModeKey = keyof typeof MODE_COLORS
const MODE_OPTIONS: ModeKey[] = ['Study', 'Work', 'Break', 'Rest']

const MAX_MINUTES = 120
const STEP_MINUTES = 5
const INITIAL_MINUTES = 20

const VIEWBOX = 400
const TRACK_WIDTH = 18
const CIRCLE_RADIUS = 150
const RADIUS = CIRCLE_RADIUS - TRACK_WIDTH
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const TOTAL_STEPS = MAX_MINUTES / STEP_MINUTES
const HALF_STEPS = TOTAL_STEPS / 2
const STEP_DEGREES = 360 / TOTAL_STEPS

const ACTIVE_COLOR = '#3b82f6'
const TRACK_COLOR = '#dbeafe'
const KNOB_COLOR = '#3b82f6'
const KNOB_HALO_COLOR = '#3b82f6'
const KNOB_HALO_RADIUS = TRACK_WIDTH * 0.9
const KNOB_RADIUS = TRACK_WIDTH * 0.6
const SLIDER_SIZE = Math.min(Dimensions.get('window').height / 1.8, 440)
const PET_CIRCLE_SIZE = SLIDER_SIZE - TRACK_WIDTH * 4
const minutesToSeconds = (minutes: number) => minutes * 60

const clampStep = (step: number) =>
  Math.min(Math.max(step, 0), TOTAL_STEPS)

const CAT_STYLE_MAP: Record<'Idle' | ModeKey, { idleScale: number; runningScale: number; offsetX?: number; offsetY?: number }> = {
  Idle: { idleScale: 1.2  , runningScale: 1, offsetX: -0.02, offsetY: 0},
  Study: { idleScale: 0.8, runningScale: 0.65, offsetY: -0.02, offsetX: -0.01},
  Work: { idleScale: 0.82, runningScale: 0.7, offsetX: 0, offsetY: 0},
  Break: { idleScale: 1.5, runningScale: 0.75, offsetX: 0.01, offsetY: 0.02 },
  Rest: { idleScale: 0.8, runningScale: 0.8, offsetY: 0.09, offsetX: -0.08 },
}

const HEART_STYLE_MAP = {
  heartsSm: { scale: 0.8, offsetY: -0.25, offsetX: 0 },
  heartsMd: { scale: 0.9, offsetY: -0.32, offsetX: 0 },
  heartsLg: { scale: 1.05, offsetY: -0.7, offsetX: -0.15 },
} as const

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}`
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

type TimerMode = 'countdown' | 'stopwatch'

type FocusTimerProps = {
  headerLeft?: ReactNode
}

const ProgressRing = ({
  angle,
  showProgress = true,
}: {
  angle: SharedValue<number>
  showProgress?: boolean
}) => {
  const dashProps = useAnimatedProps(() => {
    const ratio = Math.min(Math.max(angle.value / 360, 0), 1)
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - ratio),
    }
  })

  const knobProps = useAnimatedProps(() => {
    const bounded = Math.min(Math.max(angle.value, 0), 360)
    const angleRad = ((bounded - 90) * Math.PI) / 180
    const center = VIEWBOX / 2
    return {
      cx: center + RADIUS * Math.cos(angleRad),
      cy: center + RADIUS * Math.sin(angleRad),
    }
  })

  const center = VIEWBOX / 2

  return (
    <Svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      style={{ width: '100%', height: '100%', position: 'absolute' }}
    >
      <Circle
        cx={center}
        cy={center}
        r={RADIUS}
        stroke={TRACK_COLOR}
        strokeWidth={TRACK_WIDTH}
        fill="none"
      />
      {showProgress && (
        <>
          <AnimatedCircle
            cx={center}
            cy={center}
            r={RADIUS}
            stroke={ACTIVE_COLOR}
            strokeWidth={TRACK_WIDTH}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${center} ${center})`}
            animatedProps={dashProps}
          />
          <AnimatedCircle
            r={KNOB_HALO_RADIUS}
            fill={KNOB_HALO_COLOR}
            animatedProps={knobProps}
          />
          <AnimatedCircle
            r={KNOB_RADIUS}
            fill={KNOB_COLOR}
            animatedProps={knobProps}
          />
        </>
      )}
    </Svg>
  )
}

const FocusTimer = ({ headerLeft }: FocusTimerProps) => {
  const { user } = useGlobalContext()
  const { weeklyData, refetch: refetchWeeklyFocusData } = useWeeklyFocusData()
  const [timerMode, setTimerMode] = useState<TimerMode>('countdown')
  const todayDateKey = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayFocusEntry = useMemo(
    () => weeklyData.find((entry) => entry.date === todayDateKey),
    [weeklyData, todayDateKey],
  )
  const focusStatusText = useMemo(() => {
    if (todayFocusEntry && todayFocusEntry.totalMinutes > 0) {
      const minutesLabel = todayFocusEntry.totalMinutes === 1 ? 'min' : 'mins'
      return `Focused for ${todayFocusEntry.totalMinutes} ${minutesLabel} today`
    }
    return 'Start focusing with your pet'
  }, [todayFocusEntry])

  const [selectedMinutes, setSelectedMinutes] =
    useState<number>(INITIAL_MINUTES)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    minutesToSeconds(INITIAL_MINUTES),
  )
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [sessionMinutes, setSessionMinutes] =
    useState<number>(INITIAL_MINUTES)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [heartSource, setHeartSource] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeKey>('Study')
  const [modePickerVisible, setModePickerVisible] = useState(false)
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const layoutRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })
  const previousStepRef = useRef<number>(INITIAL_MINUTES / STEP_MINUTES)
  const angle = useSharedValue((INITIAL_MINUTES / MAX_MINUTES) * 360)
  const [catSource, setCatSource] = useState(Animations.catIdle)
  const catAnimationRef = useRef<LottieView>(null)
  const animationTimeoutRef = useRef<number | null>(null)
  const heartAnimationRef = useRef<LottieView>(null)
  const lastHeartTriggerRef = useRef<Record<number, number>>({})
  const sixtyDelayTimeoutRef = useRef<number | null>(null)
  const isStopwatch = timerMode === 'stopwatch'

  const refreshWeeklyFocus = useCallback(async () => {
    if (!user?.$id) return
    try {
      await refetchWeeklyFocusData()
    } catch (error) {
      console.error('Failed to refresh weekly focus data:', error)
    }
  }, [refetchWeeklyFocusData, user?.$id])
  const handleTimerModePress = useCallback(
    (nextMode: TimerMode) => {
      if (timerMode === nextMode) return
      if (isRunning) {
        Alert.alert('Timer running', 'Leave the session to change mode.')
        return
      }

      setTimerMode(nextMode)

      if (nextMode === 'countdown') {
        const defaultSeconds = minutesToSeconds(INITIAL_MINUTES)
        setSelectedMinutes(INITIAL_MINUTES)
        setSessionMinutes(INITIAL_MINUTES)
        setRemainingSeconds(defaultSeconds)
        previousStepRef.current = INITIAL_MINUTES / STEP_MINUTES
      } else {
        setSelectedMinutes(0)
        setSessionMinutes(0)
        setRemainingSeconds(0)
        setElapsedSeconds(0)
        previousStepRef.current = 0
      }
    },
    [isRunning, setElapsedSeconds, timerMode],
  )

  const scheduleCatReplay = useCallback(
    (delay = 8000) => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      animationTimeoutRef.current = setTimeout(() => {
        if (!isRunning && catAnimationRef.current) {
          catAnimationRef.current.reset()
          catAnimationRef.current.play()
        }
      }, delay)
    },
    [isRunning],
  )

  const stopRunningSession = useCallback(async () => {
    // Track session end - left early
    try {
      await sessionTracker.endSession()
      await refreshWeeklyFocus()
    } catch (error) {
      console.error(error)
    }

    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timerMode === 'countdown') {
      previousStepRef.current = selectedMinutes / STEP_MINUTES
      const currentSeconds = minutesToSeconds(selectedMinutes)
      setRemainingSeconds(currentSeconds)
      setSessionMinutes(selectedMinutes)
    } else {
      previousStepRef.current = 0
      setElapsedSeconds(0)
      setRemainingSeconds(0)
      setSessionMinutes(0)
    }
    setCatSource(Animations.catIdle)
    catAnimationRef.current?.reset()
    catAnimationRef.current?.play()
    scheduleCatReplay()
  }, [refreshWeeklyFocus, scheduleCatReplay, selectedMinutes, timerMode])

  useEffect(() => {
    return () => {
      // End any active session on cleanup
      if (sessionTracker.getCurrentSession()) {
        sessionTracker.endSession().catch(console.error);
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      if (sixtyDelayTimeoutRef.current) {
        clearTimeout(sixtyDelayTimeoutRef.current)
        sixtyDelayTimeoutRef.current = null
      }
    }
  }, [])

  const playHeartAnimation = useCallback(
    (heart: string, threshold: number, delay = 0) => {
      const execute = () => {
        lastHeartTriggerRef.current[threshold] = Date.now()
        setHeartSource(heart)
        heartAnimationRef.current?.reset()
        heartAnimationRef.current?.play()
        setCatSource(Animations.catIdle)
        catAnimationRef.current?.reset()
        catAnimationRef.current?.play()
        scheduleCatReplay()
      }

      if (delay > 0) {
        if (sixtyDelayTimeoutRef.current) {
          clearTimeout(sixtyDelayTimeoutRef.current)
        }
        sixtyDelayTimeoutRef.current = setTimeout(() => {
          execute()
          sixtyDelayTimeoutRef.current = null
        }, delay)
      } else {
        execute()
      }
    },
    [scheduleCatReplay],
  )

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    layoutRef.current = { width, height }
  }, [])

  const updateFromGesture = useCallback(
    (event: GestureResponderEvent) => {
      if (isRunning || isStopwatch) return
      const { width, height } = layoutRef.current
      if (!width || !height) return

      const { locationX, locationY } = event.nativeEvent
      const centerX = width / 2
      const centerY = height / 2
      const dx = locationX - centerX
      const dy = locationY - centerY

      let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
      if (angleDeg < 0) angleDeg += 360
      const normalizedAngle = angleDeg % 360

      const previousStep = previousStepRef.current
      const previousAngle = (previousStep / TOTAL_STEPS) * 360
      let delta = normalizedAngle - previousAngle
      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360
      const movingForward = delta > 0

      if (previousStep === TOTAL_STEPS && movingForward && normalizedAngle < 180) {
        return
      }

      const rawStep = Math.floor((normalizedAngle + STEP_DEGREES / 2) / STEP_DEGREES)
      let nextStep = clampStep(rawStep)

      if (nextStep === 0 && normalizedAngle > STEP_DEGREES * 0.75) {
        nextStep = 1
      }

      if (nextStep >= TOTAL_STEPS && normalizedAngle < STEP_DEGREES * 2) {
        nextStep = TOTAL_STEPS
      }

      if (
        previousStep === TOTAL_STEPS &&
        movingForward &&
        normalizedAngle > 180
      ) {
        nextStep = HALF_STEPS
      }

      if (previousStep === 0 && !movingForward && normalizedAngle > 180) {
        nextStep = 0
      }

      previousStepRef.current = nextStep
      const nextMinutes = nextStep * STEP_MINUTES
      setSelectedMinutes(nextMinutes)
      setRemainingSeconds(minutesToSeconds(nextMinutes))
      setSessionMinutes(nextMinutes)
      if (!isRunning) {
        let newHeart: string | null = null
        if (nextMinutes === 120) {
          newHeart = Animations.heartsLg
        } else if (nextMinutes === 90) {
          newHeart = Animations.heartsMd
        } else if (nextMinutes === 60) {
          newHeart = Animations.heartsSm
        }

        if (newHeart && newHeart !== heartSource) {
          const threshold = nextMinutes
          const now = Date.now()
          const lastTriggered = lastHeartTriggerRef.current[threshold] ?? 0
          if (now - lastTriggered >= 2000) {
            const delay = threshold === 60 ? 200 : 0
            playHeartAnimation(newHeart, threshold, delay)
          }
        } else if (!newHeart && heartSource) {
          setHeartSource(null)
        }
      }
    },
    [heartSource, isRunning, isStopwatch, playHeartAnimation],
  )

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isRunning && !isStopwatch,
        onMoveShouldSetPanResponder: () => !isRunning && !isStopwatch,
        onPanResponderMove: updateFromGesture,
      }),
    [isRunning, isStopwatch, updateFromGesture],
  )

  const handleControlPress = useCallback(() => {
    if (isRunning) {
      setLeaveConfirmVisible(true)
      return
    }

    if (timerMode === 'countdown') {
      if (selectedMinutes === 0) return
      const startingSeconds = minutesToSeconds(selectedMinutes)
      setRemainingSeconds(startingSeconds)
      setSessionMinutes(selectedMinutes)
      previousStepRef.current = selectedMinutes / STEP_MINUTES
    } else {
      setElapsedSeconds(0)
      setSessionMinutes(0)
      setRemainingSeconds(0)
      previousStepRef.current = 0
    }

    setIsRunning(true)
    
    // Track session start
    sessionTracker.startSession(user?.$id);
    
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }
    setCatSource(MODE_ANIMATIONS[mode])
    setHeartSource(null)
    catAnimationRef.current?.reset()
    catAnimationRef.current?.play()

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (timerMode === 'countdown') {
        setRemainingSeconds((previous) => {
          if (previous <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            
            // Track session completion
            sessionTracker
              .endSession()
              .then(refreshWeeklyFocus)
              .catch(console.error)
            
            setIsRunning(false)
            setSelectedMinutes(0)
            setSessionMinutes(0)
            previousStepRef.current = 0
            setCatSource(Animations.catIdle)
            catAnimationRef.current?.reset()
            catAnimationRef.current?.play()
            scheduleCatReplay()
            return 0
          }
          return previous - 1
        })
      } else {
        setElapsedSeconds((previous) => previous + 1)
      }
    }, 1000)
  }, [
    isRunning,
    mode,
    refreshWeeklyFocus,
    scheduleCatReplay,
    selectedMinutes,
    timerMode,
    user?.$id,
  ])

  const totalSessionSeconds = sessionMinutes * 60
  const progressMinutes = useMemo(() => {
    if (isRunning && sessionMinutes > 0) {
      return (remainingSeconds / totalSessionSeconds) * sessionMinutes
    }
    return selectedMinutes
  }, [isRunning, remainingSeconds, selectedMinutes, sessionMinutes, totalSessionSeconds])

  const progressRatio = sessionMinutes === 0 ? 0 : progressMinutes / MAX_MINUTES
  const targetAngle = Math.min(Math.max(progressRatio, 0), 1) * 360

  useEffect(() => {
    angle.value = withTiming(targetAngle, {
      duration: isRunning ? 240 : 80,
      easing: Easing.out(Easing.quad),
    })
  }, [angle, isRunning, targetAngle])

  const currentCatStyleKey: 'Idle' | ModeKey =
    catSource === Animations.catIdle ? 'Idle' : mode
  const catConfig = CAT_STYLE_MAP[currentCatStyleKey]
  const catScale = isRunning ? catConfig.runningScale : catConfig.idleScale
  const catTransforms = [
    { translateY: (catConfig.offsetY ?? 0) * PET_CIRCLE_SIZE },
    { translateX: (catConfig.offsetX ?? 0) * PET_CIRCLE_SIZE },
  ]

  let heartConfig: (typeof HEART_STYLE_MAP)[keyof typeof HEART_STYLE_MAP] | null = null
  if (heartSource === Animations.heartsSm) heartConfig = HEART_STYLE_MAP.heartsSm
  else if (heartSource === Animations.heartsMd) heartConfig = HEART_STYLE_MAP.heartsMd
  else if (heartSource === Animations.heartsLg) heartConfig = HEART_STYLE_MAP.heartsLg

  const heartTransforms = heartConfig
    ? [
        { translateY: (heartConfig.offsetY ?? 0) * PET_CIRCLE_SIZE },
        { translateX: (heartConfig.offsetX ?? 0) * PET_CIRCLE_SIZE },
      ]
    : []
  const heartScale = heartConfig?.scale ?? 1

  const formattedTime = useMemo(() => {
    if (isStopwatch) {
      return formatTime(elapsedSeconds)
    }
    const displaySeconds = isRunning
      ? remainingSeconds
      : minutesToSeconds(selectedMinutes)
    return formatTime(displaySeconds)
  }, [elapsedSeconds, isRunning, isStopwatch, remainingSeconds, selectedMinutes])

  return (
    <SafeAreaView className="w-full items-center px-6 pt-4 pb-10">
      <View className="w-full flex-row items-center">
        <View className="flex-1 items-start justify-center">
          {headerLeft ?? <View className="w-12 h-12" />}
        </View>
        <View className="relative w-32 rounded-full overflow-hidden">
          <View className="absolute inset-0" style={{ backgroundColor: KNOB_COLOR }} />
          <View className="absolute inset-0 flex-row">
            <View className={`flex-1 ${timerMode === 'countdown' ? 'bg-white/20' : 'bg-transparent'}`} />
            <View className={`flex-1 ${timerMode === 'stopwatch' ? 'bg-white/20' : 'bg-transparent'}`} />
          </View>
          <View className="relative z-10 flex-row items-center justify-center">
            <Pressable
              className="flex-1 items-center justify-center py-2 pl-1"
              onPress={() => handleTimerModePress('countdown')}
            >
              <MaterialCommunityIcons
                name={timerMode === 'countdown' ? 'timer-sand-full' : 'timer-sand-empty'}
                size={22}
                color={timerMode === 'countdown' ? '#fff' : 'rgba(255,255,255,0.65)'}
              />
            </Pressable>

            <Pressable
              className="flex-1 items-center justify-center py-2 pr-1"
              onPress={() => handleTimerModePress('stopwatch')}
            >
              <MaterialCommunityIcons
                name={timerMode === 'stopwatch' ? 'timer' : 'timer-outline'}
                size={22}
                color={timerMode === 'stopwatch' ? '#fff' : 'rgba(255,255,255,0.65)'}
              />
            </Pressable>
          </View>
        </View>
        <View className="flex-1" />
      </View>
      <View className="items-center top-16">
        <Text className="mt-4 text-base font-medium text-slate-600">
          {focusStatusText}
        </Text>

        <View className="items-center justify-center mt-8">
        <View style={{ width: SLIDER_SIZE, height: SLIDER_SIZE }} pointerEvents="none">
          <ProgressRing angle={angle} showProgress={timerMode === 'countdown'} />
        </View>

        {timerMode === 'countdown' && (
          <View
            style={{ position: 'absolute', width: SLIDER_SIZE, height: SLIDER_SIZE }}
            onLayout={handleLayout}
            {...panResponder.panHandlers}
            
          >
            <View style={{ flex: 1 }} />
          </View>
        )}

        <View
          pointerEvents="none"
          className="absolute items-center justify-center"
          style={{
            width: PET_CIRCLE_SIZE,
            height: PET_CIRCLE_SIZE,
            borderRadius: PET_CIRCLE_SIZE / 2,
          }}
        >
          <LottieView
            ref={catAnimationRef}
            source={catSource}
            autoPlay
            loop={false}
            onAnimationFinish={() => {
              if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current)
                animationTimeoutRef.current = null
              }
              if (isRunning) {
                catAnimationRef.current?.reset()
                catAnimationRef.current?.play()
              } else {
                scheduleCatReplay()
              }
            }}
            style={{
              width: PET_CIRCLE_SIZE * catScale,
              height: PET_CIRCLE_SIZE * catScale,
              transform: catTransforms,
            }}
          />
          {heartSource && (
            <LottieView
              ref={heartAnimationRef}
              source={heartSource}
              autoPlay
              loop={false}
              onAnimationFinish={() => {
                setHeartSource(null)
              }}
              style={{
                position: 'absolute',
                width: PET_CIRCLE_SIZE * heartScale,
                height: PET_CIRCLE_SIZE * heartScale,
                transform: heartTransforms,
              }}
            />
          )}
        </View>
      </View>
      <View className="items-center -mt-7 mb-3">
        <Pressable
          className="flex-row items-center gap-2 rounded-full bg-sky-100 px-5 py-2"
          onPress={() => {
            if (isRunning) {
              Alert.alert('Timer running', 'Leave the session to change mode.')
              return
            }
            setModePickerVisible(true)
          }}
          style={{ elevation: 2 }}
        >
          <View
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: MODE_COLORS[mode] }}
          />
          <Text className="font-medium text-sky-800">{mode}</Text>
        </Pressable>
      </View>

      <Text
        className="font-medium text-slate-700 top-2"
        style={{ fontSize: 85,  }}
      >
        {formattedTime}
      </Text>

      <Pressable
        className="min-w-[180px] items-center rounded-full px-10 py-3.5 shadow-lg mt-3 top-5"
        style={{
          backgroundColor: isRunning ? '#f59e0b' : KNOB_COLOR,
          shadowColor: isRunning ? '#92400e' : '#1d4ed8',
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
        onPress={handleControlPress}
      >
        <Text className="text-lg font-semibold text-white">
          {isRunning ? (timerMode === 'stopwatch' ? 'Stop' : 'Leave') : 'Start'}
        </Text>
      </Pressable>

      <Modal
        transparent
        visible={leaveConfirmVisible}
        animationType="fade"
        onRequestClose={() => setLeaveConfirmVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40"
          onPress={() => setLeaveConfirmVisible(false)}
        >
          <Pressable
            className="w-72 rounded-3xl bg-white px-6 py-6 shadow-2xl"
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="mb-4 text-center text-lg font-semibold text-slate-800">
              Are you sure?
            </Text>
            <Text className="mb-6 text-center text-sm text-slate-500">
              If you leave now the session will end.
            </Text>
            <View className="flex-row justify-between gap-4">
              <Pressable
                className="flex-1 items-center rounded-full border border-slate-200 px-4 py-2"
                onPress={() => setLeaveConfirmVisible(false)}
              >
                <Text className="font-medium text-slate-600">Cancel</Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-full bg-red-500 px-4 py-2 shadow"
                onPress={() => {
                  setLeaveConfirmVisible(false)
                  stopRunningSession()
                }}
              >
                <Text className="font-medium text-white">Leave</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        visible={modePickerVisible}
        animationType="fade"
        onRequestClose={() => setModePickerVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40"
          onPress={() => setModePickerVisible(false)}
        >
          <Pressable
            className="w-72 rounded-3xl bg-white px-5 py-5 shadow-2xl"
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="mb-3 text-center text-base font-semibold text-slate-700">
              Select Mode
            </Text>
            <FlatList
              data={MODE_OPTIONS}
              keyExtractor={(item) => item}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
              renderItem={({ item }) => (
                <Pressable
                  className={`items-center rounded-2xl border ${
                    mode === item ? 'border-sky-400 bg-sky-50' : 'border-slate-200'
                  }`}
                  style={{ flex: 1, marginHorizontal: 2, paddingVertical: 8, paddingHorizontal: 6 }}
                  onPress={() => {
                    setMode(item)
                    setModePickerVisible(false)
                  }}
                >
                  <View
                    className="mb-2 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: MODE_COLORS[item] }}
                  />
                  <Text className="text-sm font-medium text-slate-700">{item}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
      </View>
    </SafeAreaView> 

  ) 
}

export default FocusTimer
