import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, GestureResponderEvent, PanResponder } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { useAnimatedProps, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { CoralPalette } from "@/constants/colors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface TimeTrackerProps {
  progress: number;
  onChange?: (progress: number) => void;
  disabled?: boolean;
  trackColor?: string;
  trackBgColor?: string;
  centerContent?: React.ReactNode;
  onPreviewProgress?: (progress: number | null) => void;
  showHandle?: boolean;
  centerFillColor?: string;
  maxSeconds?: number;
  snapIntervalSeconds?: number;
  hideRing?: boolean;
}

export default function TimeTracker({
  progress,
  onChange,
  disabled = false,
  trackColor = CoralPalette.primary,
  trackBgColor = CoralPalette.primaryLight,
  centerContent,
  onPreviewProgress,
  showHandle = true,
  centerFillColor = CoralPalette.surfaceAlt,
  maxSeconds = 2 * 60 * 60,
  snapIntervalSeconds = 5 * 60,
  hideRing = false,
}: TimeTrackerProps) {
  const [angle, setAngle] = useState(progress * 360);
  const prevAngleRef = useRef(angle);
  const bgScale = useSharedValue(hideRing ? 0.95 : 1);

  // keep visual angle in sync with external progress
  useEffect(() => {
    const a = clamp360(progress * 360);
    setAngle(a);
    prevAngleRef.current = a;
  }, [progress]);

  useEffect(() => {
    if (hideRing) {
      bgScale.value = withSequence(
        withTiming(1.02, { duration: 180 }),
        withTiming(0.85, { duration: 150 })
      );
    } else {
      bgScale.value = withTiming(1, { duration: 220 });
    }
  }, [hideRing, bgScale]);

  // geometry (kept minimal; literals where sensible)
  const CANVAS_SIZE = 330;
  const TRACK_STROKE = 22;
  const center = CANVAS_SIZE / 2;
  const radius = (CANVAS_SIZE - 25) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - angle / 360);
  const PAD = 17; // padding in viewBox so stroke/handle never clip
  const DEADZONE_INNER = radius - 30;
  const DEADZONE_OUTER = radius + 30;

  // drag state refs
  const tapStartAngleRef = useRef(0);

  // clamp an angle to [0, 360]
  const clamp360 = (a: number) => Math.max(0, Math.min(360, a));

  const normalizedMax = Math.max(60, maxSeconds);
  const snapDegrees = Math.max(1, (snapIntervalSeconds / normalizedMax) * 360);
  const snapAngle = useCallback(
    (a: number) => clamp360(Math.round(a / snapDegrees) * snapDegrees),
    [snapDegrees]
  );

  // compute angle from a touch event
  const getTouchAngle = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;
      const dx = locationX - center;
      const dy = locationY - center;
      const radians = Math.atan2(dy, dx);
      let deg = (radians * 180) / Math.PI + 90;
      if (deg < 0) deg += 360;
      return deg;
    },
    [center]
  );

  const isTouchOnRing = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;
      const dx = locationX - center;
      const dy = locationY - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist >= DEADZONE_INNER && dist <= DEADZONE_OUTER;
    },
    [center, DEADZONE_INNER, DEADZONE_OUTER]
  );

  // update angle smoothly while dragging (no snap)
  const updateAngleSmooth = useCallback((newAngle: number) => {
    const prev = prevAngleRef.current;
    let delta = newAngle - prev;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const updated = clamp360(prev + delta);
    prevAngleRef.current = updated;
    setAngle(updated);
    onPreviewProgress?.(updated / 360);
  }, [onPreviewProgress]);

  // build gesture handlers (no tap flicker, snap on release)
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (e) =>
          !disabled && isTouchOnRing(e),
        onMoveShouldSetPanResponder: (e) =>
          !disabled && isTouchOnRing(e),

        // record touch; don't move handle yet
        onPanResponderGrant: (e) => {
          if (disabled) return;
          const a = clamp360(getTouchAngle(e));
          tapStartAngleRef.current = a;
          onPreviewProgress?.(a / 360);
        },

        // drag smoothly after a tiny movement threshold
        onPanResponderMove: (e) => {
          if (disabled) return;
          const a = clamp360(getTouchAngle(e));
          updateAngleSmooth(a);
        },

        // snap to 5-min and commit
        onPanResponderRelease: () => {
          const snapped = snapAngle(prevAngleRef.current || tapStartAngleRef.current);
          prevAngleRef.current = snapped;
          setAngle(snapped);
          onPreviewProgress?.(null);
          onChange?.(snapped / 360);
        },

        // interrupted → treat like release
        onPanResponderTerminate: () => {
          const snapped = snapAngle(prevAngleRef.current || tapStartAngleRef.current);
          prevAngleRef.current = snapped;
          setAngle(snapped);
          onPreviewProgress?.(null);
          onChange?.(snapped / 360);
        },
      }),
    [disabled, isTouchOnRing, getTouchAngle, updateAngleSmooth, snapAngle, onChange, onPreviewProgress]
  );

  // handle position
  const handleRad = ((angle - 90) * Math.PI) / 180;
  const handleX = center + radius * Math.cos(handleRad);
  const handleY = center + radius * Math.sin(handleRad);
  const HANDLE_RADIUS = 20;
  const bgProps = useAnimatedProps(() => ({
    r: radius * bgScale.value * 1.065,
  }));

  return (
    <View style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }} {...panResponder.panHandlers}>
      <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} viewBox={`${-PAD} ${-PAD} ${CANVAS_SIZE + PAD * 2} ${CANVAS_SIZE + PAD * 2}`}>
        {/* background ring */}
        <AnimatedCircle
          animatedProps={bgProps}
          cx={center}
          cy={center}
          strokeWidth={TRACK_STROKE}
          fill={trackBgColor}
          opacity={1}
        />
        {/* center fill */}
        {centerFillColor ? (
          <Circle cx={center} cy={center} r={radius - 11} fill={centerFillColor} />
        ) : null}
        {/* progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={TRACK_STROKE}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="butt"
          rotation={-90}
          originX={center}
          originY={center}
          opacity={hideRing ? 0 : 1}
        />
        {/* handle */}
        {showHandle ? (
          <Circle cx={handleX} cy={handleY} r={HANDLE_RADIUS} fill={trackColor} stroke={trackColor} strokeWidth={3} />
        ) : null}
      </Svg>

      {centerContent ? (
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          {centerContent}
        </View>
      ) : null}
    </View>
  );
}
