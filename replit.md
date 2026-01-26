# Surgical Logbook

## Overview

Surgical Logbook is a **privacy-first** mobile application for surgeons to document surgical procedures, particularly focusing on microsurgery and free flap reconstruction. Its core purpose is to enable efficient case logging through **intelligent local document parsing** from operation notes while ensuring **complete patient confidentiality**. The application integrates comprehensive RACS MALT (Royal Australasian College of Surgeons Morbidity Audit and Logbook Tool) fields for detailed audit and logging.

**Privacy Architecture:**
- **Web platform**: 100% on-device OCR using Tesseract.js - no patient data leaves the device
- **Mobile (Expo Go)**: Images sent to app server for OCR processing only (Tesseract.js doesn't run natively on React Native), then immediately discarded - parsed text processed locally with no external cloud AI
- **No external cloud AI services**: All document parsing uses local regex patterns, never Gemini/OpenAI

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2026)

### Skin Lesion Histology Capture (Latest)
- **Automated Histology Report Capture**: New workflow for skin lesion excision procedures to capture and analyze histology reports
- **Camera-based Capture**: Use device camera or photo library to capture histology report images
- **OCR Text Extraction**: On-device Tesseract.js extracts text from histology report images
- **Pattern-based Data Extraction**: Local regex patterns extract:
  - Histology diagnosis (e.g., "Basal cell carcinoma, nodular type")
  - Peripheral margin (mm)
  - Deep margin (mm)
  - Excision completeness (complete/incomplete/uncertain)
- **Confidence Indicator**: Shows extraction confidence level (high/medium/low) to guide user verification
- **Manual Confirmation Required**: Extracted data is ALWAYS presented for user review before saving
- **Navigation Flow**: CaseDetail → AddTimelineEvent (follow-up visit) → HistologyCapture → Confirm & Save
- **Skin Lesion Detection**: Automatically shows histology capture option for procedures matching keywords:
  - skin lesion excision, wide local excision, excision biopsy
  - BCC, SCC, melanoma, basal cell, squamous cell

### Standardized Facility Selection
- **Master Hospital List**: Curated database of verified hospitals organized by country (currently New Zealand with 80+ hospitals)
- **Regional Organization**: Hospitals grouped by region (Auckland, Waikato, Bay of Plenty, Wellington, Canterbury, etc.)
- **Hospital Types**: Public and private facilities distinguished with filtering capability
- **FacilitySelector Component**: Full-screen modal with search, region filter, and type filter
- **My Hospitals Management**: Users select their operating facilities in Settings from the verified list
- **Case Form Integration**: Only user's selected hospitals appear in the case form dropdown
- **Data Consistency**: Prevents free-text facility name variations across users
- **Backwards Compatible**: Legacy free-text facilities still supported via optional facilityId field

### Fracture Case Workflow
- **Streamlined Documentation**: New "Fracture Case" checkbox in Hand Surgery triggers the AO picker automatically
- **Auto-SNOMED Suggestion**: After AO code selection, automatically suggests SNOMED CT diagnosis based on fracture type
- **AO-to-SNOMED Mapping**: Intelligent mapping covers all carpal bones, metacarpals, phalanges with special handling for:
  - Bennett's/Rolando fractures (thumb metacarpal base)
  - Boxer's fracture (5th metacarpal)
  - Mallet finger (distal phalanx avulsion)
  - Scaphoid fractures with waist/pole qualifications
- **Workflow Flow**: Check "Fracture Case" → AO picker opens → Select fracture → SNOMED auto-populates → Continue documenting

### AO/OTA Fracture Classification System
- **Dynamic Cascading Form**: Replaced graphical bone picker with a clean table-based form that reveals fields as you make selections
- **AO Region 7 Coverage**: Complete AO/OTA 2018 Hand & Carpus classification:
  - Carpal bones (71-76): Lunate, Scaphoid, Capitate, Hamate, Trapezium, Pisiform, Triquetrum, Trapezoid
  - Metacarpals (77): All 5 metacarpals with segment-based typing (base/shaft/head)
  - Phalanges (78): Proximal, middle, and distal phalanges for all fingers
  - Crush/Multiple (79): Single code for complex hand injuries
- **Cascading Selection Flow**: Dynamic form that adapts based on bone type:
  - Step 1: Bone category (Carpal/Metacarpal/Phalanx/Crush)
  - Step 2: Specific bone selection (based on category)
  - Step 3: Finger/phalanx selection (for metacarpals/phalanges)
  - Step 4: Fracture location (Base/Shaft/Head for long bones)
  - Step 5: Fracture type (A/B/C with descriptive labels)
  - Step 6: Scaphoid qualification (proximal pole/waist/distal pole) when applicable
