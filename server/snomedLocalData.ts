/**
 * Local SNOMED CT Reference Data
 * 
 * Contains common surgical diagnoses and procedures with SNOMED CT codes
 * Used as fallback when Snowstorm API is unavailable
 */

export interface LocalSnomedConcept {
  conceptId: string;
  term: string;
  fsn: string;
  semanticTag: string;
  specialty?: string[];
}

// Common surgical diagnoses with SNOMED CT codes
export const localDiagnoses: LocalSnomedConcept[] = [
  // Hand Surgery / Dupuytren's
  { conceptId: "79426006", term: "Dupuytren contracture", fsn: "Dupuytren's contracture (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  { conceptId: "240078005", term: "Dupuytren disease of palm", fsn: "Dupuytren's disease of palm (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  
  // Carpal tunnel
  { conceptId: "57406009", term: "Carpal tunnel syndrome", fsn: "Carpal tunnel syndrome (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  { conceptId: "230791009", term: "Cubital tunnel syndrome", fsn: "Cubital tunnel syndrome (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  
  // Hand fractures
  { conceptId: "65966004", term: "Fracture of hand", fsn: "Fracture of hand (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  { conceptId: "16114001", term: "Fracture of finger", fsn: "Fracture of finger (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  { conceptId: "81576005", term: "Fracture of thumb", fsn: "Fracture of thumb (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  { conceptId: "46325003", term: "Fracture of metacarpal bone", fsn: "Fracture of metacarpal bone (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  { conceptId: "263102004", term: "Fracture of scaphoid", fsn: "Fracture of scaphoid (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  { conceptId: "71555007", term: "Fracture of radius", fsn: "Fracture of radius (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  { conceptId: "77910004", term: "Fracture of distal radius", fsn: "Fracture of distal end of radius (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  
  // Hand soft tissue injuries
  { conceptId: "125668000", term: "Tendon laceration", fsn: "Laceration of tendon (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  { conceptId: "282020008", term: "Flexor tendon injury", fsn: "Flexor tendon injury of hand (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  { conceptId: "282021007", term: "Extensor tendon injury", fsn: "Extensor tendon injury of hand (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  { conceptId: "262533007", term: "Digital nerve injury", fsn: "Injury of digital nerve (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  { conceptId: "81654000", term: "Traumatic amputation of finger", fsn: "Traumatic amputation of finger (disorder)", semanticTag: "disorder", specialty: ["hand_trauma", "free_flap"] },
  { conceptId: "283021007", term: "Crush injury of hand", fsn: "Crush injury of hand (disorder)", semanticTag: "disorder", specialty: ["hand_trauma"] },
  
  // Open fractures (Gustilo-Anderson)
  { conceptId: "397181002", term: "Open fracture", fsn: "Open fracture (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  { conceptId: "22640007", term: "Open fracture of tibia", fsn: "Open fracture of tibia (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  { conceptId: "21947006", term: "Open fracture of fibula", fsn: "Open fracture of fibula (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  { conceptId: "46866001", term: "Open fracture of femur", fsn: "Open fracture of femur (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  { conceptId: "263225007", term: "Open fracture of humerus", fsn: "Open fracture of humerus (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  
  // Lower limb trauma
  { conceptId: "26294005", term: "Lower limb soft tissue injury", fsn: "Injury of soft tissue of lower limb (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  { conceptId: "125597005", term: "Open wound of leg", fsn: "Open wound of leg (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  { conceptId: "301755002", term: "Soft tissue defect", fsn: "Soft tissue defect (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  
  // Cancer / Oncology
  { conceptId: "372244006", term: "Malignant melanoma", fsn: "Malignant melanoma (disorder)", semanticTag: "disorder", specialty: ["free_flap", "aesthetics"] },
  { conceptId: "93655004", term: "Melanoma of skin", fsn: "Malignant melanoma of skin (disorder)", semanticTag: "disorder", specialty: ["free_flap", "aesthetics"] },
  { conceptId: "254837009", term: "Squamous cell carcinoma of skin", fsn: "Squamous cell carcinoma of skin (disorder)", semanticTag: "disorder", specialty: ["free_flap", "aesthetics"] },
  { conceptId: "254701007", term: "Basal cell carcinoma of skin", fsn: "Basal cell carcinoma of skin (disorder)", semanticTag: "disorder", specialty: ["aesthetics"] },
  { conceptId: "363402007", term: "Breast cancer", fsn: "Malignant tumor of breast (disorder)", semanticTag: "disorder", specialty: ["free_flap", "aesthetics"] },
  { conceptId: "428061005", term: "Head and neck cancer", fsn: "Malignant neoplasm of head and neck (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  { conceptId: "363505006", term: "Oral cavity cancer", fsn: "Malignant neoplasm of oral cavity (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  { conceptId: "89155008", term: "Soft tissue sarcoma", fsn: "Soft tissue sarcoma (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  
  // Burns
  { conceptId: "48333001", term: "Burn injury", fsn: "Burn (disorder)", semanticTag: "disorder", specialty: ["burns"] },
  { conceptId: "262552009", term: "Thermal burn of skin", fsn: "Thermal burn of skin (disorder)", semanticTag: "disorder", specialty: ["burns"] },
  { conceptId: "125669008", term: "Chemical burn of skin", fsn: "Chemical burn of skin (disorder)", semanticTag: "disorder", specialty: ["burns"] },
  { conceptId: "274289000", term: "Electrical burn", fsn: "Electrical burn (disorder)", semanticTag: "disorder", specialty: ["burns"] },
  { conceptId: "39065001", term: "Burn contracture", fsn: "Burn contracture (disorder)", semanticTag: "disorder", specialty: ["burns"] },
  
  // Body contouring indications
  { conceptId: "408512008", term: "Post-bariatric skin redundancy", fsn: "Excessive skin following weight loss (finding)", semanticTag: "finding", specialty: ["body_contouring"] },
  { conceptId: "248312003", term: "Abdominal skin laxity", fsn: "Lax abdominal skin (finding)", semanticTag: "finding", specialty: ["body_contouring"] },
  { conceptId: "299731006", term: "Lipodystrophy", fsn: "Lipodystrophy (disorder)", semanticTag: "disorder", specialty: ["body_contouring"] },
  { conceptId: "248313008", term: "Breast ptosis", fsn: "Ptosis of breast (finding)", semanticTag: "finding", specialty: ["body_contouring", "aesthetics"] },
  { conceptId: "22253000", term: "Gynecomastia", fsn: "Gynecomastia (disorder)", semanticTag: "disorder", specialty: ["body_contouring", "aesthetics"] },
  
  // Aesthetics
  { conceptId: "429047008", term: "Nasal deformity", fsn: "Deformity of nose (disorder)", semanticTag: "disorder", specialty: ["aesthetics"] },
  { conceptId: "74732009", term: "Deviated nasal septum", fsn: "Deviated nasal septum (disorder)", semanticTag: "disorder", specialty: ["aesthetics"] },
  { conceptId: "45378006", term: "Blepharochalasis", fsn: "Blepharochalasis (disorder)", semanticTag: "disorder", specialty: ["aesthetics"] },
  { conceptId: "11934000", term: "Facial asymmetry", fsn: "Facial asymmetry (finding)", semanticTag: "finding", specialty: ["aesthetics"] },
  { conceptId: "248317009", term: "Breast asymmetry", fsn: "Asymmetry of breasts (finding)", semanticTag: "finding", specialty: ["aesthetics"] },
  { conceptId: "61577009", term: "Breast hypoplasia", fsn: "Hypoplasia of breast (disorder)", semanticTag: "disorder", specialty: ["aesthetics"] },
  
  // Reconstructive
  { conceptId: "44767006", term: "Cleft lip", fsn: "Cleft lip (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  { conceptId: "87979003", term: "Cleft palate", fsn: "Cleft palate (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  { conceptId: "78996003", term: "Pressure ulcer", fsn: "Pressure ulcer (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  { conceptId: "271579005", term: "Chronic wound", fsn: "Chronic wound (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
  { conceptId: "416462003", term: "Wound healing disorder", fsn: "Wound healing disorder (disorder)", semanticTag: "disorder", specialty: ["free_flap"] },
];

// Common surgical procedures with SNOMED CT codes  
export const localProcedures: LocalSnomedConcept[] = [
  // Free Flaps
  { conceptId: "36388007", term: "Free flap reconstruction", fsn: "Free tissue transfer (procedure)", semanticTag: "procedure", specialty: ["free_flap"] },
  { conceptId: "234250009", term: "Anterolateral thigh flap", fsn: "Anterolateral thigh flap procedure (procedure)", semanticTag: "procedure", specialty: ["free_flap"] },
  { conceptId: "234243008", term: "Free radial forearm flap", fsn: "Free radial forearm flap procedure (procedure)", semanticTag: "procedure", specialty: ["free_flap"] },
  { conceptId: "234240006", term: "Free latissimus dorsi flap", fsn: "Free latissimus dorsi muscle flap (procedure)", semanticTag: "procedure", specialty: ["free_flap"] },
  { conceptId: "234244002", term: "Free fibula flap", fsn: "Free fibula osteocutaneous flap (procedure)", semanticTag: "procedure", specialty: ["free_flap"] },
  { conceptId: "234242003", term: "Free rectus abdominis flap", fsn: "Free rectus abdominis muscle flap (procedure)", semanticTag: "procedure", specialty: ["free_flap"] },
  { conceptId: "234245001", term: "Free gracilis flap", fsn: "Free gracilis muscle flap (procedure)", semanticTag: "procedure", specialty: ["free_flap"] },
  { conceptId: "234251008", term: "Deep inferior epigastric artery perforator flap", fsn: "DIEP flap procedure (procedure)", semanticTag: "procedure", specialty: ["free_flap"] },
  { conceptId: "234253006", term: "Superficial inferior epigastric artery flap", fsn: "SIEA flap procedure (procedure)", semanticTag: "procedure", specialty: ["free_flap"] },
  { conceptId: "234247009", term: "Scapular free flap", fsn: "Scapular flap (procedure)", semanticTag: "procedure", specialty: ["free_flap"] },
  
  // Microsurgery
  { conceptId: "83020009", term: "Microvascular anastomosis", fsn: "Microvascular anastomosis (procedure)", semanticTag: "procedure", specialty: ["free_flap", "hand_trauma"] },
  { conceptId: "396022006", term: "Microvascular repair of artery", fsn: "Microvascular repair of artery (procedure)", semanticTag: "procedure", specialty: ["free_flap", "hand_trauma"] },
  { conceptId: "396023001", term: "Microvascular repair of vein", fsn: "Microvascular repair of vein (procedure)", semanticTag: "procedure", specialty: ["free_flap", "hand_trauma"] },
  { conceptId: "79544006", term: "Replantation of digit", fsn: "Replantation of digit (procedure)", semanticTag: "procedure", specialty: ["hand_trauma"] },
  { conceptId: "79733001", term: "Revascularization of digit", fsn: "Revascularization of digit (procedure)", semanticTag: "procedure", specialty: ["hand_trauma"] },
  
  // Hand Surgery
  { conceptId: "42128001", term: "Carpal tunnel release", fsn: "Carpal tunnel release (procedure)", semanticTag: "procedure", specialty: ["hand_trauma"] },
  { conceptId: "234185005", term: "Cubital tunnel release", fsn: "Cubital tunnel decompression (procedure)", semanticTag: "procedure", specialty: ["hand_trauma"] },
  { conceptId: "234152006", term: "Fasciectomy for Dupuytren", fsn: "Fasciectomy for Dupuytren's contracture (procedure)", semanticTag: "procedure", specialty: ["hand_trauma"] },
  { conceptId: "234153001", term: "Needle fasciotomy for Dupuytren", fsn: "Needle fasciotomy for Dupuytren's contracture (procedure)", semanticTag: "procedure", specialty: ["hand_trauma"] },
  { conceptId: "40701008", term: "Tendon repair", fsn: "Repair of tendon (procedure)", semanticTag: "procedure", specialty: ["hand_trauma"] },
  { conceptId: "9279006", term: "Flexor tendon repair", fsn: "Repair of flexor tendon (procedure)", semanticTag: "procedure", specialty: ["hand_trauma"] },
  { conceptId: "234200002", term: "Extensor tendon repair", fsn: "Repair of extensor tendon (procedure)", semanticTag: "procedure", specialty: ["hand_trauma"] },
  { conceptId: "12295000", term: "Tendon transfer", fsn: "Tendon transfer procedure (procedure)", semanticTag: "procedure", specialty: ["hand_trauma"] },
  { conceptId: "79386008", term: "Nerve repair", fsn: "Repair of nerve (procedure)", semanticTag: "procedure", specialty: ["hand_trauma", "free_flap"] },
  { conceptId: "234207004", term: "Nerve graft", fsn: "Nerve graft procedure (procedure)", semanticTag: "procedure", specialty: ["hand_trauma", "free_flap"] },
  { conceptId: "234180000", term: "Digital nerve repair", fsn: "Repair of digital nerve (procedure)", semanticTag: "procedure", specialty: ["hand_trauma"] },
  { conceptId: "179097009", term: "ORIF of fracture", fsn: "Open reduction and internal fixation (procedure)", semanticTag: "procedure", specialty: ["hand_trauma"] },
  { conceptId: "399069007", term: "K-wire fixation", fsn: "Kirschner wire fixation (procedure)", semanticTag: "procedure", specialty: ["hand_trauma"] },
  
  // Skin grafts
  { conceptId: "4365001", term: "Split thickness skin graft", fsn: "Split thickness skin graft (procedure)", semanticTag: "procedure", specialty: ["burns", "free_flap"] },
  { conceptId: "57502009", term: "Full thickness skin graft", fsn: "Full thickness skin graft (procedure)", semanticTag: "procedure", specialty: ["hand_trauma", "aesthetics"] },
  
  // Aesthetics
  { conceptId: "35863004", term: "Rhinoplasty", fsn: "Rhinoplasty (procedure)", semanticTag: "procedure", specialty: ["aesthetics"] },
  { conceptId: "172883008", term: "Blepharoplasty", fsn: "Blepharoplasty (procedure)", semanticTag: "procedure", specialty: ["aesthetics"] },
  { conceptId: "51771006", term: "Rhytidectomy", fsn: "Rhytidectomy (procedure)", semanticTag: "procedure", specialty: ["aesthetics"] },
  { conceptId: "234244002", term: "Breast augmentation", fsn: "Augmentation mammoplasty (procedure)", semanticTag: "procedure", specialty: ["aesthetics"] },
  { conceptId: "234247009", term: "Breast reduction", fsn: "Reduction mammoplasty (procedure)", semanticTag: "procedure", specialty: ["aesthetics", "body_contouring"] },
  { conceptId: "234245001", term: "Mastopexy", fsn: "Mastopexy (procedure)", semanticTag: "procedure", specialty: ["aesthetics"] },
  { conceptId: "302388006", term: "Liposuction", fsn: "Liposuction (procedure)", semanticTag: "procedure", specialty: ["aesthetics", "body_contouring"] },
  { conceptId: "172829002", term: "Otoplasty", fsn: "Otoplasty (procedure)", semanticTag: "procedure", specialty: ["aesthetics"] },
  
  // Body contouring
  { conceptId: "46963002", term: "Abdominoplasty", fsn: "Abdominoplasty (procedure)", semanticTag: "procedure", specialty: ["body_contouring"] },
  { conceptId: "234203000", term: "Panniculectomy", fsn: "Panniculectomy (procedure)", semanticTag: "procedure", specialty: ["body_contouring"] },
  { conceptId: "234204006", term: "Brachioplasty", fsn: "Brachioplasty (procedure)", semanticTag: "procedure", specialty: ["body_contouring"] },
  { conceptId: "234205007", term: "Thigh lift", fsn: "Thighplasty (procedure)", semanticTag: "procedure", specialty: ["body_contouring"] },
  { conceptId: "234206008", term: "Body lift", fsn: "Body lift procedure (procedure)", semanticTag: "procedure", specialty: ["body_contouring"] },
  
  // Burns
  { conceptId: "68842005", term: "Escharotomy", fsn: "Escharotomy (procedure)", semanticTag: "procedure", specialty: ["burns"] },
  { conceptId: "119954001", term: "Burn excision", fsn: "Excision of burn (procedure)", semanticTag: "procedure", specialty: ["burns"] },
  { conceptId: "397619005", term: "Burn debridement", fsn: "Debridement of burn wound (procedure)", semanticTag: "procedure", specialty: ["burns"] },
  { conceptId: "234202005", term: "Burn contracture release", fsn: "Release of burn contracture (procedure)", semanticTag: "procedure", specialty: ["burns"] },
  
  // General
  { conceptId: "129303007", term: "Excision of lesion", fsn: "Excision of lesion (procedure)", semanticTag: "procedure", specialty: ["general"] },
  { conceptId: "234129000", term: "Wide local excision", fsn: "Wide local excision of lesion (procedure)", semanticTag: "procedure", specialty: ["general", "free_flap"] },
  { conceptId: "274025005", term: "Debridement", fsn: "Debridement (procedure)", semanticTag: "procedure", specialty: ["general", "burns"] },
  { conceptId: "86431000", term: "Local flap", fsn: "Local flap procedure (procedure)", semanticTag: "procedure", specialty: ["general", "hand_trauma"] },
  { conceptId: "178267008", term: "Sentinel lymph node biopsy", fsn: "Sentinel lymph node biopsy (procedure)", semanticTag: "procedure", specialty: ["free_flap"] },
];

/**
 * Search local diagnoses
 * Returns specialty-matched results first, then all other matches if needed
 */
export function searchLocalDiagnoses(
  query: string,
  specialty?: string,
  limit: number = 20
): LocalSnomedConcept[] {
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  // Find all query matches
  const allMatches = localDiagnoses.filter((diagnosis) => {
    const text = `${diagnosis.term} ${diagnosis.fsn}`.toLowerCase();
    return searchTerms.every(term => text.includes(term));
  });
  
  // If specialty provided, try to prioritize specialty matches
  if (specialty && specialty !== "general") {
    const specialtyMatches = allMatches.filter(d => d.specialty?.includes(specialty));
    if (specialtyMatches.length > 0) {
      // Return specialty matches first, then others
      const otherMatches = allMatches.filter(d => !d.specialty?.includes(specialty));
      return [...specialtyMatches, ...otherMatches].slice(0, limit);
    }
  }
  
  // Return all matches if no specialty filtering or no specialty matches
  return allMatches.slice(0, limit);
}

/**
 * Search local procedures
 */
export function searchLocalProcedures(
  query: string,
  specialty?: string,
  limit: number = 20
): LocalSnomedConcept[] {
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  return localProcedures
    .filter((procedure) => {
      // Check if all search terms match
      const text = `${procedure.term} ${procedure.fsn}`.toLowerCase();
      const matchesQuery = searchTerms.every(term => text.includes(term));
      
      // Filter by specialty if provided
      const matchesSpecialty = !specialty || 
        specialty === "general" || 
        procedure.specialty?.includes(specialty);
      
      return matchesQuery && matchesSpecialty;
    })
    .slice(0, limit);
}
