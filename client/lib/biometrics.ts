import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";

export function isExpoGoRuntime() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

export function isFaceIdUnsupportedInCurrentRuntime(
  authenticationTypes: LocalAuthentication.AuthenticationType[],
) {
  return (
    Platform.OS === "ios" &&
    isExpoGoRuntime() &&
    authenticationTypes.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    )
  );
}