- **Real-time AO Code Preview**: Code builds dynamically at top of form as selections are made, with validation indicator
- **Multi-Fracture Support**: Add multiple fractures per case, view/manage list, stored as FractureEntry array
- **Hand Surgery Clinical Fields**: Affected hand, dominant hand, injury mechanism, nerve status, tendon injuries

### 100% Offline Smart Capture (Privacy-First Architecture)
- **Complete Offline Processing**: Replaced all cloud AI (Gemini/OpenAI) with local regex-based document parsers
- **Tesseract.js OCR**: On-device text extraction runs entirely in browser/mobile app, no server required
- **Document Router System**: Intelligent classification and parsing based on document type:
  - `DocumentClassifier.ts`: Detects document type using trigger keywords (e.g., "DISCHARGE SUMMARY" + "WAIKATO")
  - `waikatoDischarge.ts`: Extracts NHI, ACC/funding status, admission/discharge dates, surgeon, diagnosis
  - `anaesthesiaRecord.ts`: Extracts ASA score, weight, height, tourniquet time, anaesthetic type, blood loss
  - `operationNote.ts`: Extracts procedure name, surgeon, team, diagnosis, findings, closure, times
  - `genericParser.ts`: Fallback for unrecognized document formats
- **Document Type Badge**: UI displays detected document type with confidence indicator (high/medium/low)
- **Auto-Filled Field Indicators**: Yellow border styling on auto-filled fields with undo buttons
- **Pre-Redaction Extraction**: Patient ID (NHI) and procedure date are extracted locally
- **Auto-SNOMED Lookup**: Diagnosis and procedure names trigger automatic SNOMED CT search
- **No Cloud Dependencies**: Patient data never leaves the device - 100% privacy guaranteed

### RACS MALT Supervision Levels
- **Role Alignment**: Updated to use official RACS MALT supervision level codes:
  - PS: Primary Surgeon
  - PP: Performed with Peer (complex/combined procedures)
  - AS: Assisting (scrubbed)
  - ONS: Observing (not scrubbed)
  - SS: Supervising (scrubbed) - at table, actively training
  - SNS: Supervising (not scrubbed) - in theatre, able to advise
  - A: Available (by telephone)
- **Info Modal**: Tapping info button next to "Your Role" shows detailed descriptions for each supervision level
- **Personal Role Tracking**: Simplified approach marks your own role rather than complex team assignments

### Anatomical/Clinical Specialty Categories (Latest)
- **Specialty Restructure**: Categories now reflect anatomical/clinical areas rather than procedure types:
  - Breast, Body Contouring, Aesthetics, Hand Surgery, Orthoplastic, Burns, General, Head & Neck
- **Procedure Tags System**: Cross-specialty categorization with 13 tags:
  - Free Flap, Pedicled Flap, Local Flap, Skin Graft, Microsurgery, Replant
  - Nerve Repair, Tendon Repair, Oncological, Trauma, Elective, Revision, Complex Wound
- **Tag Selection UI**: Multi-select chip interface in procedure entry form for tagging
- **Tag-Based Statistics**: Statistics calculations now use procedure tags for cross-specialty analytics

### Dynamic Statistics Dashboard
- **Specialty-Aware Analytics**: Dashboard shows statistics that change based on selected specialty tab
- **Multi-Filter System**: Filter statistics by:
  - Specialty (All, Breast, Body Contouring, Aesthetics, Hand Surgery, Orthoplastic, Burns, General, Head & Neck)
  - Time Period (This Year, Last 6 Months, Last 12 Months, All Time)
  - Facility (all facilities or specific facility)
  - Role (All Roles, PS, PP, AS, ONS, SS, SNS, A)
- **Base Statistics Cards**: Total cases, average duration, complication rate, follow-up completion rate
- **Specialty-Specific Metrics**:
  - Orthoplastic: Free flap count, average ischemia time, cases by coverage type
  - Hand Surgery: Nerve repair count, tendon repair count, cases by procedure type
  - Body Contouring: Average resection weight
  - Breast: Reconstruction count, cases by procedure type
- **Visual Analytics**: Bar chart showing cases over time, breakdown charts by procedure type
- **Role-Aware Duration Stats**: Teaching cases filtered separately from primary surgeon cases for meaningful time comparisons
- **Recent Cases Section**: Shows last 5 cases matching current filters

