const NHI_PATTERN = /[A-Z]{3}[0-9]{4}/gi;

const DATE_PATTERNS = [
  /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g,
  /\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g,
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
  /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/gi,
];

const NAME_PREFIXES = [
  /\b(?:Mr|Mrs|Ms|Miss|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g,
];

const ADDRESS_PATTERNS = [
  /\b\d+\s+[A-Za-z]+(?:\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl|Boulevard|Blvd))\b/gi,
];

export interface RedactionResult {
  redactedText: string;
  redactedItems: {
    type: string;
    original: string;
    position: number;
  }[];
}

export function redactSensitiveData(text: string): RedactionResult {
  let redactedText = text;
  const redactedItems: RedactionResult["redactedItems"] = [];

  const nhis = text.match(NHI_PATTERN) || [];
  nhis.forEach((nhi) => {
    redactedItems.push({
      type: "NHI",
      original: nhi,
      position: text.indexOf(nhi),
    });
    redactedText = redactedText.replace(nhi, "[REDACTED_NHI]");
  });

  DATE_PATTERNS.forEach((pattern) => {
    const dates = text.match(pattern) || [];
    dates.forEach((date) => {
      if (!redactedText.includes("[REDACTED_DATE]")) {
        redactedItems.push({
          type: "DATE",
          original: date,
          position: text.indexOf(date),
        });
      }
      redactedText = redactedText.replace(date, "[REDACTED_DATE]");
    });
  });

  return { redactedText, redactedItems };
}

export function hasRedactableContent(text: string): boolean {
  if (NHI_PATTERN.test(text)) return true;
  
  for (const pattern of DATE_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  
  return false;
}

export function getRedactionSummary(result: RedactionResult): string {
  const counts: Record<string, number> = {};
  
  result.redactedItems.forEach((item) => {
    counts[item.type] = (counts[item.type] || 0) + 1;
  });
  
  const parts = Object.entries(counts).map(
    ([type, count]) => `${count} ${type.toLowerCase()}${count > 1 ? "s" : ""}`
  );
  
  if (parts.length === 0) return "No sensitive data found";
  
  return `Redacted: ${parts.join(", ")}`;
}

export function extractNHIFromText(text: string): string | null {
  const matches = text.match(NHI_PATTERN);
  return matches && matches.length > 0 ? matches[0].toUpperCase() : null;
}

export function extractDatesFromText(text: string): string[] {
  const dates: string[] = [];
  DATE_PATTERNS.forEach((pattern) => {
    const matches = text.match(pattern) || [];
    dates.push(...matches);
  });
  return dates;
}
