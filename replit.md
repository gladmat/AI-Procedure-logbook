# Surgical Logbook

## Overview

Surgical Logbook is a privacy-first mobile application designed for surgeons to efficiently document surgical procedures, with a particular focus on microsurgery and free flap reconstruction. Its primary goal is to streamline case logging through intelligent, local document parsing from operation notes while ensuring complete patient confidentiality. The application fully integrates RACS MALT fields for detailed auditing and logging.

The application's core privacy architecture emphasizes on-device processing:
- **Web Platform**: Utilizes 100% on-device OCR with Tesseract.js, ensuring no patient data leaves the device.
- **Mobile (Expo Go)**: Images are sent to an app server solely for OCR processing via Tesseract.js and are immediately discarded. All parsed text is then processed locally without external cloud AI.
- **No External Cloud AI**: All document parsing relies on local regex patterns, completely avoiding services like Gemini or OpenAI.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application is built with a strong emphasis on privacy, local processing, and a flexible data model to support various surgical specialties.

### Frontend Architecture
- **Framework**: React Native with Expo SDK.
- **Navigation**: React Navigation.
- **State Management**: TanStack React Query for server state, local component state for UI.
- **Styling**: React Native StyleSheet with custom theme (light/dark mode).
- **Animations**: React Native Reanimated.
- **Local Storage**: AsyncStorage for core data persistence.

### Backend Architecture
- **Runtime**: Express.js server with TypeScript.
- **API Design**: RESTful endpoints primarily for SNOMED CT lookups and document processing.
- **Document Router**: Manages local regex-based parsers for surgical document extraction.

### Data Model
- **Local-first Architecture**: Patient data is stored locally with encryption.
- **Flexible JSON Payload**: `clinical_details` use a flexible JSON structure to accommodate diverse surgical specialties.
- **Core Case Fields**: Includes patient demographics, admission details, diagnoses, co-morbidities, risk factors, operative factors, surgery timing, operating team, procedure codes (SNOMED CT + local system), and outcomes.
- **SNOMED CT Integration**: Utilizes a `snomed_ref` table for coded reference data and supports international SNOMED CT with country-specific code mappings.
- **RACS MALT Data Model**: Comprehensive implementation of RACS MALT requirements.

### Privacy Pipeline
The privacy pipeline ensures all patient data remains on the device or is processed temporarily and locally:
1. On-device camera capture of operation note image.
2. **OCR Text Extraction**: On-device via Tesseract.js for web; server-side via Tesseract.js (images immediately discarded) for mobile.
3. **Local Document Classification**: Identifies document type (e.g., discharge summary, anaesthesia record, op note).
4. **Local Regex Extraction**: Uses modular, hospital-specific parsers. No cloud AI services are involved.
5. Auto-population of form fields with extracted data after local processing.
6. Local storage of all extracted surgical data on the device.

### Key Features and Design Patterns
- **Standardized Facility Selection**: Curated master list of hospitals with regional organization and user-managed "My Hospitals" for data consistency.
- **AO/OTA Fracture Classification**: Dynamic, cascading form for detailed fracture classification, supporting multiple fractures per case and real-time AO code preview.
- **Skin Lesion Histology Capture**: Automated workflow for extracting histology diagnosis and margins from reports using OCR and local regex, with user confirmation.
- **Dynamic Statistics Dashboard**: Provides specialty-aware analytics with multi-filtering by specialty, time, facility, and role, including specialty-specific metrics and visual analytics.
- **Enhanced Follow-up Timeline**: Supports flexible follow-up intervals and various event types (Photo, Imaging, PROM, Note, Complication, Follow-up Visit) with media capture and PROM questionnaires.
- **RACS MALT Supervision Levels**: Implementation of official RACS MALT supervision level codes with detailed descriptions.
- **Anatomical/Clinical Specialty Categories**: Restructured categories and a procedure tagging system for cross-specialty analytics.
- **Modular Procedure Configuration**: Configuration files define specialty-specific fields.
- **Multi-Procedure Support**: Allows logging of multiple distinct procedures per case.
- **Complete Password Management**: Change password functionality in Settings with current password verification, and Forgot Password flow with email-based reset tokens (1-hour expiry).
- **App Store Legal Compliance**: Privacy Policy, Terms of Service, and Open Source Licenses pages accessible via Settings.

### Authentication & Security
- **Password Security**: bcrypt hashing (10 rounds), minimum 8-character passwords.
- **Password Reset Flow**: Token-based reset via web page (`/reset-password`), tokens expire after 1 hour and are single-use.
- **Rate Limiting**: Auth endpoints protected against brute force attacks.
- **Database Tables**: `passwordResetTokens` table tracks reset token state with expiry and usage timestamps.

## External Dependencies

The application leverages specific libraries and a local database for its functionality, prioritizing on-device processing and data privacy.

### Local Processing
- **Tesseract.js**: For on-device OCR text extraction from images.
- **Document Router**: Custom modular regex-based parsers for hospital-specific document formats.

### Database
- **PostgreSQL**: Used for SNOMED CT reference data, managed via Drizzle ORM.
- **AsyncStorage**: Primary mechanism for local data persistence on the device.

### Key Libraries
- **expo-camera**: For capturing images with the device camera.
- **expo-image-picker**: For selecting images from the device gallery.
- **tesseract.js**: The core OCR engine.
- **react-native-reanimated**: For enhanced animations.
- **drizzle-orm/drizzle-zod**: For database schema definition and validation.
- **uuid**: For generating unique identifiers.