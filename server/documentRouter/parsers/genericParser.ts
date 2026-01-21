import { extractNHI, extractSurgeryDate } from "../../privacyUtils";

export interface GenericDocumentData {
  nhi?: string;
  procedureDate?: string;
  patientName?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  diagnosis?: string;
  procedure?: string;
  surgeon?: string;
  facility?: string;
  rawTextSnippet?: string;
}

export function parseGenericDocument(rawText: string): GenericDocumentData {
  const data: GenericDocumentData = {};

  data.nhi = extractNHI(rawText) || extractNHIFromText(rawText);
  data.procedureDate = extractSurgeryDate(rawText) || extractDateFromText(rawText);
  data.gender = extractGender(rawText);
  data.diagnosis = extractFirstDiagnosis(rawText);
  data.procedure = extractFirstProcedure(rawText);
  data.surgeon = extractSurgeonName(rawText);
  data.facility = extractFacility(rawText);
  data.rawTextSnippet = rawText.substring(0, 500);

  return data;
}

function extractNHIFromText(text: string): string | undefined {
  const match = text.match(/\b([A-Z]{3}\d{4})\b/);
  return match ? match[1] : undefined;
}

function extractDateFromText(text: string): string | undefined {
  const patterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    /(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern.source.includes("[A-Za-z]")) {
        const day = match[1].padStart(2, "0");
        const monthName = match[2].toLowerCase();
        const year = match[3];
        const months: Record<string, string> = {
          jan: "01", january: "01", feb: "02", february: "02",
          mar: "03", march: "03", apr: "04", april: "04",
          may: "05", jun: "06", june: "06", jul: "07", july: "07",
          aug: "08", august: "08", sep: "09", september: "09",
          oct: "10", october: "10", nov: "11", november: "11",
          dec: "12", december: "12",
        };
        const monthNum = months[monthName];
        if (monthNum) {
          return `${year}-${monthNum}-${day}`;
        }
      } else {
        const day = match[1].padStart(2, "0");
        const month = match[2].padStart(2, "0");
        const year = match[3];
        return `${year}-${month}-${day}`;
      }
    }
  }
  return undefined;
}

function extractGender(text: string): GenericDocumentData["gender"] {
  const upperText = text.toUpperCase();
  
  if (
    /\b(MALE|M)\b/.test(upperText) &&
    !upperText.includes("FEMALE")
  ) {
    return "male";
  }
  
  if (/\bFEMALE\b/.test(upperText) || /\bSEX[:\s]*F\b/.test(upperText)) {
    return "female";
  }
  
  return undefined;
}

function extractFirstDiagnosis(text: string): string | undefined {
  const patterns = [
    /(?:Diagnosis|Dx|Principal Diagnosis)[:\s]*([^\n]{5,150})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractFirstProcedure(text: string): string | undefined {
  const patterns = [
    /(?:Procedure|Operation|Surgery)[:\s]*([^\n]{5,150})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractSurgeonName(text: string): string | undefined {
  const patterns = [
    /(?:Surgeon|Consultant|Operated by)[:\s]*(?:Dr\.?\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractFacility(text: string): string | undefined {
  const facilities = [
    "Waikato Hospital",
    "Te Whatu Ora",
    "Middlemore Hospital",
    "Auckland City Hospital",
    "Starship Hospital",
    "Wellington Hospital",
    "Christchurch Hospital",
    "Dunedin Hospital",
    "North Shore Hospital",
    "Waitakere Hospital",
  ];

  const upperText = text.toUpperCase();
  for (const facility of facilities) {
    if (upperText.includes(facility.toUpperCase())) {
      return facility;
    }
  }
  return undefined;
}