### Enhanced Follow-up Timeline System
- **Patient Search**: Cases screen includes instant search bar filtering by NHI, procedure type, and facility
- **Extended Timeline Events**: Photo, Imaging, PROM, Note, Complication, Follow-up Visit entry types
- **Flexible Follow-up Intervals**: 6 weeks, 12 weeks, 6 months, 1 year, custom intervals
- **MediaCapture Component**: Camera capture and gallery selection for photos/X-rays
- **PROMEntryForm Component**: DASH, Michigan Hand, SF-36, EQ-5D, BREAST-Q questionnaires

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation (native stack and bottom tabs)
- **State Management**: TanStack React Query for server state, local component state for UI
- **Styling**: React Native StyleSheet with custom theme (light/dark mode)
- **Animations**: React Native Reanimated
- **Local Storage**: AsyncStorage for cases, timeline events, and settings

### Backend Architecture
- **Runtime**: Express.js server with TypeScript
- **API Design**: RESTful endpoints for SNOMED CT lookups and document processing
- **Document Router**: Local regex-based parsers for surgical document extraction (no cloud AI required)

### Data Model
- **Local-first Architecture**: Patient data stored locally with encryption. No external cloud AI services used.
- **Flexible JSON Payload**: Cases use a flexible JSON structure for `clinical_details` to support various surgical specialties without schema changes.
- **Core Case Fields**: Includes patient demographics, admission details, diagnoses, co-morbidities, risk factors, operative factors, surgery timing, operating team, procedure codes (SNOMED CT + local system), and outcomes.
- **TimelineEvents**: Post-operative tracking linked to cases.
- **SNOMED CT Integration**:
    - `snomed_ref` table stores SNOMED CT coded reference data for vessels, co-morbidities, and anaesthetic types.
    - Procedure coding uses international SNOMED CT as the canonical standard with country-specific local code mappings (e.g., CHOP, OPCS-4, ACHI, CPT).
- **RACS MALT Data Model**: Comprehensive implementation including patient demographics, admission details, three-level diagnosis system, 36 SNOMED-coded co-morbidities, 6 anaesthetic types, operative factors, and comprehensive outcomes.

### Privacy Pipeline
1. On-device camera capture of operation note image.
2. **OCR text extraction**:
   - **Web platform**: 100% on-device OCR using Tesseract.js (runs entirely in browser)
   - **Mobile (Expo Go)**: Server-side OCR using Tesseract.js (images sent to app server, immediately discarded after text extraction)
3. **Local document classification** detects document type (discharge summary, anaesthesia record, op note).
4. **Local regex extraction** using modular hospital-specific parsers - **no cloud AI services used**.
5. Patient ID and dates extracted, then auto-populate form fields.
6. Extracted surgical data is stored locally on the device.
7. **No external cloud AI services** - all document parsing uses local regex patterns, not Gemini/OpenAI.

### Key Design Patterns
- **Modular Procedure Configuration**: Configuration files define specialty-specific fields.
- **Component Library**: Reusable themed UI components.
- **Multi-Procedure Support**: Cases can log multiple distinct procedures, each with its own `clinicalDetails` and SNOMED CT coding.
- **Automated Follow-up Tracking**: System for 30-day complication follow-ups and flexible follow-up timelines with various event types (photos, imaging, PROMs, notes, complications, visits).

## External Dependencies

### Local Processing (No Cloud AI)
- **Tesseract.js**: On-device OCR for text extraction from operation note images
- **Document Router**: Modular regex-based parsers for hospital-specific document formats

### Database
- **PostgreSQL**: Used for SNOMED CT reference data, configured via Drizzle ORM.
- **AsyncStorage**: Primary local data persistence on the device.

### Key Libraries
- **expo-camera**: For operation note photography.
- **expo-image-picker**: For gallery image selection.
- **tesseract.js**: On-device OCR for text extraction.
- **react-native-reanimated**: For animations.
- **drizzle-orm/drizzle-zod**: For database schema and validation.
- **uuid**: For generating unique IDs.

### Document Router Files
- `server/documentRouter/index.ts`: Main document processing entry point
- `server/documentRouter/DocumentClassifier.ts`: Document type detection
- `server/documentRouter/parsers/waikatoDischarge.ts`: Waikato DHB discharge summaries
- `server/documentRouter/parsers/anaesthesiaRecord.ts`: Anaesthesia records
- `server/documentRouter/parsers/operationNote.ts`: Operation notes
- `server/documentRouter/parsers/genericParser.ts`: Generic document fallback