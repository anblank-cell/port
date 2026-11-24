# Portfolio Management Platform - Project Roadmap

This roadmap defines the project build sequence and key milestones.

---

## Phases & Milestones

### Phase 1: Foundation & Architecture (Current)
- [ ] Initialize documentation and trackers.
- [ ] Create Frontend base directory structure.
- [ ] Create Backend Web API project skeleton (targeting `.NET 8`).
- [ ] Configure Docker / local PostgreSQL database connection properties.

### Phase 2: Database Schema & Migration
- [ ] Implement EF Core entities (`BaseEntity`, `User`, `Project`, etc.).
- [ ] Create database context (`PortfolioDbContext`).
- [ ] Set up migrations and run first update.
- [ ] Seed default admin user and system properties.

### Phase 3: Core API Services & Logic
- [ ] Build generic and specialized repository layers.
- [ ] Build service layers handling DTO mappings, logic, and validations.
- [ ] Set up JWT authentication pipeline and refresh token rotation middleware.
- [ ] Setup Global Exception Handling.

### Phase 4: API Controllers
- [ ] Implement RESTful APIs for public profiles and admin panels.
- [ ] Enable secure file upload utilities.
- [ ] Setup Swagger OpenAPI schema definitions.

### Phase 5: Frontend Shell & Client Store
- [ ] Code base styles, variables, typography, and scroll dynamics (Lenis, GSAP).
- [ ] Implement HTTP request helpers and local storage auth store.
- [ ] Create reusable visual components.

### Phase 6: Pages & Features
- [ ] Public portfolio display page with active scroll tracking.
- [ ] Admin dashboard, listing interfaces, creation forms.
- [ ] Verification, cleanups, and production deployment scripts.
