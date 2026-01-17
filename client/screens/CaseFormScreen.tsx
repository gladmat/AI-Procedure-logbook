import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { v4 as uuidv4 } from "uuid";
import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  Case,
  Specialty,
  SPECIALTY_LABELS,
  PROCEDURE_TYPES,
  Role,
  ASAScore,
  SmokingStatus,
  OperatingTeamMember,
  OperatingTeamRole,
  OPERATING_TEAM_ROLE_LABELS,
  SurgeryTiming,
  AnastomosisEntry,
  AnatomicalRegion,
  FreeFlapDetails,
  Gender,
  AdmissionCategory,
  UnplannedReadmissionReason,
  WoundInfectionRisk,
  AnaestheticType,
  UnplannedICUReason,
  DischargeOutcome,
  MortalityClassification,
  SnomedCodedItem,
  Diagnosis,
  Prophylaxis,
  GENDER_LABELS,
  ADMISSION_CATEGORY_LABELS,
  UNPLANNED_READMISSION_LABELS,
  WOUND_INFECTION_RISK_LABELS,
  ANAESTHETIC_TYPE_LABELS,
  UNPLANNED_ICU_LABELS,
  DISCHARGE_OUTCOME_LABELS,
  MORTALITY_CLASSIFICATION_LABELS,
  ASA_GRADE_LABELS,
  COMMON_COMORBIDITIES,
  ETHNICITY_OPTIONS,
} from "@/types/case";
import { FormField, SelectField } from "@/components/FormField";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/Button";
import { saveCase, getSettings } from "@/lib/storage";
import { getConfigForSpecialty, getDefaultClinicalDetails } from "@/lib/procedureConfig";
import { findSnomedProcedure, getProcedureCodeForCountry } from "@/lib/snomedCt";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { RecipientSiteSelector } from "@/components/RecipientSiteSelector";
import { AnastomosisEntryCard } from "@/components/AnastomosisEntryCard";

type RouteParams = RouteProp<RootStackParamList, "CaseForm">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TEAM_ROLES: { value: OperatingTeamRole; label: string }[] = [
  { value: "scrub_nurse", label: "Scrub Nurse" },
  { value: "circulating_nurse", label: "Circulating Nurse" },
  { value: "anaesthetist", label: "Anaesthetist" },
  { value: "anaesthetic_registrar", label: "Anaesthetic Registrar" },
  { value: "surgical_assistant", label: "Surgical Assistant" },
  { value: "surgical_registrar", label: "Surgical Registrar" },
  { value: "medical_student", label: "Medical Student" },
];

