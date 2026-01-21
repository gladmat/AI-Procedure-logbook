export interface OperationNoteData {
  procedureName?: string;
  surgeon?: string;
  assistant?: string;
  anaesthetist?: string;
  diagnosis?: string;
  indication?: string;
  findings?: string;
  procedureDetails?: string;
  estimatedBloodLoss?: number;
  implants?: string;
  drains?: string;
  closureMethod?: string;
  postOpInstructions?: string;
  surgeryStartTime?: string;
  surgeryEndTime?: string;
  durationMinutes?: number;
}

export function parseOperationNote(rawText: string): OperationNoteData {
  const data: OperationNoteData = {};

  data.procedureName = extractProcedureName(rawText);
  data.surgeon = extractSurgeon(rawText);
  data.assistant = extractAssistant(rawText);
  data.anaesthetist = extractAnaesthetist(rawText);
  data.diagnosis = extractDiagnosis(rawText);
  data.indication = extractIndication(rawText);
  data.findings = extractFindings(rawText);
  data.procedureDetails = extractProcedureDetails(rawText);
  data.estimatedBloodLoss = extractBloodLoss(rawText);
  data.implants = extractImplants(rawText);
  data.drains = extractDrains(rawText);
  data.closureMethod = extractClosure(rawText);
  data.postOpInstructions = extractPostOpInstructions(rawText);

  const times = extractSurgeryTimes(rawText);
  if (times) {
    data.surgeryStartTime = times.start;
    data.surgeryEndTime = times.end;
    data.durationMinutes = times.duration;
  }

  return data;
}

function extractProcedureName(text: string): string | undefined {
  const patterns = [
    /(?:Procedure|Operation|Surgery)[:\s]*([^\n]+)/i,
    /(?:Name of Procedure)[:\s]*([^\n]+)/i,
    /(?:Operative Procedure)[:\s]*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 3 && name.length < 200) {
        return name;
      }
    }
  }
  return undefined;
}

function extractSurgeon(text: string): string | undefined {
  const patterns = [
    /(?:Surgeon|Primary Surgeon|Consultant|Operating Surgeon)[:\s]*(?:Dr\.?\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /(?:Operated by)[:\s]*(?:Dr\.?\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractAssistant(text: string): string | undefined {
  const patterns = [
    /(?:Assistant|First Assistant|Surgical Assistant)[:\s]*(?:Dr\.?\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractAnaesthetist(text: string): string | undefined {
  const patterns = [
    /(?:Anaesthetist|Anesthetist|Anaesthesiologist)[:\s]*(?:Dr\.?\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
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
    /(?:Diagnosis|Pre-operative Diagnosis|Preoperative Diagnosis)[:\s]*([^\n]+)/i,
    /(?:Dx|DX)[:\s]*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const diagnosis = match[1].trim();
      if (diagnosis.length > 3 && diagnosis.length < 300) {
        return diagnosis;
      }
    }
  }
  return undefined;
}

function extractIndication(text: string): string | undefined {
  const patterns = [
    /(?:Indication|Indications for Surgery)[:\s]*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractFindings(text: string): string | undefined {
  const patterns = [
    /(?:Findings|Intraoperative Findings|Operative Findings)[:\s]*([\s\S]*?)(?:\n\n|Procedure|Closure|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const findings = match[1].trim();
      if (findings.length > 5 && findings.length < 1000) {
        return findings;
      }
    }
  }
  return undefined;
}

function extractProcedureDetails(text: string): string | undefined {
  const patterns = [
    /(?:Procedure Details|Operative Details|Description of Procedure|Technique)[:\s]*([\s\S]*?)(?:\n\n|Closure|Estimated Blood|Drains|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const details = match[1].trim();
      if (details.length > 10) {
        return details.substring(0, 3000);
      }
    }
  }
  return undefined;
}

function extractBloodLoss(text: string): number | undefined {
  const patterns = [
    /(?:Estimated Blood Loss|EBL|Blood Loss)[:\s]*(?:approximately\s*)?(\d+)\s*(?:ml|mL|cc)?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const ebl = parseInt(match[1], 10);
      if (ebl >= 0 && ebl <= 10000) {
        return ebl;
      }
    }
  }
  return undefined;
}

function extractImplants(text: string): string | undefined {
  const patterns = [
    /(?:Implants?|Prosthesis|Hardware)[:\s]*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractDrains(text: string): string | undefined {
  const patterns = [
    /(?:Drains?|Drain Inserted)[:\s]*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractClosure(text: string): string | undefined {
  const patterns = [
    /(?:Closure|Wound Closure)[:\s]*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractPostOpInstructions(text: string): string | undefined {
  const patterns = [
    /(?:Post-?op(?:erative)?\s*Instructions?|Post-?op\s*Plan)[:\s]*([\s\S]*?)(?:\n\n|Signed|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 500);
    }
  }
  return undefined;
}

function extractSurgeryTimes(text: string): { start?: string; end?: string; duration?: number } | undefined {
  const result: { start?: string; end?: string; duration?: number } = {};

  const startPatterns = [
    /(?:Start Time|Surgery Start|Knife to Skin|Incision)[:\s]*(\d{1,2})[:\.](\d{2})/i,
  ];
  const endPatterns = [
    /(?:End Time|Surgery End|Skin Closure|Procedure End)[:\s]*(\d{1,2})[:\.](\d{2})/i,
  ];
  const durationPatterns = [
    /(?:Duration|Operating Time|Surgical Time)[:\s]*(\d+)\s*(?:min|minutes|hrs?)?/i,
  ];

  for (const pattern of startPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.start = `${match[1].padStart(2, "0")}:${match[2]}`;
      break;
    }
  }

  for (const pattern of endPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.end = `${match[1].padStart(2, "0")}:${match[2]}`;
      break;
    }
  }

  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.duration = parseInt(match[1], 10);
      break;
    }
  }

  return result.start || result.end || result.duration ? result : undefined;
}
