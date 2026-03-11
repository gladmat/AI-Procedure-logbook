BEGIN;

-- Remove the abandoned server-side clinical registry.
-- Clinical source of truth now lives exclusively in local encrypted storage.
DROP TABLE IF EXISTS procedure_outcomes CASCADE;
DROP TABLE IF EXISTS anastomoses CASCADE;
DROP TABLE IF EXISTS flaps CASCADE;
DROP TABLE IF EXISTS case_procedures CASCADE;
DROP TABLE IF EXISTS procedures CASCADE;
DROP TABLE IF EXISTS treatment_episodes CASCADE;

COMMIT;
