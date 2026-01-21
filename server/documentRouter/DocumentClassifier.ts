export enum DocumentType {
  WAIKATO_DISCHARGE = "WAIKATO_DISCHARGE",
  ANAESTHESIA_RECORD = "ANAESTHESIA_RECORD",
  OPERATION_NOTE = "OPERATION_NOTE",
  GENERIC = "GENERIC",
}

export interface ClassificationResult {
  documentType: DocumentType;
  confidence: "high" | "medium" | "low";
  detectedTriggers: string[];
}

export function classifyDocument(rawText: string): ClassificationResult {
  const text = rawText.toUpperCase();
  const detectedTriggers: string[] = [];

  if (
    text.includes("DISCHARGE SUMMARY") &&
    (text.includes("WAIKATO") || text.includes("DHB"))
  ) {
    detectedTriggers.push("Discharge Summary", "Waikato/DHB");
    return {
      documentType: DocumentType.WAIKATO_DISCHARGE,
      confidence: "high",
      detectedTriggers,
    };
  }

  if (
    text.includes("ANAESTHESIA REPORT") ||
    text.includes("ANAESTHESIA RECORD") ||
    text.includes("TE WHATU ORA") ||
    (text.includes("PROPOFOL") && text.includes("ASA"))
  ) {
    if (text.includes("ANAESTHESIA")) detectedTriggers.push("Anaesthesia Record");
    if (text.includes("TE WHATU ORA")) detectedTriggers.push("Te Whatu Ora");
    if (text.includes("PROPOFOL")) detectedTriggers.push("Propofol");
    return {
      documentType: DocumentType.ANAESTHESIA_RECORD,
      confidence: "high",
      detectedTriggers,
    };
  }

  if (
    text.includes("OPERATION NOTE") ||
    text.includes("OPERATIVE REPORT") ||
    text.includes("PROCEDURE REPORT") ||
    (text.includes("SURGEON") && text.includes("PROCEDURE"))
  ) {
    if (text.includes("OPERATION NOTE")) detectedTriggers.push("Operation Note");
    if (text.includes("OPERATIVE REPORT")) detectedTriggers.push("Operative Report");
    if (text.includes("PROCEDURE")) detectedTriggers.push("Procedure");
    return {
      documentType: DocumentType.OPERATION_NOTE,
      confidence: "medium",
      detectedTriggers,
    };
  }

  return {
    documentType: DocumentType.GENERIC,
    confidence: "low",
    detectedTriggers: ["No specific document type detected"],
  };
}
