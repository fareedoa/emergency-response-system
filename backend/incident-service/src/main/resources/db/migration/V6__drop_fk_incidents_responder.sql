-- Drop FK constraint that incorrectly tied assigned_unit to the local responders table.
-- assigned_unit stores vehicle UUIDs from the tracking-service, not local responder IDs.
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS fk_incidents_responder;
