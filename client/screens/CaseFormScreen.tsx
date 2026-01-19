import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  CaseProcedure,
  Specialty,
  SPECIALTY_LABELS,
  PROCEDURE_TYPES,
  Role,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
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
import { FormField, SelectField, PickerField, DatePickerField } from "@/components/FormField";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/Button";
import { saveCase, getCaseDraft, saveCaseDraft, clearCaseDraft, CaseDraft } from "@/lib/storage";
import { getConfigForSpecialty, getDefaultClinicalDetails } from "@/lib/procedureConfig";
import { findSnomedProcedure, getProcedureCodeForCountry, getCountryCodeFromProfile } from "@/lib/snomedCt";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { RecipientSiteSelector } from "@/components/RecipientSiteSelector";
import { AnastomosisEntryCard } from "@/components/AnastomosisEntryCard";
import { ProcedureEntryCard } from "@/components/ProcedureEntryCard";
import { useAuth } from "@/contexts/AuthContext";

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

// Default donor vessels based on flap type
const DEFAULT_DONOR_VESSELS: Record<string, { artery: string; vein: string }> = {
  "Anterolateral thigh free flap": { 
    artery: "Descending branch of lateral circumflex femoral artery (LCFA)", 
    vein: "Venae comitantes of LCFA" 
  },
  "ALT Flap": { 
    artery: "Descending branch of lateral circumflex femoral artery (LCFA)", 
    vein: "Venae comitantes of LCFA" 
  },
  "Deep inferior epigastric perforator flap": { 
    artery: "Deep inferior epigastric artery (DIEA)", 
    vein: "Deep inferior epigastric vein (DIEV)" 
  },
  "DIEP Flap": { 
    artery: "Deep inferior epigastric artery (DIEA)", 
    vein: "Deep inferior epigastric vein (DIEV)" 
  },
  "Free fibula flap": { 
    artery: "Peroneal artery", 
    vein: "Peroneal veins" 
  },
  "Fibula Flap": { 
    artery: "Peroneal artery", 
    vein: "Peroneal veins" 
  },
  "Free radial forearm flap": { 
    artery: "Radial artery", 
    vein: "Radial venae comitantes / Cephalic vein" 
  },
  "RFFF": { 
    artery: "Radial artery", 
    vein: "Radial venae comitantes / Cephalic vein" 
  },
  "Free latissimus dorsi flap": { 
    artery: "Thoracodorsal artery", 
    vein: "Thoracodorsal vein" 
  },
  "LD Flap": { 
    artery: "Thoracodorsal artery", 
    vein: "Thoracodorsal vein" 
  },
  "Free gracilis flap": { 
    artery: "Medial circumflex femoral artery (MCFA)", 
    vein: "Venae comitantes of MCFA" 
  },
  "Gracilis": { 
    artery: "Medial circumflex femoral artery (MCFA)", 
    vein: "Venae comitantes of MCFA" 
  },
  "Free superior gluteal artery perforator flap": {
    artery: "Superior gluteal artery",
    vein: "Superior gluteal vein"
  },
  "SGAP Flap": {
    artery: "Superior gluteal artery",
    vein: "Superior gluteal vein"
  },
  "Free inferior gluteal artery perforator flap": {
    artery: "Inferior gluteal artery",
    vein: "Inferior gluteal vein"
  },
  "IGAP Flap": {
    artery: "Inferior gluteal artery",
    vein: "Inferior gluteal vein"
  },
  "Free scapular flap": {
    artery: "Circumflex scapular artery",
    vein: "Circumflex scapular vein"
  },
  "Scapular Flap": {
    artery: "Circumflex scapular artery",
    vein: "Circumflex scapular vein"
  },
  "Free medial sural artery perforator flap": {
    artery: "Medial sural artery",
    vein: "Medial sural veins"
  },
  "MSAP Flap": {
    artery: "Medial sural artery",
    vein: "Medial sural veins"
  },
};

