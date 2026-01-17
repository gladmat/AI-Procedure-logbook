export type Role = "primary" | "supervising" | "assistant" | "trainee";

export type OperatingTeamRole = 
  | "scrub_nurse" 
  | "circulating_nurse" 
  | "anaesthetist" 
  | "anaesthetic_registrar"
  | "surgical_assistant"
  | "surgical_registrar"
  | "medical_student";

export type Specialty = "free_flap" | "hand_trauma" | "body_contouring" | "aesthetics" | "burns";

export type ASAScore = 1 | 2 | 3 | 4 | 5 | 6;

export type SmokingStatus = "yes" | "no" | "ex";

export type Gender = "male" | "female" | "other";

export type AdmissionCategory = 
  | "elective" 
  | "emergency" 
  | "day_case" 
  | "unplanned_readmission" 
  | "non_admitted";

export type UnplannedReadmissionReason = 
  | "no"
  | "pain"
  | "bleeding"
  | "electrolyte_imbalance"
  | "infection"
  | "pulmonary_embolism"
  | "intra_abdominal_collection"
  | "organ_failure"
  | "other";

export type WoundInfectionRisk = 
  | "clean" 
  | "clean_contaminated" 
  | "contaminated" 
  | "dirty" 
  | "na";

export type AnaestheticType = 
  | "general" 
  | "local" 
  | "regional_block" 
  | "spinal" 
  | "epidural" 
  | "sedation"
  | "sedation_local"
  | "walant";

export type UnplannedICUReason = 
  | "no"
  | "localised_sepsis"
  | "generalised_sepsis"
  | "pneumonia"
  | "renal_failure"
  | "arrhythmia"
  | "myocardial_infarction"
  | "pulmonary_embolism"
  | "other";

export type DischargeOutcome = 
  | "died"
  | "discharged_home"
  | "discharged_care"
  | "transferred_complex_care"
  | "absconded"
  | "referred_other_services";

export type MortalityClassification = 
  | "expected"
  | "unexpected"
  | "not_applicable";

export type Indication = "trauma" | "oncologic" | "congenital";

export type AnastomosisType = "end_to_end" | "end_to_side" | "side_to_side";

export type VesselType = "artery" | "vein";

export type CouplingMethod = "hand_sewn" | "coupler" | "hybrid";

export type AnatomicalRegion = 
  | "lower_leg" 
  | "foot" 
  | "thigh" 
  | "hand" 
  | "forearm" 
  | "upper_arm" 
  | "head_neck";

export type HarvestSide = "left" | "right";

export type ElevationPlane = "subfascial" | "suprafascial";

export type CountryCode = "CH" | "GB" | "PL" | "AU" | "NZ" | "US";

export interface TeamMember {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  role: Role;
  confirmed: boolean;
  addedAt: string;
}

export interface OperatingTeamMember {
  id: string;
  name: string;
  role: OperatingTeamRole;
  specialty?: string;
}

export interface SurgeryTiming {
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
}

export interface SnomedCodedItem {
  snomedCtCode: string;
  displayName: string;
  commonName?: string;
}

export interface Diagnosis {
  snomedCtCode?: string;
  displayName: string;
  date?: string;
}

export interface Prophylaxis {
  antibiotics: boolean;
  dvtPrevention: boolean;
  antibioticName?: string;
  dvtMethod?: string;
}

export interface SnomedRefItem {
  id: number;
  snomedCtCode: string;
  displayName: string;
  commonName?: string | null;
  category: string;
  subcategory?: string | null;
  anatomicalRegion?: string | null;
  specialty?: string | null;
}

export interface AnastomosisEntry {
  id: string;
  vesselType: VesselType;
  recipientVesselSnomedCode?: string;
  recipientVesselName: string;
  donorVesselSnomedCode?: string;
  donorVesselName?: string;
  couplingMethod?: CouplingMethod;
  couplerSizeMm?: number;
  configuration?: AnastomosisType;
  sutureType?: string;
  sutureSize?: string;
  patencyConfirmed?: boolean;
}

