import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dimensions, FlatList, GestureResponderEvent, LayoutChangeEvent, Modal, PanResponder, Pressable, Text, View, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming, SharedValue } from 'react-native-reanimated'
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
} as const

type PetName = keyof typeof PET_ANIMATIONS
const DEFAULT_PET: PetName = 'Skye'


const MODE_OPTIONS: ModeKey[] = ['Study', 'Work', 'Break', 'Rest']
const INITIAL_MINUTES = 20
const VIEWBOX = 400
const TRACK_WIDTH = 18
const CIRCLE_RADIUS = 150
const RADIUS = CIRCLE_RADIUS - TRACK_WIDTH
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const TOTAL_STEPS = 24
const STEP_DEGREES = 360 / TOTAL_STEPS
const SLIDER_SIZE = Math.min(Dimensions.get('window').height / 1.8, 440)
const PET_CIRCLE_SIZE = SLIDER_SIZE - TRACK_WIDTH * 4
const minutesToSeconds = (minutes: number) => minutes * 60
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

type PetPoseStyle = {
  idleScale: number
  runningScale: number
  idleOffset?: { x?: number; y?: number }
  runningOffset?: { x?: number; y?: number }
}

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
}

const PET_ANIMATION_STYLES: Record<PetName, Record<'Idle' | ModeKey, PetPoseStyle>> = {
  Skye: DEFAULT_PET_STYLES,
  Lancelot: {
    Idle: { idleScale: 0.6, runningScale: 0.95, idleOffset: { x: 0, y: 6 }, runningOffset: { x: -4, y: 4 } },
    Study: { idleScale: 0.85, runningScale: 0.7, idleOffset: { x: -4, y: 8 }, runningOffset: { x: -4, y: 6 } },
    Work: { idleScale: 0.9, runningScale: 0.72, idleOffset: { x: -6, y: 10 }, runningOffset: { x: -6, y: 8 } },
    Break: { idleScale: 1.4, runningScale: 1, idleOffset: { x: 5, y: 20 }, runningOffset: { x: 5, y: 16 } },
    Rest: { idleScale: 0.85, runningScale: 0.6, idleOffset: { x: -30, y: 40 }, runningOffset: { x: -10, y: -70 } },
  },
}

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}`
}

type ModeKey = keyof typeof MODE_COLORS
type TimerMode = 'countdown' | 'stopwatch'

type FocusTimerProps = {
  headerLeft?: ReactNode
}

const ProgressRing = ({ angle, showProgress = true }: { angle: SharedValue<number>, showProgress?: boolean }) => {

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
        stroke="#dbeafe"
        strokeWidth={TRACK_WIDTH}
        fill="none"
      />
      {showProgress && (
        <>
          <AnimatedCircle
            cx={center}
            cy={center}
            r={RADIUS}
            stroke="#3b82f6"
            strokeWidth={TRACK_WIDTH}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${center} ${center})`}
            animatedProps={dashProps}
          />
          <AnimatedCircle
            r={16.2}
            fill="#3b82f6"
            animatedProps={knobProps}
          />
          <AnimatedCircle
            r={10.8}
            fill="#3b82f6"
            animatedProps={knobProps}
          />
        </>
      )}
    </Svg>
  )
}

const isSupportedPet = (name: string | null): name is PetName =>
  !!name && Object.prototype.hasOwnProperty.call(PET_ANIMATIONS, name)

