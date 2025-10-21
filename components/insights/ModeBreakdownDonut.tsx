// components/ModeBreakdownDonut.tsx
import React, { useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { VictoryPie } from 'victory-native';

export type ModeBreakdownSegment = {
  label: string;
  value: number;  // minutes (not used for drawing)
  color: string;
  seconds: number;
};

const MODE_DONUT_SIZE = 180;

const formatDetailedDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr${hours === 1 ? '' : 's'}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes === 1 ? '' : 's'}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} sec${seconds === 1 ? '' : 's'}`);
  return parts.join(' ');
};

export default function ModeBreakdownDonut({
  segments,
  hasData,
}: {
  segments: ModeBreakdownSegment[];
  hasData: boolean;
}) {
  const containerRef = useRef<View | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [tooltipSize, setTooltipSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const size = MODE_DONUT_SIZE;
  const outerRadius = size / 2 - 10;
  const innerRadius = outerRadius * 0.45;
  const activeSegment = activeIndex !== null ? segments[activeIndex] ?? null : null;

  if (!hasData) {
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke="#e2e8f0"
          strokeWidth={outerRadius - innerRadius}
          fill="none"
        />
      </Svg>
    );
  }

  const totalSeconds = segments.reduce((sum, s) => sum + s.seconds, 0);
  const minVisibleValue = Math.max(totalSeconds * 0.01, 1);
  const chartData = segments.map((s, index) => ({
    x: index,
    y: s.seconds > 0 ? s.seconds : minVisibleValue,
  }));
  const colorScale = segments.map((s) => s.color);
  const tooltipWidth = tooltipSize.width || 150;
  const tooltipHeight = tooltipSize.height || 56;

  return (
    <View
      ref={containerRef}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', position: 'relative' }}
    >
      <VictoryPie
        width={size}
        height={size}
        innerRadius={innerRadius}
        padAngle={0}
        padding={{ top: 0, bottom: 0, left: 0, right: 0 }}
        standalone
        data={chartData}
        colorScale={colorScale}
        labels={() => null}
        style={{ data: { strokeWidth: 0 } }}
        startAngle={-90}
        endAngle={270}
        events={[
          {
            target: 'data',
            eventHandlers: {
              onPressIn: (evt, props) => {
                const index = props.index as number;
                const selected = segments[index];
                if (selected && selected.seconds > 0) {
                  const pressEvent = evt.nativeEvent as any;
                  const { pageX, pageY, locationX, locationY } = pressEvent;
                  const fallbackX = locationX;
                  const fallbackY = locationY;
                  const applyPosition = (offsetX = 0, offsetY = 0) => {
                    const relativeX = typeof pageX === 'number' ? pageX - offsetX : fallbackX;
                    const relativeY = typeof pageY === 'number' ? pageY - offsetY : fallbackY;
                    setActiveIndex(index);
                    setTooltipPosition({ x: relativeX, y: relativeY });
                  };
                  if (typeof (containerRef.current as any)?.measureInWindow === 'function') {
                    (containerRef.current as any).measureInWindow((x: number, y: number) => applyPosition(x, y));
                  } else {
                    applyPosition();
                  }
                } else {
                  setActiveIndex(null);
                  setTooltipPosition(null);
                }
                return [];
              },
              onPressOut: () => {
                setActiveIndex(null);
                setTooltipPosition(null);
                return [];
              },
            },
          },
        ]}
      />
      {activeSegment && tooltipPosition ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: Math.max(0, Math.min(tooltipPosition.x - tooltipWidth / 2, size - tooltipWidth)),
            top: tooltipPosition.y - tooltipHeight - 18,
            alignItems: 'center',
          }}
        >
          <View
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              if (width !== tooltipSize.width || height !== tooltipSize.height) setTooltipSize({ width, height });
            }}
            style={{
              backgroundColor: '#ffffff',
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              shadowColor: '#0f172a',
              shadowOpacity: 0.08,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
              elevation: 4,
            }}
          >
            <Text className="text-sm font-rubik-medium text-gray-900 text-center">{activeSegment.label}</Text>
            <Text className="mt-1 text-xs text-gray-600 text-center">{formatDetailedDuration(activeSegment.seconds)}</Text>
          </View>
          <View
            style={{
              width: 12,
              height: 12,
              backgroundColor: '#ffffff',
              borderBottomWidth: 1,
              borderRightWidth: 1,
              borderColor: '#e2e8f0',
              transform: [{ rotate: '45deg' }],
              marginTop: -6,
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
