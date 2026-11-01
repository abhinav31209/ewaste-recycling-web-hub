ALTER TABLE devices
DROP CONSTRAINT IF EXISTS devices_device_type_check;

ALTER TABLE devices
ADD CONSTRAINT devices_device_type_check
CHECK (device_type IN (
    'PHONE',
    'LAPTOP',
    'TABLET',
    'DESKTOP',
    'CONSOLE',
    'TV',
    'WEARABLE',
    'OTHER'
));