export interface FreeFlapDetails {
  harvestSide: HarvestSide;
  indication: Indication;
  flapSnomedCode?: string;
  flapDisplayName?: string;
  flapCommonName?: string;
  composition?: string;
  harvestTechnique?: string;
  recipientSite?: string;
  recipientSiteRegion?: AnatomicalRegion;
  ischemiaTimeMinutes?: number;
  flapWidthCm?: number;
  flapLengthCm?: number;
  perforatorCount?: 1 | 2 | 3;
  elevationPlane?: ElevationPlane;
  isFlowThrough?: boolean;
  anastomoses: AnastomosisEntry[];
  // Legacy fields for backward compatibility
  recipientArteryName?: string;
  recipientVeinName?: string;
  anastomosisType?: AnastomosisType;
  couplerSizeMm?: number;
}

export interface HandTraumaDetails {
  injuryMechanism?: string;
  nerveStatus?: string;
  tendonInjuries?: string;
}

export interface BodyContouringDetails {
  resectionWeightGrams?: number;
  drainOutputMl?: number;
}

export type ClinicalDetails = FreeFlapDetails | HandTraumaDetails | BodyContouringDetails | Record<string, unknown>;

export interface ProcedureCode {
  snomedCtCode: string;
  snomedCtDisplay: string;
  localCode?: string;
  localDisplay?: string;
  localSystem?: string;
}

export interface Case {
  id: string;
  patientIdentifier: string;
  procedureDate: string;
  facility: string;
  specialty: Specialty;
  procedureType: string;
  procedureCode?: ProcedureCode;
  surgeryTiming?: SurgeryTiming;
  operatingTeam?: OperatingTeamMember[];
  
  // Patient Demographics
  gender?: Gender;
  ethnicity?: string;
  
  // Admission Details
  admissionDate?: string;
  dischargeDate?: string;
  admissionCategory?: AdmissionCategory;
  unplannedReadmission?: UnplannedReadmissionReason;
  
  // Diagnoses (SNOMED CT coded)
  diagnosisDate?: string;
  preManagementDiagnosis?: Diagnosis;
  finalDiagnosis?: Diagnosis;
  pathologicalDiagnosis?: Diagnosis;
  
  // Co-morbidities (SNOMED CT coded)
  comorbidities?: SnomedCodedItem[];
  
  // Risk Factors
  asaScore?: ASAScore;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  smoker?: SmokingStatus;
  diabetes?: boolean;
  
  // Operative Factors
  woundInfectionRisk?: WoundInfectionRisk;
  anaestheticType?: AnaestheticType;
  prophylaxis?: Prophylaxis;
  
  // Outcomes
  unplannedICU?: UnplannedICUReason;
  returnToTheatre?: boolean;
  returnToTheatreReason?: string;
  outcome?: DischargeOutcome;
  mortalityClassification?: MortalityClassification;
  recurrenceDate?: string;
  discussedAtMDM?: boolean;
  
  clinicalDetails: ClinicalDetails;
  teamMembers: TeamMember[];
  ownerId: string;
  encryptionKeyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  eventType: string;
  note: string;
  authorId?: string;
  createdAt: string;
}

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  free_flap: "Free Flap",
  hand_trauma: "Hand Trauma",
  body_contouring: "Body Contouring",
  aesthetics: "Aesthetics",
  burns: "Burns",
};

export const ROLE_LABELS: Record<Role, string> = {
  primary: "Primary Surgeon",
  supervising: "Supervising",
  assistant: "Assistant",
  trainee: "Trainee",
};

export const OPERATING_TEAM_ROLE_LABELS: Record<OperatingTeamRole, string> = {
  scrub_nurse: "Scrub Nurse",
  circulating_nurse: "Circulating Nurse",
  anaesthetist: "Anaesthetist",
  anaesthetic_registrar: "Anaesthetic Registrar",
  surgical_assistant: "Surgical Assistant",
  surgical_registrar: "Surgical Registrar",
  medical_student: "Medical Student",
};

export const INDICATION_LABELS: Record<Indication, string> = {
  trauma: "Trauma",
  oncologic: "Oncologic",
  congenital: "Congenital",
};

export const ANASTOMOSIS_LABELS: Record<AnastomosisType, string> = {
  end_to_end: "End-to-End",
  end_to_side: "End-to-Side",
  side_to_side: "Side-to-Side",
};

