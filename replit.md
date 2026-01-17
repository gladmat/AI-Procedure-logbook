# Surgical Logbook

## Overview

A privacy-first mobile application for surgeons to document surgical procedures, specifically focused on microsurgery and free flap reconstruction. The app enables efficient case logging through AI-powered data extraction from operation notes while maintaining strict patient confidentiality through local data processing and automatic redaction of sensitive information.

The application follows a local-first architecture where patient photos are processed on-device and only anonymized text is sent to cloud AI services for structured data extraction. This "Privacy Firewall" approach ensures NHI numbers, dates, and other identifying information never leave the device.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2026)

### User Authentication & Profile Management (Latest)
- **Complete Auth System**: Email/password authentication with JWT tokens and bcrypt password hashing
- **3-Step Onboarding Wizard**: New users complete profile setup on first login:
  - Step 1: Country of practice and full name
  - Step 2: Career stage selection (registrar, fellow, consultant, private practice, academic, retired)
  - Step 3: Add hospitals/clinics where the surgeon operates
- **Profile Management**: Users can view/edit profile and manage facilities from Settings
- **Facility Integration**: CaseFormScreen facility dropdown uses user's configured facilities list
- **Session Persistence**: Auth tokens stored in AsyncStorage; users stay logged in across app restarts
- **AuthContext Provider**: Global auth state management with user profile and facilities access

### Multi-Procedure Support with Procedure-Level Clinical Details
- **Multiple Procedures Per Case**: Cases now support logging multiple distinct procedures (e.g., hand trauma with K-wire fixation + tendon repair + soft tissue coverage)
- **Procedure-Level Clinical Details**: Each procedure has its own `clinicalDetails` JSON field storing specialty-specific data (moved from case-level)
  - Free flap procedures store: recipient site, anastomoses, harvest side, indication, ischemia time, flap dimensions
  - Hand trauma procedures store: fixation material, injury mechanism, nerve status, tendon injuries, fracture site
  - Body contouring procedures store: resection weight, drain output
- **ProcedureEntryCard Component**: Reusable card with procedure name, specialty picker, surgeon role, SNOMED CT fields, and dynamically rendered clinical details based on selected specialty
- **ProcedureClinicalDetails Component**: Renders specialty-specific fields (FreeFlapClinicalFields, HandTraumaClinicalFields, etc.) within each procedure card
- **CaseFormScreen Integration**: Add/remove/reorder procedures with numbered sequence display; clinical details now entered within each procedure card
- **CaseDetailScreen Display**: Shows all procedures with sequence numbers, specialty badges, surgeon roles, SNOMED codes, and inline clinical details
- **AI Extraction**: Updated prompts to attach `clinicalDetails` object to each extracted procedure

### RACS MALT Audit Integration
- **Comprehensive RACS MALT Data Model**: Full implementation of Royal Australasian College of Surgeons MALT (Morbidity Audit and Logbook Tool) fields
- **Patient Demographics**: Gender (with SNOMED CT mapping), ethnicity tracking
- **Admission Details**: Admission/discharge dates, admission category (elective/emergency/planned), unplanned readmission tracking with reason codes
- **Three-Level Diagnosis System**: Pre-management, final, and pathological diagnoses with SNOMED CT coding capability
- **36 SNOMED-Coded Co-morbidities**: AF, angina, anxiety, asthma, cancer, cardiac failure, COPD, chronic renal failure, cirrhosis, CVA, dementia, depression, diabetes (Type 1 & 2), dialysis, hepatitis, HIV, hypercholesterolemia, hypertension, hyperthyroidism, hypothyroidism, IHD, immunosuppression, MI, obesity, OSA, pacemaker, PVD, PE, seizures, steroid use, TIA, transplant, TB
- **6 Anaesthetic Types**: General, regional, local, sedation, combined general/regional, local with sedation - all SNOMED CT coded
- **Operative Factors**: Wound infection risk classification (clean/clean-contaminated/contaminated/dirty-infected), antibiotic prophylaxis, DVT prophylaxis
- **Comprehensive Outcomes**: Unplanned ICU admission (with reason), return to theatre tracking, discharge outcome (alive/deceased), mortality classification (expected/unexpected/unrelated to surgery), MDM discussion flag, recurrence date
- **ASA Score Extended**: 1-6 scale including brain-dead organ donor classification
- **AI-Powered Extraction**: All specialty prompts updated to extract RACS MALT fields from operation notes automatically

### Previous Updates
- **Dynamic Anastomosis Tracking**: Free flap cases now support multiple arterial and venous anastomoses with SNOMED CT coded vessels
- **Recipient Site Selection**: Anatomical region picker filters vessels dynamically (lower leg shows Anterior Tibial, Posterior Tibial; foot shows Dorsalis Pedis, etc.)
- **SNOMED CT Reference Database**: PostgreSQL `snomed_ref` table stores vessels, co-morbidities, and anaesthetic types organized by category with real SNOMED CT codes
- **Modular Database Design**: Universal `snomed_ref` pattern supports future expansion to other specialties (hand fractures, burns, etc.)
- **SNOMED CT Procedure Coding**: Added international procedure coding using SNOMED CT as the canonical standard, with country-specific local code mappings (CHOP for Switzerland, OPCS-4 for UK, ACHI for Australia/NZ, CPT for US, ICD-9-CM-PL for Poland)
- **Country/Region Settings**: Users can select their country in Settings to see procedure codes in their local coding system
- **Surgery Timing**: Cases now capture start time, end time, and auto-calculated duration
- **Operating Team**: Added ability to record operating team members (scrub nurse, anaesthetist, surgical assistant, etc.)
- **Enhanced AI Extraction**: All specialty prompts now extract surgery times, team members, recipient site region, and multiple anastomoses from operation notes

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation with native stack and bottom tabs
- **State Management**: TanStack React Query for server state, local component state for UI
- **Styling**: React Native StyleSheet with a custom theme system (light/dark mode support)
- **Animations**: React Native Reanimated for smooth micro-interactions
- **Local Storage**: AsyncStorage for persisting cases, timeline events, and settings on-device

