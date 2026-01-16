import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Share,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { clearAllData, exportCasesAsJSON, getCases } from "@/lib/storage";

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  subtitle?: string;
}

function SettingsItem({
  icon,
  label,
  onPress,
  destructive = false,
  subtitle,
}: SettingsItemProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsItem,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: destructive
              ? theme.error + "15"
              : theme.link + "15",
          },
        ]}
      >
        <Feather
          name={icon}
          size={20}
          color={destructive ? theme.error : theme.link}
        />
      </View>
      <View style={styles.itemContent}>
        <ThemedText
          style={[
            styles.itemLabel,
            { color: destructive ? theme.error : theme.text },
          ]}
        >
          {label}
        </ThemedText>
        {subtitle ? (
          <ThemedText style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <Feather name="chevron-right" size={20} color={theme.textTertiary} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const [caseCount, setCaseCount] = useState<number | null>(null);

  React.useEffect(() => {
    getCases().then((cases) => setCaseCount(cases.length));
  }, []);

  const handleExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const json = await exportCasesAsJSON();
      await Share.share({
        message: json,
        title: "Surgical Logbook Export",
      });
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Export Error", "Failed to export cases");
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your cases, timeline events, and settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Data Cleared", "All data has been deleted");
            setCaseCount(0);
          },
        },
      ]
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
    >
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          DATA
        </ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault }]}>
          <SettingsItem
            icon="download"
            label="Export Cases"
            subtitle={caseCount !== null ? `${caseCount} cases` : undefined}
            onPress={handleExport}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          PRIVACY
        </ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.privacyInfo}>
            <View style={[styles.privacyBadge, { backgroundColor: theme.success + "15" }]}>
              <Feather name="shield" size={20} color={theme.success} />
            </View>
            <View style={styles.privacyText}>
              <ThemedText style={styles.privacyTitle}>Local-First Privacy</ThemedText>
              <ThemedText style={[styles.privacyDescription, { color: theme.textSecondary }]}>
                All your case data is stored locally on this device. Photos are processed on-device and never uploaded. Sensitive information like NHI numbers are automatically redacted before AI analysis.
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ABOUT
        </ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.aboutItem}>
            <ThemedText style={styles.aboutLabel}>Version</ThemedText>
            <ThemedText style={[styles.aboutValue, { color: theme.textSecondary }]}>
              1.0.0
            </ThemedText>
          </View>
          <View style={styles.aboutItem}>
            <ThemedText style={styles.aboutLabel}>Built for</ThemedText>
            <ThemedText style={[styles.aboutValue, { color: theme.textSecondary }]}>
              Microsurgery & Reconstruction
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          DANGER ZONE
        </ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault }]}>
          <SettingsItem
            icon="trash-2"
            label="Clear All Data"
            onPress={handleClearData}
            destructive
          />
        </View>
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  sectionCard: {
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  privacyInfo: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  privacyBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  privacyText: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  privacyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  aboutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  aboutLabel: {
    fontSize: 15,
  },
  aboutValue: {
    fontSize: 15,
  },
});
