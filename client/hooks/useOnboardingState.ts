// client/hooks/useOnboardingState.ts
// MMKV-backed synchronous onboarding state — no async, no flash on app start.

import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'opus-onboarding' });

export interface OnboardingProfile {
  selectedCategories: string[]; // Array of category ids
  trainingProgramme: string | null;
  hospital: string | null;
}

export function useOnboardingState() {
  // Synchronous — safe to call before first render
  const isComplete = storage.getBoolean('onboarding_complete') ?? false;

  const getProfile = (): OnboardingProfile => ({
    selectedCategories: JSON.parse(
      storage.getString('categories') ?? '[]',
    ),
    trainingProgramme: storage.getString('training') ?? null,
    hospital: storage.getString('hospital') ?? null,
  });

  const completeOnboarding = (profile: OnboardingProfile) => {
    storage.set('categories', JSON.stringify(profile.selectedCategories));
    storage.set('training', profile.trainingProgramme ?? '');
    storage.set('hospital', profile.hospital ?? '');
    storage.set('onboarding_complete', true);
    // RootNavigator re-renders automatically — no manual nav needed
  };

  // Dev helper — call from settings to replay onboarding during QA
  const resetOnboarding = () => storage.clearAll();

  return { isComplete, getProfile, completeOnboarding, resetOnboarding };
}
