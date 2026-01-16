# Surgical Logbook

## Overview

A privacy-first mobile application for surgeons to document surgical procedures, specifically focused on microsurgery and free flap reconstruction. The app enables efficient case logging through AI-powered data extraction from operation notes while maintaining strict patient confidentiality through local data processing and automatic redaction of sensitive information.

The application follows a local-first architecture where patient photos are processed on-device and only anonymized text is sent to cloud AI services for structured data extraction. This "Privacy Firewall" approach ensures NHI numbers, dates, and other identifying information never leave the device.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Cases table**: Universal header fields (patient ID, date, facility, role, risk factors)
- **clinical_details**: JSON column storing specialty-specific data (flap type, vessels, timing)
- **TimelineEvents table**: Post-operative tracking linked to cases

### Privacy Pipeline
1. Camera captures operation note image (never uploaded)
2. Local text extraction from image
3. Automatic redaction of NHI patterns, dates, names, addresses
4. Only redacted text sent to AI for structured extraction
5. Extracted surgical data stored locally

### Key Design Patterns
- **Procedure Configuration**: Modular config files define fields per specialty (currently free_flap, extensible to trauma, burns)
- **SNOMED-CT Integration**: International procedure coding with country-specific mappings
- **Component Library**: Reusable themed components (Button, Card, FormField, etc.)

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