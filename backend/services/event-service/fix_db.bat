@echo off
set PGPASSWORD=sisina
echo Fixing DB constraint...
psql -h localhost -U postgres -d eventdb -c "ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_status_check; ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_status_check CHECK (status IN ('REGISTERED', 'CANCELLED', 'ATTENDED', 'WAITLISTED'));"
echo Done.
