# Surgical Logbook

## Overview

Surgical Logbook is a privacy-first mobile application for surgeons to document surgical procedures, particularly microsurgery and free flap reconstruction. Its main purpose is to streamline case logging through intelligent, local document parsing from operation notes while ensuring complete patient confidentiality. It integrates RACS MALT fields for auditing and logging. The application emphasizes on-device processing, utilizing Tesseract.js for OCR and local regex patterns for parsing, avoiding external cloud AI services like Gemini or OpenAI.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application is built with a strong emphasis on privacy, local processing, and a flexible data model.

### Frontend Architecture
- **Framework**: React Native with Expo SDK.
- **Navigation**: React Navigation.
- **State Management**: TanStack React Query for server state.
- **Styling**: React Native StyleSheet with custom theme (light/dark mode).

### Backend Architecture
- **Runtime**: Express.js server with TypeScript.
- **API Design**: RESTful endpoints for SNOMED CT lookups and document processing.
- **Document Router**: Manages local regex-based parsers for surgical document extraction.

### Data Model
- **Local-first Architecture**: Patient data stored locally with encryption.
- **Flexible JSON Payload**: `clinical_details` uses a flexible JSON structure for diverse surgical specialties.
- **Core Case Fields**: Includes patient demographics, diagnoses, operative factors, SNOMED CT codes, and outcomes.
- **RACS MALT Data Model**: Comprehensive implementation of RACS MALT requirements.

### Privacy Pipeline
Patient data remains on the device or is processed temporarily and locally:
1. On-device camera capture.
2. OCR Text Extraction: On-device (web) or server-side (mobile, images discarded) via Tesseract.js.
3. Local Document Classification and Regex Extraction: Uses modular, hospital-specific parsers without cloud AI.
4. Auto-population of form fields.
5. Local storage of all extracted surgical data on the device.

### Key Features
- **Standardized Facility Selection**: Curated hospital list with user-managed "My Hospitals".
- **AO/OTA Fracture Classification**: Dynamic, cascading form for detailed fracture classification.
- **Skin Lesion Histology Capture**: Automated extraction from reports using OCR and local regex.
- **Dynamic Statistics Dashboard**: Specialty-aware analytics with multi-filtering.
- **Enhanced Follow-up Timeline**: Supports flexible follow-up intervals and various event types with media capture.
- **RACS MALT Supervision Levels**: Implementation of official RACS MALT supervision level codes.
- **Anatomical/Clinical Specialty Categories**: Restructured categories and procedure tagging system.
- **Modular Procedure Configuration**: Configuration files define specialty-specific fields.
- **Complete 8-Specialty Procedure Picklist**: 398 unique procedures across all 8 specialties (Orthoplastic 43, Hand Surgery 94, Head & Neck 85, General 74, Breast 47, Burns 34, Aesthetics 53, Body Contouring 31) with cross-specialty tagging and SNOMED CT codes. All specialties now use the subcategory picker UI.
- **Diagnosis-to-Procedure Suggestion System**: 161 structured diagnoses across all 8 specialties with procedure suggestions (staging-conditional). Selecting a diagnosis auto-populates default procedures; staging changes activate/deactivate conditional procedures. Components: DiagnosisPicker, ProcedureSuggestions.
- **Staging Configurations**: 14 staging systems including Tubiana, Gustilo-Anderson, Breslow, CTS Severity, Quinnell, TNM, NPUAP, Burns Depth/TBSA, Baker Classification, Hurley Stage, ISL Stage, House-Brackmann Grade, Wagner Grade, Le Fort Classification.
- **Multi-Procedure Support**: Allows logging multiple distinct procedures per case.
- **Complete Password Management**: Change password and Forgot Password flow with email-based reset tokens.
- **App Store Legal Compliance**: Accessible Privacy Policy, Terms of Service, and Open Source Licenses.

### Infection Documentation Module
Comprehensive infection case documentation with serial episode tracking.
- **InfectionOverlay**: Attachable overlay for any case specialty.
- **Quick Templates**: Pre-configured templates for common infection patterns (Abscess, Necrotising Fasciitis, Implant Infection, etc.).
- **Infection Syndromes**: Various categories like Skin/Soft Tissue, Deep Infection, Bone/Joint.
- **Progressive Disclosure UI**: Collapsible sections for microbiology, clinical scores, and episode details.
- **Serial Episode Tracking**: Auto-incrementing episode numbers for multiple operative interventions.
- **Microbiology Data**: Culture status, organism entries with resistance flags.
- **Active Cases Dashboard**: Prominent display of active infection cases.
- **Infection Statistics**: Dashboard card showing counts, averages, and breakdowns.

### Free Flap / Orthoplastic Documentation
- **FreeFlapPicker Component**: Selectable list of 18 free flaps.
- **Config-Driven Elevation Planes**: Per-flap configurable elevation planes.
- **Flap-Specific Conditional Fields**: Config-driven field rendering via `flapFieldConfig.ts` for detailed clinical parameters (~100 typed fields).
- **Donor Vessel Auto-Population**: Automatic suggestion of donor vessels based on flap type.
- **Recipient Site Regions**: Expanded to include Knee.
- **Recipient Vessel Presets**: Local presets for common recipient vessels by body region.
- **Simplified Anastomosis Documentation**: Streamlined arterial and venous documentation.

### Authentication & Security
- **Password Security**: bcrypt hashing (10 rounds), minimum 8-character passwords.
- **Password Reset Flow**: Token-based reset via web page, tokens expire after 1 hour and are single-use.
- **JWT Token Revocation**: `tokenVersion` mechanism revokes all existing tokens on password change.
- **Profile Update Protection**: Restricted fields to prevent mass assignment vulnerabilities.
- **Rate Limiting**: Auth endpoints protected against brute force attacks.
- **Patient Identifier Privacy**: Patient identifiers in local case index are SHA-256 hashed.
- **OCR Privacy**: Removed debug logging of extracted OCR text.

### Encryption Architecture
- **XChaCha20-Poly1305 AEAD**: All local case data encrypted.
- **Envelope Format**: `enc:v1:nonce:ciphertext` for version identification.
- **Backward Compatibility**: Legacy XOR-encrypted data automatically re-encrypted.
- **Key Derivation**: Device encryption key derived from user passphrase using scrypt.

### End-to-End Encryption Scaffolding
- **Per-Device Key Pairs**: Each device generates X25519 key pair stored securely.
- **Device Key Registration**: Public keys registered with server.
- **Key Registry API**: Server stores device public keys and metadata.
- **Key Revocation**: Devices can be remotely revoked.
- **Case Key Wrapping**: Infrastructure for wrapping symmetric case keys with recipient public keys.

### Email Configuration
- **Email Provider**: Resend integration for transactional emails.
- **From Address**: noreply@drgladysz.com.
- **Email Types**: Password reset and welcome emails with branded HTML templates.

## External Dependencies

### Local Processing
- **Tesseract.js**: For on-device OCR text extraction.
- **Document Router**: Custom modular regex-based parsers.

### Database
- **PostgreSQL**: Used for SNOMED CT reference data, managed via Drizzle ORM.
- **AsyncStorage**: Primary mechanism for local data persistence on the device.

### Key Libraries
- **expo-camera**: For capturing images.
- **expo-image-picker**: For selecting images from the gallery.
- **tesseract.js**: Core OCR engine.
- **@noble/ciphers**: XChaCha20-Poly1305 authenticated encryption.
- **@noble/hashes**: SHA-256, scrypt, HKDF.
- **@noble/curves**: X25519 elliptic curve for E2EE key exchange.