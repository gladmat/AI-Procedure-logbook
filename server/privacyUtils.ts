const NHI_PATTERN = /[A-Z]{3}[0-9]{4}/gi;

const DATE_PATTERNS = [
  /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g,
  /\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g,
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
  /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/gi,
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