export const VESSEL_TYPE_LABELS: Record<VesselType, string> = {
  artery: "Artery",
  vein: "Vein",
};

export const COUPLING_METHOD_LABELS: Record<CouplingMethod, string> = {
  hand_sewn: "Hand-sewn",
  coupler: "Mechanical Coupler",
  hybrid: "Hybrid",
};

export const ANATOMICAL_REGION_LABELS: Record<AnatomicalRegion, string> = {
  lower_leg: "Lower Leg",
  foot: "Foot",
  thigh: "Thigh",
  hand: "Hand",
  forearm: "Forearm",
  upper_arm: "Upper Arm",
  head_neck: "Head & Neck",
};

export const COUNTRY_LABELS: Record<CountryCode, string> = {
  CH: "Switzerland",
  GB: "United Kingdom",
  PL: "Poland",
  AU: "Australia",
  NZ: "New Zealand",
  US: "United States",
};

export const PROCEDURE_TYPES: Record<Specialty, string[]> = {
  free_flap: [
    "ALT Flap",
    "DIEP Flap",
    "Radial Forearm Flap",
    "Fibula Flap",
    "Latissimus Dorsi Flap",
    "Gracilis Flap",
    "SCIP Flap",
    "Anterolateral Thigh Flap",
    "Other Free Flap",
  ],
  hand_trauma: [
    "Tendon Repair",
    "Nerve Repair",
    "Replantation",
    "Revascularization",
    "Fracture Fixation",
    "Soft Tissue Coverage",
  ],
  body_contouring: [
    "Abdominoplasty",
    "Brachioplasty",
    "Thigh Lift",
    "Belt Lipectomy",
    "Liposuction",
  ],
  aesthetics: [
    "Rhinoplasty",
    "Blepharoplasty",
    "Facelift",
    "Breast Augmentation",
    "Breast Reduction",
  ],
  burns: [
    "Skin Grafting",
    "Escharotomy",
    "Debridement",
    "Reconstruction",
  ],
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const ADMISSION_CATEGORY_LABELS: Record<AdmissionCategory, string> = {
  elective: "Elective",
  emergency: "Emergency",
  day_case: "Day Case",
  unplanned_readmission: "Unplanned Readmission < 28 Days",
  non_admitted: "Non-Admitted",
};

export const UNPLANNED_READMISSION_LABELS: Record<UnplannedReadmissionReason, string> = {
  no: "No",
  pain: "Yes - Pain",
  bleeding: "Yes - Bleeding",
  electrolyte_imbalance: "Yes - Electrolyte Imbalance",
  infection: "Yes - Infection",
  pulmonary_embolism: "Yes - Pulmonary Embolism",
  intra_abdominal_collection: "Yes - Intra-abdominal Collection",
  organ_failure: "Yes - Organ Failure",
  other: "Yes - Other Cause",
};

export const WOUND_INFECTION_RISK_LABELS: Record<WoundInfectionRisk, string> = {
  clean: "Clean",
  clean_contaminated: "Clean/Contaminated",
  contaminated: "Contaminated",
  dirty: "Dirty",
  na: "N/A",
};

export const ANAESTHETIC_TYPE_LABELS: Record<AnaestheticType, string> = {
  general: "General",
  local: "Local",
  regional_block: "Regional Block",
  spinal: "Spinal",
  epidural: "Epidural",
  sedation: "Sedation",
  sedation_local: "Sedation + Local",
  walant: "WALANT (Wide Awake Local Anaesthesia No Tourniquet)",
};

export const UNPLANNED_ICU_LABELS: Record<UnplannedICUReason, string> = {
  no: "No",
  localised_sepsis: "Yes - Localised Sepsis (Wound)",
  generalised_sepsis: "Yes - Generalised Sepsis",
  pneumonia: "Yes - Pneumonia",
  renal_failure: "Yes - Renal Failure",
  arrhythmia: "Yes - Arrhythmia",
  myocardial_infarction: "Yes - Myocardial Infarction",
  pulmonary_embolism: "Yes - Pulmonary Embolism",
  other: "Yes - Other Cause",
};

export const DISCHARGE_OUTCOME_LABELS: Record<DischargeOutcome, string> = {
  died: "Died",
  discharged_home: "Discharged Home",
  discharged_care: "Discharged for Care or Respite",
  transferred_complex_care: "Transferred for More Complex Care",
  absconded: "Absconded/Took Own Discharge",
  referred_other_services: "Referred to Other Services",
};

export const MORTALITY_CLASSIFICATION_LABELS: Record<MortalityClassification, string> = {
  expected: "Expected",
  unexpected: "Unexpected",
  not_applicable: "Not Applicable",
};

export const ETHNICITY_OPTIONS: { value: string; label: string }[] = [
  { value: "nz_european", label: "NZ European" },
  { value: "maori", label: "Maori" },
  { value: "pacific_islander", label: "Pacific Islander" },
  { value: "asian", label: "Asian" },
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "african", label: "African" },
  { value: "latin_american", label: "Latin American" },
  { value: "european", label: "European" },
  { value: "south_asian", label: "South Asian" },
  { value: "southeast_asian", label: "Southeast Asian" },
  { value: "east_asian", label: "East Asian" },
  { value: "other", label: "Other" },
  { value: "not_stated", label: "Not Stated" },
];

