import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeatherIcon from "@/components/FeatherIcon";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { palette, Colors } from "@/constants/theme";

const dark = Colors.dark;
const HEADER_TOP_OFFSET = 16;
const HEADER_BOTTOM_GAP = 28;

interface StepHeaderProps {
  currentStep: number;
  onBack?: () => void;
}

export function StepHeader({ currentStep, onBack }: StepHeaderProps) {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 44) + HEADER_TOP_OFFSET;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <FeatherIcon name="arrow-left" size={18} color={palette.amber[600]} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      ) : null}

      <View
        style={[styles.indicatorWrapper, onBack && styles.indicatorWithBack]}
      >
        <StepIndicator currentStep={currentStep} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: HEADER_BOTTOM_GAP,
  },
  backButton: {
    alignSelf: "flex-start",
    marginLeft: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: "500",
    color: dark.text,
  },
  indicatorWrapper: {
    marginTop: 8,
  },
  indicatorWithBack: {
    marginTop: 16,
  },
});
