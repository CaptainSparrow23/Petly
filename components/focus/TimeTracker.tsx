import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, GestureResponderEvent, PanResponder } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface TimeTrackerProps {
  progress: number;                
  onChange?: (progress: number) => void;          
  disabled?: boolean;
  trackColor?: string;              
  trackBgColor?: string;          
  centerContent?: React.ReactNode; 
  onPreviewProgress?: (progress: number) => void;    
  onDragStateChange?: (dragging: boolean) => void;   
  showHandle?: boolean;
  centerFillColor?: string;
  maxSeconds?: number;
  snapIntervalSeconds?: number;
}

export default function TimeTracker({
  progress,
  onChange,
  disabled = false,
  trackColor = "#3b82f6",
  trackBgColor = "#bfdbfe",
  centerContent,
  onPreviewProgress,
  onDragStateChange,
  showHandle = true,
  centerFillColor,
  maxSeconds = 2 * 60 * 60,
  snapIntervalSeconds = 5 * 60,
}: TimeTrackerProps) {
  const [angle, setAngle] = useState(progress * 360);
  const prevAngleRef = useRef(angle);

  // keep visual angle in sync with external progress
  useEffect(() => {
    const a = clamp360(progress * 360);
    setAngle(a);
    prevAngleRef.current = a;
  }, [progress]);

  // geometry (kept minimal; literals where sensible)
  const center = 350 / 2;
  const radius = (350 - 25) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - angle / 360);
  const PAD = 17; // padding in viewBox so stroke/handle never clip
  const DEADZONE_INNER = radius - 30;
  const DEADZONE_OUTER = radius + 30;

  // drag state refs
  const isDraggingRef = useRef(false);
  const tapStartAngleRef = useRef(0);

  // clamp an angle to [0, 360]
  const clamp360 = (a: number) => Math.max(0, Math.min(360, a));

  const normalizedMax = Math.max(60, maxSeconds);
  const snapDegrees =
    Math.max(1, (snapIntervalSeconds / normalizedMax) * 360);
  const snapAngle = (a: number) => clamp360(Math.round(a / snapDegrees) * snapDegrees);

  // compute angle from a touch event
  const getTouchAngle = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const dx = locationX - center;
    const dy = locationY - center;
    const radians = Math.atan2(dy, dx);
    let deg = (radians * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    return deg;
  };

  const isTouchOnRing = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const dx = locationX - center;
    const dy = locationY - center;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist >= DEADZONE_INNER && dist <= DEADZONE_OUTER;
  };

  // update angle smoothly while dragging (no snap)
  const updateAngleSmooth = (newAngle: number) => {
    const prev = prevAngleRef.current;
    let delta = newAngle - prev;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const updated = clamp360(prev + delta);
    prevAngleRef.current = updated;
    setAngle(updated);
    onPreviewProgress?.(snapAngle(updated) / 360);
  };

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
          isDraggingRef.current = false;
          onDragStateChange?.(true);
          onPreviewProgress?.(snapAngle(a) / 360);
        },

        // drag smoothly after a tiny movement threshold
        onPanResponderMove: (e) => {
          if (disabled) return;
          const a = clamp360(getTouchAngle(e));
          let diff = Math.abs(a - tapStartAngleRef.current);
          if (diff > 180) diff = 360 - diff;
          if (!isDraggingRef.current && diff < 8) {
            onPreviewProgress?.(snapAngle(a) / 360);
            return;
          }
          isDraggingRef.current = true;
          updateAngleSmooth(a);
        },

        // snap to 5-min and commit
        onPanResponderRelease: () => {
          const base = isDraggingRef.current ? prevAngleRef.current : tapStartAngleRef.current;
          const snapped = snapAngle(base);
          isDraggingRef.current = false;
          onDragStateChange?.(false);
          prevAngleRef.current = snapped;
          setAngle(snapped);
          onChange?.(snapped / 360);
        },

        // interrupted → treat like release
        onPanResponderTerminate: () => {
          const snapped = snapAngle(prevAngleRef.current || tapStartAngleRef.current);
          isDraggingRef.current = false;
          onDragStateChange?.(false);
          prevAngleRef.current = snapped;
          setAngle(snapped);
          onChange?.(snapped / 360);
        },
      }),
    [disabled, isTouchOnRing, getTouchAngle, updateAngleSmooth, snapAngle, onDragStateChange, onPreviewProgress, onChange]
  );

  // handle position
  const handleRad = ((angle - 90) * Math.PI) / 180;
  const handleX = center + radius * Math.cos(handleRad);
  const handleY = center + radius * Math.sin(handleRad);

  return (
    <View style={{ width: 350, height: 350 }} {...panResponder.panHandlers}>
      <Svg width={350} height={350} viewBox={`${-PAD} ${-PAD} ${350 + PAD * 2} ${350 + PAD * 2}`}>
        {/* center fill */}
        {centerFillColor ? (
          <Circle cx={center} cy={center} r={radius - 10} fill={centerFillColor} />
        ) : null}
        {/* background ring */}
        <Circle cx={center} cy={center} r={radius} stroke={trackBgColor} strokeWidth={20} fill="none" />
        {/* progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={20}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          originX={center}
          originY={center}
        />
        {/* handle */}
        {showHandle ? (
          <Circle cx={handleX} cy={handleY} r={20} fill={trackColor} stroke={trackColor} strokeWidth={3} />
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