export const ASA_GRADE_LABELS: Record<ASAScore, string> = {
  1: "I - Normal Healthy Patient",
  2: "II - Mild Systemic Disease",
  3: "III - Severe Systemic Disease",
  4: "IV - Severe Systemic Disease (Constant Threat to Life)",
  5: "V - Moribund Patient",
  6: "VI - Brain-Dead Organ Donor",
};

export const COMMON_COMORBIDITIES: SnomedCodedItem[] = [
  { snomedCtCode: "84114007", displayName: "Acquired Brain Injury" },
  { snomedCtCode: "49436004", displayName: "Atrial Fibrillation (AF)" },
  { snomedCtCode: "7200002", displayName: "Alcohol Abuse" },
  { snomedCtCode: "26929004", displayName: "Alzheimer's Disease" },
  { snomedCtCode: "87522002", displayName: "Anaemia - Blood Loss" },
  { snomedCtCode: "271737000", displayName: "Anaemia - Deficiency" },
  { snomedCtCode: "194828000", displayName: "Angina Pectoris" },
  { snomedCtCode: "48694002", displayName: "Anxiety" },
  { snomedCtCode: "195967001", displayName: "Asthma" },
  { snomedCtCode: "73211009", displayName: "Diabetes Mellitus" },
  { snomedCtCode: "38341003", displayName: "Hypertension" },
  { snomedCtCode: "13645005", displayName: "COPD" },
  { snomedCtCode: "84757009", displayName: "Epilepsy" },
  { snomedCtCode: "22298006", displayName: "Myocardial Infarction (Previous)" },
  { snomedCtCode: "230690007", displayName: "Stroke (Previous)" },
  { snomedCtCode: "90708001", displayName: "Kidney Disease" },
  { snomedCtCode: "235856003", displayName: "Liver Disease" },
  { snomedCtCode: "36971009", displayName: "Sinusitis" },
  { snomedCtCode: "35489007", displayName: "Depression" },
  { snomedCtCode: "414545008", displayName: "Ischaemic Heart Disease" },
  { snomedCtCode: "84027008", displayName: "Heart Failure" },
  { snomedCtCode: "59621000", displayName: "Hypertension Essential" },
  { snomedCtCode: "40930008", displayName: "Hypothyroidism" },
  { snomedCtCode: "34486009", displayName: "Hyperthyroidism" },
  { snomedCtCode: "64859006", displayName: "Osteoporosis" },
  { snomedCtCode: "396275006", displayName: "Osteoarthritis" },
  { snomedCtCode: "69896004", displayName: "Rheumatoid Arthritis" },
  { snomedCtCode: "363346000", displayName: "Malignancy (Active)" },
  { snomedCtCode: "414916001", displayName: "Obesity" },
  { snomedCtCode: "59282003", displayName: "Pulmonary Embolism (Previous)" },
  { snomedCtCode: "128053003", displayName: "Deep Vein Thrombosis (Previous)" },
];
