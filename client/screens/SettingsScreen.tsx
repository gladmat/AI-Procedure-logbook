import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Share,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { clearAllData, exportCasesAsJSON, getCases, getSettings, saveSettings, AppSettings } from "@/lib/storage";
import { CountryCode, COUNTRY_LABELS } from "@/types/case";
import { COUNTRY_CODING_SYSTEMS, getCodingSystemForProfile } from "@/lib/snomedCt";
import { useAuth } from "@/contexts/AuthContext";

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  subtitle?: string;
  value?: string;
}

function SettingsItem({
  icon,
  label,
  onPress,
  destructive = false,
  subtitle,
  value,
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
      {value ? (
        <ThemedText style={[styles.itemValue, { color: theme.textSecondary }]}>
          {value}
        </ThemedText>
      ) : null}
      <Feather name="chevron-right" size={20} color={theme.textTertiary} />
    </Pressable>
  );
}

const COUNTRIES: CountryCode[] = ["CH", "GB", "PL", "AU", "NZ", "US"];

const CAREER_STAGE_LABELS: Record<string, string> = {
  junior_house_officer: "Junior House Officer",
  registrar_non_training: "Registrar (Non-Training)",
  set_trainee: "SET Trainee",
  fellow: "Fellow",
  consultant_specialist: "Consultant / Specialist",
  moss: "Medical Officer Special Scale",
};

const COUNTRY_OF_PRACTICE_LABELS: Record<string, string> = {
  new_zealand: "New Zealand",
  australia: "Australia",
  united_kingdom: "United Kingdom",
  united_states: "United States",
  poland: "Poland",
  other: "Other",
};

