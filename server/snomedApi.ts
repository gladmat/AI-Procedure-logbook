/**
 * SNOMED CT Snowstorm API Client
 * Uses the public SNOMED International Terminology Server
 * https://snowstorm.ihtsdotools.org/
 */

const SNOWSTORM_BASE_URL = "https://snowstorm.ihtsdotools.org/snowstorm/snomed-ct";
const EDITION = "MAIN"; // International Edition
const VERSION = "MAIN"; // Latest version

// SNOMED CT Concept IDs for key hierarchies
const SNOMED_HIERARCHIES = {
  PROCEDURE: "71388002", // Procedure (procedure)
  CLINICAL_FINDING: "404684003", // Clinical finding (finding)
  BODY_STRUCTURE: "123037004", // Body structure (body structure)
};

// Specialty-related ECL filters for surgical procedures
const SPECIALTY_ECL_FILTERS: Record<string, string> = {
  free_flap: `<<71388002 AND (*:{ 260686004 = <<74964007 OR 363704007 = <<91723000 })`, // Procedures involving tissue transfer
  hand_trauma: `<<71388002 AND (*:{ 363704007 = <<85562004 OR 363704007 = <<53120007 })`, // Hand/finger procedures
  body_contouring: `<<71388002 AND (*:{ 260686004 = <<129303007 })`, // Excision procedures
  burns: `<<71388002 AND (*:{ 405813007 = <<48333001 OR 260686004 = <<129303007 })`, // Burn-related procedures
  aesthetics: `<<71388002 AND (*:{ 363704007 = <<76752008 OR 363704007 = <<181895009 })`, // Face/breast procedures
  general: `<<71388002`, // All procedures
};

// Simplified specialty keyword filters (more reliable than complex ECL)
const SPECIALTY_KEYWORDS: Record<string, string[]> = {
  free_flap: ["flap", "microsurgery", "anastomosis", "transplant", "graft", "reconstruction", "replant"],
  hand_trauma: ["hand", "finger", "wrist", "carpal", "tendon", "nerve repair", "digit"],
  body_contouring: ["liposuction", "abdominoplasty", "lipectomy", "dermolipectomy", "brachioplasty", "thigh lift"],
  burns: ["burn", "escharotomy", "skin graft", "debridement"],
  aesthetics: ["rhinoplasty", "blepharoplasty", "facelift", "rhytidectomy", "breast augmentation", "mammoplasty"],
  general: [], // No filter - search all
};

// Diagnosis keywords by specialty
const DIAGNOSIS_KEYWORDS: Record<string, string[]> = {
  free_flap: ["defect", "wound", "trauma", "cancer", "carcinoma", "sarcoma", "necrosis", "injury"],
  hand_trauma: ["fracture", "laceration", "amputation", "tendon injury", "nerve injury", "crush", "avulsion", "dupuytren"],
  body_contouring: ["redundant skin", "lipodystrophy", "ptosis", "laxity"],
  burns: ["burn", "scald", "thermal injury"],
  aesthetics: ["asymmetry", "ptosis", "deformity"],
  general: [],
};

export interface SnomedSearchResult {
  conceptId: string;
  term: string;
  fsn: string; // Fully Specified Name
  active: boolean;
  semanticTag?: string;
}

export interface SnomedConceptDetail {
  conceptId: string;
  fsn: string;
  preferredTerm: string;
  synonyms: string[];
  parents: { conceptId: string; term: string }[];
  children: { conceptId: string; term: string }[];
}

/**
 * Search SNOMED CT for procedures
 */
