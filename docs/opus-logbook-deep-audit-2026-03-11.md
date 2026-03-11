# Opus Logbook Deep Audit

Date: 2026-03-11
Mode: Audit only, report only
Architecture target: Local-first core

## Executive Summary

Opus Logbook already has a serious amount of domain work in place. The local case model, encrypted media path, specialty-specific capture workflows, and test suite show real product depth. The current system does work for single-device local use.

It is not yet architected for "blazing fast, reliable, elegant" operation at scale.

The main reason is not one isolated bug. It is that the codebase currently straddles two incompatible architectures:

1. A local-first encrypted logbook where `Case`, `TreatmentEpisode`, timeline events, drafts, and media are primarily stored and mutated on-device.
2. A partially built server-side procedure registry with its own schema, CRUD routes, and sync assumptions.

Those two worlds are not joined by a formal projection or sync contract. That creates silent failure paths, duplicate models, dead ends, and performance workarounds instead of a clean data architecture.

The highest priority changes are:

- declare the on-device case model as the canonical source of truth
- stop or gate broken server-side clinical sync paths until an explicit projection exists
- unify production and test server bootstrapping
- fix privacy/legal statements that no longer match the code
- replace repeated full-dataset decrypt/read patterns with a derived local summary index

## Method And Baseline

This audit used:

- static code inspection across `client/`, `server/`, `shared/`, `docs/`, `migrations/`, and `scripts/`
- schema and storage review
- route and query tracing
- import and call-site tracing
- doc and policy comparison
- baseline repo checks

Baseline results observed during the audit:

- `npm test`: passed
  Result observed: 41 test files, 703 tests passed.
- `npm run check:types`: passed
- `npm run lint`: failed
  Result observed: 399 problems total, including 359 errors and 40 warnings.

This matters because the repo is functionally alive, but hygiene and architectural consistency are drifting.

## Actual Architecture

### Canonical data paths today

| Subsystem | Actual source of truth | Notes |
| --- | --- | --- |
| Cases | Local encrypted AsyncStorage blobs via `client/lib/storage.ts` | `getCases()` and `getCase()` are the real app data path. |
| Drafts | Local encrypted AsyncStorage via `saveCaseDraft()` | Autosaved from the case form hook. |
| Episodes | Local encrypted AsyncStorage via `client/lib/episodeStorage.ts` | Server sync module exists but is not used. |
| Media | Local encrypted file store v2 plus legacy AsyncStorage v1 compatibility | Good direction, but migration complexity remains in hot paths. |
| Auth/profile/facilities | Server-backed | Profile is also cached locally in plain AsyncStorage. |
| SNOMED search | Server proxy to external Ontoserver | No meaningful cache or offline fallback. |
| Server procedures / case procedures / outcomes | Separate server registry model | Not the main case store used by the app. |

### Architectural assessment

For a local-first product, the good news is that the client already behaves like a local-first system. The bad news is that the repo has not fully accepted that fact, so several server-side subsystems are built as if they were canonical even though the client does not use them.

That mismatch is the dominant architectural problem in the repository.

## Severity-Ranked Findings

## Critical

### C1. The codebase has two competing clinical data models and no explicit projection boundary

**Problem**

The app's real clinical data model is the local `Case` graph stored through `client/lib/storage.ts`, while the backend defines a separate `procedures` / `case_procedures` / `flaps` / `anastomoses` / `procedure_outcomes` model in `shared/schema.ts` and `server/routes.ts`. The client does not use the server procedure API for its primary case lifecycle.

**Evidence**

- Local case reads and writes are the dominant path: `client/lib/storage.ts:286`, `client/lib/storage.ts:318`, `client/lib/storage.ts:366`
- Case save builds and persists a local `Case` payload directly: `client/hooks/useCaseForm.ts:1742`
- Repo-wide search found no non-test client call sites for `/api/procedures`
- Server procedure registry exists anyway: `shared/schema.ts:340`, `shared/schema.ts:503`, `server/routes.ts` (2212 lines total)