export default function CaseFormScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const { specialty, extractedData } = route.params;
  const config = getConfigForSpecialty(specialty);

  const [saving, setSaving] = useState(false);
  const [patientIdentifier, setPatientIdentifier] = useState("");
  const [procedureDate, setProcedureDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [facility, setFacility] = useState("");
  const [procedureType, setProcedureType] = useState<string>(
    (extractedData as FreeFlapDetails | undefined)?.flapDisplayName || 
    (extractedData as any)?.flapType || 
    PROCEDURE_TYPES[specialty][0]
  );
  const [asaScore, setAsaScore] = useState<string>("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [smoker, setSmoker] = useState<SmokingStatus | "">("");
  const [diabetes, setDiabetes] = useState<boolean | null>(null);
  const [role, setRole] = useState<Role>("primary");
  
  const [showProcedureDatePicker, setShowProcedureDatePicker] = useState(false);
  const [showAdmissionDatePicker, setShowAdmissionDatePicker] = useState(false);
  const [showDischargeDatePicker, setShowDischargeDatePicker] = useState(false);
  const [isUnplannedReadmission, setIsUnplannedReadmission] = useState(false);

  const [surgeryStartTime, setSurgeryStartTime] = useState("");
  const [surgeryEndTime, setSurgeryEndTime] = useState("");
  
  const [operatingTeam, setOperatingTeam] = useState<OperatingTeamMember[]>([]);
  const [newTeamMemberName, setNewTeamMemberName] = useState("");
  const [newTeamMemberRole, setNewTeamMemberRole] = useState<OperatingTeamRole>("scrub_nurse");

  const [clinicalDetails, setClinicalDetails] = useState<Record<string, any>>(
    extractedData || getDefaultClinicalDetails(specialty)
  );

  const [recipientSiteRegion, setRecipientSiteRegion] = useState<AnatomicalRegion | undefined>(
    (extractedData as FreeFlapDetails | undefined)?.recipientSiteRegion
  );
  const [anastomoses, setAnastomoses] = useState<AnastomosisEntry[]>(
    (extractedData as FreeFlapDetails | undefined)?.anastomoses || []
  );

  // RACS MALT Patient Demographics
  const [gender, setGender] = useState<Gender | "">("");
  const [ethnicity, setEthnicity] = useState("");

  // RACS MALT Admission Details
  const [admissionDate, setAdmissionDate] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");
  const [admissionCategory, setAdmissionCategory] = useState<AdmissionCategory | "">("");
  const [unplannedReadmission, setUnplannedReadmission] = useState<UnplannedReadmissionReason>("no");

  // RACS MALT Diagnosis (single SNOMED diagnosis)
  const [diagnosis, setDiagnosis] = useState("");

  // RACS MALT Co-morbidities
  const [selectedComorbidities, setSelectedComorbidities] = useState<SnomedCodedItem[]>([]);

  // RACS MALT Operative Factors
  const [woundInfectionRisk, setWoundInfectionRisk] = useState<WoundInfectionRisk | "">("");
  const [anaestheticType, setAnaestheticType] = useState<AnaestheticType | "">("");
  const [antibioticProphylaxis, setAntibioticProphylaxis] = useState(false);
  const [dvtProphylaxis, setDvtProphylaxis] = useState(false);

  // RACS MALT Outcomes
  const [unplannedICU, setUnplannedICU] = useState<UnplannedICUReason>("no");
  const [returnToTheatre, setReturnToTheatre] = useState(false);
  const [returnToTheatreReason, setReturnToTheatreReason] = useState("");
  const [outcome, setOutcome] = useState<DischargeOutcome | "">("");
  const [mortalityClassification, setMortalityClassification] = useState<MortalityClassification | "">("");
  const [discussedAtMDM, setDiscussedAtMDM] = useState(false);

  const calculatedBmi = useMemo(() => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!h || !w || h <= 0 || w <= 0) return undefined;
    const heightM = h / 100;
    return Math.round((w / (heightM * heightM)) * 10) / 10;
  }, [heightCm, weightKg]);

  const calculateDuration = (start: string, end: string): number | undefined => {
    if (!start || !end) return undefined;
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      return undefined;
    }
    let durationMins = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (durationMins < 0) durationMins += 24 * 60;
    return durationMins;
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: `${SPECIALTY_LABELS[specialty]} Case`,
      headerRight: () => (
        <HeaderButton
          onPress={handleSave}
          disabled={saving}
          tintColor={theme.link}
        >
          <ThemedText style={{ color: theme.link, fontWeight: "600" }}>
            {saving ? "Saving..." : "Save"}
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [saving, patientIdentifier, facility, clinicalDetails]);

  const updateClinicalDetail = (key: string, value: any) => {
    setClinicalDetails((prev) => ({ ...prev, [key]: value }));
  };

  const addTeamMember = () => {
    if (!newTeamMemberName.trim()) {
      Alert.alert("Required", "Please enter a name for the team member");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOperatingTeam((prev) => [
      ...prev,
      {
        id: uuidv4(),
        name: newTeamMemberName.trim(),
        role: newTeamMemberRole,
      },
    ]);
    setNewTeamMemberName("");
  };

  const removeTeamMember = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOperatingTeam((prev) => prev.filter((m) => m.id !== id));
  };

  const addAnastomosis = (vesselType: "artery" | "vein") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newEntry: AnastomosisEntry = {
      id: uuidv4(),
      vesselType,
      recipientVesselName: "",
    };
    setAnastomoses((prev) => [...prev, newEntry]);
  };

  const updateAnastomosis = (entry: AnastomosisEntry) => {
    setAnastomoses((prev) => prev.map((a) => (a.id === entry.id ? entry : a)));
  };

  const removeAnastomosis = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnastomoses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = async () => {
    if (!patientIdentifier.trim()) {
      Alert.alert("Required Field", "Please enter a patient identifier");
      return;
    }
    if (!facility.trim()) {
      Alert.alert("Required Field", "Please enter the facility name");
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const settings = await getSettings();
      const snomedProcedure = findSnomedProcedure(procedureType, specialty);
      const procedureCode = snomedProcedure 
        ? getProcedureCodeForCountry(snomedProcedure, settings.countryCode)
        : undefined;

      const surgeryTiming: SurgeryTiming | undefined = 
        surgeryStartTime || surgeryEndTime
          ? {
              startTime: surgeryStartTime || undefined,
              endTime: surgeryEndTime || undefined,
              durationMinutes: calculateDuration(surgeryStartTime, surgeryEndTime),
            }
          : undefined;

      const userId = uuidv4();
      
      const prophylaxis: Prophylaxis | undefined = 
        (antibioticProphylaxis || dvtProphylaxis)
          ? {
              antibiotics: antibioticProphylaxis,
              dvtPrevention: dvtProphylaxis,
            }
          : undefined;

      const newCase: Case = {
        id: uuidv4(),
        patientIdentifier: patientIdentifier.trim(),
        procedureDate,
        facility: facility.trim(),
        specialty,
        procedureType,
        procedureCode,
        surgeryTiming,
        operatingTeam: operatingTeam.length > 0 ? operatingTeam : undefined,
        
        // Patient Demographics
        gender: gender || undefined,
        ethnicity: ethnicity.trim() || undefined,
        
        // Admission Details
        admissionDate: admissionDate || undefined,
        dischargeDate: dischargeDate || undefined,
        admissionCategory: admissionCategory || undefined,
        unplannedReadmission: unplannedReadmission !== "no" ? unplannedReadmission : undefined,
        
        // Diagnosis (single SNOMED diagnosis)
        finalDiagnosis: diagnosis.trim() 
          ? { displayName: diagnosis.trim() } 
          : undefined,
        
        // Co-morbidities
        comorbidities: selectedComorbidities.length > 0 ? selectedComorbidities : undefined,
        
        // Risk Factors
        asaScore: asaScore ? (parseInt(asaScore) as ASAScore) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        bmi: calculatedBmi || undefined,
        smoker: smoker || undefined,
        diabetes: diabetes ?? undefined,
        
        // Operative Factors
        woundInfectionRisk: woundInfectionRisk || undefined,
        anaestheticType: anaestheticType || undefined,
        prophylaxis,
        
        // Outcomes
        unplannedICU: unplannedICU !== "no" ? unplannedICU : undefined,
        returnToTheatre: returnToTheatre || undefined,
        returnToTheatreReason: returnToTheatreReason.trim() || undefined,
        outcome: outcome || undefined,
        mortalityClassification: mortalityClassification || undefined,
        discussedAtMDM: discussedAtMDM || undefined,
        
        clinicalDetails: specialty === "free_flap" 
          ? {
              ...clinicalDetails,
              recipientSiteRegion,
              anastomoses,
            }
          : clinicalDetails as any,
        teamMembers: [
          {
            id: uuidv4(),
            userId,
            name: "You",
            role,
            confirmed: true,
            addedAt: new Date().toISOString(),
          },
        ],
        ownerId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveCase(newCase);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.popToTop();
    } catch (error) {
      console.error("Error saving case:", error);
      Alert.alert("Error", "Failed to save case. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const procedureOptions = PROCEDURE_TYPES[specialty].map((p) => ({
    value: p,
    label: p,
  }));

  const durationMinutes = calculateDuration(surgeryStartTime, surgeryEndTime);
  const durationDisplay = durationMinutes !== undefined
    ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
    : null;

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing["3xl"],
        },
      ]}
    >
      <SectionHeader title="Patient Information" />

      <FormField
        label="Patient Identifier"
        value={patientIdentifier}
        onChangeText={setPatientIdentifier}
        placeholder="e.g., MRN or initials"
        required
      />

      <FormField
        label="Procedure Date"
        value={procedureDate}
        onChangeText={setProcedureDate}
        placeholder="YYYY-MM-DD"
        required
      />

      <FormField
        label="Facility"
        value={facility}
        onChangeText={setFacility}
        placeholder="Hospital or clinic name"
        required
      />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <SelectField
            label="Procedure Type"
            value={procedureType}
            options={procedureOptions}
            onSelect={setProcedureType}
            required
          />
        </View>
      </View>

      <SectionHeader title="Patient Demographics" />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <SelectField
            label="Gender"
            value={gender}
            options={Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))}
            onSelect={(v) => setGender(v as Gender)}
          />
        </View>
        <View style={styles.halfField}>
          <SelectField
            label="Ethnicity"
            value={ethnicity}
            options={ETHNICITY_OPTIONS}
            onSelect={setEthnicity}
          />
        </View>
      </View>

      <SectionHeader title="Admission Details" />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <FormField
            label="Admission Date"
            value={admissionDate}
            onChangeText={setAdmissionDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={styles.halfField}>
          <FormField
            label="Discharge Date"
            value={dischargeDate}
            onChangeText={setDischargeDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>

      <SelectField
        label="Admission Category"
        value={admissionCategory}
        options={Object.entries(ADMISSION_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
        onSelect={(v) => setAdmissionCategory(v as AdmissionCategory)}
      />

      <View style={styles.checkboxRow}>
        <Pressable
          style={[
            styles.checkbox,
            { 
              backgroundColor: isUnplannedReadmission ? theme.warning + "20" : theme.backgroundDefault,
              borderColor: isUnplannedReadmission ? theme.warning : theme.border,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const newValue = !isUnplannedReadmission;
            setIsUnplannedReadmission(newValue);
            if (!newValue) {
              setUnplannedReadmission("no");
            }
          }}
        >
          {isUnplannedReadmission ? (
            <Feather name="check" size={16} color={theme.warning} />
          ) : null}
        </Pressable>
        <ThemedText style={styles.checkboxLabel}>Unplanned Readmission (within 28 days)</ThemedText>
      </View>

      {isUnplannedReadmission ? (
        <SelectField
          label="Readmission Reason"
          value={unplannedReadmission}
          options={Object.entries(UNPLANNED_READMISSION_LABELS)
            .filter(([value]) => value !== "no")
            .map(([value, label]) => ({ value, label: label.replace("Yes - ", "") }))}
          onSelect={(v) => setUnplannedReadmission(v as UnplannedReadmissionReason)}
        />
      ) : null}

      <SectionHeader title="Diagnosis" subtitle="SNOMED CT coded diagnosis" />

      <FormField
        label="Diagnosis"
        value={diagnosis}
        onChangeText={setDiagnosis}
        placeholder="e.g., Lower limb trauma, Tibial fracture"
      />

      <SectionHeader title="Co-morbidities" subtitle="Select all that apply" />

      <View style={styles.comorbidityGrid}>
        {COMMON_COMORBIDITIES.slice(0, 20).map((comorbidity) => {
          const isSelected = selectedComorbidities.some(
            (c) => c.snomedCtCode === comorbidity.snomedCtCode
          );
          return (
            <Pressable
              key={comorbidity.snomedCtCode}
              style={[
                styles.comorbidityChip,
                { 
                  backgroundColor: isSelected ? theme.link + "20" : theme.backgroundDefault,
                  borderColor: isSelected ? theme.link : theme.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (isSelected) {
                  setSelectedComorbidities((prev) =>
                    prev.filter((c) => c.snomedCtCode !== comorbidity.snomedCtCode)
                  );
                } else {
                  setSelectedComorbidities((prev) => [...prev, comorbidity]);
                }
              }}
            >
              <ThemedText
                style={[
                  styles.comorbidityText,
                  { color: isSelected ? theme.link : theme.text },
                ]}
              >
                {comorbidity.commonName || comorbidity.displayName}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Surgery Timing" subtitle="Optional but recommended" />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <FormField
            label="Start Time"
            value={surgeryStartTime}
            onChangeText={setSurgeryStartTime}
            placeholder="HH:MM (e.g., 08:30)"
          />
        </View>
        <View style={styles.halfField}>
          <FormField
            label="End Time"
            value={surgeryEndTime}
            onChangeText={setSurgeryEndTime}
            placeholder="HH:MM (e.g., 14:15)"
          />
        </View>
      </View>

      {durationDisplay ? (
        <View style={[styles.durationCard, { backgroundColor: theme.link + "10" }]}>
          <Feather name="clock" size={16} color={theme.link} />
          <ThemedText style={[styles.durationText, { color: theme.link }]}>
            Duration: {durationDisplay}
          </ThemedText>
        </View>
      ) : null}

      <SectionHeader title="Your Role" />

      <SelectField
        label="Role in Procedure"
        value={role}
        options={[
          { value: "primary", label: "Primary Surgeon" },
          { value: "supervising", label: "Supervising" },
          { value: "assistant", label: "Assistant" },
          { value: "trainee", label: "Trainee" },
        ]}
        onSelect={(v) => setRole(v as Role)}
        required
      />

      <SectionHeader title="Operating Team" subtitle="Add team members (optional)" />

      {operatingTeam.length > 0 ? (
        <View style={styles.teamList}>
          {operatingTeam.map((member) => (
            <View 
              key={member.id} 
              style={[styles.teamMemberCard, { backgroundColor: theme.backgroundDefault }]}
            >
              <View style={styles.teamMemberInfo}>
                <ThemedText style={styles.teamMemberName}>{member.name}</ThemedText>
                <ThemedText style={[styles.teamMemberRole, { color: theme.textSecondary }]}>
                  {OPERATING_TEAM_ROLE_LABELS[member.role]}
                </ThemedText>
              </View>
              <Pressable 
                onPress={() => removeTeamMember(member.id)}
                hitSlop={8}
              >
                <Feather name="x" size={20} color={theme.textTertiary} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.addTeamMemberContainer}>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <FormField
              label="Name"
              value={newTeamMemberName}
              onChangeText={setNewTeamMemberName}
              placeholder="Team member name"
            />
          </View>
          <View style={styles.halfField}>
            <SelectField
              label="Role"
              value={newTeamMemberRole}
              options={TEAM_ROLES}
              onSelect={(v) => setNewTeamMemberRole(v as OperatingTeamRole)}
            />
          </View>
        </View>
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.link + "15" }]}
          onPress={addTeamMember}
        >
          <Feather name="plus" size={18} color={theme.link} />
          <ThemedText style={[styles.addButtonText, { color: theme.link }]}>
            Add Team Member
          </ThemedText>
        </Pressable>
      </View>

      <SectionHeader title="Risk Factors" subtitle="Optional patient details" />

      <SelectField
        label="ASA Score"
        value={asaScore}
        options={Object.entries(ASA_GRADE_LABELS).map(([value, label]) => ({ value, label }))}
        onSelect={setAsaScore}
      />

      <View style={styles.row}>
        <View style={styles.thirdField}>
          <FormField
            label="Height"
            value={heightCm}
            onChangeText={setHeightCm}
            placeholder="170"
            keyboardType="decimal-pad"
            unit="cm"
          />
        </View>
        <View style={styles.thirdField}>
          <FormField
            label="Weight"
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="70"
            keyboardType="decimal-pad"
            unit="kg"
          />
        </View>
        <View style={styles.thirdField}>
          <View style={styles.bmiDisplay}>
            <ThemedText style={[styles.bmiLabel, { color: theme.textSecondary }]}>
              BMI
            </ThemedText>
            <ThemedText style={[styles.bmiValue, { color: calculatedBmi ? theme.text : theme.textTertiary }]}>
              {calculatedBmi ? calculatedBmi.toFixed(1) : "--"}
            </ThemedText>
          </View>
        </View>
      </View>

      <SelectField
        label="Smoking Status"
        value={smoker}
        options={[
          { value: "no", label: "No" },
          { value: "yes", label: "Yes" },
          { value: "ex", label: "Ex-Smoker" },
        ]}
        onSelect={(v) => setSmoker(v as SmokingStatus)}
      />

      <SelectField
        label="Diabetes"
        value={diabetes === null ? "" : diabetes ? "yes" : "no"}
        options={[
          { value: "no", label: "No" },
          { value: "yes", label: "Yes" },
        ]}
        onSelect={(v) => setDiabetes(v === "yes")}
      />

      <SectionHeader title="Operative Factors" />

      <SelectField
        label="Wound Infection Risk"
        value={woundInfectionRisk}
        options={Object.entries(WOUND_INFECTION_RISK_LABELS).map(([value, label]) => ({ value, label }))}
        onSelect={(v) => setWoundInfectionRisk(v as WoundInfectionRisk)}
      />

      <SelectField
        label="Anaesthetic Type"
        value={anaestheticType}
        options={Object.entries(ANAESTHETIC_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        onSelect={(v) => setAnaestheticType(v as AnaestheticType)}
      />

      <View style={styles.checkboxRow}>
        <Pressable
          style={[
            styles.checkbox,
            { 
              backgroundColor: antibioticProphylaxis ? theme.link + "20" : theme.backgroundDefault,
              borderColor: antibioticProphylaxis ? theme.link : theme.border,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAntibioticProphylaxis(!antibioticProphylaxis);
          }}
        >
          {antibioticProphylaxis ? (
            <Feather name="check" size={16} color={theme.link} />
          ) : null}
        </Pressable>
        <ThemedText style={styles.checkboxLabel}>Antibiotic Prophylaxis Given</ThemedText>
      </View>

      <View style={styles.checkboxRow}>
        <Pressable
          style={[
            styles.checkbox,
            { 
              backgroundColor: dvtProphylaxis ? theme.link + "20" : theme.backgroundDefault,
              borderColor: dvtProphylaxis ? theme.link : theme.border,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDvtProphylaxis(!dvtProphylaxis);
          }}
        >
          {dvtProphylaxis ? (
            <Feather name="check" size={16} color={theme.link} />
          ) : null}
        </Pressable>
        <ThemedText style={styles.checkboxLabel}>DVT Prophylaxis Given</ThemedText>
      </View>

      <SectionHeader title="Outcomes" />

      <SelectField
        label="Unplanned ICU Admission"
        value={unplannedICU}
        options={Object.entries(UNPLANNED_ICU_LABELS).map(([value, label]) => ({ value, label }))}
        onSelect={(v) => setUnplannedICU(v as UnplannedICUReason)}
      />

      <View style={styles.checkboxRow}>
        <Pressable
          style={[
            styles.checkbox,
            { 
              backgroundColor: returnToTheatre ? theme.error + "20" : theme.backgroundDefault,
              borderColor: returnToTheatre ? theme.error : theme.border,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setReturnToTheatre(!returnToTheatre);
          }}
        >
          {returnToTheatre ? (
            <Feather name="check" size={16} color={theme.error} />
          ) : null}
        </Pressable>
        <ThemedText style={styles.checkboxLabel}>Unplanned Return to Theatre</ThemedText>
      </View>

      {returnToTheatre ? (
        <FormField
          label="Reason for Return"
          value={returnToTheatreReason}
          onChangeText={setReturnToTheatreReason}
          placeholder="e.g., Wound dehiscence"
        />
      ) : null}

      <SelectField
        label="Discharge Outcome"
        value={outcome}
        options={Object.entries(DISCHARGE_OUTCOME_LABELS).map(([value, label]) => ({ value, label }))}
        onSelect={(v) => setOutcome(v as DischargeOutcome)}
      />

      {outcome === "died" ? (
        <SelectField
          label="Mortality Classification"
          value={mortalityClassification}
          options={Object.entries(MORTALITY_CLASSIFICATION_LABELS).map(([value, label]) => ({ value, label }))}
          onSelect={(v) => setMortalityClassification(v as MortalityClassification)}
        />
      ) : null}

      <View style={styles.checkboxRow}>
        <Pressable
          style={[
            styles.checkbox,
            { 
              backgroundColor: discussedAtMDM ? theme.link + "20" : theme.backgroundDefault,
              borderColor: discussedAtMDM ? theme.link : theme.border,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDiscussedAtMDM(!discussedAtMDM);
          }}
        >
          {discussedAtMDM ? (
            <Feather name="check" size={16} color={theme.link} />
          ) : null}
        </Pressable>
        <ThemedText style={styles.checkboxLabel}>Discussed at MDM</ThemedText>
      </View>

      <SectionHeader title="Clinical Details" subtitle={`${SPECIALTY_LABELS[specialty]} specific fields`} />

      {specialty === "free_flap" ? (
        <>
          <RecipientSiteSelector
            value={recipientSiteRegion}
            onSelect={setRecipientSiteRegion}
            required
          />

          <SectionHeader 
            title="Anastomoses" 
            subtitle="Add arterial and venous connections" 
          />

          {anastomoses.map((entry, index) => (
            <AnastomosisEntryCard
              key={entry.id}
              entry={entry}
              index={index}
              recipientRegion={recipientSiteRegion}
              onUpdate={updateAnastomosis}
              onDelete={() => removeAnastomosis(entry.id)}
            />
          ))}

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Pressable
                style={[styles.addButton, { backgroundColor: theme.error + "15" }]}
                onPress={() => addAnastomosis("artery")}
              >
                <Feather name="plus" size={18} color={theme.error} />
                <ThemedText style={[styles.addButtonText, { color: theme.error }]}>
                  Add Artery
                </ThemedText>
              </Pressable>
            </View>
            <View style={styles.halfField}>
              <Pressable
                style={[styles.addButton, { backgroundColor: theme.link + "15" }]}
                onPress={() => addAnastomosis("vein")}
              >
                <Feather name="plus" size={18} color={theme.link} />
                <ThemedText style={[styles.addButtonText, { color: theme.link }]}>
                  Add Vein
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={{ height: Spacing.lg }} />
        </>
      ) : null}

      {config.fields.filter((field) => {
        if (specialty === "free_flap") {
          const skipFields = [
            "recipientArteryName",
            "recipientVeinName",
            "anastomosisType",
            "couplerSizeMm",
          ];
          return !skipFields.includes(field.key);
        }
        return true;
      }).map((field) => {
        if (field.conditionalOn) {
          const conditionField = field.conditionalOn.field;
          const conditionValue = field.conditionalOn.value;
          if (conditionField === "procedureType" && procedureType !== conditionValue) {
            return null;
          }
        }

        if (field.type === "select" && field.options) {
          return (
            <SelectField
              key={field.key}
              label={field.label}
              value={clinicalDetails[field.key] || ""}
              options={field.options}
              onSelect={(v) => updateClinicalDetail(field.key, v)}
              required={field.required}
            />
          );
        }

        return (
          <FormField
            key={field.key}
            label={field.label}
            value={String(clinicalDetails[field.key] || "")}
            onChangeText={(v) =>
              updateClinicalDetail(
                field.key,
                field.type === "number" ? (v ? parseFloat(v) : undefined) : v
              )
            }
            placeholder={field.placeholder}
            keyboardType={field.keyboardType}
            unit={field.unit}
            required={field.required}
          />
        );
      })}

      <View style={styles.buttonContainer}>
        <Button onPress={handleSave} disabled={saving}>
          {saving ? "Saving Case..." : "Save Case"}
        </Button>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfField: {
    flex: 1,
  },
  thirdField: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
  durationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  durationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  teamList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  teamMemberCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: 15,
    fontWeight: "500",
  },
  teamMemberRole: {
    fontSize: 13,
    marginTop: 2,
  },
  addTeamMemberContainer: {
    marginBottom: Spacing.md,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  comorbidityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  comorbidityChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  comorbidityText: {
    fontSize: 13,
    fontWeight: "500",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: {
    fontSize: 15,
    flex: 1,
  },
  bmiDisplay: {
    paddingTop: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  bmiLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  bmiValue: {
    fontSize: 20,
    fontWeight: "600",
  },
});
