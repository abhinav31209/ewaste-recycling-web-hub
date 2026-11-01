ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS data_wipe_status VARCHAR(32) NOT NULL DEFAULT 'NOT_REQUIRED',
    ADD COLUMN IF NOT EXISTS data_wipe_completed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS data_wipe_completed_by UUID,
    ADD COLUMN IF NOT EXISTS retrieval_available BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS retrieval_available_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS retrieval_available_until TIMESTAMP;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) NOT NULL DEFAULT 'UNPAID',
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS payment_id UUID;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN (
        'PAYMENT_PENDING',
        'PAID',
        'READY_FOR_FULFILLMENT',
        'CREATED',
        'PROCESSING',
        'FULFILLED',
        'EXPIRED',
        'RESTORED',
        'CANCELLED'
    ));