export default function CaseFormScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { facilities, profile } = useAuth();
  
  const draftLoadedRef = useRef(false);

  const { specialty, extractedData } = route.params;
  const config = getConfigForSpecialty(specialty);

  const primaryFacility = facilities.find(f => f.isPrimary)?.facilityName || facilities[0]?.facilityName || "";

  const [saving, setSaving] = useState(false);
  const [patientIdentifier, setPatientIdentifier] = useState("");
  const [procedureDate, setProcedureDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [facility, setFacility] = useState(primaryFacility);
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
  const [role, setRole] = useState<Role>("PS");
  
  const [showProcedureDatePicker, setShowProcedureDatePicker] = useState(false);
  const [showAdmissionDatePicker, setShowAdmissionDatePicker] = useState(false);
  const [showDischargeDatePicker, setShowDischargeDatePicker] = useState(false);
  const [isUnplannedReadmission, setIsUnplannedReadmission] = useState(false);
  const [showRoleInfoModal, setShowRoleInfoModal] = useState(false);

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

  const buildDefaultProcedures = useCallback((): CaseProcedure[] => ([
    {
      id: uuidv4(),
      sequenceOrder: 1,
      procedureName: (extractedData as FreeFlapDetails | undefined)?.flapDisplayName || 
        (extractedData as any)?.flapType || 
        PROCEDURE_TYPES[specialty][0],
      specialty: specialty,
      surgeonRole: "PS",
    },
  ]), [extractedData, specialty]);

  // Multi-procedure support
  const [procedures, setProcedures] = useState<CaseProcedure[]>(buildDefaultProcedures);

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
    if (admissionCategory === "day_case" && procedureDate) {
      setAdmissionDate(procedureDate);
      setDischargeDate(procedureDate);
    }
  }, [admissionCategory, procedureDate]);

  useEffect(() => {
    const loadDraft = async () => {
      if (extractedData) {
        draftLoadedRef.current = true;
        return;
      }
      const draft = await getCaseDraft(specialty);
      if (!draft) {
        draftLoadedRef.current = true;
        return;
      }

      setPatientIdentifier(draft.patientIdentifier ?? "");
      setProcedureDate(draft.procedureDate ?? new Date().toISOString().split("T")[0]);
      setFacility(draft.facility ?? primaryFacility);
      setProcedureType(draft.procedureType ?? PROCEDURE_TYPES[specialty][0]);
      setAsaScore(draft.asaScore ? String(draft.asaScore) : "");
      setHeightCm(draft.heightCm ? String(draft.heightCm) : "");
      setWeightKg(draft.weightKg ? String(draft.weightKg) : "");
      setSmoker(draft.smoker ?? "");
      setDiabetes(draft.diabetes ?? null);
      setRole((draft.teamMembers?.[0]?.role as Role | undefined) ?? "PS");
      setSurgeryStartTime(draft.surgeryTiming?.startTime ?? "");
      setSurgeryEndTime(draft.surgeryTiming?.endTime ?? "");
      setOperatingTeam(draft.operatingTeam ?? []);
      setClinicalDetails((draft.clinicalDetails as Record<string, any>) ?? getDefaultClinicalDetails(specialty));
      setRecipientSiteRegion((draft.clinicalDetails as FreeFlapDetails | undefined)?.recipientSiteRegion);
      setAnastomoses((draft.clinicalDetails as FreeFlapDetails | undefined)?.anastomoses ?? []);
      setProcedures(draft.procedures ?? buildDefaultProcedures());
      setGender(draft.gender ?? "");
      setEthnicity(draft.ethnicity ?? "");
      setAdmissionDate(draft.admissionDate ?? "");
      setDischargeDate(draft.dischargeDate ?? "");
      setAdmissionCategory(draft.admissionCategory ?? "");
      setUnplannedReadmission(draft.unplannedReadmission ?? "no");
      setIsUnplannedReadmission((draft.unplannedReadmission ?? "no") !== "no");
      setDiagnosis(draft.finalDiagnosis?.displayName ?? "");
      setSelectedComorbidities(draft.comorbidities ?? []);
      setWoundInfectionRisk(draft.woundInfectionRisk ?? "");
      setAnaestheticType(draft.anaestheticType ?? "");
      setAntibioticProphylaxis(draft.prophylaxis?.antibiotics ?? false);
      setDvtProphylaxis(draft.prophylaxis?.dvtPrevention ?? false);
      setUnplannedICU(draft.unplannedICU ?? "no");
      setReturnToTheatre(draft.returnToTheatre ?? false);
      setReturnToTheatreReason(draft.returnToTheatreReason ?? "");
      setOutcome(draft.outcome ?? "");
      setMortalityClassification(draft.mortalityClassification ?? "");
      setDiscussedAtMDM(draft.discussedAtMDM ?? false);

      draftLoadedRef.current = true;
    };

    loadDraft();
  }, [buildDefaultProcedures, extractedData, primaryFacility, specialty]);

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

  useEffect(() => {
    if (!draftLoadedRef.current) return;

    const draft: CaseDraft = {
      id: "draft",
      patientIdentifier,
      procedureDate,
      facility,
      specialty,
      procedureType,
      procedures,
      surgeryTiming: surgeryStartTime || surgeryEndTime
        ? { startTime: surgeryStartTime || undefined, endTime: surgeryEndTime || undefined }
        : undefined,
      operatingTeam,
      gender: gender || undefined,
      ethnicity: ethnicity.trim() || undefined,
      admissionDate: admissionDate || undefined,
      dischargeDate: dischargeDate || undefined,
      admissionCategory: admissionCategory || undefined,
      unplannedReadmission: unplannedReadmission !== "no" ? unplannedReadmission : "no",
      finalDiagnosis: diagnosis.trim() ? { displayName: diagnosis.trim() } : undefined,
      comorbidities: selectedComorbidities.length > 0 ? selectedComorbidities : undefined,
      asaScore: asaScore ? (parseInt(asaScore) as ASAScore) : undefined,
      heightCm: heightCm ? parseFloat(heightCm) : undefined,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      bmi: calculatedBmi,
      smoker: smoker || undefined,
      diabetes: diabetes ?? undefined,
      woundInfectionRisk: woundInfectionRisk || undefined,
      anaestheticType: anaestheticType || undefined,
      prophylaxis: antibioticProphylaxis || dvtProphylaxis
        ? { antibiotics: antibioticProphylaxis, dvtPrevention: dvtProphylaxis }
        : undefined,
      unplannedICU: unplannedICU !== "no" ? unplannedICU : "no",
      returnToTheatre: returnToTheatre || undefined,
      returnToTheatreReason: returnToTheatreReason.trim() || undefined,
      outcome: outcome || undefined,
      mortalityClassification: mortalityClassification || undefined,
      discussedAtMDM: discussedAtMDM || undefined,
      clinicalDetails: {
        ...clinicalDetails,
        ...(recipientSiteRegion ? { recipientSiteRegion } : {}),
        ...(anastomoses.length > 0 ? { anastomoses } : {}),
      },
      teamMembers: [
        {
          id: "draft",
          name: "You",
          role,
          confirmed: true,
          addedAt: new Date().toISOString(),
        },
      ],
      ownerId: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const timeout = setTimeout(() => {
      saveCaseDraft(specialty, draft);
    }, 500);

    return () => clearTimeout(timeout);
  }, [
    admissionCategory,
    admissionDate,
    anaestheticType,
    anastomoses,
    antibioticProphylaxis,
    asaScore,
    calculatedBmi,
    clinicalDetails,
    diagnosis,
    diabetes,
    dischargeDate,
    discussedAtMDM,
    dvtProphylaxis,
    ethnicity,
    facility,
    gender,
    heightCm,
    mortalityClassification,
    operatingTeam,
    outcome,
    patientIdentifier,
    procedureDate,
    procedureType,
    procedures,
    recipientSiteRegion,
    returnToTheatre,
    returnToTheatreReason,
    role,
    selectedComorbidities,
    smoker,
    specialty,
    surgeryEndTime,
    surgeryStartTime,
    unplannedICU,
    unplannedReadmission,
    weightKg,
    woundInfectionRisk,
  ]);

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
    // Auto-populate donor vessel based on flap type
    const donorVessels = DEFAULT_DONOR_VESSELS[procedureType];
    const donorVesselName = donorVessels 
      ? (vesselType === "artery" ? donorVessels.artery : donorVessels.vein)
      : "";
    const newEntry: AnastomosisEntry = {
      id: uuidv4(),
      vesselType,
      recipientVesselName: "",
      donorVesselName,
      // Arteries are always hand-sewn
      couplingMethod: vesselType === "artery" ? "hand_sewn" : undefined,
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

  // Procedure management functions
  const addProcedure = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newProcedure: CaseProcedure = {
      id: uuidv4(),
      sequenceOrder: procedures.length + 1,
      procedureName: "",
      specialty: specialty,
      surgeonRole: "PS",
    };
    setProcedures((prev) => [...prev, newProcedure]);
  };

  const updateProcedure = (updated: CaseProcedure) => {
    setProcedures((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const removeProcedure = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcedures((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      return filtered.map((p, idx) => ({ ...p, sequenceOrder: idx + 1 }));
    });
  };

  const moveProcedureUp = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProcedures((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx <= 0) return prev;
      const newArr = [...prev];
      [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
      return newArr.map((p, i) => ({ ...p, sequenceOrder: i + 1 }));
    });
  };

  const moveProcedureDown = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProcedures((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const newArr = [...prev];
      [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
      return newArr.map((p, i) => ({ ...p, sequenceOrder: i + 1 }));
    });
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
      const countryCode = getCountryCodeFromProfile(profile?.countryOfPractice);
      const snomedProcedure = findSnomedProcedure(procedureType, specialty);
      const procedureCode = snomedProcedure 
        ? getProcedureCodeForCountry(snomedProcedure, countryCode)
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
        procedures: procedures.length > 0 ? procedures : undefined,
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
        
        clinicalDetails: {} as any,
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
      await clearCaseDraft(specialty);
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

      <DatePickerField
        label="Procedure Date"
        value={procedureDate}
        onChange={setProcedureDate}
        placeholder="Select date..."
        required
      />

      {facilities.length > 0 ? (
        <PickerField
          label="Facility"
          value={facility}
          options={facilities.map(f => ({ value: f.facilityName, label: f.facilityName }))}
          onSelect={setFacility}
          placeholder="Select facility..."
          required
        />
      ) : (
        <FormField
          label="Facility"
          value={facility}
          onChangeText={setFacility}
          placeholder="Hospital or clinic name"
          required
        />
      )}

      <SectionHeader title="Procedures Performed" />
      
      <ThemedText style={[styles.sectionDescription, { color: theme.textSecondary }]}>
        Add all procedures performed during this surgery. Each procedure can have its own specialty and SNOMED CT code.
      </ThemedText>

      {procedures.map((proc, idx) => (
        <ProcedureEntryCard
          key={proc.id}
          procedure={proc}
          index={idx}
          isOnlyProcedure={procedures.length === 1}
          onUpdate={updateProcedure}
          onDelete={() => removeProcedure(proc.id)}
          onMoveUp={() => moveProcedureUp(proc.id)}
          onMoveDown={() => moveProcedureDown(proc.id)}
          canMoveUp={idx > 0}
          canMoveDown={idx < procedures.length - 1}
        />
      ))}

      <Pressable
        style={[styles.addButton, { borderColor: theme.link }]}
        onPress={addProcedure}
      >
        <Feather name="plus" size={18} color={theme.link} />
        <ThemedText style={[styles.addButtonText, { color: theme.link }]}>
          Add Another Procedure
        </ThemedText>
      </Pressable>

      <SectionHeader title="Patient Demographics" />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <PickerField
            label="Gender"
            value={gender}
            options={Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))}
            onSelect={(v) => setGender(v as Gender)}
          />
        </View>
        <View style={styles.halfField}>
          <PickerField
            label="Ethnicity"
            value={ethnicity}
            options={ETHNICITY_OPTIONS}
            onSelect={setEthnicity}
          />
        </View>
      </View>

      <SectionHeader title="Admission Details" />

      <PickerField
        label="Admission Category"
        value={admissionCategory}
        options={Object.entries(ADMISSION_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
        onSelect={(v) => setAdmissionCategory(v as AdmissionCategory)}
      />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <DatePickerField
            label="Admission Date"
            value={admissionDate}
            onChange={setAdmissionDate}
            disabled={admissionCategory === "day_case"}
          />
        </View>
        <View style={styles.halfField}>
          <DatePickerField
            label="Discharge Date"
            value={dischargeDate}
            onChange={setDischargeDate}
            disabled={admissionCategory === "day_case"}
          />
        </View>
      </View>

      <Pressable
        style={styles.checkboxRow}
        testID="checkbox-unplanned-readmission"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          const newValue = !isUnplannedReadmission;
          setIsUnplannedReadmission(newValue);
          if (!newValue) {
            setUnplannedReadmission("no");
          }
        }}
      >
        <View
          style={[
            styles.checkbox,
            { 
              backgroundColor: isUnplannedReadmission ? theme.warning + "20" : theme.backgroundDefault,
              borderColor: isUnplannedReadmission ? theme.warning : theme.border,
            },
          ]}
        >
          {isUnplannedReadmission ? (
            <Feather name="check" size={16} color={theme.warning} />
          ) : null}
        </View>
        <ThemedText style={styles.checkboxLabel}>Unplanned Readmission (within 28 days)</ThemedText>
      </Pressable>

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

      <View style={styles.sectionHeaderRow}>
        <SectionHeader title="Your Role" />
        <Pressable
          style={[styles.infoButton, { backgroundColor: theme.link + "15" }]}
          onPress={() => setShowRoleInfoModal(true)}
          hitSlop={8}
        >
          <Feather name="info" size={16} color={theme.link} />
        </Pressable>
      </View>

      <PickerField
        label="Supervision Level (RACS MALT)"
        value={role}
        options={[
          { value: "PS", label: "PS - Primary Surgeon" },
          { value: "PP", label: "PP - Performed with Peer" },
          { value: "AS", label: "AS - Assisting (scrubbed)" },
          { value: "ONS", label: "ONS - Observing (not scrubbed)" },
          { value: "SS", label: "SS - Supervising (scrubbed)" },
          { value: "SNS", label: "SNS - Supervising (not scrubbed)" },
          { value: "A", label: "A - Available" },
        ]}
        onSelect={(v) => setRole(v as Role)}
        required
      />

      {/* Role Info Modal */}
      <Modal
        visible={showRoleInfoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRoleInfoModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <ThemedText style={styles.modalTitle}>Supervision Levels</ThemedText>
            <Pressable
              style={[styles.modalCloseButton, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => setShowRoleInfoModal(false)}
              hitSlop={8}
            >
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
          </View>
          <KeyboardAwareScrollViewCompat
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
          >
            <ThemedText style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              RACS MALT role in theatre definitions
            </ThemedText>
            {(Object.keys(ROLE_LABELS) as Role[]).map((roleKey) => (
              <View 
                key={roleKey} 
                style={[styles.roleInfoCard, { backgroundColor: theme.backgroundDefault }]}
              >
                <View style={styles.roleInfoHeader}>
                  <View style={[styles.roleCodeBadge, { backgroundColor: theme.link + "20" }]}>
                    <ThemedText style={[styles.roleCode, { color: theme.link }]}>
                      {roleKey}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.roleLabel}>{ROLE_LABELS[roleKey]}</ThemedText>
                </View>
                <ThemedText style={[styles.roleDescription, { color: theme.textSecondary }]}>
                  {ROLE_DESCRIPTIONS[roleKey]}
                </ThemedText>
              </View>
            ))}
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>

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
            <PickerField
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

      <PickerField
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

      <View style={styles.checkboxRow}>
        <Pressable
          style={[
            styles.checkbox,
            { 
              backgroundColor: smoker === "yes" ? theme.link + "20" : theme.backgroundRoot,
              borderColor: smoker === "yes" ? theme.link : theme.border,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSmoker(smoker === "yes" ? "no" : "yes");
          }}
        >
          {smoker === "yes" ? (
            <Feather name="check" size={16} color={theme.link} />
          ) : null}
        </Pressable>
        <ThemedText style={styles.checkboxLabel}>Smoker</ThemedText>
      </View>

      <View style={styles.checkboxRow}>
        <Pressable
          style={[
            styles.checkbox,
            { 
              backgroundColor: diabetes === true ? theme.link + "20" : theme.backgroundRoot,
              borderColor: diabetes === true ? theme.link : theme.border,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDiabetes(diabetes === true ? false : true);
          }}
        >
          {diabetes === true ? (
            <Feather name="check" size={16} color={theme.link} />
          ) : null}
        </Pressable>
        <ThemedText style={styles.checkboxLabel}>Diabetes</ThemedText>
      </View>

      <SectionHeader title="Operative Factors" />

      <PickerField
        label="Wound Infection Risk"
        value={woundInfectionRisk}
        options={Object.entries(WOUND_INFECTION_RISK_LABELS).map(([value, label]) => ({ value, label }))}
        onSelect={(v) => setWoundInfectionRisk(v as WoundInfectionRisk)}
      />

      <PickerField
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

      <PickerField
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

      <PickerField
        label="Discharge Outcome"
        value={outcome}
        options={Object.entries(DISCHARGE_OUTCOME_LABELS).map(([value, label]) => ({ value, label }))}
        onSelect={(v) => setOutcome(v as DischargeOutcome)}
      />

      {outcome === "died" ? (
        <PickerField
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
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
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
  sectionDescription: {
    fontSize: 13,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  roleInfoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  roleInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  roleCodeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    minWidth: 40,
    alignItems: "center",
  },
  roleCode: {
    fontSize: 13,
    fontWeight: "700",
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  roleDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
});
