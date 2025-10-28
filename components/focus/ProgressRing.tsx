import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';

const VIEWBOX = 400;
const TRACK_WIDTH = 18;
const CIRCLE_RADIUS = 150;
const RADIUS = CIRCLE_RADIUS - TRACK_WIDTH;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  angle: SharedValue<number>;
  showProgress?: boolean;
  color?: string;
  lightColor?: string;
};

const ProgressRing = ({ angle, showProgress = true, color = '#3b82f6', lightColor = '#dbeafe' }: Props) => {
  const dashProps = useAnimatedProps(() => {
    const ratio = Math.min(Math.max(angle.value / 360, 0), 1);
    return { strokeDashoffset: CIRCUMFERENCE * (1 - ratio) };
  });

  const knobProps = useAnimatedProps(() => {
    const bounded = Math.min(Math.max(angle.value, 0), 360);
    const angleRad = ((bounded - 90) * Math.PI) / 180;
    const center = VIEWBOX / 2;
    return { cx: center + RADIUS * Math.cos(angleRad), cy: center + RADIUS * Math.sin(angleRad) };
  });

  const center = VIEWBOX / 2;

  return (
    <Svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} style={{ width: '100%', height: '100%', position: 'absolute' }}>
      <Circle cx={center} cy={center} r={RADIUS} stroke={lightColor} strokeWidth={TRACK_WIDTH} fill="none" />
      {showProgress && (
        <>
          <AnimatedCircle
            cx={center}
            cy={center}
            r={RADIUS}
            stroke={color}
            strokeWidth={TRACK_WIDTH}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${center} ${center})`}
            animatedProps={dashProps}
          />
          <AnimatedCircle r={16.2} fill={color} animatedProps={knobProps} />
          <AnimatedCircle r={10.8} fill={color} animatedProps={knobProps} />
        </>
      )}
    </Svg>
  );
};

export default ProgressRing;
