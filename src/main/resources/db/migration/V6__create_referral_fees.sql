CREATE TABLE referral_fees (
                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

                               device_id UUID NOT NULL,
                               owner_id UUID NOT NULL,

                               device_name VARCHAR(255) NOT NULL,
                               third_party_name VARCHAR(255) NOT NULL,
                               referral_code VARCHAR(255) NOT NULL UNIQUE,
                               referral_url TEXT NOT NULL,

                               estimated_fee NUMERIC(10, 2) NOT NULL,
                               status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

                               created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                               confirmed_at TIMESTAMPTZ,
                               paid_at TIMESTAMPTZ
);