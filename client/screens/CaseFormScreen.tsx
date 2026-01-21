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
  AdmissionUrgency,
  StayType,
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
  PROCEDURE_CATEGORY_OPTIONS,
} from "@/types/case";
import { FormField, SelectField, PickerField, DatePickerField } from "@/components/FormField";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/Button";
import { saveCase, getCase, updateCase, getCaseDraft, saveCaseDraft, clearCaseDraft, CaseDraft } from "@/lib/storage";
import { getConfigForSpecialty, getDefaultClinicalDetails } from "@/lib/procedureConfig";
import { findSnomedProcedure, getProcedureCodeForCountry, getCountryCodeFromProfile } from "@/lib/snomedCt";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { RecipientSiteSelector } from "@/components/RecipientSiteSelector";
import { AnastomosisEntryCard } from "@/components/AnastomosisEntryCard";
import { ProcedureEntryCard } from "@/components/ProcedureEntryCard";
import { SnomedSearchPicker } from "@/components/SnomedSearchPicker";
import { useAuth } from "@/contexts/AuthContext";
import { getDiagnosisStaging, DiagnosisStagingConfig, searchSnomedDiagnoses, searchSnomedProcedures, SnomedSearchResult } from "@/lib/snomedApi";
import { DiagnosisClinicalFields } from "@/components/DiagnosisClinicalFields";
import { DocumentTypeBadge } from "@/components/AutoFilledField";
import { FractureEntry, DiagnosisClinicalDetails } from "@/types/case";
import { FractureClassificationWizard } from "@/components/FractureClassificationWizard";
import { getAoToSnomedSuggestion } from "@/data/aoToSnomedMapping";

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
  const editModeLoadedRef = useRef(false);

  const { specialty: routeSpecialty, extractedData, caseId } = route.params;
  const isEditMode = !!caseId;
  const [existingCase, setExistingCase] = useState<Case | null>(null);
  const specialty = routeSpecialty || existingCase?.specialty || "general";
  
  const documentType = (extractedData as any)?._documentType;
  const confidence = (extractedData as any)?._confidence;
  const detectedTriggers = (extractedData as any)?._detectedTriggers;
  const autoFilledFields: string[] = (extractedData as any)?._autoFilledFields || [];
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
        PROCEDURE_TYPES[specialty]?.[0] || "",
      specialty: specialty,
      surgeonRole: "PS",
    },
  ]), [extractedData, specialty]);

  // Multi-procedure support
  const [procedures, setProcedures] = useState<CaseProcedure[]>(buildDefaultProcedures);

  // RACS MALT Patient Demographics
  const [gender, setGender] = useState<Gender | "">("");
  const [age, setAge] = useState<string>("");
  const [ethnicity, setEthnicity] = useState("");
  
  // Procedure Category (high-level classification)
  const [procedureCategory, setProcedureCategory] = useState<string>("");

  // RACS MALT Admission Details
  const [admissionDate, setAdmissionDate] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");
  const [admissionUrgency, setAdmissionUrgency] = useState<AdmissionUrgency | "">("");
  const [stayType, setStayType] = useState<StayType | "">("");
  const [unplannedReadmission, setUnplannedReadmission] = useState<UnplannedReadmissionReason>("no");

  // RACS MALT Primary Diagnosis (SNOMED CT coded)
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState<{ conceptId: string; term: string } | null>(null);
  const [diagnosisStaging, setDiagnosisStaging] = useState<DiagnosisStagingConfig | null>(null);
  const [stagingValues, setStagingValues] = useState<Record<string, string>>({});
  const [fractures, setFractures] = useState<FractureEntry[]>([]);
  const [diagnosisClinicalDetails, setDiagnosisClinicalDetails] = useState<DiagnosisClinicalDetails>({});
  const [isFractureCase, setIsFractureCase] = useState(false);
  const [showFractureWizardFromCheckbox, setShowFractureWizardFromCheckbox] = useState(false);
  const [snomedSuggestion, setSnomedSuggestion] = useState<{ searchTerm: string; displayName: string } | null>(null);
  
  // Legacy diagnosis field for backwards compatibility
  const [diagnosis, setDiagnosis] = useState("");
  
  // Check if diagnosis contains fracture
  const isFractureDiagnosis = useMemo(() => {
    const diagnosisTerm = primaryDiagnosis?.term?.toLowerCase() || diagnosis.toLowerCase();
    return diagnosisTerm.includes("fracture");
  }, [primaryDiagnosis, diagnosis]);

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
    if (stayType === "day_case" && procedureDate) {
      setAdmissionDate(procedureDate);
      setDischargeDate(procedureDate);
    }
  }, [stayType, procedureDate]);

  // Fetch staging configuration when diagnosis changes
  useEffect(() => {
    const fetchStaging = async () => {
      if (primaryDiagnosis) {
        const staging = await getDiagnosisStaging(primaryDiagnosis.conceptId, primaryDiagnosis.term);
        setDiagnosisStaging(staging);
        // Reset staging values when diagnosis changes
        setStagingValues({});
      } else {
        setDiagnosisStaging(null);
        setStagingValues({});
      }
    };
    fetchStaging();
  }, [primaryDiagnosis]);

  // Populate ALL form fields from extractedData (Smart Capture)
  useEffect(() => {
    if (!extractedData) return;
    
    const data = extractedData as any;
    console.log("Populating form from extracted data:", Object.keys(data).filter(k => data[k] !== null));
    
    // Patient Identifier (extracted before redaction)
    if (data.patientIdentifier) setPatientIdentifier(data.patientIdentifier);
    
    // Procedure Date (extracted before redaction)
    if (data.procedureDate) setProcedureDate(data.procedureDate);
    
    // Patient Demographics
    if (data.gender) setGender(data.gender);
    if (data.age) setAge(String(data.age));
    
    // Procedure Category
    if (data.procedureCategory) setProcedureCategory(data.procedureCategory);
    
    // Admission Details
    if (data.admissionUrgency) setAdmissionUrgency(data.admissionUrgency);
    if (data.stayType) setStayType(data.stayType);
    
    // ASA Score
    if (data.asaScore) setAsaScore(String(data.asaScore));
    
    // Surgery Timing
    if (data.surgeryStartTime) setSurgeryStartTime(data.surgeryStartTime);
    if (data.surgeryEndTime) setSurgeryEndTime(data.surgeryEndTime);
    
    // Operating Team - include ALL team members, use "unassigned" for those without roles
    if (data.operatingTeam && Array.isArray(data.operatingTeam)) {
      const team: OperatingTeamMember[] = data.operatingTeam.map((member: any) => ({
        id: uuidv4(),
        name: member.name,
        role: member.role || "unassigned",
      }));
      setOperatingTeam(team);
    }
    
    // Diagnoses - auto-search SNOMED for best match
    const diagnosisText = data.finalDiagnosis || data.preManagementDiagnosis;
    const detectedSpecialty = data.detectedSpecialty || specialty;
    if (diagnosisText) {
      setDiagnosis(diagnosisText);
      // Auto-search SNOMED for diagnosis
      searchSnomedDiagnoses(diagnosisText, detectedSpecialty, 5)
        .then(results => {
          if (results.length > 0) {
            const bestMatch = results[0];
            setPrimaryDiagnosis({ conceptId: bestMatch.conceptId, term: bestMatch.term });
          }
        })
        .catch(err => console.warn("Auto-SNOMED diagnosis search failed:", err));
    }
    
    // Comorbidities - match to SNOMED coded items
    if (data.comorbidities && Array.isArray(data.comorbidities)) {
      const matchedComorbidities: SnomedCodedItem[] = [];
      for (const comorb of data.comorbidities) {
        const match = COMMON_COMORBIDITIES.find(cc => 
          cc.displayName.toLowerCase().includes(comorb.toLowerCase()) ||
          comorb.toLowerCase().includes(cc.displayName.toLowerCase())
        );
        if (match) {
          matchedComorbidities.push(match);
        }
      }
      if (matchedComorbidities.length > 0) {
        setSelectedComorbidities(matchedComorbidities);
      }
    }
    
    // Operative Factors
    if (data.anaestheticType) setAnaestheticType(data.anaestheticType);
    if (data.woundInfectionRisk) setWoundInfectionRisk(data.woundInfectionRisk);
    if (typeof data.antibioticProphylaxis === "boolean") setAntibioticProphylaxis(data.antibioticProphylaxis);
    if (typeof data.dvtProphylaxis === "boolean") setDvtProphylaxis(data.dvtProphylaxis);
    
    // Outcomes
    if (typeof data.returnToTheatre === "boolean") setReturnToTheatre(data.returnToTheatre);
    if (data.returnToTheatreReason) setReturnToTheatreReason(data.returnToTheatreReason);
    if (data.unplannedICU === true) setUnplannedICU(data.unplannedICUReason || "other");
    
    // Clinical Details (specialty-specific)
    if (data.clinicalDetails) {
      setClinicalDetails(prev => ({ ...prev, ...data.clinicalDetails }));
      
      // Free flap specific
      if (data.clinicalDetails.recipientSiteRegion) {
        setRecipientSiteRegion(data.clinicalDetails.recipientSiteRegion);
      }
      if (data.clinicalDetails.anastomoses) {
        setAnastomoses(data.clinicalDetails.anastomoses);
      }
    }
    
    // Also check for top-level flap details (older format)
    if (data.recipientSiteRegion) setRecipientSiteRegion(data.recipientSiteRegion);
    if (data.anastomoses && Array.isArray(data.anastomoses)) setAnastomoses(data.anastomoses);
    
    // Procedures - extract and auto-search SNOMED for each
    if (data.procedures && Array.isArray(data.procedures) && data.procedures.length > 0) {
      const extractedProcedures: CaseProcedure[] = data.procedures.map((proc: any, index: number) => ({
        id: uuidv4(),
        sequenceOrder: index + 1,
        procedureName: proc.procedureName || "",
        specialty: detectedSpecialty || specialty,
        surgeonRole: "PS",
        laterality: proc.laterality,
        procedureTags: proc.procedureTags || [],
        notes: proc.notes,
      }));
      setProcedures(extractedProcedures);
      
      // Also set the primary procedure type
      if (extractedProcedures[0]?.procedureName) {
        setProcedureType(extractedProcedures[0].procedureName);
      }
      
      // Auto-search SNOMED for each procedure (runs in parallel)
      extractedProcedures.forEach((proc, index) => {
        if (proc.procedureName) {
          searchSnomedProcedures(proc.procedureName, detectedSpecialty || specialty, 3)
            .then(results => {
              if (results.length > 0) {
                const bestMatch = results[0];
                setProcedures(prev => prev.map((p, i) => 
                  i === index 
                    ? { ...p, snomedCode: bestMatch.conceptId, snomedTerm: bestMatch.term }
                    : p
                ));
              }
            })
            .catch(err => console.warn("Auto-SNOMED procedure search failed:", err));
        }
      });
    }
    
    draftLoadedRef.current = true;
  }, [extractedData, specialty]);

  useEffect(() => {
    const loadDraft = async () => {
      if (extractedData) {
        // Already handled by the extractedData effect above
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
      setProcedures(draft.procedures ?? buildDefaultProcedures());
      setGender(draft.gender ?? "");
      setEthnicity(draft.ethnicity ?? "");
      setAdmissionDate(draft.admissionDate ?? "");
      setDischargeDate(draft.dischargeDate ?? "");
      setAdmissionUrgency(draft.admissionUrgency ?? "");
      setStayType(draft.stayType ?? "");
      setUnplannedReadmission(draft.unplannedReadmission ?? "no");
      setIsUnplannedReadmission((draft.unplannedReadmission ?? "no") !== "no");
      setDiagnosis(draft.finalDiagnosis?.displayName ?? "");
      if (draft.finalDiagnosis?.snomedCtCode) {
        setPrimaryDiagnosis({
          conceptId: draft.finalDiagnosis.snomedCtCode,
          term: draft.finalDiagnosis.displayName,
        });
      }
      setDiagnosisClinicalDetails(draft.finalDiagnosis?.clinicalDetails ?? {});
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
        if (caseData.procedures) setProcedures(caseData.procedures);
        if (caseData.surgeryTiming?.startTime) setSurgeryStartTime(caseData.surgeryTiming.startTime);
        if (caseData.surgeryTiming?.endTime) setSurgeryEndTime(caseData.surgeryTiming.endTime);
        if (caseData.operatingTeam) setOperatingTeam(caseData.operatingTeam);
        if (caseData.gender) setGender(caseData.gender);
        if (caseData.ethnicity) setEthnicity(caseData.ethnicity);
        if (caseData.admissionDate) setAdmissionDate(caseData.admissionDate);
        if (caseData.dischargeDate) setDischargeDate(caseData.dischargeDate);
        if (caseData.admissionUrgency) setAdmissionUrgency(caseData.admissionUrgency);
        if (caseData.stayType) setStayType(caseData.stayType);
        if (caseData.unplannedReadmission) setUnplannedReadmission(caseData.unplannedReadmission);
        if (caseData.asaScore) setAsaScore(String(caseData.asaScore));
        if (caseData.heightCm) setHeightCm(String(caseData.heightCm));
        if (caseData.weightKg) setWeightKg(String(caseData.weightKg));
        if (caseData.smoker) setSmoker(caseData.smoker);
        if (caseData.diabetes !== undefined) setDiabetes(caseData.diabetes);
        if (caseData.woundInfectionRisk) setWoundInfectionRisk(caseData.woundInfectionRisk);
        if (caseData.anaestheticType) setAnaestheticType(caseData.anaestheticType);
        if (caseData.prophylaxis?.antibiotics) setAntibioticProphylaxis(caseData.prophylaxis.antibiotics);
        if (caseData.prophylaxis?.dvtPrevention) setDvtProphylaxis(caseData.prophylaxis.dvtPrevention);
        if (caseData.unplannedICU) setUnplannedICU(caseData.unplannedICU);
        if (caseData.returnToTheatre) setReturnToTheatre(caseData.returnToTheatre);
        if (caseData.returnToTheatreReason) setReturnToTheatreReason(caseData.returnToTheatreReason);
        if (caseData.outcome) setOutcome(caseData.outcome);
        if (caseData.mortalityClassification) setMortalityClassification(caseData.mortalityClassification);
        if (caseData.discussedAtMDM) setDiscussedAtMDM(caseData.discussedAtMDM);
        if (caseData.comorbidities) setSelectedComorbidities(caseData.comorbidities);
        if (caseData.fractures) setFractures(caseData.fractures);
        
        // Load diagnosis
        if (caseData.preManagementDiagnosis || caseData.finalDiagnosis) {
          const diag = caseData.preManagementDiagnosis || caseData.finalDiagnosis;
          if (diag?.snomedCtCode) {
            setPrimaryDiagnosis({ conceptId: diag.snomedCtCode, term: diag.displayName });
          } else if (diag?.displayName) {
            setDiagnosis(diag.displayName);
          }
          if (diag?.clinicalDetails) {
            setDiagnosisClinicalDetails(diag.clinicalDetails);
          }
        }

        // Load team member role
        const userMember = caseData.teamMembers?.find(m => m.name === "You");
        if (userMember?.role) setRole(userMember.role);
      } catch (error) {
        console.error("Error loading case for edit:", error);
      }
    };

    loadExistingCase();
  }, [isEditMode, caseId]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: isEditMode ? "Edit Case" : `${SPECIALTY_LABELS[specialty]} Case`,
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
  }, [saving, patientIdentifier, facility, clinicalDetails, isEditMode, specialty]);

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
      admissionUrgency: admissionUrgency || undefined,
      stayType: stayType || undefined,
      unplannedReadmission: unplannedReadmission !== "no" ? unplannedReadmission : "no",
      finalDiagnosis: primaryDiagnosis 
        ? { 
            snomedCtCode: primaryDiagnosis.conceptId,
            displayName: primaryDiagnosis.term,
            clinicalDetails: diagnosisClinicalDetails,
          } 
        : (diagnosis.trim() ? { displayName: diagnosis.trim() } : undefined),
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
    admissionUrgency,
    stayType,
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

  const handleFractureCheckboxToggle = (checked: boolean) => {
    setIsFractureCase(checked);
    if (checked) {
      setShowFractureWizardFromCheckbox(true);
    } else {
      setFractures([]);
      setSnomedSuggestion(null);
    }
  };

  const handleFractureWizardSave = async (newFractures: FractureEntry[]) => {
    setFractures(newFractures);
    setShowFractureWizardFromCheckbox(false);
    
    if (newFractures.length > 0) {
      const firstFracture = newFractures[0];
      const suggestion = getAoToSnomedSuggestion(firstFracture.aoCode);
      setSnomedSuggestion(suggestion);
      
      try {
        const results = await searchSnomedDiagnoses(suggestion.searchTerm, specialty);
        if (results.length > 0) {
          setPrimaryDiagnosis({
            conceptId: results[0].conceptId,
            term: results[0].term
          });
        }
      } catch (error) {
        console.log("SNOMED lookup failed, using suggestion:", suggestion.displayName);
      }
    }
  };

  const handleFractureWizardClose = () => {
    setShowFractureWizardFromCheckbox(false);
    if (fractures.length === 0) {
      setIsFractureCase(false);
    }
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

      const casePayload: Case = {
        id: isEditMode && existingCase ? existingCase.id : uuidv4(),
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
        admissionUrgency: admissionUrgency || undefined,
        stayType: stayType || undefined,
        unplannedReadmission: unplannedReadmission !== "no" ? unplannedReadmission : undefined,
        
        // Diagnosis (single SNOMED diagnosis) - also set as preManagementDiagnosis for case title
        preManagementDiagnosis: primaryDiagnosis 
          ? { 
              snomedCtCode: primaryDiagnosis.conceptId,
              displayName: primaryDiagnosis.term,
              clinicalDetails: diagnosisClinicalDetails,
            } 
          : (diagnosis.trim() ? { displayName: diagnosis.trim() } : undefined),
        finalDiagnosis: primaryDiagnosis 
          ? { 
              snomedCtCode: primaryDiagnosis.conceptId,
              displayName: primaryDiagnosis.term,
              clinicalDetails: diagnosisClinicalDetails,
            } 
          : (diagnosis.trim() ? { displayName: diagnosis.trim() } : undefined),
        
        // Co-morbidities
        comorbidities: selectedComorbidities.length > 0 ? selectedComorbidities : undefined,
        
        // AO/OTA Fracture Classifications (for fracture diagnoses)
        fractures: fractures.length > 0 ? fractures : undefined,
        
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

  const procedureOptions = (PROCEDURE_TYPES[specialty] || []).map((p) => ({
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
      {documentType ? (
        <DocumentTypeBadge
          documentType={documentType}
          confidence={confidence}
          detectedTriggers={detectedTriggers}
        />
      ) : null}
      
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

      <SectionHeader title="Primary Diagnosis" subtitle="SNOMED CT coded diagnosis" />

      {specialty === "hand_surgery" ? (
        <View style={styles.fractureCheckboxContainer}>
          <Pressable
            style={styles.fractureCheckboxRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleFractureCheckboxToggle(!isFractureCase);
            }}
          >
            <View style={[
              styles.checkbox,
              { 
                borderColor: isFractureCase ? theme.link : theme.border,
                backgroundColor: isFractureCase ? theme.link : "transparent"
              }
            ]}>
              {isFractureCase ? (
                <Feather name="check" size={14} color="#FFF" />
              ) : null}
            </View>
            <ThemedText style={[styles.fractureCheckboxLabel, { color: theme.text }]}>
              Fracture Case
            </ThemedText>
          </Pressable>
          {isFractureCase && fractures.length > 0 ? (
            <View style={styles.fractureSummary}>
              {fractures.map((f) => (
                <View 
                  key={f.id} 
                  style={[styles.fractureSummaryChip, { backgroundColor: theme.backgroundTertiary }]}
                >
                  <ThemedText style={[styles.fractureSummaryText, { color: theme.text }]}>
                    {f.boneName}
                  </ThemedText>
                  <View style={[styles.aoCodeChip, { backgroundColor: theme.link }]}>
                    <ThemedText style={styles.aoCodeChipText}>{f.aoCode}</ThemedText>
                  </View>
                </View>
              ))}
              <Pressable
                style={[styles.editFracturesButton, { borderColor: theme.link }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowFractureWizardFromCheckbox(true);
                }}
              >
                <Feather name="edit-2" size={14} color={theme.link} />
                <ThemedText style={[styles.editFracturesText, { color: theme.link }]}>
                  Edit
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
          {isFractureCase && snomedSuggestion && primaryDiagnosis ? (
            <View style={[styles.suggestionBanner, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="zap" size={16} color={theme.link} />
              <ThemedText style={[styles.suggestionText, { color: theme.textSecondary }]}>
                Auto-suggested from AO code
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}

      <SnomedSearchPicker
        label="Search Diagnosis"
        value={primaryDiagnosis || undefined}
        onSelect={setPrimaryDiagnosis}
        searchType="diagnosis"
        specialty={specialty}
        placeholder="Search for diagnosis (e.g., fracture, Dupuytren)..."
      />

      {diagnosisStaging && diagnosisStaging.stagingSystems.length > 0 ? (
        <View style={styles.stagingContainer}>
          <ThemedText style={[styles.stagingTitle, { color: theme.textSecondary }]}>
            Classification / Staging
          </ThemedText>
          {diagnosisStaging.stagingSystems.map((system) => (
            <PickerField
              key={system.name}
              label={system.name}
              value={stagingValues[system.name] || ""}
              options={system.options.map((opt) => ({
                value: opt.value,
                label: opt.description ? `${opt.label} - ${opt.description}` : opt.label,
              }))}
              onSelect={(value) => 
                setStagingValues((prev) => ({ ...prev, [system.name]: value }))
              }
              placeholder={`Select ${system.name.toLowerCase()}...`}
            />
          ))}
        </View>
      ) : null}

      {primaryDiagnosis ? (
        <DiagnosisClinicalFields
          diagnosis={{
            snomedCtCode: primaryDiagnosis.conceptId,
            displayName: primaryDiagnosis.term,
            clinicalDetails: diagnosisClinicalDetails,
          }}
          onDiagnosisChange={(updatedDiagnosis) => {
            setDiagnosisClinicalDetails(updatedDiagnosis.clinicalDetails || {});
          }}
          specialty={specialty}
          fractures={fractures}
          onFracturesChange={setFractures}
        />
      ) : null}

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
          <PickerField
            label="Urgency"
            value={admissionUrgency}
            options={Object.entries(ADMISSION_URGENCY_LABELS).map(([value, label]) => ({ value, label }))}
            onSelect={(v) => setAdmissionUrgency(v as AdmissionUrgency)}
          />
        </View>
        <View style={styles.halfField}>
          <PickerField
            label="Procedure Category"
            value={procedureCategory}
            options={PROCEDURE_CATEGORY_OPTIONS[specialty] || [{ value: "other", label: "Other" }]}
            onSelect={setProcedureCategory}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <PickerField
            label="Stay Type"
            value={stayType}
            options={Object.entries(STAY_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            onSelect={(v) => setStayType(v as StayType)}
          />
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

      <FractureClassificationWizard
        visible={showFractureWizardFromCheckbox}
        onClose={handleFractureWizardClose}
        onSave={handleFractureWizardSave}
        initialFractures={fractures}
      />
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
});