**Root cause**

The server registry was added in parallel to the local-first app without an explicit "projection from local canonical record to server analytics model" contract.

**Why it matters**

- Features can appear implemented while depending on data that never exists server-side.
- Future engineers cannot tell which model is authoritative.
- Analytics, sync, privacy, and export decisions remain ambiguous.
- Every new feature risks writing logic twice.

**Recommended change**

Adopt the following architecture decision and enforce it everywhere:

1. The canonical clinical record is the local encrypted `Case` / `TreatmentEpisode` / media store.
2. The backend does not become a peer case store. It becomes one of:
   - auth/profile/config infrastructure
   - terminology proxy/cache
   - optional analytics projection target
3. If server-side analytics or multi-device support is required, implement an explicit projection pipeline:
   - local `Case.id` remains canonical
   - projection code serializes a reduced analytics payload from the local case
   - patient identity stripping is mandatory inside that serializer
   - a mapping record stores `localCaseId` and `localProcedureId` to `serverProcedureId` and `serverCaseProcedureId`
   - projection version and sync status are stored explicitly
4. Until that projection exists, the server procedure registry should be marked internal or experimental and should not be treated as authoritative in product behavior or docs.

**What this improves**

- Removes the single largest source of architectural ambiguity
- Makes privacy boundaries explicit
- Makes local-first behavior intentional instead of accidental
- Creates a clean path for analytics and future sync without corrupting the local model

**Tradeoff / rollout risk**

- Server-side clinical features that currently rely on implied sync must be paused or reframed
- Requires a deliberate migration plan if server projections are already populated in production

### C2. Flap outcome sync is wired to incompatible IDs and is likely failing silently

**Problem**

The client sends local `CaseProcedure.id` values to `/api/procedure-outcomes`, but the server expects `procedure_outcomes.case_procedure_id` to reference rows in the server's `case_procedures` table. Because the client does not create those server-side case procedures in its main case flow, the IDs do not line up.

**Evidence**

- Local case procedure IDs live inside the client case model: `client/types/case.ts:1549`
- The save flow sends `proc.id` to the sync helper: `client/hooks/useCaseForm.ts:1883`
- The sync helper posts that value as `caseProcedureId`: `client/lib/outcomeSync.ts:35`
- Server schema requires `procedure_outcomes.case_procedure_id` to reference server `case_procedures.id`: `shared/schema.ts:503`, `shared/schema.ts:604`
- No non-test client call site creates server procedures first

**Root cause**

Outcome sync was added as if local procedure IDs and server projection IDs were interchangeable.

**Why it matters**

- Server-side flap outcome analytics cannot be trusted
- Failures are hidden behind fire-and-forget logging
- The app gives the impression of dual-storage durability without actually having it

**Recommended change**

Immediate action:

1. Disable or feature-flag `syncFlapOutcomeToServer()` in the main save flow.
2. Stop treating server outcome storage as a live secondary truth.

Then, if server analytics are still required:

3. Only sync outcomes from a formal projection layer that already knows the mapped `serverCaseProcedureId`.
4. Persist sync status and last error for projections so failures are visible.
5. Backfill server outcomes only after the mapping layer exists.

**What this improves**

- Stops silent data-loss behavior
- Prevents misleading analytics
- Forces the sync story to become explicit and testable

**Tradeoff / rollout risk**

- Server-side outcome dashboards may temporarily lose new data
- Requires backfill work once the projection layer exists

### C3. Production and test server bootstrapping are different systems

**Problem**

Tests build the app through `server/app.ts`, while production runs through `server/index.ts`. Both files configure security headers, CORS, body parsing, and error handling separately, with different behavior.

**Evidence**

- Test bootstrap path: `server/app.ts:6`, `server/app.ts:108`
- Production bootstrap path: `server/index.ts:20`, `server/index.ts:68`, `server/index.ts:266`, `server/index.ts:327`, `server/index.ts:373`
- CSP differs between files:
  - `server/app.ts:24`
  - `server/index.ts:340`