export default function SettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, profile, facilities, logout, addFacility, removeFacility } = useAuth();

  const [caseCount, setCaseCount] = useState<number | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showFacilitiesModal, setShowFacilitiesModal] = useState(false);
  const [newFacilityName, setNewFacilityName] = useState("");

  useEffect(() => {
    getCases().then((cases) => setCaseCount(cases.length));
    getSettings().then(setSettings);
  }, []);

  const handleCountryChange = async (country: CountryCode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await saveSettings({ countryCode: country });
    setSettings((prev) => prev ? { ...prev, countryCode: country } : null);
    setShowCountryPicker(false);
  };

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
            getSettings().then(setSettings);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleAddFacility = async () => {
    if (!newFacilityName.trim()) return;
    try {
      await addFacility(newFacilityName.trim(), facilities.length === 0);
      setNewFacilityName("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add facility");
    }
  };

  const handleRemoveFacility = (id: string, name: string) => {
    Alert.alert(
      "Remove Facility",
      `Remove "${name}" from your facilities?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeFacility(id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
      ]
    );
  };

  return (
    <>
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
            ACCOUNT
          </ThemedText>
          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatarContainer, { backgroundColor: theme.link + "15" }]}>
                <Feather name="user" size={28} color={theme.link} />
              </View>
              <View style={styles.profileInfo}>
                <ThemedText style={styles.profileName}>
                  {profile?.fullName || "Surgeon"}
                </ThemedText>
                <ThemedText style={[styles.profileEmail, { color: theme.textSecondary }]}>
                  {user?.email}
                </ThemedText>
                {profile?.careerStage ? (
                  <ThemedText style={[styles.profileDetail, { color: theme.textTertiary }]}>
                    {CAREER_STAGE_LABELS[profile.careerStage] || profile.careerStage}
                  </ThemedText>
                ) : null}
              </View>
            </View>
            <View style={[styles.profileDetailsRow, { borderTopColor: theme.border }]}>
              <View style={styles.profileDetailItem}>
                <ThemedText style={[styles.profileDetailLabel, { color: theme.textSecondary }]}>
                  Country
                </ThemedText>
                <ThemedText style={styles.profileDetailValue}>
                  {profile?.countryOfPractice ? COUNTRY_OF_PRACTICE_LABELS[profile.countryOfPractice] || profile.countryOfPractice : "Not set"}
                </ThemedText>
              </View>
              <View style={styles.profileDetailItem}>
                <ThemedText style={[styles.profileDetailLabel, { color: theme.textSecondary }]}>
                  Coding System
                </ThemedText>
                <ThemedText style={styles.profileDetailValue} numberOfLines={1}>
                  {getCodingSystemForProfile(profile?.countryOfPractice).split(' (')[0]}
                </ThemedText>
              </View>
            </View>
            {profile?.medicalCouncilNumber ? (
              <View style={[styles.profileDetailsRow, { borderTopColor: theme.border }]}>
                <View style={styles.profileDetailItem}>
                  <ThemedText style={[styles.profileDetailLabel, { color: theme.textSecondary }]}>
                    Registration
                  </ThemedText>
                  <ThemedText style={styles.profileDetailValue}>
                    {profile.medicalCouncilNumber}
                  </ThemedText>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            FACILITIES
          </ThemedText>
          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault }]}>
            <SettingsItem
              icon="home"
              label="My Facilities"
              subtitle={`${facilities.length} ${facilities.length === 1 ? 'hospital' : 'hospitals'}`}
              onPress={() => setShowFacilitiesModal(true)}
            />
          </View>
        </View>


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
            <View style={[styles.aboutItem, { borderBottomWidth: 0 }]}>
              <ThemedText style={styles.aboutLabel}>Procedure Coding</ThemedText>
              <ThemedText style={[styles.aboutValue, { color: theme.textSecondary }]}>
                SNOMED CT
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            ACCOUNT
          </ThemedText>
          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault }]}>
            <SettingsItem
              icon="log-out"
              label="Sign Out"
              onPress={handleLogout}
              destructive
            />
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

      <Modal
        visible={showFacilitiesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFacilitiesModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowFacilitiesModal(false)}
        >
          <View style={[styles.facilitiesModalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.modalTitle}>My Facilities</ThemedText>
            <ThemedText style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Hospitals and clinics where you operate
            </ThemedText>
            
            <View style={styles.addFacilityRow}>
              <TextInput
                style={[styles.facilityInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={newFacilityName}
                onChangeText={setNewFacilityName}
                placeholder="Add new facility"
                placeholderTextColor={theme.textTertiary}
                onSubmitEditing={handleAddFacility}
                returnKeyType="done"
              />
              <Pressable
                style={[styles.addFacilityButton, { backgroundColor: theme.link, opacity: newFacilityName.trim() ? 1 : 0.5 }]}
                onPress={handleAddFacility}
                disabled={!newFacilityName.trim()}
              >
                <Feather name="plus" size={20} color="#FFF" />
              </Pressable>
            </View>

            {facilities.length > 0 ? (
              facilities.map((facility) => (
                <View
                  key={facility.id}
                  style={[styles.facilityItem, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <View style={styles.facilityItemInfo}>
                    <Feather name="home" size={16} color={theme.textSecondary} />
                    <ThemedText style={styles.facilityItemName}>{facility.facilityName}</ThemedText>
                    {facility.isPrimary ? (
                      <View style={[styles.primaryBadge, { backgroundColor: theme.link + "20" }]}>
                        <ThemedText style={[styles.primaryBadgeText, { color: theme.link }]}>Primary</ThemedText>
                      </View>
                    ) : null}
                  </View>
                  <Pressable onPress={() => handleRemoveFacility(facility.id, facility.facilityName)}>
                    <Feather name="x" size={18} color={theme.error} />
                  </Pressable>
                </View>
              ))
            ) : (
              <View style={styles.emptyFacilities}>
                <Feather name="home" size={32} color={theme.textTertiary} />
                <ThemedText style={[styles.emptyFacilitiesText, { color: theme.textSecondary }]}>
                  No facilities added
                </ThemedText>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showCountryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCountryPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.modalTitle}>Select Country / Region</ThemedText>
            <ThemedText style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              This determines the procedure coding system used
            </ThemedText>
            {COUNTRIES.map((country) => (
              <Pressable
                key={country}
                style={({ pressed }) => [
                  styles.countryOption,
                  settings?.countryCode === country && { backgroundColor: theme.link + "15" },
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => handleCountryChange(country)}
              >
                <View style={styles.countryInfo}>
                  <ThemedText style={styles.countryName}>
                    {COUNTRY_LABELS[country]}
                  </ThemedText>
                  <ThemedText style={[styles.countrySystem, { color: theme.textSecondary }]}>
                    {COUNTRY_CODING_SYSTEMS[country]}
                  </ThemedText>
                </View>
                {settings?.countryCode === country ? (
                  <Feather name="check" size={20} color={theme.link} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
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
  sectionHint: {
    fontSize: 12,
    marginTop: Spacing.sm,
    marginLeft: Spacing.sm,
    lineHeight: 16,
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
    fontSize: 12,
    marginTop: 2,
  },
  itemValue: {
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.modal,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  countryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: "500",
  },
  countrySystem: {
    fontSize: 12,
    marginTop: 2,
  },
  profileHeader: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
    alignItems: "center",
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  profileDetail: {
    fontSize: 12,
    marginTop: 4,
  },
  profileDetailsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  profileDetailItem: {
    flex: 1,
  },
  profileDetailLabel: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  profileDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  facilitiesModalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.modal,
  },
  addFacilityRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  facilityInput: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  addFacilityButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  facilityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  facilityItemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  facilityItemName: {
    fontSize: 15,
    flex: 1,
  },
  primaryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  emptyFacilities: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyFacilitiesText: {
    fontSize: 14,
    marginTop: Spacing.sm,
  },
});
