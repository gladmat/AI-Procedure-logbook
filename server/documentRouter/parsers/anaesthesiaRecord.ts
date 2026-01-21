export interface AnaesthesiaRecordData {
  asaScore?: number;
  weightKg?: number;
  heightCm?: number;
  tourniquetTimeMinutes?: number;
  anaestheticType?: string;
  airway?: string;
  intubationGrade?: string;
  bloodLossMl?: number;
  fluidsGivenMl?: number;
  medications?: string[];
}

export function parseAnaesthesiaRecord(rawText: string): AnaesthesiaRecordData {
  const data: AnaesthesiaRecordData = {};

  data.asaScore = extractASAScore(rawText);
  data.weightKg = extractWeight(rawText);
  data.heightCm = extractHeight(rawText);
  data.tourniquetTimeMinutes = extractTourniquetTime(rawText);
  data.anaestheticType = extractAnaestheticType(rawText);
  data.bloodLossMl = extractBloodLoss(rawText);
  data.fluidsGivenMl = extractFluidsGiven(rawText);

  return data;
}

function extractASAScore(text: string): number | undefined {
  const patterns = [
    /ASA[:\s]*(?:Grade\s*)?(?:ASA\s*)?(\d)/i,
    /ASA\s*(\d)/i,
    /ASA-(\d)/i,
    /Physical\s*Status[:\s]*(?:ASA\s*)?(\d)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const score = parseInt(match[1], 10);
      if (score >= 1 && score <= 6) {
        return score;
      }
    }
  }
  return undefined;
}

function extractWeight(text: string): number | undefined {
  const patterns = [
    /Weight[:\s]*(\d+(?:\.\d+)?)\s*kg/i,
    /Wt[:\s]*(\d+(?:\.\d+)?)\s*kg/i,
    /(\d+(?:\.\d+)?)\s*kg\s*(?:weight)?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const weight = parseFloat(match[1]);
      if (weight >= 20 && weight <= 300) {
        return weight;
      }
    }
  }
  return undefined;
}

function extractHeight(text: string): number | undefined {
  const patterns = [
    /Height[:\s]*(\d+(?:\.\d+)?)\s*cm/i,
    /Ht[:\s]*(\d+(?:\.\d+)?)\s*cm/i,
    /(\d{2,3})\s*cm\s*(?:height|tall)?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const height = parseFloat(match[1]);
      if (height >= 100 && height <= 250) {
        return height;
      }
    }
  }
  return undefined;
}

function extractTourniquetTime(text: string): number | undefined {
  const patterns = [
    /Tourniquet\s*(?:Time)?[:\s]*\(?(\d+)\s*min/i,
    /Tourniquet\s*\(\s*(\d+)\s*min\s*\)/i,
    /T[/]?Q[:\s]*(\d+)\s*min/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const time = parseInt(match[1], 10);
      if (time >= 0 && time <= 300) {
        return time;
      }
    }
  }
  return undefined;
}

function extractAnaestheticType(text: string): string | undefined {
  const upperText = text.toUpperCase();

  if (upperText.includes("GENERAL ANAESTHE") || upperText.includes("GA")) {
    if (upperText.includes("REGIONAL") || upperText.includes("BLOCK")) {
      return "general_regional";
    }
    return "general";
  }

  if (upperText.includes("SPINAL")) {
    return "spinal";
  }

  if (upperText.includes("EPIDURAL")) {
    return "epidural";
  }

  if (
    upperText.includes("REGIONAL") ||
    upperText.includes("BRACHIAL PLEXUS") ||
    upperText.includes("AXILLARY BLOCK") ||
    upperText.includes("NERVE BLOCK")
  ) {
    return "regional";
  }

  if (upperText.includes("LOCAL") || upperText.includes("LA ONLY")) {
    return "local";
  }

  if (upperText.includes("SEDATION") || upperText.includes("MAC")) {
    return "sedation";
  }

  return undefined;
}

function extractBloodLoss(text: string): number | undefined {
  const patterns = [
    /(?:Blood Loss|EBL|Estimated Blood Loss)[:\s]*(\d+)\s*(?:ml|mL|cc)?/i,
    /(?:Blood Loss|EBL)[:\s]*~?\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const bloodLoss = parseInt(match[1], 10);
      if (bloodLoss >= 0 && bloodLoss <= 10000) {
        return bloodLoss;
      }
    }
  }
  return undefined;
}

function extractFluidsGiven(text: string): number | undefined {
  const patterns = [
    /(?:Fluids|IV Fluids|Crystalloid)[:\s]*(\d+)\s*(?:ml|mL|cc)?/i,
    /(?:Total Fluids)[:\s]*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const fluids = parseInt(match[1], 10);
      if (fluids >= 0 && fluids <= 20000) {
        return fluids;
      }
    }
  }
  return undefined;
}
