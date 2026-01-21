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

### AO/OTA Fracture Classification System (Latest)
- **Interactive Hand Diagram**: Visual bone selector based on Gray's Anatomy illustrations (public domain) showing carpals, metacarpals, and phalanges
- **AO Region 7 Coverage**: Complete AO/OTA 2018 Hand & Carpus classification:
  - Carpal bones (71-76): Lunate, Scaphoid, Capitate, Hamate, Trapezium, Pisiform, Triquetrum, Trapezoid
  - Metacarpals (77): All 5 metacarpals with segment-based typing (base/shaft/head)
  - Phalanges (78): Proximal, middle, and distal phalanges for all fingers
  - Crush/Multiple (79): Single code for complex hand injuries
- **Dynamic Wizard Flow**: Multi-step classification that adapts to bone type:
  - Simple carpals: Bone selection → Type (A/B/C)
  - Long bones: Bone → Segment (1/2/3) → Type (A/B/C)
  - Scaphoid: Bone → Type → Qualification (proximal pole/waist/distal pole)
- **AO Code Generation**: Real-time code display with validation (e.g., 77.2.3B = Index metacarpal head partial articular fracture)
- **Multi-Fracture Support**: Add multiple fractures per case, stored as FractureEntry array
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