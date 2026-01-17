import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";

const COUNTRIES = [
  { value: "new_zealand", label: "New Zealand" },
  { value: "australia", label: "Australia" },
  { value: "united_kingdom", label: "United Kingdom" },
  { value: "united_states", label: "United States" },
  { value: "poland", label: "Poland" },
  { value: "other", label: "Other" },
];

const CAREER_STAGES = [
  { value: "junior_house_officer", label: "Junior House Officer" },
  { value: "registrar_non_training", label: "Registrar (Non-Training)" },
  { value: "set_trainee", label: "SET Trainee" },
  { value: "fellow", label: "Fellow" },
  { value: "consultant_specialist", label: "Consultant / Specialist" },
  { value: "moss", label: "Medical Officer Special Scale" },
];

type Step = "country" | "career" | "facilities";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { updateProfile, addFacility, facilities } = useAuth();

  const [step, setStep] = useState<Step>("country");
  const [isLoading, setIsLoading] = useState(false);

  const [countryOfPractice, setCountryOfPractice] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [medicalCouncilNumber, setMedicalCouncilNumber] = useState("");
  const [careerStage, setCareerStage] = useState<string | null>(null);
  const [newFacility, setNewFacility] = useState("");

  const handleNext = async () => {
    if (step === "country") {
      if (!countryOfPractice) {
        Alert.alert("Required", "Please select your country of practice");
        return;
      }
      if (!fullName.trim()) {
        Alert.alert("Required", "Please enter your full name");
        return;
      }
      setStep("career");
    } else if (step === "career") {
      if (!careerStage) {
        Alert.alert("Required", "Please select your career stage");
        return;
      }
      setStep("facilities");
    } else if (step === "facilities") {
      if (facilities.length === 0) {
        Alert.alert("Required", "Please add at least one facility where you operate");
        return;
      }
      setIsLoading(true);
      try {
        await updateProfile({
          fullName: fullName.trim(),
          countryOfPractice,
          medicalCouncilNumber: medicalCouncilNumber.trim() || null,
          careerStage,
          onboardingComplete: true,
        });
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to complete setup");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === "career") setStep("country");
    else if (step === "facilities") setStep("career");
  };

  const handleAddFacility = async () => {
    if (!newFacility.trim()) return;
    setIsLoading(true);
    try {
      await addFacility(newFacility.trim(), facilities.length === 0);
      setNewFacility("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add facility");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "country":
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Welcome to Surgical Logbook
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Let's set up your profile. First, tell us where you practice.
            </Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Dr. Jane Smith"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.lg }]}>Country of Practice</Text>
            <View style={styles.optionsGrid}>
              {COUNTRIES.map((country) => (
                <Pressable
                  key={country.value}
                  style={[
                    styles.optionCard,
                    { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                    countryOfPractice === country.value && { borderColor: colors.link, backgroundColor: colors.link + "15" },
                  ]}
                  onPress={() => setCountryOfPractice(country.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: colors.text },
                      countryOfPractice === country.value && { color: colors.link },
                    ]}
                  >
                    {country.label}
                  </Text>
                  {countryOfPractice === country.value && (
                    <Feather name="check" size={18} color={colors.link} />
                  )}
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
              Medical Council Registration (Optional)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
              value={medicalCouncilNumber}
              onChangeText={setMedicalCouncilNumber}
              placeholder="e.g. MCNZ 12345"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        );

      case "career":
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Career Stage
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Select your current training or practice level.
            </Text>

            <View style={styles.optionsList}>
              {CAREER_STAGES.map((stage) => (
                <Pressable
                  key={stage.value}
                  style={[
                    styles.optionRow,
                    { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                    careerStage === stage.value && { borderColor: colors.link, backgroundColor: colors.link + "15" },
                  ]}
                  onPress={() => setCareerStage(stage.value)}
                >
                  <Text
                    style={[
                      styles.optionRowText,
                      { color: colors.text },
                      careerStage === stage.value && { color: colors.link },
                    ]}
                  >
                    {stage.label}
                  </Text>
                  {careerStage === stage.value && (
                    <Feather name="check-circle" size={20} color={colors.link} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        );

      case "facilities":
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Your Facilities
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Add the hospitals or clinics where you perform surgery.
            </Text>

            <View style={styles.addFacilityRow}>
              <TextInput
                style={[styles.facilityInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                value={newFacility}
                onChangeText={setNewFacility}
                placeholder="Hospital or clinic name"
                placeholderTextColor={colors.textTertiary}
                onSubmitEditing={handleAddFacility}
                returnKeyType="done"
              />
              <Pressable
                style={[styles.addButton, { backgroundColor: colors.link, opacity: newFacility.trim() ? 1 : 0.5 }]}
                onPress={handleAddFacility}
                disabled={!newFacility.trim() || isLoading}
              >
                <Feather name="plus" size={22} color="#FFF" />
              </Pressable>
            </View>

            {facilities.length > 0 ? (
              <View style={styles.facilitiesList}>
                {facilities.map((facility, index) => (
                  <View
                    key={facility.id}
                    style={[styles.facilityItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                  >
                    <View style={styles.facilityInfo}>
                      <Feather name="home" size={18} color={colors.textSecondary} />
                      <Text style={[styles.facilityName, { color: colors.text }]}>{facility.facilityName}</Text>
                      {facility.isPrimary && (
                        <View style={[styles.primaryBadge, { backgroundColor: colors.link + "20" }]}>
                          <Text style={[styles.primaryBadgeText, { color: colors.link }]}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <Pressable onPress={() => {}}>
                      <Feather name="x" size={18} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
                <Feather name="home" size={32} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No facilities added yet
                </Text>
              </View>
            )}
          </View>
        );
    }
  };

  const getStepIndex = () => (step === "country" ? 0 : step === "career" ? 1 : 2);
  const canGoBack = step !== "country";
  const buttonLabel = step === "facilities" ? "Complete Setup" : "Continue";

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.backgroundRoot }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.progressContainer}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                { backgroundColor: i <= getStepIndex() ? colors.link : colors.backgroundTertiary },
              ]}
            />
          ))}
        </View>

        {renderStep()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: colors.backgroundRoot, borderTopColor: colors.border }]}>
        <View style={styles.footerButtons}>
          {canGoBack ? (
            <Pressable
              style={[styles.backButton, { borderColor: colors.border }]}
              onPress={handleBack}
              disabled={isLoading}
            >
              <Feather name="arrow-left" size={20} color={colors.text} />
              <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
            </Pressable>
          ) : (
            <View />
          )}

          <Pressable
            style={[styles.nextButton, { backgroundColor: colors.link, opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>{buttonLabel}</Text>
                {step !== "facilities" && <Feather name="arrow-right" size={20} color="#FFF" />}
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing["3xl"],
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.h1,
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    ...Typography.body,
    marginBottom: Spacing["2xl"],
  },
  label: {
    ...Typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    minWidth: "48%",
    flex: 1,
  },
  optionText: {
    ...Typography.bodySemibold,
  },
  optionsList: {
    gap: Spacing.sm,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
  },
  optionRowText: {
    ...Typography.bodySemibold,
  },
  addFacilityRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  facilityInput: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },
  addButton: {
    width: Spacing.inputHeight,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  facilitiesList: {
    gap: Spacing.sm,
  },
  facilityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  facilityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  facilityName: {
    ...Typography.body,
    flex: 1,
  },
  primaryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  primaryBadgeText: {
    ...Typography.caption,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
    borderRadius: BorderRadius.md,
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.sm,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  backButtonText: {
    ...Typography.bodySemibold,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.sm,
    minWidth: 140,
    justifyContent: "center",
  },
  nextButtonText: {
    ...Typography.bodySemibold,
    color: "#FFF",
  },
});
