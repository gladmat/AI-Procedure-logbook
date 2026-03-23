import React, { useEffect, useRef } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Text as SvgText, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import type { LearningCurvePoint } from "@/lib/assessmentAnalytics";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MAX_VISIBLE_POINTS = 12;
const Y_LEVELS = [1, 2, 3, 4, 5] as const;

interface DotPlotChartProps {
  points: LearningCurvePoint[];
  height?: number;
}

// ── Animated dot ─────────────────────────────────────────────────────────────

function AnimatedDot({
  cx,
  cy,
  r,
  fill,
  delay,
  animate,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  delay: number;
  animate: boolean;
}) {
  const opacity = useSharedValue(animate ? 0 : 1);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (animate && !hasAnimated.current) {
      hasAnimated.current = true;
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [animate, delay, opacity]);

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
  }));

  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      animatedProps={animatedProps}
    />
  );
}

// ── Main chart ───────────────────────────────────────────────────────────────

export const DotPlotChart = React.memo(function DotPlotChart({
  points,
  height = 200,
}: DotPlotChartProps) {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const chartWidth = screenWidth - Spacing.lg * 2;
  const paddingLeft = 28;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 28;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Limit visible points
  const visible =
    points.length > MAX_VISIBLE_POINTS
      ? points.slice(points.length - MAX_VISIBLE_POINTS)
      : points;

  if (visible.length === 0) return null;

  const xStep =
    visible.length > 1 ? plotWidth / (visible.length - 1) : plotWidth / 2;

  // Map entrustment level (1–5) to Y coordinate
  const levelToY = (level: number): number => {
    // Level 5 = top, Level 1 = bottom
    return paddingTop + plotHeight - ((level - 1) / 4) * plotHeight;
  };

  const supervisorColor = theme.success;
  const selfColor = theme.info;

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        {/* Horizontal grid lines at each level */}
        {Y_LEVELS.map((level) => (
          <G key={`grid-${level}`}>
            <Line
              x1={paddingLeft}
              y1={levelToY(level)}
              x2={chartWidth - paddingRight}
              y2={levelToY(level)}
              stroke={theme.border}
              strokeWidth={0.5}
              strokeDasharray="4,4"
              opacity={0.4}
            />
            <SvgText
              x={paddingLeft - 8}
              y={levelToY(level) + 4}
              fontSize={10}
              fill={theme.textTertiary}
              textAnchor="end"
            >
              {level}
            </SvgText>
          </G>
        ))}

        {/* Supervisor connecting line */}
        {visible.length > 1 &&
          visible.map((pt, i) => {
            if (i === 0) return null;
            const prev = visible[i - 1]!;
            const x1 = paddingLeft + (i - 1) * xStep;
            const x2 = paddingLeft + i * xStep;
            return (
              <Line
                key={`sup-line-${i}`}
                x1={x1}
                y1={levelToY(prev.supervisorRating)}
                x2={x2}
                y2={levelToY(pt.supervisorRating)}
                stroke={supervisorColor}
                strokeWidth={1.5}
                opacity={0.5}
              />
            );
          })}

        {/* Self connecting line */}
        {visible.length > 1 &&
          visible.map((pt, i) => {
            if (i === 0) return null;
            const prev = visible[i - 1]!;
            const x1 = paddingLeft + (i - 1) * xStep;
            const x2 = paddingLeft + i * xStep;
            return (
              <Line
                key={`self-line-${i}`}
                x1={x1}
                y1={levelToY(prev.selfRating)}
                x2={x2}
                y2={levelToY(pt.selfRating)}
                stroke={selfColor}
                strokeWidth={1.5}
                opacity={0.5}
              />
            );
          })}

        {/* Supervisor dots */}
        {visible.map((pt, i) => (
          <AnimatedDot
            key={`sup-${i}`}
            cx={paddingLeft + i * xStep}
            cy={levelToY(pt.supervisorRating)}
            r={pt.caseComplexity === "complex" ? 6 : 4.5}
            fill={supervisorColor}
            delay={i * 80}
            animate
          />
        ))}

        {/* Self dots */}
        {visible.map((pt, i) => (
          <AnimatedDot
            key={`self-${i}`}
            cx={paddingLeft + i * xStep}
            cy={levelToY(pt.selfRating)}
            r={pt.caseComplexity === "complex" ? 6 : 4.5}
            fill={selfColor}
            delay={i * 80 + 40}
            animate
          />
        ))}

        {/* X-axis labels */}
        {visible.map((pt, i) => (
          <SvgText
            key={`x-${i}`}
            x={paddingLeft + i * xStep}
            y={height - 6}
            fontSize={10}
            fill={theme.textTertiary}
            textAnchor="middle"
          >
            {pt.caseNumber}
          </SvgText>
        ))}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: supervisorColor }]}
          />
          <ThemedText
            style={[styles.legendLabel, { color: theme.textSecondary }]}
          >
            Supervisor
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: selfColor }]} />
          <ThemedText
            style={[styles.legendLabel, { color: theme.textSecondary }]}
          >
            Self
          </ThemedText>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
  },
});