**Root cause**

A test-oriented app factory and a production-oriented entrypoint were both expanded independently.

**Why it matters**

- Tests do not validate the production middleware stack
- Security, body size limits, and routing can drift without detection
- Operational bugs can hide behind passing tests

**Recommended change**

Refactor to a single composition path:

1. Build one shared app setup function that configures:
   - security headers
   - CORS
   - body parsing
   - request logging
   - routes
   - error handling
2. Make static asset / landing page serving an option on top of that shared setup.
3. Make `server/index.ts` a thin runner only.
4. Make tests call the same shared setup with static serving disabled.

**What this improves**

- Test fidelity
- Lower operational drift
- Easier review of security-sensitive middleware

**Tradeoff / rollout risk**

- Small refactor across app startup
- Need regression checks for static serving and legal pages

### C4. Privacy and security statements no longer match the implemented system

**Problem**

The public privacy policy and email copy make concrete claims that are no longer true or are incomplete.

**Evidence**

- Privacy policy says the encryption key is "derived from your passphrase": `server/templates/privacy-policy.html:107`
- The actual key is randomly generated and stored in SecureStore or AsyncStorage: `client/lib/encryption.ts:24`
- Privacy policy says patient identifiers are hashed with SHA-256: `server/templates/privacy-policy.html:108`
- Actual implementation uses per-user HMAC-SHA256: `client/lib/patientIdentifierHmac.ts:44`
- Privacy policy says all data processing happens entirely on-device and there is no cloud processing for clinical data: `server/templates/privacy-policy.html:109`
- The system does external terminology requests via Ontoserver: `server/snomedApi.ts:1`
- The system sends email via Resend: `server/email.ts:6`
- The repo contains remote episode and outcome sync paths: `client/lib/episodeSync.ts:44`, `client/lib/outcomeSync.ts:35`
- Welcome email says "All your patient data stays on your device": `server/email.ts:119`

**Root cause**

Product/legal copy did not evolve with the implementation.

**Why it matters**

- This is a trust and compliance risk, not a cosmetic mismatch
- It undermines the product's privacy-first positioning
- Future remote sync work is dangerous until policy language is corrected

**Recommended change**

1. Rewrite policy, onboarding, and email copy to describe the actual system:
   - local-first storage for core clinical records
   - encrypted media on-device
   - account/profile data on the server
   - terminology lookups proxied through the backend to an external terminology service
   - any remote clinical projection or backup only if and when enabled
2. Gate all remote clinical sync features behind an explicit product/legal review.
3. Maintain one source file for these claims and reuse it across legal pages, onboarding, and email templates.

**What this improves**

- Reduces legal and reputational risk
- Makes future sync work safer
- Aligns product claims with reality

**Tradeoff / rollout risk**

- May require legal review and updated marketing language
- Might force some "privacy-first" claims to become more precise

## High

### H1. Common screens repeatedly decrypt the full case corpus instead of using a derived local index

**Problem**

The app repeatedly loads and decrypts the full case dataset on common screens. `getCases()` decrypts each stored case in batches, and that full read path is used widely for dashboard, search, statistics, inbox matching, planned cases, settings counts, and attention views.

**Evidence**

- Full corpus load decrypts case-by-case with UI yielding: `client/lib/storage.ts:286`
- Audit count: 12 `getCases()` call sites in non-test client code
- Dashboard uses full-case loads on focus: `client/screens/DashboardScreen.tsx:94`
- Statistics loads full cases on focus and then runs multiple in-memory aggregates: `client/hooks/useStatistics.ts:50`
- Case search loads all cases once, then searches PHI and procedure text in memory: `client/screens/CaseSearchScreen.tsx:32`
- Inbox also pulls the full case set for matching and assignment flows: `client/screens/InboxScreen.tsx:41`
- Active episodes fetch episodes, then fetch linked cases per episode: `client/hooks/useActiveEpisodes.ts:17`

