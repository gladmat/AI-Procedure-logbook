export interface HistologyData {
  histologyDiagnosis: string;
  peripheralMarginMm: number | null;
  deepMarginMm: number | null;
  excisionCompleteness: "complete" | "incomplete" | "uncertain";
  confidence: number;
}

const DIAGNOSIS_PATTERNS = [
  /(?:diagnosis|histological diagnosis|final diagnosis|microscopy|histopathology)[:\s]+([^\n]+)/gi,
  /(?:basal cell carcinoma|squamous cell carcinoma|melanoma|keratosis|naevus|nevus|lipoma|sebaceous cyst|bcc|scc)[^\n]*/gi,
];

const MARGIN_PATTERNS = [
  /(?:peripheral|lateral|circumferential)\s*(?:margin|margins?)[:\s]*(\d+(?:\.\d+)?)\s*(?:mm|millimetr)/gi,
  /(?:deep|base|inferior)\s*(?:margin|margins?)[:\s]*(\d+(?:\.\d+)?)\s*(?:mm|millimetr)/gi,
  /margin[s]?\s*(?:are|is)?\s*(?:clear|free)\s*(?:by)?\s*(\d+(?:\.\d+)?)\s*mm/gi,
  /(\d+(?:\.\d+)?)\s*mm\s*(?:peripheral|lateral|circumferential)/gi,
  /(\d+(?:\.\d+)?)\s*mm\s*(?:deep|base)/gi,
];

const COMPLETENESS_PATTERNS = {
  complete: [
    /(?:completely|fully)\s*(?:excised|removed)/gi,
    /excision\s*(?:is|appears?)\s*(?:complete|adequate)/gi,
    /margins?\s*(?:are|is)?\s*(?:clear|free|negative)/gi,
    /no\s*(?:residual|remaining)\s*(?:tumou?r|lesion)/gi,
    /clear\s*(?:of|from)\s*(?:tumou?r|margins?)/gi,
  ],
  incomplete: [
    /(?:incompletely|partially)\s*(?:excised|removed)/gi,
    /excision\s*(?:is|appears?)\s*(?:incomplete|inadequate)/gi,
    /margins?\s*(?:are|is)?\s*(?:involved|positive|not clear)/gi,
    /(?:tumou?r|lesion)\s*(?:extends?|present)\s*(?:at|to)\s*(?:the)?\s*margin/gi,
    /(?:close|narrow)\s*margins?/gi,
    /margin\s*(?:involvement|positive)/gi,
  ],
};

export function parseHistologyReport(text: string): HistologyData {
  const normalizedText = text.toLowerCase();
  
  let diagnosis = "";
  let peripheralMarginMm: number | null = null;
  let deepMarginMm: number | null = null;
  let excisionCompleteness: "complete" | "incomplete" | "uncertain" = "uncertain";
  let confidence = 0;
  
  for (const pattern of DIAGNOSIS_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      if (match[1]) {
        diagnosis = match[1].trim();
      } else {
        diagnosis = match[0].trim();
      }
      confidence += 0.3;
      break;
    }
    pattern.lastIndex = 0;
  }
  
  if (!diagnosis) {
    const diagnosisKeywords = [
      "basal cell carcinoma", "bcc",
      "squamous cell carcinoma", "scc",
      "melanoma",
      "keratosis", "actinic keratosis", "seborrheic keratosis",
      "naevus", "nevus", "melanocytic naevus",
      "lipoma",
      "sebaceous cyst", "epidermoid cyst",
      "dermatofibroma",
      "haemangioma", "hemangioma",
    ];
    
    for (const keyword of diagnosisKeywords) {
      if (normalizedText.includes(keyword)) {
        const startIndex = normalizedText.indexOf(keyword);
        const endIndex = Math.min(startIndex + 100, text.length);
        diagnosis = text.substring(startIndex, endIndex).split(/[.\n]/)[0].trim();
        confidence += 0.2;
        break;
      }
    }
  }
  
  const peripheralPatterns = [
    /(?:peripheral|lateral|circumferential)\s*(?:margin|margins?)[:\s]*(\d+(?:\.\d+)?)\s*(?:mm)/gi,
    /(\d+(?:\.\d+)?)\s*mm\s*(?:peripheral|lateral|circumferential)/gi,
    /(?:peripheral|lateral)\s*(?:clearance|distance)[:\s]*(\d+(?:\.\d+)?)\s*(?:mm)/gi,
  ];
  
  for (const pattern of peripheralPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      peripheralMarginMm = parseFloat(match[1]);
      confidence += 0.2;
      break;
    }
    pattern.lastIndex = 0;
  }
  
  const deepPatterns = [
    /(?:deep|base|inferior)\s*(?:margin|margins?)[:\s]*(\d+(?:\.\d+)?)\s*(?:mm)/gi,
    /(\d+(?:\.\d+)?)\s*mm\s*(?:deep|base)/gi,
    /(?:deep)\s*(?:clearance|distance)[:\s]*(\d+(?:\.\d+)?)\s*(?:mm)/gi,
  ];
  
  for (const pattern of deepPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      deepMarginMm = parseFloat(match[1]);
      confidence += 0.2;
      break;
    }
    pattern.lastIndex = 0;
  }
  
  if (peripheralMarginMm === null && deepMarginMm === null) {
    const genericMarginPattern = /(?:margin|margins?|clearance)[:\s]*(\d+(?:\.\d+)?)\s*(?:mm)/gi;
    const matches: number[] = [];
    let match;
    while ((match = genericMarginPattern.exec(text)) !== null) {
      matches.push(parseFloat(match[1]));
    }
    if (matches.length >= 2) {
      peripheralMarginMm = matches[0];
      deepMarginMm = matches[1];
      confidence += 0.1;
    } else if (matches.length === 1) {
      peripheralMarginMm = matches[0];
      confidence += 0.05;
    }
  }
  
  let incompleteScore = 0;
  let completeScore = 0;
  
  for (const pattern of COMPLETENESS_PATTERNS.complete) {
    if (pattern.test(normalizedText)) {
      completeScore++;
    }
    pattern.lastIndex = 0;
  }
  
  for (const pattern of COMPLETENESS_PATTERNS.incomplete) {
    if (pattern.test(normalizedText)) {
      incompleteScore++;
    }
    pattern.lastIndex = 0;
  }
  
  if (incompleteScore > completeScore) {
    excisionCompleteness = "incomplete";
    confidence += 0.2;
  } else if (completeScore > incompleteScore) {
    excisionCompleteness = "complete";
    confidence += 0.2;
  } else if (completeScore > 0 || incompleteScore > 0) {
    excisionCompleteness = "uncertain";
    confidence += 0.1;
  }
  
  confidence = Math.min(confidence, 1);
  
  return {
    histologyDiagnosis: diagnosis,
    peripheralMarginMm,
    deepMarginMm,
    excisionCompleteness,
    confidence,
  };
}