const FocusTimer = ({ headerLeft }: FocusTimerProps) => {
  const { user, selectedPetName } = useGlobalContext()
  const { weeklyData, refetch: refetchWeeklyFocusData } = useWeeklyFocusData()
  const [timerMode, setTimerMode] = useState<TimerMode>('countdown')
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const todayDateKey = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayFocusEntry = useMemo(
    () => weeklyData.find((entry) => entry.date === todayDateKey),
    [weeklyData, todayDateKey],
  )
  const focusStatusText = useMemo(() => {
    if (isRunning) {
      return 'Stay focused and get off your phone!'
    }

    if (todayFocusEntry && todayFocusEntry.totalMinutes > 0) {
      const minutesLabel = todayFocusEntry.totalMinutes === 1 ? 'min' : 'mins'
      return `Focused for ${todayFocusEntry.totalMinutes} ${minutesLabel} today`
    }
    return 'Start focusing with your pet'
  }, [isRunning, todayFocusEntry])

  const hasPetAnimations = useMemo(
    () => isSupportedPet(selectedPetName),
    [selectedPetName],
  )
  const activePetName = useMemo<PetName>(
    () =>
      hasPetAnimations && selectedPetName
        ? (selectedPetName as PetName)
        : DEFAULT_PET,
    [hasPetAnimations, selectedPetName],
  )
  const petAnimations = PET_ANIMATIONS[activePetName]
  const idleAnimation = petAnimations.Idle
  const modeAnimations = useMemo(
    () => ({
      Study: petAnimations.Study,
      Work: petAnimations.Work,
      Break: petAnimations.Break,
      Rest: petAnimations.Rest,
    }),
    [petAnimations],
  )
  const petStyles = PET_ANIMATION_STYLES[activePetName] ?? DEFAULT_PET_STYLES

  const [selectedMinutes, setSelectedMinutes] =
    useState<number>(INITIAL_MINUTES)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    minutesToSeconds(INITIAL_MINUTES),
  )
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [sessionMinutes, setSessionMinutes] =
    useState<number>(INITIAL_MINUTES)
  const [mode, setMode] = useState<ModeKey>('Study')
  const [modePickerVisible, setModePickerVisible] = useState(false)
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const layoutRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })
  const previousStepRef = useRef<number>(4) // 20 minutes / 5 minute steps
  const angle = useSharedValue(60) // (20 / 120) * 360
  const [catSource, setCatSource] = useState(idleAnimation)
  const catAnimationRef = useRef<LottieView>(null)
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
        previousStepRef.current = 4 // 20 minutes / 5 minute steps
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

  useEffect(() => {
    if (!hasPetAnimations) {
      if (catSource !== idleAnimation) {
        setCatSource(idleAnimation)
      }
      return
    }

    const nextSource = isRunning ? modeAnimations[mode] : idleAnimation
    if (catSource === nextSource) {
      return
    }

    setCatSource(nextSource)
    catAnimationRef.current?.reset()
    catAnimationRef.current?.play()
  }, [
    catSource,
    hasPetAnimations,
    idleAnimation,
    isRunning,
    mode,
    modeAnimations,
  ])

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
      previousStepRef.current = selectedMinutes / 5
      const currentSeconds = minutesToSeconds(selectedMinutes)
      setRemainingSeconds(currentSeconds)
      setSessionMinutes(selectedMinutes)
    } else {
      previousStepRef.current = 0
      setElapsedSeconds(0)
      setRemainingSeconds(0)
      setSessionMinutes(0)
    }
  setCatSource(idleAnimation)
  catAnimationRef.current?.reset()
  catAnimationRef.current?.play()
}, [idleAnimation, refreshWeeklyFocus, selectedMinutes, timerMode])

  useEffect(() => {
    return () => {
      // End any active session on cleanup
      if (sessionTracker.getCurrentSession()) {
        sessionTracker.endSession().catch(console.error);
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])



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

      const rawStep = normalizedAngle / STEP_DEGREES
      let nextStep = Math.round(rawStep)
      nextStep = Math.min(Math.max(nextStep, 0), TOTAL_STEPS)

      const prevStep = previousStepRef.current ?? nextStep
      const nearStartThreshold = STEP_DEGREES
      const nearEndThreshold = 360 - STEP_DEGREES
      const halfwaySteps = TOTAL_STEPS / 2

      if (prevStep <= 1 && normalizedAngle >= nearEndThreshold) {
        nextStep = 0
      } else if (prevStep >= TOTAL_STEPS - 1 && normalizedAngle <= nearStartThreshold) {
        nextStep = TOTAL_STEPS
      } else if (normalizedAngle >= 360 - STEP_DEGREES / 2) {
        nextStep = TOTAL_STEPS
      }

      if (prevStep === TOTAL_STEPS && rawStep < halfwaySteps) {
        nextStep = TOTAL_STEPS
      }

      if (prevStep === 0 && rawStep > halfwaySteps) {
        nextStep = 0
      }

      previousStepRef.current = nextStep
      const nextMinutes = nextStep * 5
      setSelectedMinutes(nextMinutes)
      setRemainingSeconds(minutesToSeconds(nextMinutes))
      setSessionMinutes(nextMinutes)
    },
    [isRunning, isStopwatch],
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
      previousStepRef.current = selectedMinutes / 5
    } else {
      setElapsedSeconds(0)
      setSessionMinutes(0)
      setRemainingSeconds(0)
      previousStepRef.current = 0
    }

    setIsRunning(true)
    
    // Track session start
    sessionTracker.startSession(user?.$id, mode);
    setCatSource(modeAnimations[mode])
    catAnimationRef.current?.reset()
    catAnimationRef.current?.play()

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (timerMode === 'countdown') {
        setRemainingSeconds((previous) => {
          if (previous <= 1) {
            // Timer completed - clean up and reset
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            
            sessionTracker.endSession().then(refreshWeeklyFocus).catch(console.error)
            
            setIsRunning(false)
            setSelectedMinutes(0)
            setSessionMinutes(0)
            previousStepRef.current = 0
            setCatSource(idleAnimation)
            catAnimationRef.current?.reset()
            catAnimationRef.current?.play()
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
    selectedMinutes,
    timerMode,
    user?.$id,
    idleAnimation,
    modeAnimations,
  ])

  const totalSessionSeconds = sessionMinutes * 60
  const progressMinutes = useMemo(() => {
    if (isRunning && sessionMinutes > 0) {
      return (remainingSeconds / totalSessionSeconds) * sessionMinutes
    }
    return selectedMinutes
  }, [isRunning, remainingSeconds, selectedMinutes, sessionMinutes, totalSessionSeconds])

  const progressRatio = sessionMinutes === 0 ? 0 : progressMinutes / 120
  const targetAngle = Math.min(Math.max(progressRatio, 0), 1) * 360

  useEffect(() => {
    angle.value = withTiming(targetAngle, {
      duration: isRunning ? 240 : 80,
      easing: Easing.out(Easing.quad),
    })
  }, [angle, isRunning, targetAngle])

  const currentCatStyleKey: 'Idle' | ModeKey =
    catSource === idleAnimation ? 'Idle' : mode
  const catConfig = petStyles[currentCatStyleKey] ?? DEFAULT_PET_STYLES[currentCatStyleKey]
  const catScale = isRunning ? catConfig.runningScale : catConfig.idleScale
  const catOffset = isRunning ? catConfig.runningOffset : catConfig.idleOffset



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
          <View className="absolute inset-0" style={{ backgroundColor: '#3b82f6' }} />
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
          {hasPetAnimations ? (
            <LottieView
              ref={catAnimationRef}
              source={catSource}
              autoPlay
              loop={!isRunning}
              onAnimationFinish={() => {
                if (isRunning) {
                  catAnimationRef.current?.reset()
                  catAnimationRef.current?.play()
                }
              }}
              style={{
                width: PET_CIRCLE_SIZE,
                height: PET_CIRCLE_SIZE,
                transform: [
                  { scale: catScale },
                  { translateX: catOffset?.x ?? 0 },
                  { translateY: catOffset?.y ?? 0 },
                ],
              }}
            />
          ) : (
            <Text className="px-6 text-center text-sm font-rubik text-slate-500">
              {selectedPetName
                ? `Animations coming soon for ${selectedPetName}`
                : 'Select a pet to see their focus animation'}
            </Text>
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
          backgroundColor: isRunning ? '#f59e0b' : '#3b82f6',
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
              If you leave now your pet will be disappointed.
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
