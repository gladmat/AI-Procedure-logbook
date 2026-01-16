import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
  ScrollView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Case, Specialty, SPECIALTY_LABELS } from "@/types/case";
import { getCases } from "@/lib/storage";
import { CaseCard } from "@/components/CaseCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/LoadingState";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const SPECIALTY_FILTERS: (Specialty | "all")[] = [
  "all",
  "free_flap",
  "hand_trauma",
  "body_contouring",
  "aesthetics",
  "burns",
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Specialty | "all">("all");

  const loadCases = async () => {
    try {
      const data = await getCases();
      setCases(data);
    } catch (error) {
      console.error("Error loading cases:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCases();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCases();
    setRefreshing(false);
  };

  const filteredCases =
    filter === "all"
      ? cases
      : cases.filter((c) => c.specialty === filter);

  const handleCasePress = (caseData: Case) => {
    navigation.navigate("CaseDetail", { caseId: caseData.id });
  };

  const handleFilterPress = (specialty: Specialty | "all") => {
    Haptics.selectionAsync();
    setFilter(specialty);
  };

  const renderItem = ({ item, index }: { item: Case; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <CaseCard caseData={item} onPress={() => handleCasePress(item)} />
    </Animated.View>
  );

  const renderEmptyState = () => (
    <EmptyState
      image={require("../../client/assets/images/empty-cases.png")}
      title="No Cases Yet"
      message="Start logging your surgical cases to build your professional portfolio"
      actionLabel="Add Your First Case"
      onAction={() => navigation.navigate("AddCase")}
    />
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight },
        ]}
      >
        <View style={styles.skeletonContainer}>
          <SkeletonCard height={130} />
          <SkeletonCard height={130} />
          <SkeletonCard height={130} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={filteredCases}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl + 80,
          },
          filteredCases.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.link}
            progressViewOffset={headerHeight}
          />
        }
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
            style={styles.filterScroll}
          >
            {SPECIALTY_FILTERS.map((specialty) => (
              <Pressable
                key={specialty}
                onPress={() => handleFilterPress(specialty)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      filter === specialty
                        ? theme.link
                        : theme.backgroundDefault,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterText,
                    {
                      color:
                        filter === specialty
                          ? theme.buttonText
                          : theme.text,
                    },
                  ]}
                >
                  {specialty === "all" ? "All" : SPECIALTY_LABELS[specialty]}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate("AddCase");
        }}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.link,
            bottom: tabBarHeight + Spacing.lg,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Feather name="plus" size={28} color={theme.buttonText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: Spacing.md,
  },
  filterScroll: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  skeletonContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
