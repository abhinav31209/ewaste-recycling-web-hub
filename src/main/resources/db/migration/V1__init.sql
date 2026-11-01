BEGIN;


CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','staff','admin')) DEFAULT 'owner',
  status TEXT NOT NULL CHECK (status IN ('active','disabled')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE IF NOT EXISTS devices (
                                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    device_name TEXT NOT NULL,
    brand TEXT,
    condition TEXT CHECK (condition IN ('new','good','fair','broken')),

    classification TEXT NOT NULL
    CHECK (classification IN ('UNKNOWN','CURRENT','RECYCLE','RARE','UNWANTED'))
    DEFAULT 'UNKNOWN',

    workflow_status TEXT NOT NULL
    CHECK (workflow_status IN ('SUBMITTED','UNDER_REVIEW','PUBLISHED','HIDDEN'))
    DEFAULT 'SUBMITTED',

    follow_up_status TEXT,
    owner_contacted BOOLEAN DEFAULT FALSE,
    staff_note TEXT,

    device_type TEXT
    CHECK (device_type IN ('PHONE','LAPTOP','TABLET','DESKTOP','CONSOLE','TV','WEARABLE','OTHER')),

    device_visibility TEXT NOT NULL
    CHECK (device_visibility IN ('DRAFT','VISIBLE','HIDDEN'))
    DEFAULT 'DRAFT',

    created_at TIMESTAMPTZ DEFAULT now()
    );

CREATE INDEX IF NOT EXISTS idx_devices_user_id
ON devices(user_id);

CREATE INDEX IF NOT EXISTS idx_devices_classification
ON devices(classification);

CREATE TABLE IF NOT EXISTS orders (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,

  type TEXT NOT NULL
    CHECK (type IN ('DATA_RETRIEVAL','RECYCLE')),

  status TEXT NOT NULL
    CHECK (status IN ('CREATED','PROCESSING','FULFILLED','RESTORED','CANCELLED'))
    DEFAULT 'CREATED',

  created_at TIMESTAMPTZ DEFAULT now(),

  retrieval_token TEXT,

  fulfilled_at TIMESTAMPTZ,

  expires_at TIMESTAMPTZ,

  hard_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id
ON orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_device_id
ON orders(device_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);


CREATE TABLE IF NOT EXISTS payments (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  provider TEXT NOT NULL
    CHECK (provider IN ('stripe','paypal')),

  provider_intent_id TEXT,

  amount NUMERIC NOT NULL,

  currency TEXT NOT NULL DEFAULT 'GBP',

  status TEXT NOT NULL
    CHECK (status IN ('initiated','succeeded','failed','refunded')),

  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (provider, provider_intent_id)
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id
ON payments(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
ON payments(status);

-- =========================
-- REPORTING VIEW
-- =========================
CREATE OR REPLACE VIEW v_payments_monthly AS
SELECT
  date_trunc('month', created_at) AS month,
  status,
  COUNT(*) AS payments_count,
  SUM(amount) AS total_amount
FROM payments
GROUP BY 1,2
ORDER BY 1 DESC;

COMMIT;
