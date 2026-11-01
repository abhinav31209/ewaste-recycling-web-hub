CREATE TABLE qr_access_tokens (
                                  id BIGSERIAL PRIMARY KEY,
                                  token VARCHAR(128) NOT NULL UNIQUE,
                                  device_id UUID NOT NULL,
                                  active BOOLEAN NOT NULL DEFAULT TRUE,
                                  created_at TIMESTAMP NOT NULL,
                                  expires_at TIMESTAMP NOT NULL,
                                  CONSTRAINT fk_qr_access_tokens_device
                                      FOREIGN KEY (device_id) REFERENCES offered_devices(id) ON DELETE CASCADE
);