**Root cause**

The system only has one practical local query primitive: "decrypt all cases, then filter in memory."

**Why it matters**

- Performance degrades with real logbook volume
- Search and dashboard responsiveness are capped by full decrypt cost
- Battery and memory use increase unnecessarily
- UI responsiveness is being preserved by workarounds like `InteractionManager` and tiny batch sizes rather than by better storage design

**Recommended change**

Introduce a local derived summary/query layer while keeping full encrypted cases canonical:

1. Keep full `Case` blobs as the canonical record.
2. Add an encrypted summary index containing only query/display fields:
   - `caseId`
   - `procedureDate`
   - `updatedAt`
   - `specialty`
   - `caseStatus`
   - `plannedDate`
   - `episodeId`
   - `encounterClass`
   - `facility`
   - primary diagnosis/procedure label
   - patient identifier hash
   - optional local search tokens needed for on-device search
3. Create dedicated query helpers:
   - `listRecentCaseSummaries()`
   - `searchCaseSummaries(query)`
   - `listCasesForEpisode(episodeId)`
   - `listPlannedCaseSummaries()`
4. Reserve `getCase(id)` for detail screens and edit flows.
5. Add an in-memory cache with explicit invalidation after case saves/deletes.

**What this improves**

- Faster dashboard, search, and inbox flows
- Less repeated decrypt work
- Better scalability without surrendering local-first privacy

**Tradeoff / rollout risk**

- Requires index migration and consistency guarantees
- Search token design must balance speed, privacy, and feature completeness

### H2. The case capture pipeline guarantees too little data quality while doing too much write work

**Problem**

The case form validates only a tiny subset of the model, but it continuously serializes and autosaves the entire form state. This creates a poor combination: weak data quality enforcement plus high write amplification.

**Evidence**

- Blocking validation checks only:
  - `patientIdentifier`
  - `procedureDate`
  - `facility`
  - `diagnosisGroups`
  Evidence: `client/hooks/useCaseForm.ts:704`
- The save flow builds a very wide `Case` payload from many optional and legacy fields: `client/hooks/useCaseForm.ts:1742`
- Draft persistence stringifies the full form state, compares full-state JSON, then saves an encrypted draft every 500ms after changes: `client/hooks/useCaseDraft.ts:88`
- Draft writes are kicked off without awaiting completion in `flushDraft()` and the debounce callback: `client/hooks/useCaseDraft.ts:76`

**Root cause**

Validation rules are under-modeled, while draft persistence was implemented as a coarse full-state autosave.

**Why it matters**

- Clinically inconsistent records can still be saved
- Large form sessions create avoidable storage churn
- Save behavior is harder to reason about and test
- Backgrounding the app during pending draft writes is fragile

**Recommended change**

Split this into two explicit subsystems:

1. Validation
   - Create domain validation modules by save mode: planned, incomplete, complete
   - Add specialty-level validation rules and warning tiers
   - Normalize then validate before persistence
2. Draft persistence
   - Persist only the draft subset, not the full UI state
   - Track dirty fields instead of `JSON.stringify(state)`
   - Replace ad hoc timers with a single write queue
   - Flush explicitly on background, navigation away, and save success
   - Surface write failures rather than silently ignoring them

**What this improves**

- Better capture quality
- Lower battery and storage pressure
- More predictable recovery from interrupted form sessions

**Tradeoff / rollout risk**

- More validation may add friction unless warnings and blocking rules are carefully separated
- Draft migration logic must preserve existing unsaved work

### H3. Terminology lookup depends on an uncached external service with weak resilience and questionable privacy boundaries

**Problem**

SNOMED search depends on a live backend proxy to Ontoserver, with no cache, no offline fallback, and raw query logging in the server layer.

**Evidence**

