CREATE TABLE IF NOT EXISTS attendance_students (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  nis TEXT NOT NULL UNIQUE,
  class_name TEXT NOT NULL,
  descriptor JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGSERIAL PRIMARY KEY,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  attendance_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  nis TEXT NOT NULL,
  class_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Masuk', 'Pulang')),
  distance DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records (attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_nis_date ON attendance_records (nis, attendance_date, status);