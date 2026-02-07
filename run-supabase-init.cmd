@echo off
setlocal

if "%DB_HOST%"=="" echo Missing DB_HOST & exit /b 1
if "%DB_PORT%"=="" echo Missing DB_PORT & exit /b 1
if "%DB_NAME%"=="" echo Missing DB_NAME & exit /b 1
if "%DB_USERNAME%"=="" echo Missing DB_USERNAME & exit /b 1
if "%DB_PASSWORD%"=="" echo Missing DB_PASSWORD & exit /b 1

set "PGPASSWORD=%DB_PASSWORD%"
"C:\Program Files\PostgreSQL\13\bin\psql.exe" -f "c:\Users\sirine\Desktop\pi\supabase-init.sql" "host=%DB_HOST% port=%DB_PORT% dbname=%DB_NAME% user=%DB_USERNAME% sslmode=require"