- External terminology dependency: `server/snomedApi.ts:1`
- Fetches are performed live with an 8 second timeout: `server/snomedApi.ts:10`
- Raw search terms are logged: `server/snomedApi.ts:119`
- Client terminology UI depends on the server API for search: `client/lib/snomedApi.ts:47`

**Root cause**

The terminology layer was added as an online lookup service rather than a resilient local-first support layer.

**Why it matters**

- Search UX will feel slow or brittle on poor networks
- A terminology outage harms case capture
- Logged query terms can include clinically sensitive text

**Recommended change**

1. Add server-side response caching keyed by normalized query, specialty, and result limit.
2. Add client-side "recent terminology" fallback for the most common workflows.
3. Stop logging raw search strings in production.
4. Add a degraded-mode UX:
   - recent/favorite terminology first
   - server search second
   - explicit offline/unavailable state
5. For the long term, decide whether the most common picklists should stay local and only rare lookups should go remote.

**What this improves**

- Faster search
- Better resilience
- Better privacy posture

**Tradeoff / rollout risk**

- Terminology freshness must be managed if cache windows are too long
- More complexity in the search stack

### H4. Sensitive profile data is cached in plain AsyncStorage on all platforms

**Problem**

Profile data from the server is cached locally in plain AsyncStorage, even on native platforms where the app already uses more secure stores for auth and encryption keys.

**Evidence**

- Profile cache write: `client/contexts/AuthContext.tsx:72`
- Profile cache read: `client/contexts/AuthContext.tsx:80`

The cached `UserProfile` includes fields such as name, date of birth, country of practice, and medical registration metadata.

**Root cause**

The profile cache was optimized for offline UX without following the same storage rules as tokens and case data.

**Why it matters**

- It weakens the app's overall privacy posture
- It creates a "secure clinical data, insecure surrounding metadata" inconsistency

**Recommended change**

1. Move profile cache to encrypted local storage:
   - SecureStore-backed small cache, or
   - the same local encryption wrapper used for case data
2. Cache only the minimum fields needed for offline boot.
3. Treat the profile cache as a separate DTO rather than storing the full server profile object.

**What this improves**

- Better confidentiality for personal/professional data
- More consistent storage policy across the app

**Tradeoff / rollout risk**

- Slightly slower cold start for offline profile hydration
- Cache migration required

### H5. Core modules are too large and too dynamic to stay elegant or safe

**Problem**

Several key files are large monoliths, and the codebase relies on widespread `any` / `as any` escapes. This weakens compiler guarantees and makes refactors risky.

**Evidence**

- `client/lib/procedurePicklist.ts`: 5624 lines
- `client/types/case.ts`: 2484 lines
- `server/routes.ts`: 2212 lines
- `client/hooks/useCaseForm.ts`: 1953 lines
- Repo-wide audit found heavy `any` usage across form, migration, UI, and type boundaries

**Root cause**

Feature growth outpaced structural extraction.

**Why it matters**

- Harder reasoning about behavior
- Harder testing
- High merge conflict pressure
- More accidental regressions when changing capture logic

**Recommended change**

Refactor by bounded context, not by file size alone:

1. Split `useCaseForm` into:
   - form state
   - validation
   - save orchestration
   - specialty enrichers
   - draft conversion
2. Split `server/routes.ts` by route module:
   - auth/profile
   - facilities/device keys
   - terminology/staging
   - procedures/outcomes
   - episodes
3. Move large static picklists into generated JSON or typed data modules loaded by specialty.
4. Replace `any` in hot paths with adapters for legacy payloads at the boundary only.

**What this improves**

- Cleaner reviews
- Better compiler leverage
- Safer future changes

**Tradeoff / rollout risk**

- Refactor work touches many files
- Must avoid mixing structural refactors with behavior changes

## Medium

### M1. The repo contains dormant or half-adopted data layers

**Problem**

Several subsystems are present but not meaningfully integrated:

- React Query is configured but not used for real data fetching
- episode sync exists but has no call sites outside itself
- `/api/procedures` exists but has no non-test client consumers
- `stripPatientIdentityForSync()` exists but is not used anywhere

