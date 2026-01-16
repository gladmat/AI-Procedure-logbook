import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
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
  TeamMember,
  ASAScore,
  SmokingStatus,
  FreeFlapDetails,
} from "@/types/case";
import { FormField, SelectField } from "@/components/FormField";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/Button";
import { saveCase } from "@/lib/storage";
import { getConfigForSpecialty, getDefaultClinicalDetails } from "@/lib/procedureConfig";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteParams = RouteProp<RootStackParamList, "CaseForm">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

  const [clinicalDetails, setClinicalDetails] = useState<Record<string, any>>(
    extractedData || getDefaultClinicalDetails(specialty)
  );

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
      const userId = uuidv4();
      const newCase: Case = {
        id: uuidv4(),
        patientIdentifier: patientIdentifier.trim(),
        procedureDate,
        facility: facility.trim(),
        specialty,
        procedureType,
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
});
