import AsyncStorage from "@react-native-async-storage/async-storage";

const FORCE_ONBOARDING_RESTART_USER_KEY = "@opus_force_onboarding_restart_user";

export type OnboardingRestartMode = "resume" | "full";

type OnboardingRestartRequest = {
  userId: string;
  mode: OnboardingRestartMode;
};

export async function requestOnboardingRestart(
  userId: string,
  mode: OnboardingRestartMode = "resume",
) {
  const request: OnboardingRestartRequest = { userId, mode };
  await AsyncStorage.setItem(
    FORCE_ONBOARDING_RESTART_USER_KEY,
    JSON.stringify(request),
  );
}

export async function consumeOnboardingRestartRequest(userId: string) {
  const raw = await AsyncStorage.getItem(FORCE_ONBOARDING_RESTART_USER_KEY);
  if (!raw) {
    return null;
  }

  let parsed: OnboardingRestartRequest | null = null;
  try {
    parsed = JSON.parse(raw) as OnboardingRestartRequest;
  } catch {
    // Backward compatibility for the old "userId only" storage shape.
    parsed = { userId: raw, mode: "resume" };
  }

  if (!parsed || parsed.userId !== userId) {
    return null;
  }

  await AsyncStorage.removeItem(FORCE_ONBOARDING_RESTART_USER_KEY);
  return parsed.mode;
}
