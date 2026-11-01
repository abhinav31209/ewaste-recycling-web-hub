CREATE TABLE data_erasure_records (
                                      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

                                      device_id UUID NOT NULL,
                                      owner_id UUID NOT NULL,

                                      status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
                                      erasure_provider VARCHAR(255) NOT NULL DEFAULT 'Third-party recycler',
                                      certificate_code VARCHAR(255),
                                      staff_note TEXT,

                                      requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                      completed_at TIMESTAMPTZ
);