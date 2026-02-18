@echo off
setlocal

:: Load environment variables from .env if they aren't set
if exist .env (
    for /f "tokens=*" %%i in ('type .env ^| findstr /v "^#"') do set "%%i"
)

if "%DB_HOST%"=="" echo Missing DB_HOST in .env & exit /b 1
if "%DB_PORT%"=="" echo Missing DB_PORT in .env & exit /b 1
if "%DB_NAME%"=="" echo Missing DB_NAME in .env & exit /b 1
if "%DB_USERNAME%"=="" echo Missing DB_USERNAME in .env & exit /b 1
if "%DB_PASSWORD%"=="" echo Missing DB_PASSWORD in .env & exit /b 1

set "PGPASSWORD=%DB_PASSWORD%" 

:: Try to find psql in PATH first, then Fallback to common locations
where psql >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set "PSQL_BIN=psql"
) else (
    if exist "C:\Program Files\PostgreSQL\18\bin\psql.exe" (
        set "PSQL_BIN="C:\Program Files\PostgreSQL\18\bin\psql.exe""
    ) else if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" (
        set "PSQL_BIN="C:\Program Files\PostgreSQL\17\bin\psql.exe""
    ) else if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
        set "PSQL_BIN="C:\Program Files\PostgreSQL\16\bin\psql.exe""
    ) else if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
        set "PSQL_BIN="C:\Program Files\PostgreSQL\15\bin\psql.exe""
    ) else if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
        set "PSQL_BIN="C:\Program Files\PostgreSQL\14\bin\psql.exe""
    ) else if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" (
        set "PSQL_BIN="C:\Program Files\PostgreSQL\13\bin\psql.exe""
    ) else (
        echo psql.exe not found in PATH or standard PostgreSQL folders. 
        echo Please install PostgreSQL client or add it to your PATH.
        exit /b 1
    )
)

echo Initializing database at %DB_HOST%...
%PSQL_BIN% -f "supabase-init.sql" "host=%DB_HOST% port=%DB_PORT% dbname=%DB_NAME% user=%DB_USERNAME% sslmode=require"
