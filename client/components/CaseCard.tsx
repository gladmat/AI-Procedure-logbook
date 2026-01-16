import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";
import { Case, SPECIALTY_LABELS } from "@/types/case";
import { RoleBadge } from "@/components/RoleBadge";
import { SpecialtyBadge } from "@/components/SpecialtyBadge";

interface CaseCardProps {
  caseData: Case;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CaseCard({ caseData, onPress }: CaseCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const formattedDate = new Date(caseData.procedureDate).toLocaleDateString(
    "en-NZ",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );

  const userRole = caseData.teamMembers.find(
    (m) => m.id === caseData.ownerId
  )?.role || "primary";

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundDefault,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SpecialtyBadge specialty={caseData.specialty} size="small" />
          <RoleBadge role={userRole} size="small" />
        </View>
        <Feather name="chevron-right" size={20} color={theme.textTertiary} />
      </View>

      <View style={styles.content}>
        <ThemedText type="h3" style={styles.patientId}>
          {caseData.patientIdentifier}
        </ThemedText>
        <ThemedText
          style={[styles.procedureType, { color: theme.textSecondary }]}
        >
          {caseData.procedureType}
        </ThemedText>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Feather name="calendar" size={14} color={theme.textTertiary} />
          <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
            {formattedDate}
          </ThemedText>
        </View>
        <View style={styles.footerItem}>
          <Feather name="map-pin" size={14} color={theme.textTertiary} />
          <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
            {caseData.facility}
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  content: {
    marginBottom: Spacing.md,
  },
  patientId: {
    marginBottom: Spacing.xs,
  },
  procedureType: {
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: 13,
  },
});
