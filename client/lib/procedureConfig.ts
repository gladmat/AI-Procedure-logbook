import { Specialty, FreeFlapDetails } from "@/types/case";

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  unit?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  conditionalOn?: { field: string; value: unknown };
}

export interface ProcedureModuleConfig {
  id: Specialty;
  displayName: string;
  icon: string;
  aiPrompt: string;
  fields: FieldConfig[];
}

export const FREE_FLAP_CONFIG: ProcedureModuleConfig = {
  id: "free_flap",
  displayName: "Free Flap",
  icon: "activity",
  aiPrompt: `You are a medical data extraction assistant specialized in microsurgery. 
Extract the following information from the operation note:
- Flap type (e.g., ALT, DIEP, Radial Forearm, Fibula, Latissimus Dorsi, Gracilis, SCIP)
- Harvest side (left or right)
- Indication (trauma, oncologic, or congenital)
- Recipient artery name
- Recipient vein name
- Anastomosis type (end-to-end or end-to-side)
- Ischemia time in minutes (warm ischemia time)
- Coupler size in mm if used
- Flap dimensions (width x length in cm)
- Number of perforators (for ALT flaps)
- Elevation plane (subfascial or suprafascial for ALT flaps)

Return the data as JSON with these exact keys:
{
  "flapType": string,
  "harvestSide": "left" | "right",
  "indication": "trauma" | "oncologic" | "congenital",
  "recipientArteryName": string,
  "recipientVeinName": string,
  "anastomosisType": "end_to_end" | "end_to_side",
  "ischemiaTimeMinutes": number,
  "couplerSizeMm": number | null,
  "flapWidthCm": number | null,
  "flapLengthCm": number | null,
  "perforatorCount": 1 | 2 | 3 | null,
  "elevationPlane": "subfascial" | "suprafascial" | null
}

If information is not found, use null for optional fields. Be precise with medical terminology.`,
  fields: [
    {
      key: "harvestSide",
      label: "Harvest Side",
      type: "select",
      options: [
        { value: "left", label: "Left" },
        { value: "right", label: "Right" },
      ],
      required: true,
    },
    {
      key: "indication",
      label: "Indication",
      type: "select",
      options: [
        { value: "trauma", label: "Trauma" },
        { value: "oncologic", label: "Oncologic" },
        { value: "congenital", label: "Congenital" },
      ],
      required: true,
    },
    {
      key: "recipientArteryName",
      label: "Recipient Artery",
      type: "text",
      required: true,
      placeholder: "e.g., Facial artery",
    },
    {
      key: "recipientVeinName",
      label: "Recipient Vein",
      type: "text",
      required: true,
      placeholder: "e.g., Internal jugular vein",
    },
    {
      key: "anastomosisType",
      label: "Anastomosis",
      type: "select",
      options: [
        { value: "end_to_end", label: "End-to-End" },
        { value: "end_to_side", label: "End-to-Side" },
      ],
      required: true,
    },
    {
      key: "ischemiaTimeMinutes",
      label: "Ischemia Time",
      type: "number",
      required: true,
      unit: "min",
      keyboardType: "numeric",
      placeholder: "60",
    },
    {
      key: "couplerSizeMm",
      label: "Coupler Size",
      type: "number",
      unit: "mm",
      keyboardType: "decimal-pad",
      placeholder: "2.5",
    },
    {
      key: "flapWidthCm",
      label: "Flap Width",
      type: "number",
      unit: "cm",
      keyboardType: "decimal-pad",
      placeholder: "8",
    },
    {
      key: "flapLengthCm",
      label: "Flap Length",
      type: "number",
      unit: "cm",
      keyboardType: "decimal-pad",
      placeholder: "15",
    },
    {
      key: "perforatorCount",
      label: "Perforator Count",
      type: "select",
      options: [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3", label: "3+" },
      ],
      conditionalOn: { field: "procedureType", value: "ALT Flap" },
    },
    {
      key: "elevationPlane",
      label: "Elevation Plane",
      type: "select",
      options: [
        { value: "subfascial", label: "Subfascial" },
        { value: "suprafascial", label: "Suprafascial" },
      ],
      conditionalOn: { field: "procedureType", value: "ALT Flap" },
    },
  ],
};

export const HAND_TRAUMA_CONFIG: ProcedureModuleConfig = {
  id: "hand_trauma",
  displayName: "Hand Trauma",
  icon: "hand",
  aiPrompt: "Extract hand trauma surgical details...",
  fields: [
    {
      key: "injuryMechanism",
      label: "Injury Mechanism",
      type: "text",
      placeholder: "e.g., Saw injury",
    },
    {
      key: "nerveStatus",
      label: "Nerve Status",
      type: "text",
      placeholder: "e.g., Digital nerve intact",
    },
    {
      key: "tendonInjuries",
      label: "Tendon Injuries",
      type: "text",
      placeholder: "e.g., FDP zone 2",
    },
  ],
};

export const BODY_CONTOURING_CONFIG: ProcedureModuleConfig = {
  id: "body_contouring",
  displayName: "Body Contouring",
  icon: "user",
  aiPrompt: "Extract body contouring surgical details...",
  fields: [
    {
      key: "resectionWeightGrams",
      label: "Resection Weight",
      type: "number",
      unit: "g",
      keyboardType: "numeric",
    },
    {
      key: "drainOutputMl",
      label: "Drain Output",
      type: "number",
      unit: "mL",
      keyboardType: "numeric",
    },
  ],
};

export const PROCEDURE_CONFIGS: Record<Specialty, ProcedureModuleConfig> = {
  free_flap: FREE_FLAP_CONFIG,
  hand_trauma: HAND_TRAUMA_CONFIG,
  body_contouring: BODY_CONTOURING_CONFIG,
  aesthetics: {
    id: "aesthetics",
    displayName: "Aesthetics",
    icon: "star",
    aiPrompt: "Extract aesthetic surgery details...",
    fields: [],
  },
  burns: {
    id: "burns",
    displayName: "Burns",
    icon: "thermometer",
    aiPrompt: "Extract burn surgery details...",
    fields: [],
  },
  general: {
    id: "general",
    displayName: "General",
    icon: "clipboard",
    aiPrompt: "Extract general plastic surgery details...",
    fields: [],
  },
};

export function getConfigForSpecialty(specialty: Specialty): ProcedureModuleConfig {
  return PROCEDURE_CONFIGS[specialty];
}

export function getDefaultClinicalDetails(specialty: Specialty): Record<string, unknown> {
  const config = PROCEDURE_CONFIGS[specialty];
  const defaults: Record<string, unknown> = {};
  
  config.fields.forEach((field) => {
    if (field.type === "boolean") {
      defaults[field.key] = false;
    } else if (field.type === "number") {
      defaults[field.key] = undefined;
    } else {
      defaults[field.key] = "";
    }
  });
  
  return defaults;
}
