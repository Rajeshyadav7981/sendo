-- Sendo platform — fresh database bootstrap.
-- Run as a superuser (e.g. `psql -U postgres -f db-init.sql`).
-- Safe to re-run; uses IF NOT EXISTS guards.

-- Configurable values. Override with `psql -v role_name=... -v db_name=...`.
\set role_name 'sendo'
\set role_password 'sendo_change_me'
\set db_name 'sendo'
\set schema_name 'sendo'

-- Role (login user the backend uses).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'role_name') THEN
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', :'role_name', :'role_password');
  END IF;
END
$$;

-- Database (cannot be created inside a transaction; use \gexec).
SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'role_name')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name')
\gexec

\connect :db_name

-- Required extensions (uuid_generate_v4 is used by entities).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Application schema (separate from `public` so app objects are namespaced).
CREATE SCHEMA IF NOT EXISTS :"schema_name" AUTHORIZATION :role_name;
GRANT USAGE, CREATE ON SCHEMA :"schema_name" TO :role_name;
ALTER ROLE :role_name SET search_path = :"schema_name", public;
