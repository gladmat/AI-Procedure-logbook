import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import CaseDetailScreen from "@/screens/CaseDetailScreen";
import CaseFormScreen from "@/screens/CaseFormScreen";
import AddCaseScreen from "@/screens/AddCaseScreen";
import AddTimelineEventScreen from "@/screens/AddTimelineEventScreen";
import MediaManagementScreen from "@/screens/MediaManagementScreen";
import AddOperativeMediaScreen from "@/screens/AddOperativeMediaScreen";
import { OnboardingAuthScreen } from "@/screens/onboarding/AuthScreen";
import { EmailSignupScreen } from "@/screens/onboarding/EmailSignupScreen";
import { CategoriesScreen } from "@/screens/onboarding/CategoriesScreen";
import { TrainingScreen } from "@/screens/onboarding/TrainingScreen";
import {
  HospitalScreen,
  type HospitalSelection,
} from "@/screens/onboarding/HospitalScreen";
import { PrivacyScreen } from "@/screens/onboarding/PrivacyScreen";
import LockScreen from "@/screens/LockScreen";
import SetupAppLockScreen from "@/screens/SetupAppLockScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import EpisodeDetailScreen from "@/screens/EpisodeDetailScreen";
import EpisodeListScreen from "@/screens/EpisodeListScreen";
import ManageFacilitiesScreen from "@/screens/ManageFacilitiesScreen";
import PersonalisationScreen from "@/screens/PersonalisationScreen";
import SurgicalPreferencesScreen from "@/screens/SurgicalPreferencesScreen";
import { WelcomeScreen } from "@/screens/onboarding/WelcomeScreen";
import { FeaturePager } from "@/screens/onboarding/FeaturePager";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { useAppLock } from "@/contexts/AppLockContext";
import {
  buildSurgicalPreferencesUpdate,
  getStoredSelectedSpecialties,
} from "@/lib/personalization";
import { TRAINING_OPTIONS } from "@/constants/trainingProgrammes";
import {
  Specialty,
  TimelineEventType,
  MediaAttachment,
  Case,
} from "@/types/case";
import type { EpisodePrefillData } from "@/types/episode";
import { useTheme } from "@/hooks/useTheme";

const WELCOME_SEEN_KEY = "@opus_has_seen_welcome";
const FEATURES_SEEN_KEY = "@opus_has_seen_features";
type OnboardingStep = "categories" | "training" | "hospital" | "privacy";
type OnboardingDraft = {
  selectedCategories: Specialty[];
  trainingSelectionId: string | null;
  trainingProgramme: string | null;
  selectedHospitals: HospitalSelection[];
};

const EMPTY_ONBOARDING_DRAFT: OnboardingDraft = {
  selectedCategories: [],
  trainingSelectionId: null,
  trainingProgramme: null,
  selectedHospitals: [],
};

function normalizeHospitalName(name: string) {
  return name.trim().toLowerCase();
}

function isSameHospitalSelection(
  left: HospitalSelection,
  right: HospitalSelection,
) {
  if (left.facilityId && right.facilityId) {
    return left.facilityId === right.facilityId;
  }

  return normalizeHospitalName(left.name) === normalizeHospitalName(right.name);
}

function getFirstIncompleteOnboardingStep(
  profile: ReturnType<typeof useAuth>["profile"],
  facilities: ReturnType<typeof useAuth>["facilities"],
): OnboardingStep {
  const personalization = profile?.surgicalPreferences?.personalization;

  if (!Array.isArray(personalization?.selectedSpecialties)) {
    return "categories";
  }

  if (personalization?.trainingProgrammeAnswered !== true) {
    return "training";
  }

  if (personalization?.hospitalAnswered !== true && facilities.length === 0) {
    return "hospital";
  }

  return "privacy";
}

function buildOnboardingDraft(
  profile: ReturnType<typeof useAuth>["profile"],
  facilities: ReturnType<typeof useAuth>["facilities"],
): OnboardingDraft {
  const personalization = profile?.surgicalPreferences?.personalization;
  const storedTrainingProgramme = personalization?.trainingProgramme ?? null;
  const selectedTrainingOption = storedTrainingProgramme
    ? TRAINING_OPTIONS.find((option) => option.id === storedTrainingProgramme)
    : null;

  return {
    selectedCategories: getStoredSelectedSpecialties(profile) ?? [],
    trainingSelectionId:
      personalization?.trainingProgrammeAnswered === true
        ? storedTrainingProgramme === null
          ? "none"
          : selectedTrainingOption
            ? selectedTrainingOption.id
            : "other"
        : null,
    trainingProgramme: storedTrainingProgramme,
    selectedHospitals: facilities.map((facility) => ({
      name: facility.facilityName,
      facilityId: facility.facilityId,
    })),
  };
}

