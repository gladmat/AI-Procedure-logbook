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

// Common OCR character confusions for letters
const OCR_LETTER_CORRECTIONS: Record<string, string> = {
  'E': 'B',  // E often misread as B
  '8': 'B',  // 8 often misread as B
  '0': 'O',  // 0 often misread as O
  '1': 'I',  // 1 often misread as I
  '5': 'S',  // 5 often misread as S
};

// Extract NHI/patient identifier BEFORE redacting
// NHI format: 3 letters followed by 4 digits (e.g., BKK3490)
export function extractNHI(text: string): string | null {
  const matches = text.match(NHI_PATTERN);
  if (!matches || matches.length === 0) return null;
  
  let nhi = matches[0].toUpperCase();
  
  // Try to correct common OCR errors in the letter portion (first 3 chars)
  // Look for context clues like "Patient ID:", "NHI:", etc. to find the original
  const contextPatterns = [
    /(?:Patient\s*ID|NHI|Patient\s*Identifier)[:\s]+([A-Z]{3}\d{4})/i,
    /(?:Patient|ID)[:\s]+([A-Z]{3}\d{4})/i,
  ];
  
  for (const pattern of contextPatterns) {
    const contextMatch = text.match(pattern);
    if (contextMatch && contextMatch[1]) {
      // Use the one with context as it's likely more accurate
      return contextMatch[1].toUpperCase();
    }
  }
  
  return nhi;
}

// Extract the most likely surgery/procedure date from the text
export function extractSurgeryDate(text: string): string | null {
  // Look for patterns like "Admission: 01 Dec 2025", "DOS: 01/12/2025", "Date of Surgery: ..."
  const surgeryDatePatterns = [
    /(?:DOS|Date of Surgery|Surgery Date|Admission|Operation Date)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
    /(?:DOS|Date of Surgery|Surgery Date|Admission|Operation Date)[:\s]+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/gi,
    /(?:Start Case)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
  ];
  
  for (const pattern of surgeryDatePatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      return parseAndFormatDate(match[1]);
    }
  }
  
  // Fallback: find any date in the document
  for (const pattern of DATE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return parseAndFormatDate(matches[0]);
    }
  }
  
  return null;
}

// Correct common OCR errors in years (e.g., 2075 → 2025)
function correctOcrYear(year: number): number {
  const currentYear = new Date().getFullYear();
  const maxValidYear = currentYear + 1; // Allow up to 1 year in the future
  const minValidYear = 1990; // Reasonable minimum for surgical records
  
  // If year is in valid range, return as-is
  if (year >= minValidYear && year <= maxValidYear) {
    return year;
  }
  
  // Common OCR digit confusions: 7↔2, 0↔6, 1↔7, 5↔6
  // Try correcting future years
  if (year > maxValidYear) {
    const yearStr = String(year);
    // Try replacing 7 with 2 (most common: 2075 → 2025)
    const corrected7to2 = parseInt(yearStr.replace(/7/g, '2'));
    if (corrected7to2 >= minValidYear && corrected7to2 <= maxValidYear) {
      console.log(`Corrected OCR year: ${year} → ${corrected7to2}`);
      return corrected7to2;
    }
    // Try replacing just the first 7 after 20 (2075 → 2025)
    if (yearStr.startsWith('20')) {
      const correctedOnce = parseInt('20' + yearStr.slice(2).replace('7', '2'));
      if (correctedOnce >= minValidYear && correctedOnce <= maxValidYear) {
        console.log(`Corrected OCR year: ${year} → ${correctedOnce}`);
        return correctedOnce;
      }
    }
  }
  
  // If all corrections failed, return the original (will be flagged as potentially wrong)
  console.warn(`Unable to correct suspicious year: ${year}`);
  return year;
}

function parseAndFormatDate(dateStr: string): string | null {
  try {
    // Handle various date formats and convert to YYYY-MM-DD
    const months: Record<string, number> = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11,
    };
    
    // Try "01 Dec 2025" format
    const monthNameMatch = dateStr.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i);
    if (monthNameMatch) {
      const day = parseInt(monthNameMatch[1]);
      const month = months[monthNameMatch[2].toLowerCase()];
      let year = parseInt(monthNameMatch[3]);
      year = correctOcrYear(year);
      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    }
    
    // Try "01/12/2025" or "01-12-2025" format (DD/MM/YYYY)
    const slashMatch = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (slashMatch) {
      let day = parseInt(slashMatch[1]);
      let month = parseInt(slashMatch[2]) - 1;
      let year = parseInt(slashMatch[3]);
      
      // Handle 2-digit years
      if (year < 100) {
        year += year > 50 ? 1900 : 2000;
      }
      
      year = correctOcrYear(year);
      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    }
    
    return null;
  } catch {
    return null;
  }
}
