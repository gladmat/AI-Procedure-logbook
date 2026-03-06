import React, { useState, useEffect, useCallback } from "react";
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
import PersonalisationScreen from "@/screens/PersonalisationScreen";
import SurgicalPreferencesScreen from "@/screens/SurgicalPreferencesScreen";
import { WelcomeScreen } from "@/screens/onboarding/WelcomeScreen";
import { FeaturePager } from "@/screens/onboarding/FeaturePager";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { useAppLock } from "@/contexts/AppLockContext";
import {
  buildSurgicalPreferencesUpdate,
  hasAnsweredCategoryPersonalization,
  hasAnsweredHospitalAffiliation,
  hasAnsweredTrainingProgramme,
} from "@/lib/personalization";
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
  SurgicalPreferences: undefined;
  Personalisation: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const {
    isAuthenticated,
    onboardingComplete,
    isLoading,
    profile,
    facilities,
    updateProfile,
    addFacility,
  } = useAuth();
  const { isLocked, isAppLockConfigured } = useAppLock();
  const { theme: colors } = useTheme();

  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [hasSeenFeatures, setHasSeenFeatures] = useState<boolean | null>(null);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [emailAuthMode, setEmailAuthMode] = useState<"signup" | "signin">(
    "signup",
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
    },
    [profile?.surgicalPreferences, updateProfile],
  );

  const handleTrainingComplete = useCallback(
    async (programme: string | null) => {
      await updateProfile({
        surgicalPreferences: buildSurgicalPreferencesUpdate(
          profile?.surgicalPreferences,
          {
            trainingProgramme: programme,
            trainingProgrammeAnswered: true,
          },
        ),
      });
    },
    [profile?.surgicalPreferences, updateProfile],
  );

  const handleHospitalComplete = useCallback(
    async (hospital: HospitalSelection | null) => {
      if (hospital) {
        const alreadyExists = facilities.some((facility) => {
          if (
            hospital.facilityId &&
            facility.facilityId === hospital.facilityId
          ) {
            return true;
          }

          return (
            facility.facilityName.trim().toLowerCase() ===
            hospital.name.trim().toLowerCase()
          );
        });

        if (!alreadyExists) {
          await addFacility(
            hospital.name,
            facilities.length === 0,
            hospital.facilityId,
          );
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
    },
    [addFacility, facilities, profile?.surgicalPreferences, updateProfile],
  );

  useEffect(() => {
    if (isAuthenticated) {
      setShowEmailAuth(false);
      setEmailAuthMode("signup");
    }
  }, [isAuthenticated]);

  const hasCompletedCategories = hasAnsweredCategoryPersonalization(profile);
  const hasCompletedTraining = hasAnsweredTrainingProgramme(profile);
  const hasCompletedHospital =
    hasAnsweredHospitalAffiliation(profile) || facilities.length > 0;

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
        <Stack.Screen name="Welcome" options={{ headerShown: false }}>
          {() => (
            <WelcomeScreen
              onComplete={handleWelcomeComplete}
              onSignIn={handleWelcomeSignIn}
            />
          )}
        </Stack.Screen>
      ) : !hasSeenFeatures && !isAuthenticated ? (
        <Stack.Screen name="Features" options={{ headerShown: false }}>
          {() => <FeaturePager onComplete={handleFeaturesComplete} />}
        </Stack.Screen>
      ) : !isAuthenticated && showEmailAuth ? (
        <Stack.Screen name="EmailSignup" options={{ headerShown: false }}>
          {() => <EmailSignupScreen initialMode={emailAuthMode} />}
        </Stack.Screen>
      ) : !isAuthenticated ? (
        <Stack.Screen name="Auth" options={{ headerShown: false }}>
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
      ) : !onboardingComplete && !hasCompletedCategories ? (
        <Stack.Screen name="Categories" options={{ headerShown: false }}>
          {() => <CategoriesScreen onComplete={handleCategoriesComplete} />}
        </Stack.Screen>
      ) : !onboardingComplete && !hasCompletedTraining ? (
        <Stack.Screen name="Training" options={{ headerShown: false }}>
          {() => <TrainingScreen onComplete={handleTrainingComplete} />}
        </Stack.Screen>
      ) : !onboardingComplete && !hasCompletedHospital ? (
        <Stack.Screen name="Hospital" options={{ headerShown: false }}>
          {() => (
            <HospitalScreen
              onComplete={handleHospitalComplete}
              trainingProgramme={
                profile?.surgicalPreferences?.personalization
                  ?.trainingProgramme ?? null
              }
            />
          )}
        </Stack.Screen>
      ) : !onboardingComplete ? (
        <Stack.Screen name="Privacy" options={{ headerShown: false }}>
          {() => <PrivacyScreen onComplete={() => undefined} />}
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
