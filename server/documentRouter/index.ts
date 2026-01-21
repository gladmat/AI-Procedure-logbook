import { classifyDocument, DocumentType, ClassificationResult } from "./DocumentClassifier";
import { parseWaikatoDischarge, WaikatoDischargeData } from "./parsers/waikatoDischarge";
import { parseAnaesthesiaRecord, AnaesthesiaRecordData } from "./parsers/anaesthesiaRecord";
import { parseOperationNote, OperationNoteData } from "./parsers/operationNote";
import { parseGenericDocument, GenericDocumentData } from "./parsers/genericParser";
import { extractNHI, extractSurgeryDate } from "../privacyUtils";

export interface DocumentRouterResult {
  documentType: DocumentType;
  documentTypeName: string;
  confidence: ClassificationResult["confidence"];
  detectedTriggers: string[];
  extractedData: ExtractedCaseData;
  autoFilledFields: string[];
}

export interface ExtractedCaseData {
  patientIdentifier?: string;
  procedureDate?: string;
  gender?: "male" | "female" | "other";
  admissionDate?: string;
  dischargeDate?: string;
  admissionUrgency?: "elective" | "urgent" | "emergency";
  stayType?: "day_case" | "inpatient" | "outpatient";
  asaScore?: number;
  weightKg?: number;
  heightCm?: number;
  finalDiagnosis?: string;
  procedures?: Array<{
    procedureName: string;
    notes?: string;
  }>;
  operatingTeam?: Array<{
    name: string;
    role: string;
  }>;
  clinicalDetails?: {
    surgeryStartTime?: string;
    surgeryEndTime?: string;
    durationMinutes?: number;
    tourniquetTimeMinutes?: number;
    estimatedBloodLoss?: number;
    closureMethod?: string;
    drains?: string;
    postOpInstructions?: string;
  };
  fundingStatus?: "ACC" | "Public" | "Private" | "Unknown";
  facility?: string;
  anaestheticType?: string;
  complications?: string[];
}

const DOCUMENT_TYPE_NAMES: Record<DocumentType, string> = {
  [DocumentType.WAIKATO_DISCHARGE]: "Waikato Discharge Summary",
  [DocumentType.ANAESTHESIA_RECORD]: "Anaesthesia Record",
  [DocumentType.OPERATION_NOTE]: "Operation Note",
  [DocumentType.GENERIC]: "Generic Document",
};

export function processDocument(rawText: string): DocumentRouterResult {
  const classification = classifyDocument(rawText);
  
  const nhi = extractNHI(rawText);
  const procedureDate = extractSurgeryDate(rawText);
  
  let extractedData: ExtractedCaseData = {
    patientIdentifier: nhi || undefined,
    procedureDate: procedureDate || undefined,
  };
  
  const autoFilledFields: string[] = [];
  
  if (nhi) autoFilledFields.push("patientIdentifier");
  if (procedureDate) autoFilledFields.push("procedureDate");

  switch (classification.documentType) {
    case DocumentType.WAIKATO_DISCHARGE:
      const waikatoData = parseWaikatoDischarge(rawText);
      extractedData = mergeWaikatoData(extractedData, waikatoData, autoFilledFields);
      break;

    case DocumentType.ANAESTHESIA_RECORD:
      const anaesthesiaData = parseAnaesthesiaRecord(rawText);
      extractedData = mergeAnaesthesiaData(extractedData, anaesthesiaData, autoFilledFields);
      break;

    case DocumentType.OPERATION_NOTE:
      const opNoteData = parseOperationNote(rawText);
      extractedData = mergeOperationNoteData(extractedData, opNoteData, autoFilledFields);
      break;

    case DocumentType.GENERIC:
    default:
      const genericData = parseGenericDocument(rawText);
      extractedData = mergeGenericData(extractedData, genericData, autoFilledFields);
      break;
  }

  return {
    documentType: classification.documentType,
    documentTypeName: DOCUMENT_TYPE_NAMES[classification.documentType],
    confidence: classification.confidence,
    detectedTriggers: classification.detectedTriggers,
    extractedData,
    autoFilledFields,
  };
}

function mergeWaikatoData(
  base: ExtractedCaseData,
  waikato: WaikatoDischargeData,
  autoFilledFields: string[]
): ExtractedCaseData {
  const result = { ...base };

  if (waikato.nhi && !result.patientIdentifier) {
    result.patientIdentifier = waikato.nhi;
    autoFilledFields.push("patientIdentifier");
  }

  if (waikato.fundingStatus) {
    result.fundingStatus = waikato.fundingStatus;
    autoFilledFields.push("fundingStatus");
  }

  if (waikato.admissionDate) {
    result.admissionDate = waikato.admissionDate;
    autoFilledFields.push("admissionDate");
  }

  if (waikato.dischargeDate) {
    result.dischargeDate = waikato.dischargeDate;
    autoFilledFields.push("dischargeDate");
  }

  if (waikato.diagnosis) {
    result.finalDiagnosis = waikato.diagnosis;
    autoFilledFields.push("finalDiagnosis");
  }

  if (waikato.surgeon) {
    result.operatingTeam = [{ name: waikato.surgeon, role: "consultant" }];
    autoFilledFields.push("surgeon");
  }

  if (waikato.procedureNotes) {
    result.procedures = [{ procedureName: "See notes", notes: waikato.procedureNotes }];
    autoFilledFields.push("procedures");
  }

  if (waikato.complications && waikato.complications.length > 0) {
    result.complications = waikato.complications;
    autoFilledFields.push("complications");
  }

  result.facility = "Waikato Hospital";
  autoFilledFields.push("facility");

  return result;
}