export type RootStackParamList = {
  Welcome: undefined;
  Features: undefined;
  Auth: undefined;
  EmailSignup: undefined;
  Categories: undefined;
  Training: undefined;
  Hospital: undefined;
  Privacy: undefined;
  Main: undefined;
  CaseDetail: { caseId: string; showComplicationForm?: boolean };
  CaseForm: {
    specialty?: Specialty;
    caseId?: string;
    duplicateFrom?: Case;
    episodeId?: string;
    episodePrefill?: EpisodePrefillData;
  };
  AddCase: undefined;
  AddTimelineEvent: {
    caseId: string;
    initialEventType?: TimelineEventType;
    isSkinLesion?: boolean;
    caseDischargeDate?: string;
    editEventId?: string;
  };
  MediaManagement: {
    existingAttachments?: MediaAttachment[];
    callbackId?: string;
    maxAttachments?: number;
    context?: "case" | "timeline";
    eventType?: TimelineEventType;
  };
  AddOperativeMedia: {
    imageUri: string;
    mimeType?: string;
    callbackId?: string;
    editMode?: boolean;
    existingMediaId?: string;
    existingMediaType?: string;
    existingCaption?: string;
    existingTimestamp?: string;
  };
  EpisodeDetail: { episodeId: string };
  EpisodeList: undefined;
  SetupAppLock: undefined;
  EditProfile: undefined;
  ManageFacilities: undefined;
  SurgicalPreferences: undefined;
  Personalisation: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const {
    user,
    isAuthenticated,
    onboardingComplete,
    isLoading,
    profile,
    facilities,
    updateProfile,
    addFacility,
    removeFacility,
    setFacilityPrimary,
  } = useAuth();
  const { isLocked, isAppLockConfigured } = useAppLock();
  const { theme: colors } = useTheme();
  const initializedOnboardingUserIdRef = useRef<string | null>(null);

  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [hasSeenFeatures, setHasSeenFeatures] = useState<boolean | null>(null);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [emailAuthMode, setEmailAuthMode] = useState<"signup" | "signin">(
    "signup",
  );
  const [currentOnboardingStep, setCurrentOnboardingStep] =
    useState<OnboardingStep | null>(null);
  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingDraft>(
    EMPTY_ONBOARDING_DRAFT,
  );

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(WELCOME_SEEN_KEY),
      AsyncStorage.getItem(FEATURES_SEEN_KEY),
    ]).then(([welcomeVal, featuresVal]) => {
      setHasSeenWelcome(welcomeVal === "true");
      setHasSeenFeatures(featuresVal === "true");
    });
  }, []);

  const handleWelcomeComplete = useCallback(async () => {
    await AsyncStorage.setItem(WELCOME_SEEN_KEY, "true");
    setHasSeenWelcome(true);
  }, []);

  const handleWelcomeSignIn = useCallback(async () => {
    await Promise.all([
      AsyncStorage.setItem(WELCOME_SEEN_KEY, "true"),
      AsyncStorage.setItem(FEATURES_SEEN_KEY, "true"),
    ]);
    setHasSeenWelcome(true);
    setHasSeenFeatures(true);
    setEmailAuthMode("signin");
    setShowEmailAuth(true);
  }, []);

  const handleFeaturesComplete = useCallback(async () => {
    await AsyncStorage.setItem(FEATURES_SEEN_KEY, "true");
    setHasSeenFeatures(true);
  }, []);

  const handleCategoriesComplete = useCallback(
    async (selectedCategories: Specialty[]) => {
      await updateProfile({
        surgicalPreferences: buildSurgicalPreferencesUpdate(
          profile?.surgicalPreferences,
          {
            selectedSpecialties: selectedCategories,
          },
        ),
      });
      setOnboardingDraft((prev) => ({ ...prev, selectedCategories }));
      setCurrentOnboardingStep("training");
    },
    [profile?.surgicalPreferences, updateProfile],
  );

  const handleTrainingComplete = useCallback(
    async ({
      selectionId,
      trainingProgramme,
    }: {
      selectionId: string;
      trainingProgramme: string | null;
    }) => {
      await updateProfile({
        surgicalPreferences: buildSurgicalPreferencesUpdate(
          profile?.surgicalPreferences,
          {
            trainingProgramme,
            trainingProgrammeAnswered: true,
          },
        ),
      });
      setOnboardingDraft((prev) => ({
        ...prev,
        trainingSelectionId: selectionId,
        trainingProgramme,
      }));
      setCurrentOnboardingStep("hospital");
    },
    [profile?.surgicalPreferences, updateProfile],
  );

  const handleHospitalComplete = useCallback(
    async (selectedHospitals: HospitalSelection[]) => {
      const hospitalsToSave = selectedHospitals.reduce<HospitalSelection[]>(
        (acc, hospital) => {
          if (acc.some((item) => isSameHospitalSelection(item, hospital))) {
            return acc;
          }

          return [...acc, hospital];
        },
        [],
      );

      const resolvedSelections = [...hospitalsToSave];

      if (hospitalsToSave.length > 0) {
        const retainedFacilities = facilities.filter((facility) =>
          hospitalsToSave.some((hospital) =>
            isSameHospitalSelection(hospital, {
              name: facility.facilityName,
              facilityId: facility.facilityId,
            }),
          ),
        );

        const facilitiesToRemove = facilities.filter(
          (facility) =>
            !hospitalsToSave.some((hospital) =>
              isSameHospitalSelection(hospital, {
                name: facility.facilityName,
                facilityId: facility.facilityId,
              }),
            ),
        );

        for (const facility of facilitiesToRemove) {
          await removeFacility(facility.id);
        }

        let firstSelectedFacilityId: string | undefined;
        for (let index = 0; index < hospitalsToSave.length; index += 1) {
          const hospital = hospitalsToSave[index];
          if (!hospital) {
            continue;
          }

          const existingFacility = facilities.find((facility) =>
            isSameHospitalSelection(hospital, {
              name: facility.facilityName,
              facilityId: facility.facilityId,
            }),
          );

          if (existingFacility) {
            if (index === 0) {
              firstSelectedFacilityId = existingFacility.id;
            }
            continue;
          }

          const createdFacility = await addFacility(
            hospital.name,
            retainedFacilities.length === 0 && index === 0,
            hospital.facilityId,
          );
          if (index === 0) {
            firstSelectedFacilityId = createdFacility.id;
          }

          resolvedSelections[index] = {
            name: createdFacility.facilityName,
            facilityId: createdFacility.facilityId,
          };
        }

        const selectedPrimaryFacility =
          retainedFacilities.find((facility) => facility.isPrimary) ?? null;

        if (!selectedPrimaryFacility && firstSelectedFacilityId) {
          await setFacilityPrimary(firstSelectedFacilityId);
        }
      }

      await updateProfile({
        surgicalPreferences: buildSurgicalPreferencesUpdate(
          profile?.surgicalPreferences,
          {
            hospitalAnswered: true,
          },
        ),
      });
      setOnboardingDraft((prev) => ({
        ...prev,
        selectedHospitals:
          hospitalsToSave.length > 0
            ? resolvedSelections
            : prev.selectedHospitals,
      }));
      setCurrentOnboardingStep("privacy");
    },
    [
      addFacility,
      facilities,
      profile?.surgicalPreferences,
      removeFacility,
      setFacilityPrimary,
      updateProfile,
    ],
  );

  useEffect(() => {
    if (isAuthenticated) {
      setShowEmailAuth(false);
      setEmailAuthMode("signup");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || onboardingComplete || !user?.id) {
      initializedOnboardingUserIdRef.current = null;
      setCurrentOnboardingStep(null);
      setOnboardingDraft(EMPTY_ONBOARDING_DRAFT);
      return;
    }

    if (initializedOnboardingUserIdRef.current === user.id) {
      return;
    }

    initializedOnboardingUserIdRef.current = user.id;
    setOnboardingDraft(buildOnboardingDraft(profile, facilities));
    setCurrentOnboardingStep(
      getFirstIncompleteOnboardingStep(profile, facilities),
    );
  }, [facilities, isAuthenticated, onboardingComplete, profile, user?.id]);

  const activeOnboardingStep =
    currentOnboardingStep ??
    getFirstIncompleteOnboardingStep(profile, facilities);

  if (isLoading || hasSeenWelcome === null || hasSeenFeatures === null) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.backgroundRoot },
        ]}
      >
        <ActivityIndicator size="large" color={colors.link} />
      </View>
    );
  }

  // Show lock screen when authenticated, app lock is configured, and currently locked
  if (isAuthenticated && isAppLockConfigured && isLocked) {
    return <LockScreen />;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!hasSeenWelcome && !isAuthenticated ? (
        <Stack.Screen
          key="welcome"
          name="Welcome"
          options={{ headerShown: false }}
        >
          {() => (
            <WelcomeScreen
              onComplete={handleWelcomeComplete}
              onSignIn={handleWelcomeSignIn}
            />
          )}
        </Stack.Screen>
      ) : !hasSeenFeatures && !isAuthenticated ? (
        <Stack.Screen
          key="features"
          name="Features"
          options={{ headerShown: false }}
        >
          {() => <FeaturePager onComplete={handleFeaturesComplete} />}
        </Stack.Screen>
      ) : !isAuthenticated && showEmailAuth ? (
        <Stack.Screen
          key={`email-auth-${emailAuthMode}`}
          name="EmailSignup"
          options={{ headerShown: false }}
        >
          {() => <EmailSignupScreen initialMode={emailAuthMode} />}
        </Stack.Screen>
      ) : !isAuthenticated ? (
        <Stack.Screen key="auth" name="Auth" options={{ headerShown: false }}>
          {() => (
            <OnboardingAuthScreen
              onContinueWithEmail={() => {
                setEmailAuthMode("signup");
                setShowEmailAuth(true);
              }}
              onSignIn={() => {
                setEmailAuthMode("signin");
                setShowEmailAuth(true);
              }}
            />
          )}
        </Stack.Screen>
      ) : !onboardingComplete && activeOnboardingStep === "categories" ? (
        <Stack.Screen
          key="onboarding-categories"
          name="Categories"
          options={{ headerShown: false }}
        >
          {() => (
            <CategoriesScreen
              initialSelectedCategories={onboardingDraft.selectedCategories}
              onComplete={handleCategoriesComplete}
            />
          )}
        </Stack.Screen>
      ) : !onboardingComplete && activeOnboardingStep === "training" ? (
        <Stack.Screen
          key="onboarding-training"
          name="Training"
          options={{ headerShown: false }}
        >
          {() => (
            <TrainingScreen
              initialSelectionId={onboardingDraft.trainingSelectionId}
              initialOtherText={
                onboardingDraft.trainingSelectionId === "other"
                  ? (onboardingDraft.trainingProgramme ?? "")
                  : ""
              }
              onBack={() => setCurrentOnboardingStep("categories")}
              onComplete={handleTrainingComplete}
            />
          )}
        </Stack.Screen>
      ) : !onboardingComplete && activeOnboardingStep === "hospital" ? (
        <Stack.Screen
          key="onboarding-hospital"
          name="Hospital"
          options={{ headerShown: false }}
        >
          {() => (
            <HospitalScreen
              initialHospitals={onboardingDraft.selectedHospitals}
              onBack={() => setCurrentOnboardingStep("training")}
              onComplete={handleHospitalComplete}
              trainingProgramme={onboardingDraft.trainingProgramme}
            />
          )}
        </Stack.Screen>
      ) : !onboardingComplete ? (
        <Stack.Screen
          key="onboarding-privacy"
          name="Privacy"
          options={{ headerShown: false }}
        >
          {() => (
            <PrivacyScreen
              onBack={() => setCurrentOnboardingStep("hospital")}
              onComplete={() => undefined}
            />
          )}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CaseDetail"
            component={CaseDetailScreen}
            options={{
              headerTitle: "Case Details",
            }}
          />
          <Stack.Screen
            name="CaseForm"
            component={CaseFormScreen}
            options={{
              headerTitle: "New Case",
            }}
          />
          <Stack.Screen
            name="AddCase"
            component={AddCaseScreen}
            options={{
              headerTitle: "Add Case",
            }}
          />
          <Stack.Screen
            name="AddTimelineEvent"
            component={AddTimelineEventScreen}
            options={{
              headerTitle: "Add Event",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="MediaManagement"
            component={MediaManagementScreen}
            options={{
              headerShown: false,
              presentation: "fullScreenModal",
            }}
          />
          <Stack.Screen
            name="AddOperativeMedia"
            component={AddOperativeMediaScreen}
            options={{
              headerShown: false,
              presentation: "fullScreenModal",
            }}
          />
          <Stack.Screen
            name="EpisodeDetail"
            component={EpisodeDetailScreen}
            options={{
              headerTitle: "Episode",
            }}
          />
          <Stack.Screen
            name="EpisodeList"
            component={EpisodeListScreen}
            options={{
              headerTitle: "All Episodes",
            }}
          />
          <Stack.Screen
            name="SetupAppLock"
            component={SetupAppLockScreen}
            options={{
              headerTitle: "App Lock",
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              headerTitle: "Edit Profile",
            }}
          />
          <Stack.Screen
            name="ManageFacilities"
            component={ManageFacilitiesScreen}
            options={{
              headerTitle: "My Hospitals",
            }}
          />
          <Stack.Screen
            name="SurgicalPreferences"
            component={SurgicalPreferencesScreen}
            options={{
              headerTitle: "Surgical Preferences",
            }}
          />
          <Stack.Screen
            name="Personalisation"
            component={PersonalisationScreen}
            options={{
              headerTitle: "Personalisation",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
