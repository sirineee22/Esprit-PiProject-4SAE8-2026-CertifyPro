# Trainer Session Booking Feature

Build a session reservation page for **TRAINER** users. The page will feature a native datetime picker popup for start time, smart end-time presets (+1h, +2h, +3h), auto-filled trainer info (from logged-in user), and a room dropdown populated from the backend.

## Proposed Changes

### Backend

#### [MODIFY] [SecurityConfig.java](file:///c:/PI%20AMMAR/Esprit-PiProject-4SAE8-2026-CertifyPro/backend/services/user-service/src/main/java/com/training/platform/security/SecurityConfig.java)
- Restrict `POST /api/schedules` to `ROLE_TRAINER`.
- Allow `GET /api/schedules/**` to any authenticated user.

---

### Frontend

#### [MODIFY] [api.config.ts](file:///c:/PI%20AMMAR/Esprit-PiProject-4SAE8-2026-CertifyPro/frontend/src/app/core/api/api.config.ts)
- Add `schedules` endpoint.

#### [NEW] `features/sessions/services/session.api.ts`
- Service with `createSession()`, `getMySessionsAsTrainer(trainerId)` methods.

#### [NEW] `features/sessions/pages/book-session/book-session.component.ts`
- Guard: only accessible by `TRAINER` role (enforced via [rolesGuard](file:///c:/PI%20AMMAR/Esprit-PiProject-4SAE8-2026-CertifyPro/frontend/src/app/core/auth/roles.guard.ts#5-18)).
- On init: loads available rooms from [RoomService](file:///c:/PI%20AMMAR/Esprit-PiProject-4SAE8-2026-CertifyPro/backend/services/user-service/src/main/java/com/training/platform/service/RoomService.java#11-52), auto-fills trainer from `AuthService.getCurrentUser()`.
- Date/time picker: uses `<input type="datetime-local">` which opens the OS native calendar/clock picker popup.
- On start-time selected: computes 3 end-time options (+1h, +2h, +3h) shown as clickable buttons.
- On submit: sends `POST /api/schedules` with trainer ID, room ID, topic, startTime, endTime.

#### [NEW] `features/sessions/pages/book-session/book-session.component.html`
- Sleek booking form with: topic input, datetime-local picker, end-time chip buttons (+1h, +2h, +3h), room dropdown, and submit button.

#### [NEW] `features/sessions/pages/book-session/book-session.component.css`
- Premium styling matching the project design system.

#### [NEW] `features/sessions/sessions.routes.ts`
- Route: `{ path: 'book-session', component: BookSessionComponent, canActivate: [authGuard, rolesGuard(['TRAINER'])] }`

#### [MODIFY] [app.routes.ts](file:///c:/PI%20AMMAR/Esprit-PiProject-4SAE8-2026-CertifyPro/frontend/src/app/app.routes.ts)
- Add `book-session` route under `UserLayoutComponent` (so trainer gets navbar), guarded by [rolesGuard(['TRAINER'])](file:///c:/PI%20AMMAR/Esprit-PiProject-4SAE8-2026-CertifyPro/frontend/src/app/core/auth/roles.guard.ts#5-18).

#### [MODIFY] navbar or trainer profile
- Add a "Book a Session" link visible only when [isTrainer](file:///c:/PI%20AMMAR/Esprit-PiProject-4SAE8-2026-CertifyPro/frontend/src/app/shared/components/navbar/navbar.component.ts#152-155).

## Verification Plan

### Manual Verification
1. Log in as a **TRAINER**.
2. Navigate to the **"Book a Session"** page via the navbar link.
3. Select a **start time** via the browser datetime picker — 3 end-time option chips appear.
4. Select a **room** from the dropdown (populated from backend).
5. Enter a **topic** and submit — success alert and the form resets.
6. Try submitting with a conflicting time → error message from backend displayed.
7. Log in as a **LEARNER** → the link and route should not be accessible.

