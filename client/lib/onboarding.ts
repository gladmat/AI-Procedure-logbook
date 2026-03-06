import AsyncStorage from "@react-native-async-storage/async-storage";

const FORCE_ONBOARDING_RESTART_USER_KEY = "@opus_force_onboarding_restart_user";

export async function requestOnboardingRestart(userId: string) {
  await AsyncStorage.setItem(FORCE_ONBOARDING_RESTART_USER_KEY, userId);
}

export async function consumeOnboardingRestartRequest(userId: string) {
  const storedUserId = await AsyncStorage.getItem(
    FORCE_ONBOARDING_RESTART_USER_KEY,
  );

  if (storedUserId !== userId) {
    return false;
  }

  await AsyncStorage.removeItem(FORCE_ONBOARDING_RESTART_USER_KEY);
  return true;
}
