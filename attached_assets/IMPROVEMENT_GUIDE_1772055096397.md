# Improvement Package — Audit Follow-up (Points 1–4)

## Summary of Changes

This package contains **5 improvements** across 3 server files and 1 SQL migration. They address the audit findings plus the IDOR vulnerability that was flagged as "fixed" but wasn't actually patched in the codebase.

---

## Improvement 0 (Critical): Facility Deletion IDOR Fix

**Files:** `server/routes.ts`, `server/storage.ts`

The audit report stated this was "fixed in this patch," but the code on GitHub still has the vulnerability. `deleteUserFacility()` accepts only an `id` parameter — any authenticated user who guesses or enumerates facility IDs can delete another user's facilities.

**What changed:**
- `storage.deleteUserFacility(id)` → `storage.deleteUserFacility(id, userId)` — signature now requires userId
- The SQL DELETE now uses `WHERE id = ? AND user_id = ?` (both conditions)
- The IStorage interface is updated to match
- The route now passes `req.userId!` and checks the return value to return 404 if the facility doesn't belong to the user

---

## Improvement 1: Environment-Gated Seed Endpoint

**File:** `server/routes.ts`

The `/api/seed-snomed-ref` POST endpoint is now only registered when `ENABLE_SEED=true` is set in the environment. In all other cases, the route simply doesn't exist — no 403, no runtime check, just a 404 from Express.

**What changed:**
- The `app.post("/api/seed-snomed-ref", ...)` registration is wrapped in `if (process.env.ENABLE_SEED === "true")`
- The redundant `isProduction` check inside the handler is removed (the gate is now at route registration time, which is cleaner)
- The `x-seed-token` header check is preserved as a secondary defence

**To use:** Set `ENABLE_SEED=true` in Replit Secrets when you need to seed data, then remove or set to `false` afterwards.

---

## Improvement 2: Route-Level Body Size Limits

**File:** `server/index.ts`

The global 50MB body limit is replaced with route-specific limits:

| Route prefix | Limit | Rationale |
|---|---|---|
| `/api/auth/*` | 1 KB | Login/signup payloads are tiny; large payloads are abuse |
| `/api/seed-snomed-ref` | 5 MB | Bulk seed data can be large |
| `/api/*` (everything else) | 256 KB | Normal API operations — procedure data, profiles, SNOMED refs |
| Non-API routes | 256 KB | Landing page, Expo manifest — shouldn't receive POST bodies at all |

**What changed:**
- `setupBodyParsing()` now applies `express.json()` with different limits per route prefix
- Express matches route-specific middleware first (most specific wins), so `/api/auth` gets 1KB before the generic `/api` 256KB kicks in
- The `rawBody` capture for webhook verification is preserved on the bulk and fallback parsers

---

## Improvement 3: Database Performance Indexes

**File:** `migrations/add_performance_indexes.sql`

Adds 8 indexes covering the highest-frequency query paths:

| Index | Table | Column(s) | Query Pattern |
|---|---|---|---|
| `idx_procedures_user_id` | procedures | user_id | Case list by user |
| `idx_procedures_user_date` | procedures | user_id, procedure_date DESC | Case list sorted by date |
| `idx_flaps_procedure_id` | flaps | procedure_id | Flaps for a case |
| `idx_anastomoses_flap_id` | anastomoses | flap_id | Anastomoses for a flap |
| `idx_case_procedures_case_id` | case_procedures | case_id | Sub-procedures for a case |
| `idx_password_reset_tokens_expires_at` | password_reset_tokens | expires_at | Expired token cleanup |
| `idx_snomed_ref_category_active` | snomed_ref | category, is_active | Reference picklist queries |
| `idx_user_facilities_user_id` | user_facilities | user_id | User's facilities list |

**To apply:** Run the SQL file against your PostgreSQL database. All statements use `IF NOT EXISTS` so it's safe to run multiple times.

In Replit, you can run this via the database shell or add it to your Drizzle migration pipeline.

---

## Improvement 4: Endpoint Annotations

**File:** `server/routes.ts`

Every route group now has a comment block documenting:
- **Consumer** — which client or system calls this endpoint
- **Ownership model** — how user-scoping is enforced
- **Status** — whether the endpoint is active, planned, or scaffolding

This makes it immediately clear which endpoints are in active use by the mobile client and which are scaffolding for future features (E2EE device keys, SNOMED concept detail view, staging browser).

---

## How to Apply

### Option A: Full file replacement (recommended)
Copy these files directly into your Replit project, replacing the originals:
1. `server/index.ts` — replaces existing
2. `server/routes.ts` — replaces existing
3. `server/storage.ts` — replaces existing
4. Run `migrations/add_performance_indexes.sql` against your database

### Option B: Cherry-pick individual changes
If you prefer to apply selectively, the key diffs are:

**IDOR fix (storage.ts line ~149):**
```typescript
// OLD:
async deleteUserFacility(id: string): Promise<boolean> {
  const result = await db.delete(userFacilities).where(eq(userFacilities.id, id));
  return true;
}

// NEW:
async deleteUserFacility(id: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(userFacilities)
    .where(and(eq(userFacilities.id, id), eq(userFacilities.userId, userId)))
    .returning();
  return result.length > 0;
}
```

**IDOR fix (routes.ts facility delete handler):**
```typescript
// OLD:
await storage.deleteUserFacility(req.params.id);
res.json({ success: true });

// NEW:
const deleted = await storage.deleteUserFacility(req.params.id, req.userId!);
if (!deleted) {
  return res.status(404).json({ error: "Facility not found" });
}
res.json({ success: true });
```

**Seed endpoint gate (routes.ts):**
```typescript
// OLD: always registered
app.post("/api/seed-snomed-ref", authenticateToken, async (...) => { ... });

// NEW: only registered when env var is set
if (process.env.ENABLE_SEED === "true") {
  app.post("/api/seed-snomed-ref", authenticateToken, async (...) => { ... });
}
```

**Body limits (index.ts):**
Replace the entire `setupBodyParsing()` function with the new version.

### Environment variables to add in Replit Secrets:
- `ENABLE_SEED` — set to `"true"` only when you need to seed data, then remove

---

## Logging Cleanup (bonus)

The patched `routes.ts` also removes debug console.logs that were left in:
- `console.log("Password reset request received")` — removed
- `console.log("Password reset requested for email:", ...)` — removed  
- `console.log("Password reset rate limited for IP:", ...)` — removed
- `console.log("Creating facility - received:", ...)` — removed
- `console.log("Created facility - returning:", ...)` — removed

Error-level logging (`console.error`) is preserved — those are appropriate for production.
