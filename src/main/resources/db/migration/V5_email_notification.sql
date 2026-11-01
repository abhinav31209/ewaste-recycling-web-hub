CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  recipient_email TEXT NOT NULL,

  subject TEXT NOT NULL,

  body TEXT NOT NULL,

  status TEXT NOT NULL
    CHECK (status IN ('sent','failed')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id
ON email_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_email_notifications_order_id
ON email_notifications(order_id);

CREATE INDEX IF NOT EXISTS idx_email_notifications_status
ON email_notifications(status);