import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import {
  Case,
  TimelineEvent,
  SPECIALTY_LABELS,
  ROLE_LABELS,
  INDICATION_LABELS,
  ANASTOMOSIS_LABELS,
  FreeFlapDetails,
  OPERATING_TEAM_ROLE_LABELS,
} from "@/types/case";
import { getCase, getTimelineEvents, deleteCase, getSettings } from "@/lib/storage";
import { SpecialtyBadge } from "@/components/SpecialtyBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { COUNTRY_CODING_SYSTEMS } from "@/lib/snomedCt";

type RouteParams = RouteProp<RootStackParamList, "CaseDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DetailRowProps {
  label: string;
  value: string | number | undefined | null;
  unit?: string;
}

function DetailRow({ label, value, unit }: DetailRowProps) {
  const { theme } = useTheme();
  
  if (value === undefined || value === null || value === "") return null;
  
  return (
    <View style={styles.detailRow}>
      <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <ThemedText style={styles.detailValue}>
        {value}{unit ? ` ${unit}` : ""}
      </ThemedText>
    </View>
  );
}

export default function CaseDetailScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryCode, setCountryCode] = useState<string>("GB");

  const loadData = async () => {
    try {
      const [data, settings] = await Promise.all([
        getCase(route.params.caseId),
        getSettings(),
      ]);
      setCaseData(data);
      setCountryCode(settings.countryCode);
      if (data) {
        const events = await getTimelineEvents(data.id);
        setTimelineEvents(events);
      }
    } catch (error) {
      console.error("Error loading case:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [route.params.caseId])
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: caseData?.patientIdentifier || "Case Details",
    });
  }, [caseData]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Case",
      "Are you sure you want to delete this case? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (caseData) {
              await deleteCase(caseData.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handleAddEvent = () => {
    if (caseData) {
      navigation.navigate("AddTimelineEvent", { caseId: caseData.id });
    }
  };

  if (loading) {
    return <LoadingState message="Loading case..." />;
  }

  if (!caseData) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          image={require("../../client/assets/images/empty-cases.png")}
          title="Case Not Found"
          message="This case may have been deleted"
          actionLabel="Go Back"
          onAction={() => navigation.goBack()}
        />
      </ThemedView>
    );
  }

  const formattedDate = new Date(caseData.procedureDate).toLocaleDateString(
    "en-NZ",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" }
  );

  const userMember = caseData.teamMembers.find(
    (m) => m.id === caseData.ownerId || m.userId === caseData.ownerId
  );

  const flapDetails = caseData.clinicalDetails as FreeFlapDetails;

  const formatDuration = (minutes: number | undefined): string | undefined => {
    if (!minutes) return undefined;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["3xl"] + 80,
          },
        ]}
      >
        <View style={[styles.heroCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.heroBadges}>
            <SpecialtyBadge specialty={caseData.specialty} size="medium" />
            {userMember ? <RoleBadge role={userMember.role} /> : null}
          </View>
          <ThemedText type="h2" style={styles.procedureType}>
            {caseData.procedureType}
          </ThemedText>
          
          {caseData.procedureCode ? (
            <View style={[styles.codeCard, { backgroundColor: theme.backgroundRoot }]}>
              <ThemedText style={[styles.codeLabel, { color: theme.textSecondary }]}>
                SNOMED CT
              </ThemedText>
              <ThemedText style={styles.codeValue}>
                {caseData.procedureCode.snomedCtCode}
              </ThemedText>
              {caseData.procedureCode.localCode ? (
                <>
                  <ThemedText style={[styles.codeLabel, { color: theme.textSecondary, marginTop: Spacing.xs }]}>
                    {caseData.procedureCode.localSystem}
                  </ThemedText>
                  <ThemedText style={styles.codeValue}>
                    {caseData.procedureCode.localCode}
                  </ThemedText>
                </>
              ) : null}
            </View>
          ) : null}

          <View style={styles.heroMeta}>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={16} color={theme.textSecondary} />
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                {formattedDate}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={16} color={theme.textSecondary} />
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                {caseData.facility}
              </ThemedText>
            </View>
          </View>
        </View>

        {caseData.surgeryTiming ? (
          <>
            <SectionHeader title="Surgery Timing" />
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.timingRow}>
                {caseData.surgeryTiming.startTime ? (
                  <View style={styles.timingItem}>
                    <Feather name="play-circle" size={20} color={theme.success} />
                    <View>
                      <ThemedText style={[styles.timingLabel, { color: theme.textSecondary }]}>
                        Start
                      </ThemedText>
                      <ThemedText style={styles.timingValue}>
                        {caseData.surgeryTiming.startTime}
                      </ThemedText>
                    </View>
                  </View>
                ) : null}
                {caseData.surgeryTiming.endTime ? (
                  <View style={styles.timingItem}>
                    <Feather name="stop-circle" size={20} color={theme.error} />
                    <View>
                      <ThemedText style={[styles.timingLabel, { color: theme.textSecondary }]}>
                        End
                      </ThemedText>
                      <ThemedText style={styles.timingValue}>
                        {caseData.surgeryTiming.endTime}
                      </ThemedText>
                    </View>
                  </View>
                ) : null}
                {caseData.surgeryTiming.durationMinutes ? (
                  <View style={styles.timingItem}>
                    <Feather name="clock" size={20} color={theme.link} />
                    <View>
                      <ThemedText style={[styles.timingLabel, { color: theme.textSecondary }]}>
                        Duration
                      </ThemedText>
                      <ThemedText style={styles.timingValue}>
                        {formatDuration(caseData.surgeryTiming.durationMinutes)}
                      </ThemedText>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          </>
        ) : null}

        <SectionHeader title="Surgical Team" />
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          {caseData.teamMembers.map((member) => (
            <View key={member.id} style={styles.teamMember}>
              <View style={[styles.avatar, { backgroundColor: theme.link + "20" }]}>
                <Feather name="user" size={18} color={theme.link} />
              </View>
              <View style={styles.memberInfo}>
                <ThemedText style={styles.memberName}>{member.name}</ThemedText>
                <RoleBadge role={member.role} size="small" />
              </View>
              {member.confirmed ? (
                <Feather name="check-circle" size={18} color={theme.success} />
              ) : (
                <Feather name="clock" size={18} color={theme.warning} />
              )}
            </View>
          ))}
        </View>

        {caseData.operatingTeam && caseData.operatingTeam.length > 0 ? (
          <>
            <SectionHeader title="Operating Team" />
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
              {caseData.operatingTeam.map((member) => (
                <View key={member.id} style={styles.teamMember}>
                  <View style={[styles.avatar, { backgroundColor: theme.success + "20" }]}>
                    <Feather name="users" size={18} color={theme.success} />
                  </View>
                  <View style={styles.memberInfo}>
                    <ThemedText style={styles.memberName}>{member.name}</ThemedText>
                    <ThemedText style={[styles.memberRole, { color: theme.textSecondary }]}>
                      {OPERATING_TEAM_ROLE_LABELS[member.role]}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {(caseData.asaScore || caseData.bmi || caseData.smoker || caseData.diabetes !== undefined) ? (
          <>
            <SectionHeader title="Risk Factors" />
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
              <DetailRow label="ASA Score" value={caseData.asaScore} />
              <DetailRow label="BMI" value={caseData.bmi} />
              <DetailRow
                label="Smoking Status"
                value={caseData.smoker === "yes" ? "Current Smoker" : caseData.smoker === "ex" ? "Ex-Smoker" : caseData.smoker === "no" ? "Non-Smoker" : undefined}
              />
              <DetailRow
                label="Diabetes"
                value={caseData.diabetes === true ? "Yes" : caseData.diabetes === false ? "No" : undefined}
              />
            </View>
          </>
        ) : null}

        <SectionHeader title="Clinical Details" />
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          {caseData.specialty === "free_flap" ? (
            <>
              <DetailRow label="Harvest Side" value={flapDetails.harvestSide === "left" ? "Left" : "Right"} />
              <DetailRow label="Indication" value={flapDetails.indication ? INDICATION_LABELS[flapDetails.indication] : undefined} />
              <DetailRow label="Recipient Artery" value={flapDetails.recipientArteryName} />
              <DetailRow label="Recipient Vein" value={flapDetails.recipientVeinName} />
              <DetailRow label="Anastomosis" value={flapDetails.anastomosisType ? ANASTOMOSIS_LABELS[flapDetails.anastomosisType] : undefined} />
              <DetailRow label="Ischemia Time" value={flapDetails.ischemiaTimeMinutes} unit="min" />
              <DetailRow label="Coupler Size" value={flapDetails.couplerSizeMm} unit="mm" />
              <DetailRow label="Flap Dimensions" value={flapDetails.flapWidthCm && flapDetails.flapLengthCm ? `${flapDetails.flapWidthCm} x ${flapDetails.flapLengthCm}` : undefined} unit="cm" />
              <DetailRow label="Perforator Count" value={flapDetails.perforatorCount} />
              <DetailRow label="Elevation Plane" value={flapDetails.elevationPlane === "subfascial" ? "Subfascial" : flapDetails.elevationPlane === "suprafascial" ? "Suprafascial" : undefined} />
            </>
          ) : (
            <ThemedText style={{ color: theme.textSecondary }}>
              Clinical details not available for this specialty
            </ThemedText>
          )}
        </View>

        <SectionHeader title="Timeline" />
        {timelineEvents.length === 0 ? (
          <View style={[styles.emptyTimeline, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="calendar" size={32} color={theme.textTertiary} />
            <ThemedText style={[styles.emptyTimelineText, { color: theme.textSecondary }]}>
              No timeline events yet
            </ThemedText>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            {timelineEvents.map((event) => (
              <View key={event.id} style={styles.timelineEvent}>
                <View style={[styles.timelineDot, { backgroundColor: theme.link }]} />
                <View style={styles.timelineContent}>
                  <ThemedText style={styles.eventType}>{event.eventType}</ThemedText>
                  <ThemedText style={[styles.eventNote, { color: theme.textSecondary }]}>
                    {event.note}
                  </ThemedText>
                  <ThemedText style={[styles.eventDate, { color: theme.textTertiary }]}>
                    {new Date(event.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.dangerZone}>
          <Pressable
            onPress={handleDelete}
            style={[styles.deleteButton, { borderColor: theme.error }]}
          >
            <Feather name="trash-2" size={18} color={theme.error} />
            <ThemedText style={[styles.deleteText, { color: theme.error }]}>
              Delete Case
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      <Pressable
        onPress={handleAddEvent}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.link,
            bottom: insets.bottom + Spacing.lg,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Feather name="plus" size={24} color={theme.buttonText} />
        <ThemedText style={[styles.fabText, { color: theme.buttonText }]}>
          Add Event
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  heroCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  heroBadges: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: "wrap",
  },
  procedureType: {
    marginBottom: Spacing.md,
  },
  codeCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  codeValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  heroMeta: {
    gap: Spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metaText: {
    fontSize: 14,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  timingRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  timingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  timingLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timingValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  teamMember: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  memberInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "500",
  },
  memberRole: {
    fontSize: 13,
  },
  emptyTimeline: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyTimelineText: {
    fontSize: 14,
  },
  timelineEvent: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: Spacing.md,
  },
  timelineContent: {
    flex: 1,
  },
  eventType: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  eventNote: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  eventDate: {
    fontSize: 12,
  },
  dangerZone: {
    marginTop: Spacing["3xl"],
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.floating,
  },
  fabText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
