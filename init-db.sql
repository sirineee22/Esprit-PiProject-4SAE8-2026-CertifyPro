-- userdb is already created by POSTGRES_DB env var.
-- Create eventdb if it doesn't exist.
SELECT 'CREATE DATABASE eventdb' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'eventdb')\gexec