**Evidence**

- Query client configuration exists: `client/lib/query-client.ts:127`
- `QueryClientProvider` is mounted: `client/App.tsx`
- Audit search found no non-test `useQuery()` or `useMutation()` call sites
- Episode sync module only self-references: `client/lib/episodeSync.ts:44`
- Unused sync boundary helper exists: `client/lib/patientIdentifierHmac.ts:75`

**Recommended change**

For each subsystem, do one of two things:

1. Remove it now if it is not part of the chosen architecture.
2. Or wire it into a deliberate boundary with tests and observability.

For the local-first target:

- remove or postpone React Query for local case data
- either remove `episodeSync.ts` or mark it feature-flagged and experimental
- make any future server projection path call a mandatory serializer that strips identity fields

**What this improves**

- Less confusion
- Smaller maintenance surface
- Stronger boundaries for future sync work

**Tradeoff / rollout risk**

- Removing dormant code may expose hidden assumptions in branches not covered by tests

### M2. Server relation loading and index definitions are not aligned to real query patterns

**Problem**

The server storage layer still has avoidable N+1 reads, and the Drizzle schema index definition does not match the stated performance migration.

**Evidence**

- `getProcedureWithRelations()` fetches flaps and then loads anastomoses per flap: `server/storage.ts:547`
- Drizzle index uses `(user_id, created_at)`: `shared/schema.ts:377`
- Performance migration says the hot path should index `(user_id, procedure_date DESC)`: `migrations/add_performance_indexes.sql:18`

**Root cause**

Query shaping and index evolution happened in pieces.

**Recommended change**

1. Align schema-declared indexes, migrations, and query order with the intended access pattern.
2. Replace flap-by-flap anastomosis loading with a batched relation query.
3. Add an assertion in tests or migration review that schema and SQL index definitions stay aligned.

**What this improves**

- Lower query latency
- Less schema drift
- Better confidence in the backend's performance claims

**Tradeoff / rollout risk**

- Index changes require migration discipline in existing environments

### M3. Legacy compatibility logic is spread too deep into live features

**Problem**

Legacy fields and fallbacks are still woven through active business logic, instead of being normalized once at the boundary.

**Evidence**

- `Case` still carries many deprecated fields and compatibility shims: `client/types/case.ts`
- Statistics and statistics helpers duplicate role fallback logic:
  - `client/lib/statistics.ts:190`
  - `client/lib/statisticsHelpers.ts:165`
- Migration and read repair logic remain active inside storage paths: `client/lib/storage.ts:288`, `client/lib/storage.ts:332`

**Recommended change**

1. Push all legacy normalization to load-time adapters.
2. Keep the canonical in-memory model legacy-free after normalization.
3. Publish a deprecation matrix for fields and set deadlines for removal.
4. Replace duplicated fallback logic with shared selectors.

**What this improves**

- Cleaner domain logic
- Lower cognitive load
- Safer analytics and feature work

**Tradeoff / rollout risk**

- Requires careful migration coverage for old records

### M4. Static picklist volume is likely inflating bundle parse time and memory use

**Problem**

Large specialty picklists are embedded directly in TypeScript modules. This makes startup and memory characteristics worse than they need to be.

**Evidence**

- `client/lib/procedurePicklist.ts`: 5624 lines
- Additional diagnosis picklists are also several thousand lines each

**Recommended change**

1. Move large picklist payloads into generated JSON or versioned static assets.
2. Load them by specialty on demand.
3. Keep only narrow typed adapters in code.

**What this improves**

- Lower JS parse cost
- Lower memory footprint
- Faster startup on lower-end devices

**Tradeoff / rollout risk**

- Build pipeline becomes slightly more complex

### M5. Tooling and documentation are drifting away from repo reality

**Problem**

The repo contains status documentation that does not match the current codebase state.

**Evidence**

