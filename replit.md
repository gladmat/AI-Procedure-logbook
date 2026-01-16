# Surgical Logbook

## Overview

A privacy-first mobile application for surgeons to document surgical procedures, specifically focused on microsurgery and free flap reconstruction. The app enables efficient case logging through AI-powered data extraction from operation notes while maintaining strict patient confidentiality through local data processing and automatic redaction of sensitive information.

The application follows a local-first architecture where patient photos are processed on-device and only anonymized text is sent to cloud AI services for structured data extraction. This "Privacy Firewall" approach ensures NHI numbers, dates, and other identifying information never leave the device.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2026)

- **Dynamic Anastomosis Tracking**: Free flap cases now support multiple arterial and venous anastomoses with SNOMED CT coded vessels
- **Recipient Site Selection**: Anatomical region picker filters vessels dynamically (lower leg shows Anterior Tibial, Posterior Tibial; foot shows Dorsalis Pedis, etc.)
- **SNOMED CT Reference Database**: PostgreSQL `snomed_ref` table stores vessels organized by anatomical region with real SNOMED CT codes
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
- **API Design**: RESTful endpoints for AI data extraction
- **AI Integration**: Google Gemini via Replit AI Integrations for extracting surgical data from anonymized operation note text

### Data Model (Core + Payload Pattern)
Cases use a flexible JSON payload structure for clinical details, allowing future expansion to new surgical specialties without database schema changes:
- **Cases table**: Universal header fields (patient ID, date, facility, role, risk factors, surgery timing, operating team, procedure codes)
- **clinical_details**: JSON column storing specialty-specific data (flap type, vessels, timing)
- **TimelineEvents table**: Post-operative tracking linked to cases
- **Settings**: Country code, display preferences stored in AsyncStorage

### Privacy Pipeline
1. Camera captures operation note image (never uploaded)
2. Local text extraction from image
3. Automatic redaction of NHI patterns, dates, names, addresses
4. Only redacted text sent to AI for structured extraction
5. Extracted surgical data stored locally

### Key Design Patterns
- **Procedure Configuration**: Modular config files define fields per specialty (free_flap, hand_trauma, body_contouring, burns, aesthetics)
- **SNOMED-CT Integration**: International procedure coding with country-specific mappings (client/lib/snomedCt.ts)
- **Component Library**: Reusable themed components (Button, Card, FormField, etc.)

## Key Files

- `client/types/case.ts` - Core data model types including Case, SurgeryTiming, OperatingTeamMember, ProcedureCode, AnastomosisEntry
- `client/lib/snomedCt.ts` - SNOMED CT procedure database with country-specific code mappings
- `client/lib/snomedApi.ts` - API client for fetching SNOMED CT vessels by region from PostgreSQL
- `client/lib/storage.ts` - AsyncStorage operations for cases, settings, timeline events
- `client/lib/procedureConfig.ts` - Specialty-specific field configurations
- `client/lib/privacyUtils.ts` - NHI/date redaction utilities
- `client/screens/CaseFormScreen.tsx` - Case entry form with surgery timing, team, and anastomosis fields
- `client/screens/CaseDetailScreen.tsx` - Case detail view with procedure codes and timing display
- `client/screens/SettingsScreen.tsx` - Country selection and data export
- `client/components/RecipientSiteSelector.tsx` - Anatomical region picker for recipient site
- `client/components/AnastomosisEntryCard.tsx` - Dynamic vessel selection card with region filtering
- `server/ai-prompts.ts` - AI extraction prompts for each specialty (now extracts anastomoses)
- `server/seedData.ts` - SNOMED CT vessel seeding for PostgreSQL snomed_ref table
- `shared/schema.ts` - Drizzle ORM schema with snomed_ref, flaps, and anastomoses tables

## External Dependencies

### AI Services
- **Google Gemini** (via Replit AI Integrations): Extracts structured surgical data from anonymized operation note text

### Database
- **PostgreSQL**: Configured via Drizzle ORM for potential server-side storage
- **AsyncStorage**: Primary local data persistence on device

### Key Libraries
- **expo-camera**: Operation note photography
- **expo-image-picker**: Gallery image selection
- **react-native-reanimated**: Animation system
- **drizzle-orm/drizzle-zod**: Database schema and validation
- **uuid**: Case and event ID generation

## Future Work (Not Yet Implemented)

- RACS MALT logbook field integration (user to provide details)
- Team collaboration with end-to-end encryption
- Data export in multiple formats (CSV, FHIR)
- Additional SNOMED CT procedure mappings for more flap types
