-- Sendo platform — fresh database bootstrap.
-- Run as a Postgres superuser:
--   sudo -u postgres psql -v ON_ERROR_STOP=1 -f scripts/db-init.sql
-- Idempotent (safe to re-run).

-- Role (login user the backend uses).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sendo') THEN
    CREATE ROLE sendo LOGIN PASSWORD 'sendo_change_me';
  END IF;
END
$$;

-- Database (cannot be created inside a transaction; \gexec runs the produced SQL).
SELECT 'CREATE DATABASE sendo OWNER sendo'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'sendo')
\gexec

\connect sendo

-- Required extensions.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Application schema (separate from `public`).
CREATE SCHEMA IF NOT EXISTS sendo AUTHORIZATION sendo;
GRANT USAGE, CREATE ON SCHEMA sendo TO sendo;
ALTER ROLE sendo SET search_path = sendo, public;