### Backend Architecture
- **Runtime**: Express.js server with TypeScript
- **API Design**: RESTful endpoints for AI data extraction and SNOMED CT lookups
- **AI Integration**: Google Gemini via Replit AI Integrations for extracting surgical data from anonymized operation note text

### Data Model (Core + Payload Pattern)
Cases use a flexible JSON payload structure for clinical details, allowing future expansion to new surgical specialties without database schema changes:
- **Cases table**: Universal header fields including:
  - Patient ID, date, facility, role
  - Patient demographics (gender, ethnicity)
  - Admission details (dates, category, readmission status)
  - Diagnoses (pre-management, final, pathological)
  - Co-morbidities (array of SNOMED-coded conditions)
  - Risk factors (ASA, BMI, smoking, diabetes)
  - Operative factors (wound risk, anaesthetic type, prophylaxis)
  - Surgery timing and operating team
  - Procedure codes (SNOMED CT + local system)
  - Outcomes (ICU, return to theatre, mortality, MDM)
- **clinical_details**: JSON column storing specialty-specific data (flap type, vessels, timing)
- **TimelineEvents table**: Post-operative tracking linked to cases
- **snomed_ref table**: SNOMED CT coded reference data for vessels, co-morbidities, anaesthetic types
- **Settings**: Country code, display preferences stored in AsyncStorage

### Privacy Pipeline
1. Camera captures operation note image (never uploaded)
2. Local text extraction from image
3. Automatic redaction of NHI patterns, dates, names, addresses
4. Only redacted text sent to AI for structured extraction
5. Extracted surgical data stored locally

### Key Design Patterns
- **Procedure Configuration**: Modular config files define fields per specialty (free_flap, hand_trauma, body_contouring, burns, aesthetics)
- **SNOMED-CT Integration**: International procedure and diagnosis coding with country-specific mappings
- **Component Library**: Reusable themed components (Button, Card, FormField, etc.)

## Key Files

### Authentication & User Management
- `client/contexts/AuthContext.tsx` - Global auth state management with JWT tokens, profile, and facilities
- `client/lib/auth.ts` - API client for authentication, profile, and facilities endpoints
- `client/screens/AuthScreen.tsx` - Login/signup screen with email and password
- `client/screens/OnboardingScreen.tsx` - 3-step profile setup wizard for new users
- `server/routes.ts` - API routes including auth, profile, and facilities CRUD endpoints
- `server/storage.ts` - Server-side storage interface with user and facility operations
- `shared/schema.ts` - Drizzle ORM schema with users, profiles, user_facilities, teams, and team_members tables

### Case Management
- `client/types/case.ts` - Core data model types including Case, RACS MALT types (Gender, AdmissionCategory, WoundInfectionRisk, DischargeOutcome, etc.), label constants for all enums
- `client/lib/snomedCt.ts` - SNOMED CT procedure database with country-specific code mappings
- `client/lib/snomedApi.ts` - API client for fetching SNOMED CT data (vessels, co-morbidities, anaesthetic types) by category from PostgreSQL
- `client/lib/storage.ts` - AsyncStorage operations for cases, settings, timeline events
- `client/lib/procedureConfig.ts` - Specialty-specific field configurations
- `client/lib/privacyUtils.ts` - NHI/date redaction utilities
- `client/screens/CaseFormScreen.tsx` - Comprehensive case entry form with RACS MALT sections (demographics, admission, diagnoses, co-morbidities, operative factors, outcomes)
- `client/screens/CaseDetailScreen.tsx` - Case detail view displaying all RACS MALT fields with SNOMED codes
- `client/screens/SettingsScreen.tsx` - Profile management, facilities, country selection and data export
- `client/components/RecipientSiteSelector.tsx` - Anatomical region picker for recipient site
- `client/components/AnastomosisEntryCard.tsx` - Dynamic vessel selection card with region filtering
- `client/components/ProcedureEntryCard.tsx` - Multi-procedure entry card with SNOMED CT coding
- `server/ai-prompts.ts` - AI extraction prompts for each specialty (extracts all RACS MALT fields)
- `server/seedData.ts` - SNOMED CT seeding for vessels, co-morbidities, anaesthetic types

## External Dependencies

### AI Services
- **Google Gemini** (via Replit AI Integrations): Extracts structured surgical data from anonymized operation note text

### Database
- **PostgreSQL**: Configured via Drizzle ORM for SNOMED CT reference data
- **AsyncStorage**: Primary local data persistence on device

### Key Libraries
- **expo-camera**: Operation note photography
- **expo-image-picker**: Gallery image selection
- **react-native-reanimated**: Animation system
- **drizzle-orm/drizzle-zod**: Database schema and validation
- **uuid**: Case and event ID generation

## Future Work (Not Yet Implemented)

- Team collaboration with end-to-end encryption
- Data export in multiple formats (CSV, FHIR)
- Additional SNOMED CT procedure mappings for more flap types
- SNOMED CT diagnosis search/autocomplete integration
