# CertifyPro

Training platform: certifications, courses, user and admin flows.

## Stack

- **Frontend:** Angular (port 4200)
- **Backend:** Spring Boot – user-service (port 8083)
- **DB:** PostgreSQL

## Run

**PostgreSQL**

- Create DB: `CREATE DATABASE userdb;`
- Start PostgreSQL (e.g. service or `pg_ctl`).

**Backend**

```bash
cd backend/services/user-service
mvn spring-boot:run
```

Uses `application.properties`; override with env: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`.

**Frontend**

```bash
cd frontend
npm install
ng serve
```

API base URL: `http://localhost:8083` (see `frontend/src/app/core/api/api.config.ts`).

## Admin

On first run, an admin user is created if missing:

- **Email:** `admin@platform.com`
- **Password:** `Admin123!`

## Env (production)

Set in `.env` or environment:

- `DB_URL` – JDBC URL (e.g. `jdbc:postgresql://host:5432/userdb`)
- `DB_USERNAME` / `DB_PASSWORD`
- `JWT_SECRET` – long random string (min 256 bits)

Copy `.env.example` to `.env` and fill values.
