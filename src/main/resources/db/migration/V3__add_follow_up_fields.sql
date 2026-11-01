ALTER TABLE offered_devices
    ADD COLUMN IF NOT EXISTS follow_up_status VARCHAR(50);

ALTER TABLE offered_devices
    ADD COLUMN IF NOT EXISTS owner_contacted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE offered_devices
    ADD COLUMN IF NOT EXISTS staff_note VARCHAR(500);