-- PostgreSQL-flavoured (GaussDB for PostgreSQL / RDS PostgreSQL). Verify PostGIS availability on your chosen Huawei engine;
-- if absent, keep the haversine lookup in app.py (fine for ~100 shelters).
CREATE TABLE shelters (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  lat          DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lon          DOUBLE PRECISION NOT NULL CHECK (lon BETWEEN -180 AND 180),
  capacity     INT,
  elevation_m  REAL,                 -- from DEM; prefer shelters above the local flood surface
  source       TEXT NOT NULL,        -- 'fyp-15' | 'osm' | 'jkm'
  verified_at  DATE
);
CREATE TABLE devices (
  device_id TEXT PRIMARY KEY, mount_height_cm REAL NOT NULL, lat DOUBLE PRECISION, lon DOUBLE PRECISION,
  ground_elev_m REAL, secret_hash TEXT NOT NULL
);
CREATE TABLE sensor_readings (
  device_id TEXT REFERENCES devices, ts TIMESTAMPTZ NOT NULL, level_m REAL NOT NULL, PRIMARY KEY (device_id, ts)
);
CREATE TABLE family_groups (id TEXT PRIMARY KEY, owner_uid TEXT NOT NULL);
CREATE TABLE family_contacts (
  id SERIAL PRIMARY KEY, group_id TEXT REFERENCES family_groups, display_name TEXT, phone_e164 TEXT NOT NULL,
  consent_at TIMESTAMPTZ NOT NULL,           -- PDPA: record explicit consent
  sms_confirmed BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE sos_events (
  idempotency_key TEXT PRIMARY KEY, uid TEXT NOT NULL, group_id TEXT, lat DOUBLE PRECISION, lon DOUBLE PRECISION,
  level_m REAL, shelter_name TEXT, channel TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
-- retention: purge sos_events location fields after 30 days; readings can stay.
