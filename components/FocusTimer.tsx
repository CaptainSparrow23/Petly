import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Dimensions,
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  Text,
  View,
} from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import LottieView from 'lottie-react-native'
import { Animations } from '@/constants/animations'

const MAX_MINUTES = 120
const STEP_MINUTES = 5
const INITIAL_MINUTES = 20

const VIEWBOX = 400
const TRACK_WIDTH = 20
const CIRCLE_RADIUS = 150
const RADIUS = CIRCLE_RADIUS - TRACK_WIDTH
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const TOTAL_STEPS = MAX_MINUTES / STEP_MINUTES
const HALF_STEPS = TOTAL_STEPS / 2

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

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}`
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const ProgressRing = ({ angle }: { angle: Animated.SharedValue<number> }) => {
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
    </Svg>
  )
}

const FocusTimer = () => {
  const [selectedMinutes, setSelectedMinutes] =
    useState<number>(INITIAL_MINUTES)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    minutesToSeconds(INITIAL_MINUTES),
  )
  const [sessionMinutes, setSessionMinutes] =
    useState<number>(INITIAL_MINUTES)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [heartSource, setHeartSource] = useState<string | null>(null)

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

  const scheduleCatReplay = useCallback(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }
    animationTimeoutRef.current = setTimeout(() => {
      catAnimationRef.current?.reset()
      catAnimationRef.current?.play()
    }, 3000)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    layoutRef.current = { width, height }
  }, [])

  const updateFromGesture = useCallback(
    (event: GestureResponderEvent) => {
      if (isRunning) return
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

      if (previousStep === TOTAL_STEPS && movingForward) {
        return
      }

      let nextStep = clampStep(
        Math.round((normalizedAngle / 360) * TOTAL_STEPS),
      )

      if (
        previousStep === TOTAL_STEPS &&
        movingForward &&
        normalizedAngle < 180
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
          setHeartSource(newHeart)
          heartAnimationRef.current?.reset()
          heartAnimationRef.current?.play()
          setCatSource(Animations.catIdle)
          catAnimationRef.current?.reset()
          catAnimationRef.current?.play()
          scheduleCatReplay()
        } else if (!newHeart && heartSource) {
          setHeartSource(null)
        }
      }
    },
    [heartSource, isRunning, scheduleCatReplay],
  )

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isRunning,
        onMoveShouldSetPanResponder: () => !isRunning,
        onPanResponderMove: updateFromGesture,
      }),
    [isRunning, updateFromGesture],
  )

  const handleControlPress = useCallback(() => {
    if (isRunning) {
      setIsRunning(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      previousStepRef.current = selectedMinutes / STEP_MINUTES
      setRemainingSeconds(minutesToSeconds(selectedMinutes))
      setSessionMinutes(selectedMinutes)
      setCatSource(Animations.catIdle)
      catAnimationRef.current?.reset()
      catAnimationRef.current?.play()
      scheduleCatReplay()
      return
    }

    if (selectedMinutes === 0) return

    const startingSeconds = minutesToSeconds(selectedMinutes)
    setRemainingSeconds(startingSeconds)
    setSessionMinutes(selectedMinutes)
    setIsRunning(true)
    previousStepRef.current = selectedMinutes / STEP_MINUTES
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }
    setCatSource(Animations.catFocus)
    setHeartSource(null)
    catAnimationRef.current?.reset()
    catAnimationRef.current?.play()

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
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
    }, 1000)
  }, [isRunning, selectedMinutes, scheduleCatReplay])

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

  const formattedTime = formatTime(
    isRunning ? remainingSeconds : minutesToSeconds(selectedMinutes),
  )

  return (
    <View className="items-center gap-8 py-10 top-10">
      <Text className="text-base text-slate-600">Start focusing with your pet</Text>

      <View className="items-center justify-center">
        <View style={{ width: SLIDER_SIZE, height: SLIDER_SIZE }} pointerEvents="none">
          <ProgressRing angle={angle} />
        </View>

        <View
          style={{ position: 'absolute', width: SLIDER_SIZE, height: SLIDER_SIZE }}
          onLayout={handleLayout}
          {...panResponder.panHandlers}
          
        >
          <View style={{ flex: 1 }} />
        </View>

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
            speed={1}
            onAnimationFinish={() => {
              if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current)
              }
              if (isRunning) {
                catAnimationRef.current?.reset()
                catAnimationRef.current?.play()
              } else {
                scheduleCatReplay()
              }
            }}
            style={{
              width: isRunning
                ? PET_CIRCLE_SIZE * 0.7
                : PET_CIRCLE_SIZE * 0.85,
              height: isRunning
                ? PET_CIRCLE_SIZE * 0.7
                : PET_CIRCLE_SIZE * 0.85,
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
                width: PET_CIRCLE_SIZE,
                height: PET_CIRCLE_SIZE,
                transform: [
                  {
                    translateY:
                      heartSource === Animations.heartsLg
                        ? -PET_CIRCLE_SIZE * 0.7
                        : -PET_CIRCLE_SIZE * 0.25,
                  },
                  {
                    translateX:
                      heartSource === Animations.heartsLg
                        ? -PET_CIRCLE_SIZE * 0.08
                        : 0,
                  },
                ],
              }}
            />
          )}
        </View>
      </View>

      <Text
        className="font-medium text-slate-700"
        style={{ fontSize: 56,  }}
      >
        {formattedTime}
      </Text>

      <Pressable
        className="min-w-[160px] items-center rounded-full px-10 py-3.5 shadow-lg"
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
          {isRunning ? 'Leave' : 'Start'}
        </Text>
      </Pressable>
    </View>
  )
}

export default FocusTimer
