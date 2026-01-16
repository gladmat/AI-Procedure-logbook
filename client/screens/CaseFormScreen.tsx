import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
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
} from "@/types/case";
import { FormField, SelectField } from "@/components/FormField";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/Button";
import { saveCase, getSettings } from "@/lib/storage";
import { getConfigForSpecialty, getDefaultClinicalDetails } from "@/lib/procedureConfig";
import { findSnomedProcedure, getProcedureCodeForCountry } from "@/lib/snomedCt";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

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
  const [procedureType, setProcedureType] = useState(
    extractedData?.flapType || PROCEDURE_TYPES[specialty][0]
  );
  const [asaScore, setAsaScore] = useState<string>("");
  const [bmi, setBmi] = useState("");
  const [smoker, setSmoker] = useState<SmokingStatus | "">("");
  const [diabetes, setDiabetes] = useState<boolean | null>(null);
  const [role, setRole] = useState<Role>("primary");

  const [surgeryStartTime, setSurgeryStartTime] = useState("");
  const [surgeryEndTime, setSurgeryEndTime] = useState("");
  
  const [operatingTeam, setOperatingTeam] = useState<OperatingTeamMember[]>([]);
  const [newTeamMemberName, setNewTeamMemberName] = useState("");
  const [newTeamMemberRole, setNewTeamMemberRole] = useState<OperatingTeamRole>("scrub_nurse");

  const [clinicalDetails, setClinicalDetails] = useState<Record<string, any>>(
    extractedData || getDefaultClinicalDetails(specialty)
  );

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
        asaScore: asaScore ? (parseInt(asaScore) as ASAScore) : undefined,
        bmi: bmi ? parseFloat(bmi) : undefined,
        smoker: smoker || undefined,
        diabetes: diabetes ?? undefined,
        clinicalDetails: clinicalDetails as any,
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

      <View style={styles.row}>
        <View style={styles.thirdField}>
          <SelectField
            label="ASA Score"
            value={asaScore}
            options={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5" },
            ]}
            onSelect={setAsaScore}
          />
        </View>
        <View style={styles.thirdField}>
          <FormField
            label="BMI"
            value={bmi}
            onChangeText={setBmi}
            placeholder="25.0"
            keyboardType="decimal-pad"
          />
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

      <SectionHeader title="Clinical Details" subtitle={`${SPECIALTY_LABELS[specialty]} specific fields`} />

      {config.fields.map((field) => {
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
});