function mergeAnaesthesiaData(
  base: ExtractedCaseData,
  anaesthesia: AnaesthesiaRecordData,
  autoFilledFields: string[]
): ExtractedCaseData {
  const result = { ...base };

  if (anaesthesia.asaScore) {
    result.asaScore = anaesthesia.asaScore;
    autoFilledFields.push("asaScore");
  }

  if (anaesthesia.weightKg) {
    result.weightKg = anaesthesia.weightKg;
    autoFilledFields.push("weightKg");
  }

  if (anaesthesia.heightCm) {
    result.heightCm = anaesthesia.heightCm;
    autoFilledFields.push("heightCm");
  }

  if (anaesthesia.anaestheticType) {
    result.anaestheticType = anaesthesia.anaestheticType;
    autoFilledFields.push("anaestheticType");
  }

  result.clinicalDetails = result.clinicalDetails || {};

  if (anaesthesia.tourniquetTimeMinutes) {
    result.clinicalDetails.tourniquetTimeMinutes = anaesthesia.tourniquetTimeMinutes;
    autoFilledFields.push("tourniquetTimeMinutes");
  }

  if (anaesthesia.bloodLossMl) {
    result.clinicalDetails.estimatedBloodLoss = anaesthesia.bloodLossMl;
    autoFilledFields.push("estimatedBloodLoss");
  }

  return result;
}

function mergeOperationNoteData(
  base: ExtractedCaseData,
  opNote: OperationNoteData,
  autoFilledFields: string[]
): ExtractedCaseData {
  const result = { ...base };

  if (opNote.diagnosis) {
    result.finalDiagnosis = opNote.diagnosis;
    autoFilledFields.push("finalDiagnosis");
  }

  if (opNote.procedureName) {
    result.procedures = [{
      procedureName: opNote.procedureName,
      notes: opNote.procedureDetails,
    }];
    autoFilledFields.push("procedures");
  }

  const team: Array<{ name: string; role: string }> = [];
  if (opNote.surgeon) {
    team.push({ name: opNote.surgeon, role: "consultant" });
    autoFilledFields.push("surgeon");
  }
  if (opNote.assistant) {
    team.push({ name: opNote.assistant, role: "surgical_assistant" });
  }
  if (opNote.anaesthetist) {
    team.push({ name: opNote.anaesthetist, role: "anaesthetist" });
  }
  if (team.length > 0) {
    result.operatingTeam = team;
  }

  result.clinicalDetails = result.clinicalDetails || {};

  if (opNote.surgeryStartTime) {
    result.clinicalDetails.surgeryStartTime = opNote.surgeryStartTime;
    autoFilledFields.push("surgeryStartTime");
  }

  if (opNote.surgeryEndTime) {
    result.clinicalDetails.surgeryEndTime = opNote.surgeryEndTime;
    autoFilledFields.push("surgeryEndTime");
  }

  if (opNote.durationMinutes) {
    result.clinicalDetails.durationMinutes = opNote.durationMinutes;
    autoFilledFields.push("durationMinutes");
  }

  if (opNote.estimatedBloodLoss) {
    result.clinicalDetails.estimatedBloodLoss = opNote.estimatedBloodLoss;
    autoFilledFields.push("estimatedBloodLoss");
  }

  if (opNote.closureMethod) {
    result.clinicalDetails.closureMethod = opNote.closureMethod;
  }

  if (opNote.drains) {
    result.clinicalDetails.drains = opNote.drains;
  }

  if (opNote.postOpInstructions) {
    result.clinicalDetails.postOpInstructions = opNote.postOpInstructions;
  }

  return result;
}

function mergeGenericData(
  base: ExtractedCaseData,
  generic: GenericDocumentData,
  autoFilledFields: string[]
): ExtractedCaseData {
  const result = { ...base };

  if (generic.nhi && !result.patientIdentifier) {
    result.patientIdentifier = generic.nhi;
    autoFilledFields.push("patientIdentifier");
  }

  if (generic.procedureDate && !result.procedureDate) {
    result.procedureDate = generic.procedureDate;
    autoFilledFields.push("procedureDate");
  }

  if (generic.gender) {
    result.gender = generic.gender;
    autoFilledFields.push("gender");
  }

  if (generic.diagnosis) {
    result.finalDiagnosis = generic.diagnosis;
    autoFilledFields.push("finalDiagnosis");
  }

  if (generic.procedure) {
    result.procedures = [{ procedureName: generic.procedure }];
    autoFilledFields.push("procedures");
  }

  if (generic.surgeon) {
    result.operatingTeam = [{ name: generic.surgeon, role: "consultant" }];
    autoFilledFields.push("surgeon");
  }

  if (generic.facility) {
    result.facility = generic.facility;
    autoFilledFields.push("facility");
  }

  return result;
}

export { DocumentType, ClassificationResult };
