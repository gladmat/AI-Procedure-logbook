# Surgical Logbook

## Overview

Surgical Logbook is a privacy-first mobile application for surgeons to document surgical procedures, particularly focusing on microsurgery and free flap reconstruction. Its core purpose is to enable efficient case logging through AI-powered data extraction from operation notes while ensuring patient confidentiality. This is achieved by processing patient data locally on-device and automatically redacting sensitive information before any anonymized text is sent to cloud AI services. The application also integrates comprehensive RACS MALT (Royal Australasian College of Surgeons Morbidity Audit and Logbook Tool) fields for detailed audit and logging.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2026)

### RACS MALT Supervision Levels (Latest)
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

### Dynamic Statistics Dashboard
- **Specialty-Aware Analytics**: Dashboard shows statistics that change based on selected specialty tab
- **Multi-Filter System**: Filter statistics by:
  - Specialty (All, Free Flap, Hand Trauma, Body Contouring, Aesthetics, Burns, General)
  - Time Period (This Year, Last 6 Months, Last 12 Months, All Time)
  - Facility (all facilities or specific facility)
  - Role (All Roles, PS, PP, AS, ONS, SS, SNS, A)
- **Base Statistics Cards**: Total cases, average duration, complication rate, follow-up completion rate
- **Specialty-Specific Metrics**:
  - Free Flap: Flap survival rate, average ischemia time, take-back rate, cases by flap type
  - Hand Trauma: Nerve repair count, tendon repair count, cases by procedure type
  - Body Contouring: Average resection weight
- **Visual Analytics**: Bar chart showing cases over time, breakdown charts by flap type/procedure type
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
- **API Design**: RESTful endpoints for AI data extraction and SNOMED CT lookups
- **AI Integration**: Google Gemini via Replit AI Integrations for surgical data extraction

### Data Model
- **Local-first Architecture**: Patient data processed on-device; only anonymized text sent to cloud AI.
- **Flexible JSON Payload**: Cases use a flexible JSON structure for `clinical_details` to support various surgical specialties without schema changes.
- **Core Case Fields**: Includes patient demographics, admission details, diagnoses, co-morbidities, risk factors, operative factors, surgery timing, operating team, procedure codes (SNOMED CT + local system), and outcomes.
- **TimelineEvents**: Post-operative tracking linked to cases.
- **SNOMED CT Integration**:
    - `snomed_ref` table stores SNOMED CT coded reference data for vessels, co-morbidities, and anaesthetic types.
    - Procedure coding uses international SNOMED CT as the canonical standard with country-specific local code mappings (e.g., CHOP, OPCS-4, ACHI, CPT).
- **RACS MALT Data Model**: Comprehensive implementation including patient demographics, admission details, three-level diagnosis system, 36 SNOMED-coded co-morbidities, 6 anaesthetic types, operative factors, and comprehensive outcomes.

### Privacy Pipeline
1. On-device camera capture of operation note image.
2. Local text extraction from the image.
3. Automatic redaction of sensitive patient identifiers (NHI, dates, names, addresses).
4. Only redacted text is sent to AI for structured extraction.
5. Extracted surgical data is stored locally on the device.

### Key Design Patterns
- **Modular Procedure Configuration**: Configuration files define specialty-specific fields.
- **Component Library**: Reusable themed UI components.
- **Multi-Procedure Support**: Cases can log multiple distinct procedures, each with its own `clinicalDetails` and SNOMED CT coding.
- **Automated Follow-up Tracking**: System for 30-day complication follow-ups and flexible follow-up timelines with various event types (photos, imaging, PROMs, notes, complications, visits).

## External Dependencies

### AI Services
- **Google Gemini** (via Replit AI Integrations): Used for extracting structured surgical data from anonymized operation note text.

### Database
- **PostgreSQL**: Used for SNOMED CT reference data, configured via Drizzle ORM.
- **AsyncStorage**: Primary local data persistence on the device.

### Key Libraries
- **expo-camera**: For operation note photography.
- **expo-image-picker**: For gallery image selection.
- **react-native-reanimated**: For animations.
- **drizzle-orm/drizzle-zod**: For database schema and validation.
- **uuid**: For generating unique IDs.