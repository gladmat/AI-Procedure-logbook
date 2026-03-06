-- Migration: add structured professional registrations to profiles
-- Purpose:
--   - keep the legacy single medical_council_number column
--   - add a JSONB column that can hold multiple simultaneous registrations
--   - backfill existing users into the new structure using country_of_practice

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS professional_registrations jsonb
  NOT NULL
  DEFAULT '{}'::jsonb;

UPDATE profiles
SET professional_registrations = jsonb_build_object(
  CASE country_of_practice
    WHEN 'new_zealand' THEN 'new_zealand'
    WHEN 'australia' THEN 'australia'
    WHEN 'poland' THEN 'poland'
    WHEN 'united_kingdom' THEN 'united_kingdom'
    WHEN 'united_states' THEN 'united_states'
    ELSE 'other'
  END,
  btrim(medical_council_number)
)
WHERE (professional_registrations IS NULL OR professional_registrations = '{}'::jsonb)
  AND medical_council_number IS NOT NULL
  AND btrim(medical_council_number) <> '';
