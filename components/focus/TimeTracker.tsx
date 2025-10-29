import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, GestureResponderEvent, PanResponder, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface TimeTrackerProps {
  progress: number;                 // 0–1 (fraction of an hour)
  onChange?: (progress: number) => void;
  disabled?: boolean;
  trackColor?: string;              // main arc + handle
  trackBgColor?: string;            // lighter background ring
  centerContent?: React.ReactNode;  // content centered inside the ring (e.g., Lottie)
}

export default function TimeTracker({
  progress,
  onChange,
  disabled = false,
  trackColor = "#3b82f6",
  trackBgColor = "#bfdbfe",
  centerContent,
}: TimeTrackerProps) {
  const [angle, setAngle] = useState(progress * 360);
  const prevAngleRef = useRef(angle);

  useEffect(() => {
    const a = Math.max(0, Math.min(360, progress * 360));
    setAngle(a);
    prevAngleRef.current = a;
  }, [progress]);

  const size = 325;
  const strokeWidth = 25;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = circumference * (1 - angle / 360);

  // 2-minute snapping: 60 min => 360°, so 2 min => 12°
  const STEP_DEG = 12;
  const snapAngle = (a: number) => Math.max(0, Math.min(360, Math.round(a / STEP_DEG) * STEP_DEG));

  const getTouchAngle = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const dx = locationX - center;
    const dy = locationY - center;
    const radians = Math.atan2(dy, dx);
    let deg = (radians * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    return deg;
  };

  const updateAngle = (newAngle: number, snap: boolean) => {
    const prevAngle = prevAngleRef.current;
    let delta = newAngle - prevAngle;
    if (delta > 300) delta -= 360;
    if (delta < -300) delta += 360;

    let updated = Math.max(0, Math.min(360, prevAngle + delta));
    if (snap) updated = snapAngle(updated);

    prevAngleRef.current = updated;
    setAngle(updated);
    onChange?.(updated / 360);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (e) => {
          if (disabled) return;
          const a = snapAngle(getTouchAngle(e));
          prevAngleRef.current = a;
          setAngle(a);
          onChange?.(a / 360);
        },
        onPanResponderMove: (e) => {
          if (disabled) return;
          updateAngle(getTouchAngle(e), true);
        },
        onPanResponderRelease: () => {
          prevAngleRef.current = angle;
        },
      }),
    [disabled, angle]
  );

  const handleRad = ((angle - 90) * Math.PI) / 180;
  const handleX = center + radius * Math.cos(handleRad);
  const handleY = center + radius * Math.sin(handleRad);

  return (
    <View style={{ width: size, height: size }} {...panResponder.panHandlers}>
      {/* centered content over the SVG; pointerEvents none so dragging still works */}
      {centerContent ? (
        <View pointerEvents="none" style={styles.centerOverlay}>
          {centerContent}
        </View>
      ) : null}

      <Svg width={size} height={size}>
        {/* background ring */}
        <Circle cx={center} cy={center} r={radius} stroke={trackBgColor} strokeWidth={strokeWidth} fill="none" />
        {/* progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          originX={center}
          originY={center}
        />
        {/* handle */}
        <Circle cx={handleX} cy={handleY} r={12} fill={trackColor} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  centerOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
