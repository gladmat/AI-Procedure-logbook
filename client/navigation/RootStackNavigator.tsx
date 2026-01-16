import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import CaseDetailScreen from "@/screens/CaseDetailScreen";
import CaseFormScreen from "@/screens/CaseFormScreen";
import AddCaseScreen from "@/screens/AddCaseScreen";
import SmartCaptureScreen from "@/screens/SmartCaptureScreen";
import AddTimelineEventScreen from "@/screens/AddTimelineEventScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Specialty } from "@/types/case";

export type RootStackParamList = {
  Main: undefined;
  CaseDetail: { caseId: string };
  CaseForm: { specialty: Specialty; extractedData?: Record<string, unknown> };
  AddCase: undefined;
  SmartCapture: undefined;
  AddTimelineEvent: { caseId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
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
        name="SmartCapture"
        component={SmartCaptureScreen}
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
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
    </Stack.Navigator>
  );
}
