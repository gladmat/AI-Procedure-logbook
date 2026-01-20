/**
 * Diagnosis Staging Configuration System
 * Maps SNOMED CT diagnosis codes to their staging/classification options
 * 
 * This file is designed to be easily extensible as new diagnoses are encountered
 */

export interface StagingOption {
  value: string;
  label: string;
  description?: string;
}

export interface StagingSystem {
  name: string;
  description?: string;
  options: StagingOption[];
}

export interface DiagnosisStagingConfig {
  snomedCtCodes: string[]; // Multiple codes can map to same staging
  keywords: string[]; // Fallback matching by keyword in diagnosis name
  stagingSystems: StagingSystem[];
}

/**
 * Diagnosis staging configurations
 * Add new configurations here as you encounter cases
 */
export const diagnosisStagingConfigs: DiagnosisStagingConfig[] = [
  // Dupuytren's Contracture
  {
    snomedCtCodes: [
      "79426006", // Dupuytren's contracture
      "240078005", // Dupuytren's disease of palm
    ],
    keywords: ["dupuytren"],
    stagingSystems: [
      {
        name: "Tubiana Stage",
        description: "Total passive extension deficit across all joints",
        options: [
          { value: "0", label: "Stage 0", description: "Nodule or cord, no contracture" },
          { value: "N", label: "Stage N", description: "Nodule only" },
          { value: "1", label: "Stage 1", description: "0-45° total extension deficit" },
          { value: "2", label: "Stage 2", description: "45-90° total extension deficit" },
          { value: "3", label: "Stage 3", description: "90-135° total extension deficit" },
          { value: "4", label: "Stage 4", description: ">135° total extension deficit" },
        ],
      },
      {
        name: "Affected Fingers",
        description: "Number of fingers involved",
        options: [
          { value: "1", label: "1 finger" },
          { value: "2", label: "2 fingers" },
          { value: "3", label: "3 fingers" },
          { value: "4", label: "4 fingers" },
          { value: "5", label: "5 fingers" },
        ],
      },
    ],
  },

  // Open Fractures (Gustilo-Anderson Classification)
  {
    snomedCtCodes: [
      "397181002", // Open fracture (disorder)
      "22640007", // Open fracture of tibia
      "21947006", // Open fracture of fibula
      "46866001", // Open fracture of femur
      "263225007", // Open fracture of humerus
      "46199005", // Open fracture of radius
      "64665009", // Open fracture of ulna
    ],
    keywords: ["open fracture", "compound fracture", "gustilo"],
    stagingSystems: [
      {
        name: "Gustilo-Anderson Classification",
        description: "Classification of open fractures",
        options: [
          { value: "I", label: "Type I", description: "Wound <1cm, minimal contamination, simple fracture" },
          { value: "II", label: "Type II", description: "Wound 1-10cm, moderate soft tissue damage, adequate bone coverage" },
          { value: "IIIa", label: "Type IIIa", description: "Wound >10cm, high-energy, adequate soft tissue coverage" },
          { value: "IIIb", label: "Type IIIb", description: "Extensive soft tissue loss, periosteal stripping, requires flap" },
          { value: "IIIc", label: "Type IIIc", description: "Arterial injury requiring repair" },
        ],
      },
    ],
  },

  // Melanoma (Breslow Thickness & Clark Level)
  {
    snomedCtCodes: [
      "372244006", // Malignant melanoma
      "93655004", // Melanoma of skin
    ],
    keywords: ["melanoma"],
    stagingSystems: [
      {
        name: "Breslow Thickness",
        description: "Depth of invasion in millimeters",
        options: [
          { value: "in_situ", label: "In situ", description: "Confined to epidermis" },
          { value: "≤1.0", label: "≤1.0 mm", description: "Thin melanoma" },
          { value: "1.01-2.0", label: "1.01-2.0 mm", description: "Intermediate" },
          { value: "2.01-4.0", label: "2.01-4.0 mm", description: "Thick" },
          { value: ">4.0", label: ">4.0 mm", description: "Very thick" },
        ],
      },
      {
        name: "Ulceration",
        description: "Presence of ulceration",
        options: [
          { value: "no", label: "No ulceration" },
          { value: "yes", label: "Ulcerated" },
        ],
      },
    ],
  },

  // Carpal Tunnel Syndrome
  {
    snomedCtCodes: [
      "57406009", // Carpal tunnel syndrome
    ],
    keywords: ["carpal tunnel"],
    stagingSystems: [
      {
        name: "Severity",
        description: "Clinical severity grading",
        options: [
          { value: "mild", label: "Mild", description: "Intermittent symptoms, normal sensation" },
          { value: "moderate", label: "Moderate", description: "Persistent symptoms, reduced sensation" },
          { value: "severe", label: "Severe", description: "Constant numbness, thenar atrophy" },
        ],
      },
      {
        name: "EMG Grade",
        description: "Electrodiagnostic severity (if performed)",
        options: [
          { value: "normal", label: "Normal", description: "No abnormality" },
          { value: "mild", label: "Mild", description: "Prolonged sensory latency only" },
          { value: "moderate", label: "Moderate", description: "Prolonged motor and sensory latencies" },
          { value: "severe", label: "Severe", description: "Absent sensory response, reduced motor amplitude" },
          { value: "very_severe", label: "Very Severe", description: "Absent motor and sensory responses" },
        ],
      },
    ],
  },

  // Trigger Finger
  {
    snomedCtCodes: [
      "60849009", // Trigger finger
      "202855006", // Stenosing tenosynovitis of finger
    ],
    keywords: ["trigger finger", "trigger thumb", "stenosing tenosynovitis"],
    stagingSystems: [
      {
        name: "Quinnell Grade",
        description: "Grading of trigger finger severity",
        options: [
          { value: "0", label: "Grade 0", description: "Normal movement" },
          { value: "1", label: "Grade I", description: "Uneven movement" },
          { value: "2", label: "Grade II", description: "Actively correctable triggering" },
          { value: "3", label: "Grade III", description: "Passively correctable triggering" },
          { value: "4", label: "Grade IV", description: "Fixed flexion contracture" },
        ],
      },
    ],
  },

  // Breast Cancer
  {
    snomedCtCodes: [
      "254837009", // Malignant neoplasm of breast
      "188168008", // Carcinoma of breast
    ],
    keywords: ["breast cancer", "breast carcinoma", "mammary carcinoma"],
    stagingSystems: [
      {
        name: "TNM T Stage",
        description: "Tumor size",
        options: [
          { value: "Tis", label: "Tis", description: "Carcinoma in situ" },
          { value: "T1", label: "T1", description: "≤2 cm" },
          { value: "T2", label: "T2", description: ">2 cm to ≤5 cm" },
          { value: "T3", label: "T3", description: ">5 cm" },
          { value: "T4", label: "T4", description: "Chest wall or skin involvement" },
        ],
      },
      {
        name: "TNM N Stage",
        description: "Nodal involvement",
        options: [
          { value: "N0", label: "N0", description: "No regional lymph node metastasis" },
          { value: "N1", label: "N1", description: "1-3 axillary nodes" },
          { value: "N2", label: "N2", description: "4-9 axillary nodes" },
          { value: "N3", label: "N3", description: "≥10 axillary or infraclavicular nodes" },
        ],
      },
    ],
  },

  // Pressure Ulcer/Injury
  {
    snomedCtCodes: [
      "399912005", // Pressure ulcer
      "420324007", // Pressure injury
    ],
    keywords: ["pressure ulcer", "pressure injury", "pressure sore", "decubitus"],
    stagingSystems: [
      {
        name: "NPUAP Stage",
        description: "National Pressure Ulcer Advisory Panel staging",
        options: [
          { value: "1", label: "Stage 1", description: "Non-blanchable erythema of intact skin" },
          { value: "2", label: "Stage 2", description: "Partial thickness skin loss with dermis exposed" },
          { value: "3", label: "Stage 3", description: "Full thickness skin loss" },
          { value: "4", label: "Stage 4", description: "Full thickness skin and tissue loss" },
          { value: "unstageable", label: "Unstageable", description: "Obscured by slough/eschar" },
          { value: "deep_tissue", label: "Deep Tissue", description: "Persistent non-blanchable deep red/purple" },
        ],
      },
    ],
  },

  // Burns
  {
    snomedCtCodes: [
      "48333001", // Burn injury
      "125666000", // Burn of skin
    ],
    keywords: ["burn", "scald", "thermal injury"],
    stagingSystems: [
      {
        name: "Depth",
        description: "Burn depth classification",
        options: [
          { value: "superficial", label: "Superficial", description: "Epidermis only, erythema, painful" },
          { value: "superficial_partial", label: "Superficial Partial", description: "Epidermis + superficial dermis, blisters" },
          { value: "deep_partial", label: "Deep Partial", description: "Epidermis + deep dermis, less painful" },
          { value: "full_thickness", label: "Full Thickness", description: "All skin layers, painless, waxy" },
        ],
      },
      {
        name: "TBSA %",
        description: "Total Body Surface Area percentage",
        options: [
          { value: "<10", label: "<10%" },
          { value: "10-20", label: "10-20%" },
          { value: "20-30", label: "20-30%" },
          { value: "30-50", label: "30-50%" },
          { value: ">50", label: ">50%" },
        ],
      },
    ],
  },
];

/**
 * Find staging configuration for a diagnosis
 * First tries exact SNOMED code match, then falls back to keyword matching
 */
export function getStagingForDiagnosis(
  snomedCode?: string,
  diagnosisName?: string
): DiagnosisStagingConfig | null {
  // First try exact SNOMED code match
  if (snomedCode) {
    const exactMatch = diagnosisStagingConfigs.find((config) =>
      config.snomedCtCodes.includes(snomedCode)
    );
    if (exactMatch) {
      return exactMatch;
    }
  }

  // Fallback to keyword matching
  if (diagnosisName) {
    const lowerName = diagnosisName.toLowerCase();
    const keywordMatch = diagnosisStagingConfigs.find((config) =>
      config.keywords.some((keyword) => lowerName.includes(keyword.toLowerCase()))
    );
    if (keywordMatch) {
      return keywordMatch;
    }
  }

  return null;
}

/**
 * Get all available staging configurations (for admin/reference)
 */
export function getAllStagingConfigs(): DiagnosisStagingConfig[] {
  return diagnosisStagingConfigs;
}