- Media closeout doc says repo-wide lint cleanup was completed and eslint passes with zero warnings: `docs/media-improvement-closeout.md:44`
- Actual audit baseline found `npm run lint` failing with 399 problems

**Recommended change**

1. Stop writing static "lint is clean" claims into docs unless they are generated from CI.
2. Add a CI badge or generated verification block if this needs to be documented.
3. Re-establish a realistic lint baseline:
   - either fix incrementally by area
   - or add per-directory budgets and burn them down deliberately

**What this improves**

- Restores trust in project docs
- Makes hygiene work measurable again

**Tradeoff / rollout risk**

- Exposes the current maintenance gap more clearly

## Low

### L1. There are multiple smaller doc and comment mismatches

Examples:

- `client/lib/snomedApi.ts` still says "Snowstorm API" while the backend uses Ontoserver
- avatar upload comment says the original extension is preserved, but the filename is hardcoded to `.jpg`

These are not primary risks, but they add noise and reduce trust.

### L2. Logging is still mostly ad hoc `console.*`

The app and server use raw `console.log`, `console.warn`, and `console.error` broadly, including terminology search paths and operational events. A structured logger with redaction would be safer and easier to operate.

### L3. Performance and recovery behavior need dedicated non-functional testing

The repo has strong unit coverage, but it lacks explicit regression checks for:

- large local case corpora
- draft recovery after interruption
- performance of dashboard/search against realistic data volume
- visibility of remote sync failures when feature flags are enabled

## Target-State Architecture Recommendation

For the local-first target, the architecture should become:

| Layer | Responsibility |
| --- | --- |
| Local canonical store | Full encrypted `Case`, `TreatmentEpisode`, timeline, and media records |
| Local derived indexes | Encrypted summary index, search index, and optional cached aggregate views |
| UI data access | Query helpers over indexes plus `getCase(id)` for detail/edit flows |
| Server platform layer | Auth, profiles, facilities, device keys, legal pages, email |
| Terminology layer | Cached backend proxy plus local recents/favorites |
| Optional analytics projection | Explicit one-way projection from local records to server reporting tables |

The key rule is:

**No server clinical table should receive client data unless it comes through an explicit serializer/projection boundary with identity stripping, mapping IDs, versioning, and observable sync state.**

## Prioritized Roadmap

## Stabilize Now

1. Declare local case and episode stores as canonical in code comments, docs, and implementation planning.
2. Disable or feature-flag the broken flap outcome sync path.
3. Unify server bootstrapping so tests and production share the same middleware configuration.
4. Correct privacy policy and email claims to match the implementation.
5. Remove or encrypt the plain AsyncStorage profile cache.
6. Stop claiming lint is clean until it actually is.

## Simplify Next

1. Build an encrypted local summary index and replace common `getCases()` full-load call sites.
2. Refactor draft persistence into a queued writer for the persisted draft subset only.
3. Extract save-mode and specialty validation into dedicated modules.
4. Split `server/routes.ts` and `useCaseForm.ts` by bounded context.
5. Remove or formalize dormant subsystems:
   - React Query for local data
   - episode sync
   - server procedure registry assumptions

## Strategic Redesign

1. Build a formal local-to-server analytics projection layer with stable ID mapping.
2. Move large picklists to lazy-loaded generated assets.
3. Add server-side terminology caching and offline-aware terminology UX.
4. Add scale and recovery benchmarks for:
   - dashboard load
   - case search
   - statistics
   - draft recovery
   - media-heavy case detail

## Final Assessment

Opus Logbook should not be rewritten around a server-first architecture. The repo is already structurally closer to a strong local-first product than to a coherent cloud-sync product.

The right move is to finish that architecture properly:

- make local canonical storage explicit
- make server-side clinical data derived, not implied
- add fast local indexes
- tighten privacy boundaries
- remove dead architectural branches

If those changes are made in that order, the codebase can become materially faster, more reliable, and much easier to evolve without sacrificing the privacy model that already gives the product its strongest identity.
