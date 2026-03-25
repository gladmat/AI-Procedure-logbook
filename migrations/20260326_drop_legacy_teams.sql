-- Drop legacy teams / team_members tables.
-- Replaced by team_contacts (per-user operative team roster with optional linkedUserId).
-- These tables were never queried by the application; safe to remove.

DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
