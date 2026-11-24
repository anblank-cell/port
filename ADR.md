# Architectural Decision Records (ADR)

This document tracks major design, architecture, and technology decisions made for the Portfolio Management Platform.

---

## ADR 1: Base Tech Stack & Separation of Concerns

### Context
We need to design a scalable and manageable Portfolio Management Platform. The frontend should display the portfolio using modern design aesthetics, and the admin dashboard should manage everything.

### Decision
- **Frontend**: Separation of concerns is enforced. The frontend is a set of static assets (HTML5, Vanilla CSS, ES6 JavaScript) placed in a `Frontend/` folder, interacting with the backend purely via REST APIs. Animations are powered by GSAP, Lenis, and Swiper.js.
- **Backend**: ASP.NET Core 8 Web API placed in a `Backend/` folder. All endpoints will return standardized response payloads. Data access will use EF Core Code First.
- **Database**: PostgreSQL 18.

### Consequences
- Frontend can be hosted independently (e.g., CDN, Vercel, Netlify).
- Backend contains zero frontend logic or UI views.
- Requires robust CORS policies and secure JWT authentication with refresh token rotation.

---

## ADR 2: Base Entity & Database Auditing

### Context
We need audit trails, soft deletes, and unified primary keys for all database entities.

### Decision
Implement a `BaseEntity` abstract class that all tables inherit from:
- Primary Key: UUID (`Guid` in C#)
- Timestamps: `CreatedAt` (UTC), `UpdatedAt` (UTC)
- Audit: `CreatedBy`, `UpdatedBy`
- Soft Delete: `IsDeleted`, `DeletedAt`, `DeletedBy`

All database changes must generate EF Core migrations. Direct DB changes are prohibited.

### Consequences
- Increases maintainability and security.
- Eliminates manual table management.
- Requires soft delete query filters to be set in DB configurations (DbContext).
