import React, { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { VictoryLine, VictoryChart, VictoryAxis, VictoryArea, VictoryScatter } from "victory-native";
import { Activity } from "lucide-react-native";
import { CoralPalette } from "@/constants/colors";

const FONT = { fontFamily: "Nunito" };

interface TodayActivityChartProps {
  data: number[];
  title?: string;
}

export default function TodayActivityChart({
  data,
  title = "Today's Activity",
}: TodayActivityChartProps) {
  const [chartWidth, setChartWidth] = useState(0);
  
  // Get current time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeDecimal = currentHour + currentMinute / 60;
  
  // Only show data up to current hour (inclusive)
  const chartData = useMemo(() => {
    const points = [];
    for (let hour = 0; hour <= currentHour; hour++) {
      points.push({
        x: hour,
        y: data[hour] || 0,
      });
    }
    // Add current time point (interpolated or same as current hour)
    if (currentMinute > 0) {
      points.push({
        x: currentTimeDecimal,
        y: data[currentHour] || 0,
      });
    }
    return points;
  }, [data, currentHour, currentMinute, currentTimeDecimal]);
  
  const maxY = useMemo(() => {
    const relevantData = data.slice(0, currentHour + 1);
    return Math.max(5, ...relevantData);
  }, [data, currentHour]);
  
  const totalMinutes = useMemo(() => {
    return data.slice(0, currentHour + 1).reduce((sum, m) => sum + m, 0);
  }, [data, currentHour]);
  
  const hasData = totalMinutes > 0;
  
  // Generate tick values dynamically based on current time
  const tickValues = useMemo(() => {
    const ticks = [0];
    if (currentHour >= 6) ticks.push(6);
    if (currentHour >= 12) ticks.push(12);
    if (currentHour >= 18) ticks.push(18);
    if (currentHour > 0 && !ticks.includes(currentHour)) {
      ticks.push(currentHour);
    }
    return ticks.sort((a, b) => a - b);
  }, [currentHour]);
  
  const formatTime = (hour: number) => {
    const h = Math.floor(hour);
    return `${h.toString().padStart(2, "0")}:00`;
  };
  
  return (
    <View
      style={{
        backgroundColor: CoralPalette.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${CoralPalette.yellow}25`,
        overflow: "hidden",
        shadowColor: CoralPalette.yellow,
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          paddingBottom: 8,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${CoralPalette.yellow}20`,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Activity size={20} color={CoralPalette.yellow} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[{ color: CoralPalette.dark, fontSize: 16, fontWeight: "700" }, FONT]}>
            {title}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: `${CoralPalette.yellow}15`,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 8,
          }}
        >
          <Text style={[{ color: CoralPalette.yellow, fontSize: 12, fontWeight: "700" }, FONT]}>
            Now
          </Text>
        </View>
      </View>
      
      {/* Chart */}
      <View
        style={{ height: 180, paddingHorizontal: 16, paddingBottom: 16 }}
        onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
      >
        {chartWidth > 0 && (
          <VictoryChart
            width={chartWidth}
            height={180}
            padding={{ top: 24, bottom: 40, left: 40, right: 40 }}
            domain={{ 
              x: [0, Math.max(currentTimeDecimal, 1)],
              y: [0, Math.ceil(maxY * 1.2) || 10],
            }}
          >
            <VictoryAxis
              tickValues={tickValues}
              tickFormat={formatTime}
              style={{
                axis: { stroke: CoralPalette.greyLight },
                ticks: { stroke: "transparent" },
                tickLabels: {
                  fill: CoralPalette.mutedDark,
                  fontSize: 10,
                  fontFamily: "Nunito",
                },
                grid: { stroke: "transparent" },
              }}
            />
            <VictoryAxis
              dependentAxis
              tickCount={4}
              style={{
                axis: { stroke: "transparent" },
                ticks: { stroke: "transparent" },
                tickLabels: {
                  fill: CoralPalette.mutedDark,
                  fontSize: 10,
                  fontFamily: "Nunito",
                },
                grid: { stroke: CoralPalette.greyLight, strokeDasharray: "4,4" },
              }}
            />
            {/* Area fill */}
            <VictoryArea
              data={chartData}
              interpolation="natural"
              style={{
                data: {
                  fill: `${CoralPalette.yellow}25`,
                  stroke: "transparent",
                },
              }}
            />
            {/* Line */}
            <VictoryLine
              data={chartData}
              interpolation="natural"
              style={{
                data: {
                  stroke: CoralPalette.yellow,
                  strokeWidth: 2.5,
                },
              }}
            />
            {/* Current time indicator dot */}
            <VictoryScatter
              data={[chartData[chartData.length - 1]]}
              size={6}
              style={{
                data: {
                  fill: CoralPalette.yellow,
                  stroke: CoralPalette.white,
                  strokeWidth: 3,
                },
              }}
            />
          </VictoryChart>
        )}
        
        {/* No data overlay */}
        {!hasData && chartWidth > 0 && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={[{ color: CoralPalette.mutedDark, fontSize: 13 }, FONT]}>
              Start focusing to see your activity
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
