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

export type ASAScore = 1 | 2 | 3 | 4 | 5;

export type SmokingStatus = "yes" | "no" | "ex";

export type Indication = "trauma" | "oncologic" | "congenital";

export type AnastomosisType = "end_to_end" | "end_to_side";

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

export interface FreeFlapDetails {
  harvestSide: HarvestSide;
  indication: Indication;
  recipientArteryName: string;
  recipientVeinName: string;
  anastomosisType: AnastomosisType;
  ischemiaTimeMinutes: number;
  couplerSizeMm?: number;
  flapWidthCm?: number;
  flapLengthCm?: number;
  perforatorCount?: 1 | 2 | 3;
  elevationPlane?: ElevationPlane;
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
  asaScore?: ASAScore;
  bmi?: number;
  smoker?: SmokingStatus;
  diabetes?: boolean;
  ethnicity?: string;
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
