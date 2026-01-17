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
  CaseProcedure,
  TimelineEvent,
  SPECIALTY_LABELS,
  ROLE_LABELS,
  INDICATION_LABELS,
  ANASTOMOSIS_LABELS,
  FreeFlapDetails,
  OPERATING_TEAM_ROLE_LABELS,
  GENDER_LABELS,
  ADMISSION_CATEGORY_LABELS,
  UNPLANNED_READMISSION_LABELS,
  WOUND_INFECTION_RISK_LABELS,
  ANAESTHETIC_TYPE_LABELS,
  UNPLANNED_ICU_LABELS,
  DISCHARGE_OUTCOME_LABELS,
  MORTALITY_CLASSIFICATION_LABELS,
} from "@/types/case";
import { getCase, getTimelineEvents, deleteCase } from "@/lib/storage";
import { SpecialtyBadge } from "@/components/SpecialtyBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { COUNTRY_CODING_SYSTEMS, getCountryCodeFromProfile } from "@/lib/snomedCt";
import { useAuth } from "@/contexts/AuthContext";

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
  const { profile } = useAuth();
  
  const countryCode = getCountryCodeFromProfile(profile?.countryOfPractice);

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await getCase(route.params.caseId);
      setCaseData(data);
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

  const formatDateDisplay = (dateStr: string | undefined): string | undefined => {
    if (!dateStr) return undefined;
    try {
      return new Date(dateStr).toLocaleDateString("en-NZ", { 
        day: "numeric", 
        month: "short", 
        year: "numeric" 
      });
    } catch {
      return dateStr;
    }
  };

  const hasProcedures = caseData.procedures && caseData.procedures.length > 0;
  const hasPatientDemographics = caseData.gender || caseData.ethnicity;
  const hasAdmissionDetails = caseData.admissionDate || caseData.dischargeDate || caseData.admissionCategory || (caseData.unplannedReadmission && caseData.unplannedReadmission !== "no");
  const hasDiagnoses = caseData.preManagementDiagnosis || caseData.finalDiagnosis || caseData.pathologicalDiagnosis;
  const hasComorbidities = caseData.comorbidities && caseData.comorbidities.length > 0;
  const hasOperativeFactors = caseData.woundInfectionRisk || caseData.anaestheticType || caseData.prophylaxis;
  const hasOutcomes = caseData.unplannedICU || caseData.returnToTheatre || caseData.outcome || caseData.mortalityClassification || caseData.discussedAtMDM;

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

        {hasProcedures ? (
          <>
            <SectionHeader title="Procedures Performed" />
            {caseData.procedures?.map((proc, idx) => (
              <View 
                key={proc.id} 
                style={[styles.procedureCard, { backgroundColor: theme.backgroundDefault }]}
              >
                <View style={styles.procedureHeader}>
                  <View style={[styles.procedureNumber, { backgroundColor: theme.link + "20" }]}>
                    <ThemedText style={[styles.procedureNumberText, { color: theme.link }]}>
                      {idx + 1}
                    </ThemedText>
                  </View>
                  <View style={styles.procedureInfo}>
                    <ThemedText style={styles.procedureName}>
                      {proc.procedureName || "Unnamed Procedure"}
                    </ThemedText>
                    {proc.specialty ? (
                      <ThemedText style={[styles.procedureSpecialty, { color: theme.textSecondary }]}>
                        {SPECIALTY_LABELS[proc.specialty]}
                      </ThemedText>
                    ) : null}
                  </View>
                  <RoleBadge role={proc.surgeonRole} />
                </View>
                {proc.snomedCtCode ? (
                  <View style={[styles.procedureSnomedRow, { borderTopColor: theme.border }]}>
                    <ThemedText style={[styles.procedureSnomedLabel, { color: theme.textTertiary }]}>
                      SNOMED CT: {proc.snomedCtCode}
                    </ThemedText>
                    {proc.snomedCtDisplay ? (
                      <ThemedText style={[styles.procedureSnomedDisplay, { color: theme.textSecondary }]}>
                        {proc.snomedCtDisplay}
                      </ThemedText>
                    ) : null}
                  </View>
                ) : null}
                {proc.notes ? (
                  <ThemedText style={[styles.procedureNotes, { color: theme.textSecondary }]}>
                    {proc.notes}
                  </ThemedText>
                ) : null}
                {proc.clinicalDetails ? (
                  <View style={[styles.procedureClinicalDetails, { borderTopColor: theme.border }]}>
                    {proc.specialty === "free_flap" && (proc.clinicalDetails as FreeFlapDetails) ? (
                      <>
                        {(proc.clinicalDetails as FreeFlapDetails).harvestSide ? (
                          <DetailRow 
                            label="Harvest Side" 
                            value={(proc.clinicalDetails as FreeFlapDetails).harvestSide === "left" ? "Left" : "Right"} 
                          />
                        ) : null}
                        {(proc.clinicalDetails as FreeFlapDetails).indication ? (
                          <DetailRow 
                            label="Indication" 
                            value={INDICATION_LABELS[(proc.clinicalDetails as FreeFlapDetails).indication!]} 
                          />
                        ) : null}
                        {(proc.clinicalDetails as FreeFlapDetails).recipientSiteRegion ? (
                          <DetailRow 
                            label="Recipient Site" 
                            value={(proc.clinicalDetails as FreeFlapDetails).recipientSiteRegion?.replace(/_/g, " ")} 
                          />
                        ) : null}
                        {(proc.clinicalDetails as FreeFlapDetails).ischemiaTimeMinutes ? (
                          <DetailRow 
                            label="Ischemia Time" 
                            value={(proc.clinicalDetails as FreeFlapDetails).ischemiaTimeMinutes} 
                            unit="min"
                          />
                        ) : null}
                        {(proc.clinicalDetails as FreeFlapDetails).flapWidthCm || (proc.clinicalDetails as FreeFlapDetails).flapLengthCm ? (
                          <DetailRow 
                            label="Flap Dimensions" 
                            value={`${(proc.clinicalDetails as FreeFlapDetails).flapWidthCm || "?"} x ${(proc.clinicalDetails as FreeFlapDetails).flapLengthCm || "?"} cm`} 
                          />
                        ) : null}
                        {(proc.clinicalDetails as FreeFlapDetails).anastomoses && (proc.clinicalDetails as FreeFlapDetails).anastomoses!.length > 0 ? (
                          <View style={styles.anastomosesList}>
                            <ThemedText style={[styles.anastomosesTitle, { color: theme.textSecondary }]}>
                              Anastomoses:
                            </ThemedText>
                            {(proc.clinicalDetails as FreeFlapDetails).anastomoses!.map((a, aIdx) => (
                              <ThemedText key={a.id || aIdx} style={styles.anastomosisItem}>
                                {a.vesselType === "artery" ? "\u2764\uFE0F " : "\uD83D\uDCA7 "}
                                {a.recipientVesselName || "Unknown vessel"}
                                {a.couplingMethod ? ` (${ANASTOMOSIS_LABELS[a.couplingMethod as keyof typeof ANASTOMOSIS_LABELS] || a.couplingMethod})` : ""}
                              </ThemedText>
                            ))}
                          </View>
                        ) : null}
                      </>
                    ) : null}
                    {proc.specialty === "hand_trauma" && proc.clinicalDetails ? (
                      <>
                        <DetailRow 
                          label="Injury Mechanism" 
                          value={(proc.clinicalDetails as any).injuryMechanism} 
                        />
                        <DetailRow 
                          label="Fixation Material" 
                          value={(proc.clinicalDetails as any).fixationMaterial?.replace(/_/g, " ")} 
                        />
                        <DetailRow 
                          label="Nerve Status" 
                          value={(proc.clinicalDetails as any).nerveStatus} 
                        />
                        <DetailRow 
                          label="Tendon Injuries" 
                          value={(proc.clinicalDetails as any).tendonInjuries} 
                        />
                        <DetailRow 
                          label="Fracture Site" 
                          value={(proc.clinicalDetails as any).fractureSite} 
                        />
                      </>
                    ) : null}
                    {proc.specialty === "body_contouring" && proc.clinicalDetails ? (
                      <>
                        <DetailRow 
                          label="Resection Weight" 
                          value={(proc.clinicalDetails as any).resectionWeightGrams} 
                          unit="g"
                        />
                        <DetailRow 
                          label="Drain Output" 
                          value={(proc.clinicalDetails as any).drainOutputMl} 
                          unit="ml"
                        />
                      </>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {hasPatientDemographics ? (
          <>
            <SectionHeader title="Patient Demographics" />
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
              <DetailRow 
                label="Gender" 
                value={caseData.gender ? GENDER_LABELS[caseData.gender] : undefined} 
              />
              <DetailRow label="Ethnicity" value={caseData.ethnicity} />
            </View>
          </>
        ) : null}

        {hasAdmissionDetails ? (
          <>
            <SectionHeader title="Admission Details" />
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
              <DetailRow 
                label="Admission Date" 
                value={formatDateDisplay(caseData.admissionDate)} 
              />
              <DetailRow 
                label="Discharge Date" 
                value={formatDateDisplay(caseData.dischargeDate)} 
              />
              <DetailRow 
                label="Admission Category" 
                value={caseData.admissionCategory ? ADMISSION_CATEGORY_LABELS[caseData.admissionCategory] : undefined} 
              />
              {caseData.unplannedReadmission && caseData.unplannedReadmission !== "no" ? (
                <DetailRow 
                  label="Unplanned Readmission" 
                  value={UNPLANNED_READMISSION_LABELS[caseData.unplannedReadmission]} 
                />
              ) : null}
            </View>
          </>
        ) : null}

        {hasDiagnoses ? (
          <>
            <SectionHeader title="Diagnoses" />
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
              {caseData.preManagementDiagnosis ? (
                <View style={styles.diagnosisItem}>
                  <ThemedText style={[styles.diagnosisLabel, { color: theme.textSecondary }]}>
                    Pre-Management Diagnosis
                  </ThemedText>
                  <ThemedText style={styles.diagnosisValue}>
                    {caseData.preManagementDiagnosis.displayName}
                  </ThemedText>
                  {caseData.preManagementDiagnosis.snomedCtCode ? (
                    <ThemedText style={[styles.snomedCode, { color: theme.textTertiary }]}>
                      SNOMED CT: {caseData.preManagementDiagnosis.snomedCtCode}
                    </ThemedText>
                  ) : null}
                </View>
              ) : null}
              {caseData.finalDiagnosis ? (
                <View style={styles.diagnosisItem}>
                  <ThemedText style={[styles.diagnosisLabel, { color: theme.textSecondary }]}>
                    Final Diagnosis
                  </ThemedText>
                  <ThemedText style={styles.diagnosisValue}>
                    {caseData.finalDiagnosis.displayName}
                  </ThemedText>
                  {caseData.finalDiagnosis.snomedCtCode ? (
                    <ThemedText style={[styles.snomedCode, { color: theme.textTertiary }]}>
                      SNOMED CT: {caseData.finalDiagnosis.snomedCtCode}
                    </ThemedText>
                  ) : null}
                </View>
              ) : null}
              {caseData.pathologicalDiagnosis ? (
                <View style={styles.diagnosisItem}>
                  <ThemedText style={[styles.diagnosisLabel, { color: theme.textSecondary }]}>
                    Pathological Diagnosis
                  </ThemedText>
                  <ThemedText style={styles.diagnosisValue}>
                    {caseData.pathologicalDiagnosis.displayName}
                  </ThemedText>
                  {caseData.pathologicalDiagnosis.snomedCtCode ? (
                    <ThemedText style={[styles.snomedCode, { color: theme.textTertiary }]}>
                      SNOMED CT: {caseData.pathologicalDiagnosis.snomedCtCode}
                    </ThemedText>
                  ) : null}
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {hasComorbidities ? (
          <>
            <SectionHeader title="Co-morbidities" />
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.comorbidityList}>
                {caseData.comorbidities?.map((comorbidity, index) => (
                  <View 
                    key={comorbidity.snomedCtCode || index} 
                    style={[styles.comorbidityChip, { backgroundColor: theme.warning + "20", borderColor: theme.warning }]}
                  >
                    <ThemedText style={[styles.comorbidityText, { color: theme.warning }]}>
                      {comorbidity.commonName || comorbidity.displayName}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

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

        {hasOperativeFactors ? (
          <>
            <SectionHeader title="Operative Factors" />
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
              <DetailRow 
                label="Wound Infection Risk" 
                value={caseData.woundInfectionRisk ? WOUND_INFECTION_RISK_LABELS[caseData.woundInfectionRisk] : undefined} 
              />
              <DetailRow 
                label="Anaesthetic Type" 
                value={caseData.anaestheticType ? ANAESTHETIC_TYPE_LABELS[caseData.anaestheticType] : undefined} 
              />
              {caseData.prophylaxis ? (
                <>
                  <DetailRow 
                    label="Antibiotic Prophylaxis" 
                    value={caseData.prophylaxis.antibiotics ? "Given" : "Not Given"} 
                  />
                  <DetailRow 
                    label="DVT Prophylaxis" 
                    value={caseData.prophylaxis.dvtPrevention ? "Given" : "Not Given"} 
                  />
                </>
              ) : null}
            </View>
          </>
        ) : null}

        {hasOutcomes ? (
          <>
            <SectionHeader title="Outcomes" />
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
              {caseData.unplannedICU && caseData.unplannedICU !== "no" ? (
                <DetailRow 
                  label="Unplanned ICU Admission" 
                  value={UNPLANNED_ICU_LABELS[caseData.unplannedICU]} 
                />
              ) : null}
              {caseData.returnToTheatre ? (
                <>
                  <DetailRow label="Return to Theatre" value="Yes" />
                  <DetailRow label="Reason" value={caseData.returnToTheatreReason} />
                </>
              ) : null}
              <DetailRow 
                label="Discharge Outcome" 
                value={caseData.outcome ? DISCHARGE_OUTCOME_LABELS[caseData.outcome] : undefined} 
              />
              {caseData.mortalityClassification ? (
                <DetailRow 
                  label="Mortality Classification" 
                  value={MORTALITY_CLASSIFICATION_LABELS[caseData.mortalityClassification]} 
                />
              ) : null}
              <DetailRow 
                label="Discussed at MDM" 
                value={caseData.discussedAtMDM ? "Yes" : undefined} 
              />
              <DetailRow 
                label="Recurrence Date" 
                value={formatDateDisplay(caseData.recurrenceDate)} 
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
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  diagnosisItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  diagnosisLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  diagnosisValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  snomedCode: {
    fontSize: 11,
    marginTop: Spacing.xs,
  },
  comorbidityList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  comorbidityChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  comorbidityText: {
    fontSize: 12,
    fontWeight: "500",
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
  procedureCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  procedureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  procedureNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  procedureNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },
  procedureInfo: {
    flex: 1,
  },
  procedureName: {
    fontSize: 16,
    fontWeight: "600",
  },
  procedureSpecialty: {
    fontSize: 13,
    marginTop: 2,
  },
  procedureSnomedRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  procedureSnomedLabel: {
    fontSize: 11,
  },
  procedureSnomedDisplay: {
    fontSize: 13,
    marginTop: 2,
  },
  procedureNotes: {
    fontSize: 13,
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
  procedureClinicalDetails: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  anastomosesList: {
    marginTop: Spacing.xs,
  },
  anastomosesTitle: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  anastomosisItem: {
    fontSize: 13,
    marginLeft: Spacing.sm,
    marginBottom: 2,
  },
});
