export interface WaikatoDischargeData {
  nhi?: string;
  fundingStatus?: "ACC" | "Public" | "Private" | "Unknown";
  admissionDate?: string;
  dischargeDate?: string;
  procedureNotes?: string;
  surgeon?: string;
  diagnosis?: string;
  complications?: string[];
}

export function parseWaikatoDischarge(rawText: string): WaikatoDischargeData {
  const data: WaikatoDischargeData = {};

  data.nhi = extractNHI(rawText);
  data.fundingStatus = extractFundingStatus(rawText);
  data.admissionDate = extractDate(rawText, ["admission", "admitted", "date of admission"]);
  data.dischargeDate = extractDate(rawText, ["discharge", "discharged", "date of discharge"]);
  data.procedureNotes = extractProcedureNotes(rawText);
  data.surgeon = extractSurgeon(rawText);
  data.diagnosis = extractDiagnosis(rawText);
  data.complications = extractComplications(rawText);

  return data;
}

function extractNHI(text: string): string | undefined {
  const patterns = [
    /(?:Patient\s*ID|NHI|NHI\s*Number|Patient\s*Number)\s*[:\s]*([A-Z]{3}\d{4})/i,
    /\b([A-Z]{3}\d{4})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }
  return undefined;
}

function extractFundingStatus(text: string): WaikatoDischargeData["fundingStatus"] {
  const upperText = text.toUpperCase();

  if (
    upperText.includes("ACC CLAIM : YES") ||
    upperText.includes("ACC CLAIM: YES") ||
    upperText.includes("ACC NUMBER") ||
    upperText.includes("ACC CLAIMANT") ||
    /ACC\s*[#:]?\s*\d+/.test(upperText)
  ) {
    return "ACC";
  }

  if (
    upperText.includes("PRIVATE PATIENT") ||
    upperText.includes("FUNDING: PRIVATE") ||
    upperText.includes("PRIVATE ADMISSION")
  ) {
    return "Private";
  }

  if (
    upperText.includes("DHB") ||
    upperText.includes("PUBLIC") ||
    upperText.includes("PUBLIC PATIENT") ||
    upperText.includes("TE WHATU ORA")
  ) {
    return "Public";
  }

  return "Unknown";
}

function extractDate(text: string, keywords: string[]): string | undefined {
  for (const keyword of keywords) {
    const pattern = new RegExp(
      `${keyword}[:\\s]*(?:on\\s*)?([0-3]?\\d)\\s*(?:\\/|-)\\s*([0-1]?\\d)\\s*(?:\\/|-)\\s*(\\d{2,4})`,
      "i"
    );
    const match = text.match(pattern);
    if (match) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      const year = match[3].length === 2 ? `20${match[3]}` : match[3];
      return `${year}-${month}-${day}`;
    }

    const datePattern = new RegExp(
      `${keyword}[:\\s]*(?:on\\s*)?([0-3]?\\d)\\s+([A-Za-z]{3,9})\\s+(\\d{4})`,
      "i"
    );
    const dateMatch = text.match(datePattern);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, "0");
      const monthName = dateMatch[2];
      const year = dateMatch[3];
      const monthNum = monthToNumber(monthName);
      if (monthNum) {
        return `${year}-${monthNum}-${day}`;
      }
    }
  }

  return undefined;
}

function monthToNumber(month: string): string | undefined {
  const months: Record<string, string> = {
    jan: "01", january: "01",
    feb: "02", february: "02",
    mar: "03", march: "03",
    apr: "04", april: "04",
    may: "05",
    jun: "06", june: "06",
    jul: "07", july: "07",
    aug: "08", august: "08",
    sep: "09", september: "09",
    oct: "10", october: "10",
    nov: "11", november: "11",
    dec: "12", december: "12",
  };
  return months[month.toLowerCase()];
}

function extractProcedureNotes(text: string): string | undefined {
  const procedureMatch = text.match(
    /(?:Procedure|Operation|Surgery)[:\s]*([\s\S]*?)(?:Plan|Discharge|Complications|Medications|$)/i
  );
  if (procedureMatch && procedureMatch[1]) {
    const notes = procedureMatch[1].trim();
    if (notes.length > 10) {
      return notes.substring(0, 2000);
    }
  }
  return undefined;
}

function extractSurgeon(text: string): string | undefined {
  const patterns = [
    /Consultant[:\s]*(?:Dr\.?\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /Surgeon[:\s]*(?:Dr\.?\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /Operated\s*by[:\s]*(?:Dr\.?\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /Primary\s*Surgeon[:\s]*(?:Dr\.?\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractDiagnosis(text: string): string | undefined {
  const patterns = [
    /(?:Diagnosis|Principal Diagnosis|Admission Diagnosis)[:\s]*([\s\S]*?)(?:\n\n|Procedure|Operation|$)/i,
    /(?:DX|Dx)[:\s]*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const diagnosis = match[1].trim();
      if (diagnosis.length > 3 && diagnosis.length < 500) {
        return diagnosis;
      }
    }
  }
  return undefined;
}

function extractComplications(text: string): string[] | undefined {
  const complications: string[] = [];
  
  const complicationMatch = text.match(
    /Complications?[:\s]*([\s\S]*?)(?:\n\n|Discharge|Medications|Plan|$)/i
  );
  
  if (complicationMatch && complicationMatch[1]) {
    const complicationText = complicationMatch[1].trim().toLowerCase();
    
    if (complicationText.includes("nil") || complicationText.includes("none") || complicationText.includes("no complications")) {
      return [];
    }

    const knownComplications = [
      "infection", "wound infection", "surgical site infection",
      "bleeding", "hematoma", "haematoma",
      "seroma",
      "dehiscence", "wound breakdown",
      "flap failure", "partial flap loss", "total flap loss",
      "nerve injury", "neuropraxia",
      "dvt", "deep vein thrombosis", "pe", "pulmonary embolism",
      "return to theatre", "reoperation",
    ];

    for (const complication of knownComplications) {
      if (complicationText.includes(complication)) {
        complications.push(complication);
      }
    }
  }

  return complications.length > 0 ? complications : undefined;
}
