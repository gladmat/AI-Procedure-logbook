// client/navigation/OnboardingNavigator.tsx
// Stack navigator for all onboarding screens.
// No header bar — all navigation is handled by in-screen buttons.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@/theme/tokens';

export type OnboardingStackParams = {
  Welcome: undefined;
  Features: undefined; // Screens 2–4 handled internally as FlatList pager
  Auth: undefined;
  AuthEmail: undefined; // Email/password sub-screen
  Categories: undefined;
  Training: { categories: string[] };
  Hospital: { categories: string[]; training: string | null };
  Privacy: {
    categories: string[];
    training: string | null;
    hospital: string | null;
  };
};

// Placeholder components — replaced in subsequent phases
function Placeholder({ name }: { name: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{name}</Text>
    </View>
  );
}

function WelcomeScreen() {
  return <Placeholder name="Welcome" />;
}
function FeaturePager() {
  return <Placeholder name="Features" />;
}
function AuthScreen() {
  return <Placeholder name="Auth" />;
}
function AuthEmailScreen() {
  return <Placeholder name="AuthEmail" />;
}
function CategoriesScreen() {
  return <Placeholder name="Categories" />;
}
function TrainingScreen() {
  return <Placeholder name="Training" />;
}
function HospitalScreen() {
  return <Placeholder name="Hospital" />;
}
function PrivacyScreen() {
  return <Placeholder name="Privacy" />;
}

const Stack = createNativeStackNavigator<OnboardingStackParams>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background.primary },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Features" component={FeaturePager} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="AuthEmail" component={AuthEmailScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Training" component={TrainingScreen} />
      <Stack.Screen name="Hospital" component={HospitalScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  placeholderText: {
    color: colors.text.secondary,
    fontSize: 17,
  },
});
