import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";
import { MEDIA_TAG_REGISTRY } from "@/types/media";
import type { MediaTag, MediaTagGroup } from "@/types/media";

interface MediaTagBadgeProps {
  tag: MediaTag;
  size?: "small" | "medium";
}

/**
 * Colour-coded chip showing a media tag label.
 * Background uses the group colour at 15% alpha; text at full opacity.
 */
function MediaTagBadgeInner({ tag, size = "medium" }: MediaTagBadgeProps) {
  const { theme } = useTheme();
  const meta = MEDIA_TAG_REGISTRY[tag];
  const group = meta?.group ?? "other";
  const label = meta?.label ?? tag;
  const color = getGroupColor(group, theme);

  const isSmall = size === "small";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + "26", // 15% alpha
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 4 : 8,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize: isSmall ? 9 : 12,
            lineHeight: isSmall ? 12 : 16,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function getGroupColor(
  group: MediaTagGroup,
  theme: ReturnType<typeof useTheme>["theme"],
): string {
  switch (group) {
    case "temporal":
      return theme.textSecondary;
    case "imaging":
      return theme.info;
    case "flap_surgery":
      return theme.error;
    case "skin_cancer":
      return theme.warning;
    case "aesthetic":
      return theme.link;
    case "hand_function":
      return theme.success;
    case "other":
      return theme.textTertiary;
  }
}

export { getGroupColor };

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600",
  },
});

export const MediaTagBadge = React.memo(MediaTagBadgeInner);