export async function searchProcedures(
  query: string,
  specialty?: string,
  limit: number = 20
): Promise<SnomedSearchResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Build search term with specialty keywords if provided
    let searchTerm = query;
    const keywords = specialty && SPECIALTY_KEYWORDS[specialty];
    
    // Use ECL to restrict to Procedure hierarchy
    const ecl = `<<${SNOMED_HIERARCHIES.PROCEDURE}`;
    
    const params = new URLSearchParams({
      term: searchTerm,
      ecl: ecl,
      activeFilter: "true",
      limit: String(limit),
      offset: "0",
      conceptActive: "true",
      language: "en",
      preferredOrAcceptableIn: "900000000000509007", // US English
    });

    const response = await fetch(
      `${SNOWSTORM_BASE_URL}/browser/${EDITION}/${VERSION}/descriptions?${params.toString()}`,
      {
        headers: {
          "Accept": "application/json",
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      console.error("SNOMED API error:", response.status, await response.text());
      return [];
    }

    const data = await response.json();
    
    // Map results to our format
    const results: SnomedSearchResult[] = (data.items || []).map((item: any) => ({
      conceptId: item.concept?.conceptId || item.conceptId,
      term: item.term,
      fsn: item.concept?.fsn?.term || item.term,
      active: item.active ?? true,
      semanticTag: extractSemanticTag(item.concept?.fsn?.term || ""),
    }));

    // Filter by specialty keywords if provided
    if (keywords && keywords.length > 0) {
      return results.filter((r) => 
        keywords.some((kw) => 
          r.term.toLowerCase().includes(kw.toLowerCase()) ||
          r.fsn.toLowerCase().includes(kw.toLowerCase())
        )
      ).slice(0, limit);
    }

    return results;
  } catch (error) {
    console.error("Error searching SNOMED procedures:", error);
    return [];
  }
}

/**
 * Search SNOMED CT for diagnoses (clinical findings)
 */
export async function searchDiagnoses(
  query: string,
  specialty?: string,
  limit: number = 20
): Promise<SnomedSearchResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Use ECL to restrict to Clinical Finding hierarchy
    const ecl = `<<${SNOMED_HIERARCHIES.CLINICAL_FINDING}`;
    
    const params = new URLSearchParams({
      term: query,
      ecl: ecl,
      activeFilter: "true",
      limit: String(limit),
      offset: "0",
      conceptActive: "true",
      language: "en",
      preferredOrAcceptableIn: "900000000000509007", // US English
    });

    const response = await fetch(
      `${SNOWSTORM_BASE_URL}/browser/${EDITION}/${VERSION}/descriptions?${params.toString()}`,
      {
        headers: {
          "Accept": "application/json",
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      console.error("SNOMED API error:", response.status, await response.text());
      return [];
    }

    const data = await response.json();
    
    // Map results to our format
    const results: SnomedSearchResult[] = (data.items || []).map((item: any) => ({
      conceptId: item.concept?.conceptId || item.conceptId,
      term: item.term,
      fsn: item.concept?.fsn?.term || item.term,
      active: item.active ?? true,
      semanticTag: extractSemanticTag(item.concept?.fsn?.term || ""),
    }));

    // Filter by specialty keywords if provided
    const keywords = specialty && DIAGNOSIS_KEYWORDS[specialty];
    if (keywords && keywords.length > 0) {
      const filtered = results.filter((r) => 
        keywords.some((kw) => 
          r.term.toLowerCase().includes(kw.toLowerCase()) ||
          r.fsn.toLowerCase().includes(kw.toLowerCase())
        )
      );
      // Return filtered if we have results, otherwise return all
      if (filtered.length > 0) {
        return filtered.slice(0, limit);
      }
    }

    return results;
  } catch (error) {
    console.error("Error searching SNOMED diagnoses:", error);
    return [];
  }
}

/**
 * Get concept details by ID
 */
export async function getConceptDetails(conceptId: string): Promise<SnomedConceptDetail | null> {
  try {
    const response = await fetch(
      `${SNOWSTORM_BASE_URL}/browser/${EDITION}/${VERSION}/concepts/${conceptId}`,
      {
        headers: {
          "Accept": "application/json",
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      console.error("SNOMED API error:", response.status);
      return null;
    }

    const data = await response.json();
    
    return {
      conceptId: data.conceptId,
      fsn: data.fsn?.term || "",
      preferredTerm: data.pt?.term || "",
      synonyms: (data.descriptions || [])
        .filter((d: any) => d.type === "SYNONYM" && d.active)
        .map((d: any) => d.term),
      parents: [], // Would need separate call
      children: [], // Would need separate call
    };
  } catch (error) {
    console.error("Error fetching concept details:", error);
    return null;
  }
}

/**
 * Extract semantic tag from FSN (e.g., "(procedure)" from "Repair of tendon (procedure)")
 */
function extractSemanticTag(fsn: string): string {
  const match = fsn.match(/\(([^)]+)\)$/);
  return match ? match[1] : "";
}
