# CertifyPro

Training platform: certifications, courses, user and admin flows.

## Stack

- **Frontend:** Angular (port 4200)
- **Backend:** Spring Boot – user-service (port 8083)
- **DB:** PostgreSQL (local)

## Run

**PostgreSQL**

- Create DB: `CREATE DATABASE userdb;`
- Default: `localhost:5432`, user `postgres`, password `sisina`.
- Hibernate creates/updates tables on startup.

**Backend**

```bash
cd backend/services/user-service
mvn spring-boot:run
```

Use profile `local` for same config as `.env`:  
`mvn spring-boot:run -Dspring-boot.run.profiles=local`

Override via env: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`.

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

## Env

Copy `.env.example` to `.env` and set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`. For production, set `JWT_SECRET` (min 256 bits).

---
