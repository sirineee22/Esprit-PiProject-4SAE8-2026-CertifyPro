# CertifyPro

Training platform: certifications, courses, user and admin flows.

## Stack

- **Frontend:** Angular (`ng serve` → port **4200**)
- **API entry:** Spring Cloud **Gateway** (port **8080**) — routes to microservices
- **Services:** `user-service`, `event-service` (register with **Eureka**)
- **Discovery:** Eureka server (port **8761**)
- **DB:** PostgreSQL (local)

The Angular app calls **`http://localhost:8080`** only (see `frontend/src/app/core/api/api.config.ts`).  
Do **not** point the frontend at a service port unless you run that service alone for debugging.

| Service        | Typical port | Role                                      |
|----------------|--------------|-------------------------------------------|
| api-gateway    | 8080         | Single HTTP entry (`/api/users`, `/api/events`, …) |
| discovery-server | 8761       | Service registry                          |
| user-service   | 8083         | Users, auth, roles, trainer-requests      |
| event-service  | (assigned)   | Events, registrations, reviews          |

## Run (full stack)

1. **PostgreSQL** — create DB, e.g. `userdb` (see `application` / `.env` for URL and credentials).

2. **Eureka** — start discovery server first.

3. **Microservices** — start `user-service` and `event-service` (each registers with Eureka).

4. **Gateway** — start `api-gateway` on **8080**.

5. **Frontend**

```bash
cd frontend
npm install
ng serve
```

**API base URL:** `http://localhost:8080` (gateway).

### Run a single service (dev only)

You can run e.g. `user-service` alone on **8083** and temporarily set `API_BASE_URL` in `api.config.ts` to `http://localhost:8083` — then the gateway and event features are not used. Prefer the gateway for normal development.

Environment overrides (services): `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`.

Use profile `local` where supported, e.g.  
`mvn spring-boot:run -Dspring-boot.run.profiles=local`

## Admin

On first run, an admin user is created if missing:

- **Email:** `admin@platform.com`
- **Password:** `Admin123!`

## Env

Copy `.env.example` to `.env` and set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`. For production, set `JWT_SECRET` (min 256 bits).

---
