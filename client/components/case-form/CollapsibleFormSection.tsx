import React, { useState, useRef } from "react";
import { View, Pressable, Animated, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface CollapsibleFormSectionProps {
  title: string;
  subtitle?: string;
  filledCount: number;
  totalCount: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const CollapsibleFormSection = React.memo(function CollapsibleFormSection({
  title,
  subtitle,
  filledCount,
  totalCount,
  children,
  defaultExpanded = true,
}: CollapsibleFormSectionProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [measured, setMeasured] = useState(false);
  const expandedRef = useRef(defaultExpanded);
  const contentHeightRef = useRef(0);
  const animatedHeight = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const toggle = () => {
    const nextExpanded = !expandedRef.current;
    expandedRef.current = nextExpanded;
    setExpanded(nextExpanded);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (measured) {
      Animated.timing(animatedHeight, {
        toValue: nextExpanded ? contentHeightRef.current : 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  };

  const badgeColor = filledCount > 0 ? theme.link : theme.textTertiary;

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={toggle} style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText style={[styles.subtitle, { color: theme.textTertiary }]}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: badgeColor + "15",
                borderColor: badgeColor + "30",
              },
            ]}
          >
            <ThemedText style={[styles.badgeText, { color: badgeColor }]}>
              {filledCount}/{totalCount}
            </ThemedText>
          </View>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={theme.textSecondary}
          />
        </View>
      </Pressable>

      <Animated.View
        style={{
          height: measured ? animatedHeight : undefined,
          overflow: "hidden",
        }}
      >
        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) {
              contentHeightRef.current = h;
              if (!measured) {
                animatedHeight.setValue(expandedRef.current ? h : 0);
                setMeasured(true);
              } else if (expandedRef.current) {
                animatedHeight.setValue(h);
              }
            }
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
