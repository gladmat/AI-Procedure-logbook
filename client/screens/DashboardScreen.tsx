import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  Pressable,
  ScrollView,
  Modal,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Case, Specialty, Role, SPECIALTY_LABELS, ROLE_LABELS } from "@/types/case";
import { getCases, getCasesPendingFollowUp, markNoComplications } from "@/lib/storage";
import { CaseCard } from "@/components/CaseCard";
import { SkeletonCard } from "@/components/LoadingState";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  StatisticsFilters,
  TimePeriod,
  TIME_PERIOD_LABELS,
  ROLE_FILTER_LABELS,
  filterCases,
  calculateStatistics,
  getUniqueFacilities,
  formatDuration,
  formatPercentage,
  formatMonthLabel,
  BaseStatistics,
  FreeFlapStatistics,
  HandTraumaStatistics,
} from "@/lib/statistics";

const SPECIALTY_FILTERS: (Specialty | "all")[] = [
  "all",
  "free_flap",
  "hand_trauma",
  "body_contouring",
  "aesthetics",
  "burns",
  "general",
];

const TIME_PERIODS: TimePeriod[] = [
  "this_year",
  "last_6_months",
  "last_12_months",
  "all_time",
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  trend?: "up" | "down" | "neutral";
}

function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <View style={styles.statContent}>
        <ThemedText style={[styles.statValue, { color: theme.text }]}>
          {value}
        </ThemedText>
        <ThemedText style={[styles.statTitle, { color: theme.textSecondary }]}>
          {title}
        </ThemedText>
        {subtitle ? (
          <View style={styles.statSubtitleRow}>
            {trend && trend !== "neutral" ? (
              <Feather 
                name={trend === "up" ? "trending-up" : "trending-down"} 
                size={12} 
                color={trend === "up" ? theme.success : theme.error} 
              />
            ) : null}
            <ThemedText style={[styles.statSubtitle, { color: theme.textTertiary }]}>
              {subtitle}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function FilterChip({ label, selected, onPress }: FilterChipProps) {
  const { theme } = useTheme();
  
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected ? theme.link : theme.backgroundDefault,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.filterText,
          { color: selected ? theme.buttonText : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

interface DropdownSelectProps {
  label: string;
  value: string;
  onPress: () => void;
}

function DropdownSelect({ label, value, onPress }: DropdownSelectProps) {
  const { theme } = useTheme();
  
  return (
    <Pressable 
      onPress={onPress}
      style={[styles.dropdownSelect, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
    >
      <View>
        <ThemedText style={[styles.dropdownLabel, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
        <ThemedText style={styles.dropdownValue} numberOfLines={1}>
          {value}
        </ThemedText>
      </View>
      <Feather name="chevron-down" size={16} color={theme.textSecondary} />
    </Pressable>
  );
}

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
  
  const [filters, setFilters] = useState<StatisticsFilters>({
    specialty: "all",
    timePeriod: "this_year",
    facility: "all",
    role: "all",
  });
  
  const [showFacilityPicker, setShowFacilityPicker] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);

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

  const filteredCases = useMemo(() => filterCases(cases, filters), [cases, filters]);
  const statistics = useMemo(() => calculateStatistics(filteredCases, filters.specialty), [filteredCases, filters.specialty]);
  const recentCases = useMemo(() => filteredCases.slice(0, 5), [filteredCases]);
  const facilities = useMemo(() => getUniqueFacilities(cases), [cases]);

  const handleCasePress = (caseData: Case) => {
    navigation.navigate("CaseDetail", { caseId: caseData.id });
  };

  const handleSpecialtyPress = (specialty: Specialty | "all") => {
    Haptics.selectionAsync();
    setFilters(prev => ({ ...prev, specialty }));
  };

  const handleTimePeriodPress = (timePeriod: TimePeriod) => {
    Haptics.selectionAsync();
    setFilters(prev => ({ ...prev, timePeriod }));
  };

  const isFreeFlapStats = (stats: BaseStatistics): stats is FreeFlapStatistics => {
    return "flapSurvivalRate" in stats;
  };

  const isHandTraumaStats = (stats: BaseStatistics): stats is HandTraumaStatistics => {
    return "nerveRepairCount" in stats;
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight },
        ]}
      >
        <View style={styles.skeletonContainer}>
          <SkeletonCard height={60} />
          <SkeletonCard height={130} />
          <SkeletonCard height={130} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl + 80,
          },
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
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
          style={styles.filterScroll}
        >
          {SPECIALTY_FILTERS.map((specialty) => (
            <FilterChip
              key={specialty}
              label={specialty === "all" ? "All" : SPECIALTY_LABELS[specialty]}
              selected={filters.specialty === specialty}
              onPress={() => handleSpecialtyPress(specialty)}
            />
          ))}
        </ScrollView>

        <View style={styles.secondaryFilters}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timePeriodContainer}
          >
            {TIME_PERIODS.map((period) => (
              <Pressable
                key={period}
                onPress={() => handleTimePeriodPress(period)}
                style={[
                  styles.timePeriodChip,
                  {
                    backgroundColor: filters.timePeriod === period 
                      ? theme.link + "20" 
                      : "transparent",
                    borderColor: filters.timePeriod === period 
                      ? theme.link 
                      : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.timePeriodText,
                    { color: filters.timePeriod === period ? theme.link : theme.textSecondary },
                  ]}
                >
                  {TIME_PERIOD_LABELS[period]}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.dropdownRow}>
          <View style={styles.dropdownWrapper}>
            <DropdownSelect
              label="Facility"
              value={filters.facility === "all" ? "All Facilities" : filters.facility}
              onPress={() => setShowFacilityPicker(true)}
            />
          </View>
          <View style={styles.dropdownWrapper}>
            <DropdownSelect
              label="Role"
              value={ROLE_FILTER_LABELS[filters.role]}
              onPress={() => setShowRolePicker(true)}
            />
          </View>
        </View>

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
            
            {pendingFollowUps.slice(0, 3).map((caseItem) => (
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
            
            {pendingFollowUps.length > 3 ? (
              <ThemedText style={[styles.moreFollowUps, { color: theme.textSecondary }]}>
                +{pendingFollowUps.length - 3} more cases pending review
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
              {pendingFollowUps.length} follow-up{pendingFollowUps.length !== 1 ? "s" : ""} due
            </ThemedText>
            <Feather name="chevron-down" size={18} color={theme.warning} />
          </Pressable>
        ) : null}

        <View style={styles.statsSection}>
          <ThemedText style={styles.sectionTitle}>Statistics</ThemedText>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Cases"
              value={statistics.totalCases.toString()}
              icon="folder"
              color={theme.link}
            />
            <StatCard
              title="Avg Duration"
              value={formatDuration(statistics.averageDurationMinutes)}
              subtitle={filters.role !== "all" ? ROLE_LABELS[filters.role] : undefined}
              icon="clock"
              color={theme.info}
            />
            <StatCard
              title="Complication Rate"
              value={formatPercentage(statistics.complicationRate)}
              icon="alert-circle"
              color={statistics.complicationRate > 10 ? theme.error : theme.success}
            />
            <StatCard
              title="Follow-up Rate"
              value={formatPercentage(statistics.followUpCompletionRate)}
              icon="check-circle"
              color={statistics.followUpCompletionRate >= 90 ? theme.success : theme.warning}
            />
          </View>

          {isFreeFlapStats(statistics) ? (
            <View style={styles.specialtyStats}>
              <ThemedText style={[styles.specialtyStatsTitle, { color: theme.textSecondary }]}>
                Free Flap Specific
              </ThemedText>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Flap Survival"
                  value={formatPercentage(statistics.flapSurvivalRate)}
                  icon="heart"
                  color={statistics.flapSurvivalRate >= 95 ? theme.success : theme.warning}
                />
                <StatCard
                  title="Avg Ischemia"
                  value={statistics.averageIschemiaTimeMinutes 
                    ? `${statistics.averageIschemiaTimeMinutes}m` 
                    : "—"}
                  icon="thermometer"
                  color={theme.info}
                />
                <StatCard
                  title="Take-back Rate"
                  value={formatPercentage(statistics.takeBackRate)}
                  icon="refresh-cw"
                  color={statistics.takeBackRate > 5 ? theme.warning : theme.success}
                />
              </View>
              
              {statistics.casesByFlapType.length > 0 ? (
                <View style={[styles.breakdownCard, { backgroundColor: theme.backgroundDefault }]}>
                  <ThemedText style={styles.breakdownTitle}>Cases by Flap Type</ThemedText>
                  {statistics.casesByFlapType.slice(0, 5).map((item) => (
                    <View key={item.flapType} style={styles.breakdownRow}>
                      <ThemedText style={styles.breakdownLabel} numberOfLines={1}>
                        {item.flapType}
                      </ThemedText>
                      <View style={styles.breakdownBarContainer}>
                        <View 
                          style={[
                            styles.breakdownBar, 
                            { 
                              backgroundColor: theme.link,
                              width: `${(item.count / statistics.totalCases) * 100}%`,
                            },
                          ]} 
                        />
                      </View>
                      <ThemedText style={[styles.breakdownCount, { color: theme.textSecondary }]}>
                        {item.count}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {isHandTraumaStats(statistics) ? (
            <View style={styles.specialtyStats}>
              <ThemedText style={[styles.specialtyStatsTitle, { color: theme.textSecondary }]}>
                Hand Trauma Specific
              </ThemedText>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Nerve Repairs"
                  value={statistics.nerveRepairCount.toString()}
                  icon="activity"
                  color={theme.info}
                />
                <StatCard
                  title="Tendon Repairs"
                  value={statistics.tendonRepairCount.toString()}
                  icon="link"
                  color={theme.link}
                />
              </View>
            </View>
          ) : null}

          {statistics.casesByMonth.length > 0 ? (
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText style={styles.chartTitle}>Cases Over Time</ThemedText>
              <View style={styles.barChart}>
                {statistics.casesByMonth.slice(-6).map((item) => {
                  const maxCount = Math.max(...statistics.casesByMonth.map(m => m.count));
                  const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  return (
                    <View key={item.month} style={styles.barContainer}>
                      <View style={styles.barWrapper}>
                        <View 
                          style={[
                            styles.bar, 
                            { 
                              backgroundColor: theme.link,
                              height: `${heightPercent}%`,
                            },
                          ]} 
                        />
                      </View>
                      <ThemedText style={[styles.barLabel, { color: theme.textTertiary }]}>
                        {formatMonthLabel(item.month)}
                      </ThemedText>
                      <ThemedText style={[styles.barValue, { color: theme.textSecondary }]}>
                        {item.count}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Recent Cases</ThemedText>
            {filteredCases.length > 5 ? (
              <Pressable onPress={() => navigation.getParent()?.navigate("Cases")}>
                <ThemedText style={[styles.seeAllLink, { color: theme.link }]}>
                  See All ({filteredCases.length})
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
          
          {recentCases.length > 0 ? (
            recentCases.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(index * 50).springify()}>
                <CaseCard caseData={item} onPress={() => handleCasePress(item)} />
                {index < recentCases.length - 1 ? <View style={styles.separator} /> : null}
              </Animated.View>
            ))
          ) : (
            <ThemedView style={[styles.emptyCard, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="inbox" size={32} color={theme.textTertiary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No cases match your filters
              </ThemedText>
            </ThemedView>
          )}
        </View>
      </ScrollView>

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

      <Modal
        visible={showFacilityPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFacilityPicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowFacilityPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.modalTitle}>Select Facility</ThemedText>
            <ScrollView style={styles.modalScroll}>
              <Pressable
                style={[
                  styles.modalOption,
                  filters.facility === "all" && { backgroundColor: theme.link + "20" },
                ]}
                onPress={() => {
                  setFilters(prev => ({ ...prev, facility: "all" }));
                  setShowFacilityPicker(false);
                }}
              >
                <ThemedText style={[
                  styles.modalOptionText,
                  filters.facility === "all" && { color: theme.link, fontWeight: "600" },
                ]}>
                  All Facilities
                </ThemedText>
              </Pressable>
              {facilities.map((facility) => (
                <Pressable
                  key={facility}
                  style={[
                    styles.modalOption,
                    filters.facility === facility && { backgroundColor: theme.link + "20" },
                  ]}
                  onPress={() => {
                    setFilters(prev => ({ ...prev, facility }));
                    setShowFacilityPicker(false);
                  }}
                >
                  <ThemedText style={[
                    styles.modalOptionText,
                    filters.facility === facility && { color: theme.link, fontWeight: "600" },
                  ]}>
                    {facility}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showRolePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRolePicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowRolePicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.modalTitle}>Select Role</ThemedText>
            <ScrollView style={styles.modalScroll}>
              {(["all", "PS", "PP", "AS", "ONS", "SS", "SNS", "A"] as const).map((role) => (
                <Pressable
                  key={role}
                  style={[
                    styles.modalOption,
                    filters.role === role && { backgroundColor: theme.link + "20" },
                  ]}
                  onPress={() => {
                    setFilters(prev => ({ ...prev, role }));
                    setShowRolePicker(false);
                  }}
                >
                  <ThemedText style={[
                    styles.modalOptionText,
                    filters.role === role && { color: theme.link, fontWeight: "600" },
                  ]}>
                    {ROLE_FILTER_LABELS[role]}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  filterScroll: {
    marginBottom: Spacing.md,
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
  secondaryFilters: {
    marginBottom: Spacing.md,
  },
  timePeriodContainer: {
    gap: Spacing.sm,
  },
  timePeriodChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  timePeriodText: {
    fontSize: 12,
    fontWeight: "500",
  },
  dropdownRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  dropdownWrapper: {
    flex: 1,
  },
  dropdownSelect: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  dropdownLabel: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  skeletonContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  statSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 10,
  },
  specialtyStats: {
    marginTop: Spacing.lg,
  },
  specialtyStatsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  breakdownCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    ...Shadows.card,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  breakdownLabel: {
    width: 100,
    fontSize: 13,
  },
  breakdownBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 4,
    overflow: "hidden",
  },
  breakdownBar: {
    height: "100%",
    borderRadius: 4,
  },
  breakdownCount: {
    width: 30,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  chartCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    ...Shadows.card,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  barChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
  },
  barWrapper: {
    width: 24,
    height: 80,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    marginTop: Spacing.xs,
  },
  barValue: {
    fontSize: 11,
    fontWeight: "600",
  },
  recentSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: "500",
  },
  separator: {
    height: Spacing.md,
  },
  emptyCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.card,
  },
  emptyText: {
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.floating,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxHeight: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.floating,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  modalOptionText: {
    fontSize: 15,
  },
});
