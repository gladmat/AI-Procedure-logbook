import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Specialty, SPECIALTY_LABELS, PROCEDURE_TYPES } from "@/types/case";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SPECIALTY_ICONS: Record<Specialty, keyof typeof Feather.glyphMap> = {
  free_flap: "activity",
  hand_trauma: "tool",
  body_contouring: "user",
  aesthetics: "star",
  burns: "thermometer",
  general: "clipboard",
};

export default function AddCaseScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const handleSpecialtySelect = (specialty: Specialty) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("CaseForm", { specialty });
  };

  const handleScanPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("SmartCapture");
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Pressable
        onPress={handleScanPress}
        style={({ pressed }) => [
          styles.scanCard,
          {
            backgroundColor: theme.link,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <View style={styles.scanContent}>
          <View style={[styles.scanIconContainer, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name="camera" size={28} color={theme.buttonText} />
          </View>
          <View style={styles.scanText}>
            <ThemedText style={[styles.scanTitle, { color: theme.buttonText }]}>
              Smart Capture
            </ThemedText>
            <ThemedText style={[styles.scanSubtitle, { color: "rgba(255,255,255,0.8)" }]}>
              Photograph your operation note and let AI extract the details
            </ThemedText>
          </View>
        </View>
        <Feather name="chevron-right" size={24} color={theme.buttonText} />
      </Pressable>

      <View style={styles.dividerContainer}>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>
          or select specialty
        </ThemedText>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      </View>

      <View style={styles.specialtyGrid}>
        {(Object.keys(SPECIALTY_LABELS) as Specialty[]).map((specialty) => (
          <Pressable
            key={specialty}
            onPress={() => handleSpecialtySelect(specialty)}
            style={({ pressed }) => [
              styles.specialtyCard,
              {
                backgroundColor: theme.backgroundDefault,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View
              style={[
                styles.specialtyIcon,
                { backgroundColor: theme.link + "15" },
              ]}
            >
              <Feather
                name={SPECIALTY_ICONS[specialty]}
                size={24}
                color={theme.link}
              />
            </View>
            <ThemedText style={styles.specialtyName}>
              {SPECIALTY_LABELS[specialty]}
            </ThemedText>
            <ThemedText style={[styles.specialtyCount, { color: theme.textTertiary }]}>
              {PROCEDURE_TYPES[specialty].length} procedures
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  scanCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  scanContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.lg,
  },
  scanIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  scanText: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  scanSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing["2xl"],
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  specialtyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  specialtyCard: {
    width: "47%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    ...Shadows.card,
  },
  specialtyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  specialtyName: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  specialtyCount: {
    fontSize: 12,
  },
});
