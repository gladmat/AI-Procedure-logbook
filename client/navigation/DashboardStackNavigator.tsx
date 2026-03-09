import React from "react";
import { Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DashboardScreen from "@/screens/DashboardScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@/components/FeatherIcon";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export type DashboardStackParamList = {
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

function SearchButton() {
  const { theme } = useTheme();
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      onPress={() => rootNavigation.navigate("CaseSearch")}
      style={{ padding: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Search cases"
      accessibilityHint="Opens the case search screen"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Feather name="search" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function DashboardStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerTitle: () => <HeaderTitle />,
          headerRight: () => <SearchButton />,
        }}
      />
    </Stack.Navigator>
  );
}
