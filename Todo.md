# Project TODO List

Detailed task tracker for the development phases.

---

## Phase 1: Foundation
- [x] Create project documentation trackers (`ADR.md`, `DevelopmentJournal.md`, `Roadmap.md`, `Progress.md`, `Todo.md`)
- [x] Initialize Frontend directory structure
- [x] Initialize Backend Web API project skeleton (`net8.0`)
- [x] Verify initial build compiles and runs

## Phase 2: Database Schema & Migrations
- [x] BaseEntity class
- [ ] User and RefreshToken entities
- [ ] HeroSection, Project, Service, Skill, Experience, Education, Certificate, Testimonial, SocialLink, Statistic, ContactMessage, SiteSetting, and SeoSetting entities
- [x] DbContext configuration & relationship setup (Fluent API)
- [x] Register DbContext in DI container
- [ ] Generate first migration `InitialCreate`
- [ ] Apply migration to PostgreSQL 18
- [ ] Add seed data scripts (Default admin user & settings)

## Phase 5: Frontend Shell
- [x] Base HSL design variable colors setup (`variables.css`)
- [x] Reset, custom scrollbar, navbar and responsive drawer styles (`styles.css`)
- [x] Smooth scrolling (Lenis) and interactive coordinates spotlight hover effects (`app.js`)
- [x] Client layout HTML container wrappers (`index.html`)
