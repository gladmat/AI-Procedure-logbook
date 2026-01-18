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
import { getCases, getCasesPendingFollowUp, markNoComplications } from "@/lib/storage";
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
  const [pendingFollowUps, setPendingFollowUps] = useState<Case[]>([]);
  const [showFollowUps, setShowFollowUps] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Specialty | "all">("all");

  const loadCases = async () => {
    try {
      const data = await getCases();
      setCases(data);
      setPendingFollowUps(getCasesPendingFollowUp(data));
    } catch (error) {
      console.error("Error loading cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNoComplications = async (caseId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markNoComplications(caseId);
    setPendingFollowUps((prev) => prev.filter((c) => c.id !== caseId));
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              complicationsReviewed: true,
              complicationsReviewedAt: new Date().toISOString(),
              hasComplications: false,
            }
          : c
      )
    );
  };

  const handleAddComplication = (caseData: Case) => {
    navigation.navigate("CaseDetail", { caseId: caseData.id, showComplicationForm: true });
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
          <>
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

            {pendingFollowUps.length > 0 && showFollowUps ? (
              <View style={styles.followUpSection}>
                <Pressable 
                  onPress={() => setShowFollowUps(false)}
                  style={styles.followUpHeader}
                >
                  <View style={styles.followUpTitleRow}>
                    <Feather name="clock" size={18} color={theme.warning} />
                    <ThemedText style={[styles.followUpTitle, { color: theme.warning }]}>
                      Follow-ups Due ({pendingFollowUps.length})
                    </ThemedText>
                  </View>
                  <Feather name="chevron-up" size={20} color={theme.textSecondary} />
                </Pressable>
                
                {pendingFollowUps.slice(0, 5).map((caseItem) => (
                  <View 
                    key={caseItem.id} 
                    style={[styles.followUpCard, { backgroundColor: theme.backgroundDefault }]}
                  >
                    <Pressable
                      style={styles.followUpCardContent}
                      onPress={() => handleCasePress(caseItem)}
                    >
                      <View style={styles.followUpCaseInfo}>
                        <ThemedText style={styles.followUpCaseType} numberOfLines={1}>
                          {caseItem.procedureType}
                        </ThemedText>
                        <ThemedText style={[styles.followUpCaseDate, { color: theme.textSecondary }]}>
                          {new Date(caseItem.procedureDate).toLocaleDateString()}
                        </ThemedText>
                      </View>
                    </Pressable>
                    
                    <View style={styles.followUpActions}>
                      <Pressable
                        onPress={() => handleAddComplication(caseItem)}
                        style={[styles.followUpButton, styles.addComplicationBtn, { borderColor: theme.warning }]}
                      >
                        <ThemedText style={[styles.followUpButtonText, { color: theme.warning }]}>
                          Add
                        </ThemedText>
                      </Pressable>
                      
                      <Pressable
                        onPress={() => handleMarkNoComplications(caseItem.id)}
                        style={[styles.followUpButton, styles.noneBtn, { backgroundColor: theme.success }]}
                      >
                        <Feather name="check" size={14} color={theme.buttonText} />
                        <ThemedText style={[styles.followUpButtonText, { color: theme.buttonText }]}>
                          None
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ))}
                
                {pendingFollowUps.length > 5 ? (
                  <ThemedText style={[styles.moreFollowUps, { color: theme.textSecondary }]}>
                    +{pendingFollowUps.length - 5} more cases pending review
                  </ThemedText>
                ) : null}
              </View>
            ) : pendingFollowUps.length > 0 ? (
              <Pressable 
                onPress={() => setShowFollowUps(true)}
                style={[styles.collapsedFollowUp, { backgroundColor: theme.warning + "15" }]}
              >
                <Feather name="clock" size={16} color={theme.warning} />
                <ThemedText style={[styles.collapsedFollowUpText, { color: theme.warning }]}>
                  {pendingFollowUps.length} follow-up{pendingFollowUps.length !== 1 ? 's' : ''} due
                </ThemedText>
                <Feather name="chevron-down" size={18} color={theme.warning} />
              </Pressable>
            ) : null}
          </>
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
  followUpSection: {
    marginBottom: Spacing.lg,
  },
  followUpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  followUpTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  followUpTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  followUpCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  followUpCardContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  followUpCaseInfo: {
    gap: 2,
  },
  followUpCaseType: {
    fontSize: 15,
    fontWeight: "500",
  },
  followUpCaseDate: {
    fontSize: 13,
  },
  followUpActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  followUpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  addComplicationBtn: {
    borderWidth: 1,
  },
  noneBtn: {
    minWidth: 70,
    justifyContent: "center",
  },
  followUpButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  moreFollowUps: {
    fontSize: 13,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  collapsedFollowUp: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  collapsedFollowUpText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
