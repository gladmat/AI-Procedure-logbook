import React from "react";
import Svg, { Path } from "react-native-svg";

interface OpusMarkProps {
  size?: number;
  color?: string;
}

/**
 * Opus brand mark — Interrupted Circle
 * A monoline circle with an asymmetric gap at the top.
 *
 * The SVG path draws an arc leaving a gap centered near 12 o'clock.
 * Stroke width scales proportionally: 7.2% of viewBox size.
 *
 * @param size - Width and height in points (default: 32)
 * @param color - Stroke color (default: '#E5A00D')
 */
export function OpusMark({ size = 32, color = "#E5A00D" }: OpusMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path
        d="M 64.68 13.65 A 39.2 39.2 0 1 1 35.32 13.65"
        stroke={color}
        strokeWidth={7.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
