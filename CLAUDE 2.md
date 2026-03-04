# CLAUDE.md — AI Procedure Logbook (Surgical Logbook)

## What is this project?

A full-stack Expo/React Native surgical logbook app for documenting surgical procedures, tracking post-operative outcomes, and generating analytics. Supports multiple surgical specialties with SNOMED CT coding, free flap tracking, anastomosis logging, wound assessments, and infection episode monitoring. Originally built on Replit.

## Tech stack

- **Frontend:** Expo 54, React Native 0.81, React 19, TypeScript, React Navigation 7, TanStack React Query 5, React Native Reanimated
- **Backend:** Express 4, TypeScript, Drizzle ORM, PostgreSQL (pg driver)
- **Auth:** JWT with token versioning, bcryptjs, rate-limited auth endpoints
- **Encryption:** @noble/* (hashes, curves, ciphers) — E2EE device key scaffolding in place
- **Email:** Resend (password reset flows)
- **Build:** tsx for dev server, esbuild for server prod build, Expo for client builds

## Commands

```bash
npm run server:dev     # Start Express API server (port from .env, default 5001 locally)
npm run expo:dev       # Start Expo dev client (designed for Replit — needs env adjustment locally)
npm run db:push        # Push Drizzle schema to PostgreSQL (loads .env)
npm run server:build   # Production server build → server_dist/
npm run server:prod    # Run production server
npm run lint           # ESLint via Expo
npm run check:types    # TypeScript type-check (tsc --noEmit)
npm run format         # Prettier format
```

## Local development setup

1. PostgreSQL must be running locally (Homebrew postgresql@16)
2. `.env` file in project root with: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`
3. `npm install` then `npm run db:push` to create tables
4. `npm run server:dev` starts the API server
5. Port 5000 conflicts with macOS AirPlay — use port 5001

## Project structure

```
client/
  App.tsx                    # Root with AuthContext + MediaCallbackContext providers
  screens/
    AuthScreen.tsx           # Login/signup/password reset
    OnboardingScreen.tsx     # First-time setup (profile, facilities)
    DashboardScreen.tsx      # Case list, filtering, statistics
    CaseDetailScreen.tsx     # Full case record view
    CaseFormScreen.tsx       # Multi-step case entry form
    AddCaseScreen.tsx        # Case entry initiation workflow
    AddTimelineEventScreen.tsx  # Post-op complications/follow-ups
    AddOperativeMediaScreen.tsx # Intraoperative image capture
    MediaManagementScreen.tsx   # Batch media upload
    SettingsScreen.tsx       # Profile, data export, legal
  navigation/
    RootStackNavigator.tsx   # Auth → Onboarding → Main flow
    MainTabNavigator.tsx     # Bottom tabs: Dashboard + Settings
    DashboardStackNavigator.tsx
    SettingsStackNavigator.tsx
  components/               # ~46 components (forms, editors, display, layout)
  contexts/
    AuthContext.tsx           # Auth state, profile, facilities, device keys
    MediaCallbackContext.tsx  # Cross-screen media selection callbacks
  hooks/                     # useTheme, useColorScheme, useScreenOptions
  lib/
    auth.ts                  # JWT token management, device key registration
    storage.ts               # Local AsyncStorage for offline-first cases
    query-client.ts          # TanStack React Query + API base URL
    encryption.ts / e2ee.ts  # E2EE utilities and device key management
    snomedCt.ts              # SNOMED CT code mapping
    procedureConfig.ts       # Specialty-specific form field config
    statistics.ts            # Case analytics calculations
    mediaStorage.ts          # Image encryption + storage
    melanomaStaging.ts       # Melanoma staging rules
    diagnosisPicklists/      # Pre-built diagnosis suggestions by specialty
  types/
    case.ts                  # Case, Procedure, TimelineEvent, MediaAttachment
    diagnosis.ts             # Diagnosis with TNM/Breslow/Clark staging
    infection.ts             # Post-op infection tracking
    wound.ts                 # Wound assessment dimensions
  data/
    aoHandClassification.ts  # AO hand trauma codes
    facilities.ts            # Master facility database
    flapFieldConfig.ts       # Flap-specific form configs
server/
  index.ts                   # Express server entry (CORS, body parsing, routing)
  routes.ts                  # 40+ API endpoints (auth, profile, procedures, flaps, SNOMED)
  storage.ts                 # DatabaseStorage class (Drizzle queries, ownership checks)
  db.ts                      # Drizzle + pg Pool connection
  snomedApi.ts               # Ontoserver FHIR integration for live SNOMED search
  email.ts                   # Resend email (password reset)
  diagnosisStagingConfig.ts  # Dynamic staging form definitions
  seedData.ts                # SNOMED reference data seed (~33KB)
  templates/                 # HTML: landing page, privacy, terms, reset-password, licenses
shared/
  schema.ts                  # Drizzle ORM table definitions (12 tables)
migrations/                  # SQL migration files
```

## Key architecture

- **Navigation:** Auth → Onboarding → Main (bottom tabs: Dashboard, Settings) with modal stack for case entry/detail
- **Data ownership:** Hierarchical: User → Procedure → Flap → Anastomosis. Ownership verified at each API level.
- **SNOMED CT:** Curated picklists in `snomed_ref` table + live search via Ontoserver FHIR API
- **Offline-first:** Local AsyncStorage for cases; server sync via API
- **E2EE scaffolding:** Device key registration in place; media encryption implemented
- **Multi-specialty:** Hand surgery, orthoplastic, breast, burns, head/neck, aesthetics, general, body contouring

## Database tables (PostgreSQL)

`users`, `profiles`, `user_facilities`, `user_device_keys`, `password_reset_tokens`, `procedures`, `flaps`, `anastomoses`, `case_procedures`, `snomed_ref`, `teams`, `team_members`

## Path aliases (tsconfig + babel)

- `@/*` → `client/*`
- `@shared/*` → `shared/*`

## Environment variables

- `DATABASE_URL` — PostgreSQL connection string (required)
- `JWT_SECRET` — Secret for JWT signing (required)
- `PORT` — Server port (default 5000, use 5001 locally on macOS)
- `NODE_ENV` — `development` or `production`
- `ENABLE_SEED` / `SEED_TOKEN` — Gate SNOMED seed endpoint (dev only)

## Supported specialties

Hand surgery, Orthoplastic, Breast, Body contouring, Burns, Head & neck, Aesthetics, General

## Railway deployment (production API)

- **Project:** surgical-logbook-api
- **URL:** https://api-server-production-4dd7.up.railway.app
- **Services:** `api-server` (Express backend) + `Postgres` (PostgreSQL database)
- **Deploy method:** `railway up` from project root (CLI push)
- **Build:** Nixpacks, Node 20, `npm run server:build` → CJS bundle → `node server_dist/index.js`
- **Config:** `railway.toml` in project root
- **Env vars on Railway:** `DATABASE_URL` (references Postgres service), `JWT_SECRET`, `PORT=5000`, `NODE_ENV=production`
- **Healthcheck:** `GET /api/health`
- **Schema push:** Use public DATABASE_URL from Postgres service with `npx drizzle-kit push`

## Style conventions

- Strict TypeScript throughout
- React Navigation for all routing (not Expo Router)
- TanStack React Query for server state
- Zod + drizzle-zod for validation at API boundaries
- Components use React Native primitives (View, Text, ScrollView)
- @noble/* for cryptographic operations (not Web Crypto)
- No test suite yet
