/**
 * Diagnosis-specific additional structured fields for elective hand.
 * Maps diagnosis picklist IDs to extra UI fields that appear
 * after diagnosis selection (e.g., per-finger selection for trigger finger).
 */

export interface ElectiveFingerOption {
  id: "thumb" | "index" | "middle" | "ring" | "little";
  label: string;
}

export const FINGER_OPTIONS: ElectiveFingerOption[] = [
  { id: "thumb", label: "Thumb" },
  { id: "index", label: "Index" },
  { id: "middle", label: "Middle" },
  { id: "ring", label: "Ring" },
  { id: "little", label: "Little" },
];

export interface DiagnosisFingerConfig {
  fingerOptions: ElectiveFingerOption[];
  multiSelect: boolean;
  label: string;
}

/**
 * Map of diagnosis IDs → finger selection config.
 * Only diagnoses that need per-finger selection appear here.
 */
const DIAGNOSIS_FINGER_CONFIG: Record<string, DiagnosisFingerConfig> = {
  hand_dx_trigger_finger: {
    fingerOptions: FINGER_OPTIONS.filter((f) => f.id !== "thumb"),
    multiSelect: true,
    label: "AFFECTED FINGER(S)",
  },
  hand_dx_trigger_thumb: {
    fingerOptions: FINGER_OPTIONS.filter((f) => f.id === "thumb"),
    multiSelect: false,
    label: "AFFECTED DIGIT",
  },
};

/**
 * Get finger selection config for a diagnosis, if applicable.
 */
export function getFingerConfigForDiagnosis(
  diagnosisId: string | undefined,
): DiagnosisFingerConfig | null {
  if (!diagnosisId) return null;
  return DIAGNOSIS_FINGER_CONFIG[diagnosisId] ?? null;
}
