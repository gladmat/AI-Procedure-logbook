-- Migration: Add performance indexes for high-frequency query paths
-- Generated from audit recommendation #3
-- 
-- These indexes cover the most common read patterns in the application:
-- - Procedure lookups by user (case list screen)
-- - Flap lookups by procedure (case detail screen)
-- - Anastomosis lookups by flap (flap detail screen)
-- - Case procedure lookups by case (multi-procedure case view)
-- - Password reset token cleanup (expired token deletion)
-- - SNOMED reference lookups by category (procedure entry picklists)
-- - Facility lookups by user (onboarding, settings)
--
-- All indexes use IF NOT EXISTS for idempotent execution.

-- Procedures: user's case list is the most common query in the app
CREATE INDEX IF NOT EXISTS idx_procedures_user_id ON procedures (user_id);

-- Procedures: sorting by date is the default case list order
CREATE INDEX IF NOT EXISTS idx_procedures_user_date ON procedures (user_id, procedure_date DESC);

-- Flaps: always queried by parent procedure
CREATE INDEX IF NOT EXISTS idx_flaps_procedure_id ON flaps (procedure_id);

-- Anastomoses: always queried by parent flap
CREATE INDEX IF NOT EXISTS idx_anastomoses_flap_id ON anastomoses (flap_id);

-- Case procedures: always queried by parent case
CREATE INDEX IF NOT EXISTS idx_case_procedures_case_id ON case_procedures (case_id);

-- Password reset tokens: expired token cleanup runs on every reset request
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens (expires_at);

-- SNOMED reference: filtered by category + active status (the primary query pattern)
CREATE INDEX IF NOT EXISTS idx_snomed_ref_category_active ON snomed_ref (category, is_active);

-- User facilities: always queried by user
CREATE INDEX IF NOT EXISTS idx_user_facilities_user_id ON user_facilities (user_id);
