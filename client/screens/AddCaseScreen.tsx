import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
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
  breast: "heart",
  body_contouring: "user",
  aesthetics: "star",
  hand_surgery: "edit-3",
  orthoplastic: "activity",
  burns: "thermometer",
  general: "clipboard",
  head_neck: "mic",
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
              {PROCEDURE_TYPES[specialty]?.length || 0} procedures
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
