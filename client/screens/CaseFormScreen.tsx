import React, { useState, useEffect, useMemo, useRef, useCallback, MutableRefObject } from "react";
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
  DiagnosisGroup,
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
  AdmissionUrgency,
  StayType,
  UnplannedReadmissionReason,
  WoundInfectionRisk,
  AnaestheticType,
  UnplannedICUReason,
  DischargeOutcome,
  MortalityClassification,
  SnomedCodedItem,
  Prophylaxis,
  GENDER_LABELS,
  ADMISSION_URGENCY_LABELS,
  STAY_TYPE_LABELS,
  UNPLANNED_READMISSION_LABELS,
  WOUND_INFECTION_RISK_LABELS,
  ANAESTHETIC_TYPE_LABELS,
  UNPLANNED_ICU_LABELS,
  DISCHARGE_OUTCOME_LABELS,
  MORTALITY_CLASSIFICATION_LABELS,
  ASA_GRADE_LABELS,
  COMMON_COMORBIDITIES,
  ETHNICITY_OPTIONS,
  OperativeMediaItem,
} from "@/types/case";
import { InfectionOverlay } from "@/types/infection";
import { FormField, SelectField, PickerField, DatePickerField } from "@/components/FormField";
import { InfectionOverlayForm } from "@/components/InfectionOverlayForm";
import { TimeField } from "@/components/TimeField";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/Button";
import { saveCase, getCase, updateCase, getCaseDraft, saveCaseDraft, clearCaseDraft, CaseDraft } from "@/lib/storage";
import { getConfigForSpecialty, getDefaultClinicalDetails } from "@/lib/procedureConfig";
import { findSnomedProcedure, getProcedureCodeForCountry, getCountryCodeFromProfile } from "@/lib/snomedCt";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { RecipientSiteSelector } from "@/components/RecipientSiteSelector";
import { AnastomosisEntryCard } from "@/components/AnastomosisEntryCard";
import { useAuth } from "@/contexts/AuthContext";
import { OperativeMediaSection } from "@/components/OperativeMediaSection";
import { DiagnosisGroupEditor } from "@/components/DiagnosisGroupEditor";

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
  const savedRef = useRef(false);
  const editModeLoadedRef = useRef(false);
  const scrollViewRef = useRef<any>(null);
  const scrollPositionRef = useRef(0);

  const { specialty: routeSpecialty, caseId } = route.params;
  const isEditMode = !!caseId;
  const [existingCase, setExistingCase] = useState<Case | null>(null);
  const specialty = routeSpecialty || existingCase?.specialty || "general";
  const config = getConfigForSpecialty(specialty);

  const primaryFacility = facilities.find(f => f.isPrimary)?.facilityName || facilities[0]?.facilityName || "";

  const [saving, setSaving] = useState(false);
  const [patientIdentifier, setPatientIdentifier] = useState("");
  const [procedureDate, setProcedureDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [facility, setFacility] = useState(primaryFacility);
  const [procedureType, setProcedureType] = useState<string>(
    PROCEDURE_TYPES[specialty]?.[0] || ""
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
    getDefaultClinicalDetails(specialty)
  );

  const [infectionOverlay, setInfectionOverlay] = useState<InfectionOverlay | undefined>(undefined);
  const [infectionCollapsed, setInfectionCollapsed] = useState(false);

  const [recipientSiteRegion, setRecipientSiteRegion] = useState<AnatomicalRegion | undefined>(
    undefined
  );
  const [anastomoses, setAnastomoses] = useState<AnastomosisEntry[]>(
    []
  );

  const [diagnosisGroups, setDiagnosisGroups] = useState<DiagnosisGroup[]>([
    {
      id: uuidv4(),
      sequenceOrder: 1,
      specialty,
      procedures: [{
        id: uuidv4(),
        sequenceOrder: 1,
        procedureName: PROCEDURE_TYPES[specialty]?.[0] || "",
        specialty,
        surgeonRole: "PS",
      }],
    },
  ]);

  // RACS MALT Patient Demographics
  const [gender, setGender] = useState<Gender | "">("");
  const [age, setAge] = useState<string>("");
  const [ethnicity, setEthnicity] = useState("");
  
  // RACS MALT Admission Details
  const [admissionDate, setAdmissionDate] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");
  const [admissionUrgency, setAdmissionUrgency] = useState<AdmissionUrgency | "">("");
  const [stayType, setStayType] = useState<StayType | "">("");
  const [injuryDate, setInjuryDate] = useState("");
  const [unplannedReadmission, setUnplannedReadmission] = useState<UnplannedReadmissionReason>("no");

  const [operativeMedia, setOperativeMedia] = useState<OperativeMediaItem[]>([]);

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

  const showInjuryDate = admissionUrgency === "acute" || diagnosisGroups.some(g => g.specialty === "hand_surgery" || g.specialty === "orthoplastic");

  useEffect(() => {
    if (!showInjuryDate) {
      setInjuryDate("");
    }
  }, [showInjuryDate]);

  useEffect(() => {
    if (stayType === "day_case" && procedureDate) {
      setAdmissionDate(procedureDate);
      setDischargeDate(procedureDate);
    }
  }, [stayType, procedureDate]);

  useEffect(() => {
    const loadDraft = async () => {
      if (isEditMode) {
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
      setProcedureType(draft.procedureType ?? PROCEDURE_TYPES[specialty]?.[0] ?? "");
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
      if (draft.diagnosisGroups) setDiagnosisGroups(draft.diagnosisGroups);
      setGender(draft.gender ?? "");
      setEthnicity(draft.ethnicity ?? "");
      setAdmissionDate(draft.admissionDate ?? "");
      setDischargeDate(draft.dischargeDate ?? "");
      setAdmissionUrgency(draft.admissionUrgency ?? "");
      setStayType(draft.stayType ?? "");
      setInjuryDate(draft.injuryDate ?? "");
      setUnplannedReadmission(draft.unplannedReadmission ?? "no");
      setIsUnplannedReadmission((draft.unplannedReadmission ?? "no") !== "no");
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
  }, [primaryFacility, specialty]);

  // Load existing case for edit mode
  useEffect(() => {
    if (!isEditMode || !caseId || editModeLoadedRef.current) return;

    const loadExistingCase = async () => {
      try {
        const caseData = await getCase(caseId);
        if (!caseData) return;

        setExistingCase(caseData);
        editModeLoadedRef.current = true;

        // Populate form fields from existing case
        setPatientIdentifier(caseData.patientIdentifier);
        setProcedureDate(caseData.procedureDate);
        setFacility(caseData.facility);
        setProcedureType(caseData.procedureType);
        setDiagnosisGroups(caseData.diagnosisGroups || diagnosisGroups);
        setSurgeryStartTime(caseData.surgeryTiming?.startTime ?? "");
        setSurgeryEndTime(caseData.surgeryTiming?.endTime ?? "");
        setOperatingTeam(caseData.operatingTeam ?? []);
        setGender(caseData.gender ?? "");
        setEthnicity(caseData.ethnicity ?? "");
        setAdmissionDate(caseData.admissionDate ?? "");
        setDischargeDate(caseData.dischargeDate ?? "");
        setAdmissionUrgency(caseData.admissionUrgency ?? "");
        setStayType(caseData.stayType ?? "");
        setInjuryDate(caseData.injuryDate ?? "");
        setUnplannedReadmission(caseData.unplannedReadmission ?? "no");
        setIsUnplannedReadmission((caseData.unplannedReadmission ?? "no") !== "no");
        setAsaScore(caseData.asaScore ? String(caseData.asaScore) : "");
        setHeightCm(caseData.heightCm ? String(caseData.heightCm) : "");
        setWeightKg(caseData.weightKg ? String(caseData.weightKg) : "");
        setSmoker(caseData.smoker ?? "");
        setDiabetes(caseData.diabetes ?? null);
        setWoundInfectionRisk(caseData.woundInfectionRisk ?? "");
        setAnaestheticType(caseData.anaestheticType ?? "");
        setAntibioticProphylaxis(caseData.prophylaxis?.antibiotics ?? false);
        setDvtProphylaxis(caseData.prophylaxis?.dvtPrevention ?? false);
        setUnplannedICU(caseData.unplannedICU ?? "no");
        setReturnToTheatre(caseData.returnToTheatre ?? false);
        setReturnToTheatreReason(caseData.returnToTheatreReason ?? "");
        setOutcome(caseData.outcome ?? "");
        setMortalityClassification(caseData.mortalityClassification ?? "");
        setDiscussedAtMDM(caseData.discussedAtMDM ?? false);
        setSelectedComorbidities(caseData.comorbidities ?? []);
        setOperativeMedia(caseData.operativeMedia ?? []);
        setInfectionOverlay(caseData.infectionOverlay ?? undefined);

        if (caseData.clinicalDetails) {
          setClinicalDetails(caseData.clinicalDetails as Record<string, any>);
          const details = caseData.clinicalDetails as FreeFlapDetails;
          if (details.recipientSiteRegion) {
            setRecipientSiteRegion(details.recipientSiteRegion);
          }
          if (details.anastomoses && details.anastomoses.length > 0) {
            setAnastomoses(details.anastomoses);
          }
        } else {
          setClinicalDetails(getDefaultClinicalDetails(specialty));
          setRecipientSiteRegion(undefined);
          setAnastomoses([]);
        }

        const userMember = caseData.teamMembers?.find(m => m.name === "You");
        if (userMember?.role) setRole(userMember.role as Role);
      } catch (error) {
        console.error("Error loading case for edit:", error);
      }
    };

    loadExistingCase();
  }, [isEditMode, caseId]);


  useEffect(() => {
    if (!draftLoadedRef.current || savedRef.current || isEditMode) return;

    const draft: CaseDraft = {
      id: "draft",
      patientIdentifier,
      procedureDate,
      facility,
      specialty,
      procedureType,
      diagnosisGroups,
      surgeryTiming: surgeryStartTime || surgeryEndTime
        ? { startTime: surgeryStartTime || undefined, endTime: surgeryEndTime || undefined }
        : undefined,
      operatingTeam,
      gender: gender || undefined,
      ethnicity: ethnicity.trim() || undefined,
      admissionDate: admissionDate || undefined,
      dischargeDate: dischargeDate || undefined,
      admissionUrgency: admissionUrgency || undefined,
      stayType: stayType || undefined,
      injuryDate: showInjuryDate && injuryDate ? injuryDate : undefined,
      unplannedReadmission: unplannedReadmission !== "no" ? unplannedReadmission : "no",
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
      if (!savedRef.current) {
        saveCaseDraft(specialty, draft);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [
    admissionUrgency,
    stayType,
    injuryDate,
    showInjuryDate,
    admissionDate,
    anaestheticType,
    anastomoses,
    antibioticProphylaxis,
    asaScore,
    calculatedBmi,
    clinicalDetails,
    diagnosisGroups,
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

  const handleDiagnosisGroupChange = useCallback((index: number, updated: DiagnosisGroup) => {
    setDiagnosisGroups(prev => prev.map((g, i) => i === index ? updated : g));
  }, []);

  const handleDeleteDiagnosisGroup = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDiagnosisGroups(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((g, i) => ({ ...g, sequenceOrder: i + 1 }));
    });
  }, []);

  const addDiagnosisGroup = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDiagnosisGroups(prev => [
      ...prev,
      {
        id: uuidv4(),
        sequenceOrder: prev.length + 1,
        specialty,
        procedures: [{
          id: uuidv4(),
          sequenceOrder: 1,
          procedureName: "",
          specialty,
          surgeonRole: "PS" as Role,
        }],
      },
    ]);
  }, [specialty]);

  const handleSaveRef = useRef<() => Promise<void>>(async () => {});

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

      const casePayload: Case = {
        id: isEditMode && existingCase ? existingCase.id : uuidv4(),
        patientIdentifier: patientIdentifier.trim(),
        procedureDate,
        facility: facility.trim(),
        specialty,
        procedureType,
        procedureCode,
        diagnosisGroups,
        surgeryTiming,
        operatingTeam: operatingTeam.length > 0 ? operatingTeam : undefined,
        
        // Patient Demographics
        gender: gender || undefined,
        ethnicity: ethnicity.trim() || undefined,
        
        // Admission Details
        admissionDate: admissionDate || undefined,
        dischargeDate: dischargeDate || undefined,
        admissionUrgency: admissionUrgency || undefined,
        stayType: stayType || undefined,
        injuryDate: showInjuryDate && injuryDate ? injuryDate : undefined,
        unplannedReadmission: unplannedReadmission !== "no" ? unplannedReadmission : undefined,
        
        // Co-morbidities
        comorbidities: selectedComorbidities.length > 0 ? selectedComorbidities : undefined,
        
        // Operative Media
        operativeMedia: operativeMedia.length > 0 ? operativeMedia : undefined,
        
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
        
        // Infection Overlay
        infectionOverlay: infectionOverlay || undefined,
        
        // Case Status (active if no discharge date)
        caseStatus: dischargeDate ? "discharged" : "active",
        
        clinicalDetails: {
          ...clinicalDetails,
          ...(recipientSiteRegion ? { recipientSiteRegion } : {}),
          ...(anastomoses.length > 0 ? { anastomoses } : {}),
        },
        teamMembers: isEditMode && existingCase?.teamMembers 
          ? existingCase.teamMembers 
          : [
              {
                id: uuidv4(),
                userId,
                name: "You",
                role,
                confirmed: true,
                addedAt: new Date().toISOString(),
              },
            ],
        ownerId: isEditMode && existingCase ? existingCase.ownerId : userId,
        createdAt: isEditMode && existingCase ? existingCase.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEditMode && existingCase) {
        await updateCase(existingCase.id, casePayload);
      } else {
        await saveCase(casePayload);
        savedRef.current = true;
        await clearCaseDraft(specialty);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving case:", error);
      Alert.alert("Error", "Failed to save case. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  handleSaveRef.current = handleSave;

  useEffect(() => {
    navigation.setOptions({
      headerTitle: isEditMode ? "Edit Case" : `${SPECIALTY_LABELS[specialty]} Case`,
      headerRight: () => (
        <HeaderButton
          onPress={() => handleSaveRef.current()}
          disabled={saving}
          tintColor={theme.link}
        >
          <ThemedText style={{ color: theme.link, fontWeight: "600" }}>
            {saving ? "Saving..." : "Save"}
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [saving, isEditMode, specialty]);

  const procedureOptions = (PROCEDURE_TYPES[specialty] || []).map((p) => ({
    value: p,
    label: p,
  }));

  const durationMinutes = calculateDuration(surgeryStartTime, surgeryEndTime);
  const durationDisplay = durationMinutes !== undefined
    ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
    : null;

  const handleScroll = useCallback((event: any) => {
    scrollPositionRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  return (
    <KeyboardAwareScrollViewCompat
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing["3xl"],
        },
      ]}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <SectionHeader title="Patient Information" />

      <FormField
        label="Patient Identifier"
        value={patientIdentifier}
        onChangeText={(text) => setPatientIdentifier(text.toUpperCase())}
        placeholder="e.g., MRN or initials"
        required
        autoCapitalize="characters"
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

      {diagnosisGroups.map((group, idx) => (
        <DiagnosisGroupEditor
          key={group.id}
          group={group}
          index={idx}
          isOnly={diagnosisGroups.length === 1}
          onChange={(updated) => handleDiagnosisGroupChange(idx, updated)}
          onDelete={() => handleDeleteDiagnosisGroup(idx)}
        />
      ))}

      <Pressable
        style={[styles.addGroupButton, { borderColor: theme.link, backgroundColor: theme.backgroundSecondary }]}
        onPress={addDiagnosisGroup}
      >
        <Feather name="plus-circle" size={18} color={theme.link} />
        <ThemedText style={[styles.addGroupButtonText, { color: theme.link }]}>
          Add Diagnosis Group
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
          <FormField
            label="Age (years)"
            value={age}
            onChangeText={setAge}
            placeholder="e.g. 51"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.row}>
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

      <View style={styles.row}>
        <View style={styles.halfField}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Urgency</ThemedText>
          <View style={[styles.segmentedControl, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}>
            {(Object.entries(ADMISSION_URGENCY_LABELS) as [AdmissionUrgency, string][]).map(([value, label]) => {
              const isSelected = admissionUrgency === value;
              return (
                <Pressable
                  key={value}
                  testID={`toggle-urgency-${value}`}
                  style={[
                    styles.segmentedButton,
                    isSelected ? { backgroundColor: theme.link } : undefined,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAdmissionUrgency(value);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.segmentedButtonText,
                      { color: isSelected ? "#FFFFFF" : theme.textSecondary },
                    ]}
                  >
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.halfField}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Stay Type</ThemedText>
          <View style={[styles.segmentedControl, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}>
            {(Object.entries(STAY_TYPE_LABELS) as [StayType, string][]).map(([value, label]) => {
              const isSelected = stayType === value;
              return (
                <Pressable
                  key={value}
                  testID={`toggle-stay-${value}`}
                  style={[
                    styles.segmentedButton,
                    isSelected ? { backgroundColor: theme.link } : undefined,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStayType(value);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.segmentedButtonText,
                      { color: isSelected ? "#FFFFFF" : theme.textSecondary },
                    ]}
                  >
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <DatePickerField
            label="Admission Date"
            value={admissionDate}
            onChange={setAdmissionDate}
            disabled={stayType === "day_case"}
          />
        </View>
        <View style={styles.halfField}>
          <DatePickerField
            label="Discharge Date"
            value={dischargeDate}
            onChange={setDischargeDate}
            disabled={stayType === "day_case"}
            clearable
          />
        </View>
      </View>

      {showInjuryDate ? (
        <View style={styles.row}>
          <View style={styles.halfField}>
            <DatePickerField
              label="Day of Injury"
              value={injuryDate}
              onChange={setInjuryDate}
              placeholder="Select date..."
            />
          </View>
        </View>
      ) : null}

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
          <TimeField
            label="Start Time"
            value={surgeryStartTime}
            onChangeText={setSurgeryStartTime}
            placeholder="e.g., 0830"
          />
        </View>
        <View style={styles.halfField}>
          <TimeField
            label="End Time"
            value={surgeryEndTime}
            onChangeText={setSurgeryEndTime}
            placeholder="e.g., 1415"
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

      <SectionHeader title="Operative Media" subtitle="Photos, X-rays, and imaging" />
      <OperativeMediaSection
        media={operativeMedia}
        onMediaChange={setOperativeMedia}
        maxItems={20}
      />

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

      <SectionHeader title="Infection Documentation" subtitle="Add if this case involves infection" />
      <InfectionOverlayForm
        value={infectionOverlay}
        onChange={setInfectionOverlay}
        collapsed={infectionCollapsed}
        onToggleCollapse={() => setInfectionCollapsed(!infectionCollapsed)}
      />

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
  addGroupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: Spacing.xl,
  },
  addGroupButtonText: {
    fontSize: 15,
    fontWeight: "600",
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
  stagingContainer: {
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  stagingTitle: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: Spacing.md,
  },
  fractureCheckboxContainer: {
    marginBottom: Spacing.md,
  },
  fractureCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  fractureCheckboxLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  fractureSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    alignItems: "center",
  },
  fractureSummaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  fractureSummaryText: {
    fontSize: 13,
    fontWeight: "500",
  },
  aoCodeChip: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  aoCodeChipText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  editFracturesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  editFracturesText: {
    fontSize: 12,
    fontWeight: "500",
  },
  suggestionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  suggestionText: {
    fontSize: 13,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentedButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
