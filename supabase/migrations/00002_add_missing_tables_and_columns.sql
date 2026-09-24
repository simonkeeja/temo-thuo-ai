
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add missing columns to profiles
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. audit_logs table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  table_name    TEXT,
  record_id     UUID,
  old_data      JSONB,
  new_data      JSONB,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_read" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'operations_team')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. notifications table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'system',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  action_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_owner_all" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. sensor_readings table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sensor_readings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id    UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  reading_type TEXT NOT NULL,
  value        NUMERIC NOT NULL,
  unit         TEXT,
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sensor_readings_auth_read" ON sensor_readings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sensor_readings_auth_insert" ON sensor_readings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. iot_devices table (separate from device_assets)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS iot_devices (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code        TEXT UNIQUE NOT NULL DEFAULT 'IOT-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)),
  device_type        TEXT NOT NULL,
  serial_number      TEXT,
  protocol           TEXT DEFAULT 'MQTT',
  farm_id            UUID REFERENCES farms(id) ON DELETE SET NULL,
  field_id           UUID REFERENCES crop_fields(id) ON DELETE SET NULL,
  installation_date  DATE,
  status             TEXT NOT NULL DEFAULT 'offline',
  last_ping_at       TIMESTAMPTZ,
  signal_strength    INTEGER,
  firmware_version   TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "iot_devices_auth_read" ON iot_devices
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "iot_devices_admin_write" ON iot_devices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','operations_team','extension_officer'))
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. iot_events table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS iot_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE iot_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "iot_events_auth_read" ON iot_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. treatments table (vet services)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treatments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id    UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  visit_id     UUID REFERENCES veterinary_visits(id) ON DELETE SET NULL,
  diagnosis    TEXT NOT NULL,
  medication   TEXT,
  dosage       TEXT,
  duration     TEXT,
  notes        TEXT,
  treated_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "treatments_auth_read" ON treatments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "treatments_vet_write" ON treatments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. device_maintenance table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_maintenance (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id        UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_date   DATE,
  completed_date   DATE,
  performed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'scheduled',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE device_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_maintenance_auth_read" ON device_maintenance
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Indexes for common queries
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_id     ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read     ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id ON sensor_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded  ON sensor_readings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at     ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_iot_devices_status        ON iot_devices(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role             ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status           ON profiles(status);
