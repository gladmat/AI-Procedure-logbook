import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@/components/FeatherIcon";
import { useTheme } from "@/hooks/useTheme";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AddCaseFABProps {
  onPress: () => void;
}

function AddCaseFABInner({ onPress }: AddCaseFABProps) {
  const { theme, isDark } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel="Add case"
      accessibilityHint="Opens a new case form"
      style={[
        styles.fab,
        { backgroundColor: theme.accent },
        { bottom: tabBarHeight + 16 },
        !isDark && [styles.fabShadow, { shadowColor: theme.accent }],
        animatedStyle,
      ]}
    >
      <Feather name="plus" size={24} color={theme.accentContrast} />
    </AnimatedPressable>
  );
}

export const AddCaseFAB = React.memo(AddCaseFABInner);

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  fabShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
