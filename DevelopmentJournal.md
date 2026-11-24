# Development Journal

This journal tracks all completed features, database schema modifications, migration logs, and testing notes throughout development.

---

## [2026-07-20] Project Initialization

### Feature
Project setup, folder structure design, and architectural planning.

### Files Created
- [ADR.md](file:///c:/Users/Welcome/Desktop/port/ADR.md)
- [DevelopmentJournal.md](file:///c:/Users/Welcome/Desktop/port/DevelopmentJournal.md)
- [Roadmap.md](file:///c:/Users/Welcome/Desktop/port/Roadmap.md)
- [Progress.md](file:///c:/Users/Welcome/Desktop/port/Progress.md)
- [Todo.md](file:///c:/Users/Welcome/Desktop/port/Todo.md)

### Files Modified
None.

### Database Changes
None.

### Migration Name
None.

### Testing Notes
- Verified dotnet version and PostgreSQL 18 service status.

### Future Improvements
- Implement project creation scripts to spin up Backend and Frontend base directories.

---

## [2026-07-20] Step 3: Backend Foundation Setup

### Feature
Implement backend common domain core, generic repository, DbContext, global exception handling, CORS configuration, and app initialization.

### Files Created
- [Backend/Entities/BaseEntity.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Entities/BaseEntity.cs)
- [Backend/Models/ApiResponse.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Models/ApiResponse.cs)
- [Backend/Helpers/Exceptions.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Helpers/Exceptions.cs)
- [Backend/Interfaces/IRepository.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Interfaces/IRepository.cs)
- [Backend/Repositories/Repository.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Repositories/Repository.cs)
- [Backend/Data/PortfolioDbContext.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Data/PortfolioDbContext.cs)
- [Backend/Middleware/ExceptionHandlingMiddleware.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Middleware/ExceptionHandlingMiddleware.cs)

### Files Modified
- [Backend/Program.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Program.cs)
- [Backend/appsettings.json](file:///c:/Users/Welcome/Desktop/port/Backend/appsettings.json)
- [Backend/appsettings.Development.json](file:///c:/Users/Welcome/Desktop/port/Backend/appsettings.Development.json)

### Database Changes
None (DbContext configured, schema tables not yet added).

### Migration Name
None.

### Testing Notes
- Validated compile status: successfully builds with zero errors.

### Future Improvements
- Implement JWT authentication middleware and login/logout services.

---

## [2026-07-20] Step 4: Frontend Foundation Setup

### Feature
Implement static decoupled frontend foundation including HTML5 layout shell, premium HSL CSS design variables, glassmorphic layout rules, mobile drawer controls, smooth Lenis scrolling, and spotlight-effect spotlight hover cards.

### Files Created
- [Frontend/index.html](file:///c:/Users/Welcome/Desktop/port/Frontend/index.html)
- [Frontend/assets/css/variables.css](file:///c:/Users/Welcome/Desktop/port/Frontend/assets/css/variables.css)
- [Frontend/assets/css/styles.css](file:///c:/Users/Welcome/Desktop/port/Frontend/assets/css/styles.css)
- [Frontend/assets/js/app.js](file:///c:/Users/Welcome/Desktop/port/Frontend/assets/js/app.js)

### Files Modified
None.

### Database Changes
None.

### Migration Name
None.

### Testing Notes
- Verified local browser load coordinates spotlight updates.
- Verified CDN dependencies (GSAP, Lenis, Swiper.js) resolve successfully without errors.

### Future Improvements
- Integrate backend login and dynamic card templates.

---

## [2026-07-20] Step 5: Authentication System

### Feature
Implement JWT authentication, BCrypt password hashing, refresh token rotation, and secure cookie-based session management.

### Files Created
- [Backend/Configurations/JwtSettings.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Configurations/JwtSettings.cs)
- [Backend/Entities/User.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Entities/User.cs)
- [Backend/Entities/RefreshToken.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Entities/RefreshToken.cs)
- [Backend/DTOs/AuthDto.cs](file:///c:/Users/Welcome/Desktop/port/Backend/DTOs/AuthDto.cs)
- [Backend/Validators/LoginRequestValidator.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Validators/LoginRequestValidator.cs)
- [Backend/Authentication/IJwtTokenGenerator.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Authentication/IJwtTokenGenerator.cs)
- [Backend/Authentication/JwtTokenGenerator.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Authentication/JwtTokenGenerator.cs)
- [Backend/Interfaces/IAuthService.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Interfaces/IAuthService.cs)
- [Backend/Services/AuthService.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Services/AuthService.cs)
- [Backend/Controllers/AuthController.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Controllers/AuthController.cs)

### Files Modified
- [Backend/Data/PortfolioDbContext.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Data/PortfolioDbContext.cs)
- [Backend/Program.cs](file:///c:/Users/Welcome/Desktop/port/Backend/Program.cs)
- [Backend/appsettings.json](file:///c:/Users/Welcome/Desktop/port/Backend/appsettings.json)
- [Backend/appsettings.Development.json](file:///c:/Users/Welcome/Desktop/port/Backend/appsettings.Development.json)

### Database Changes
Added `Users` and `RefreshTokens` DbSets. Migration not yet applied — will be generated in Step 6 with all portfolio entities together.

### Migration Name
Pending — `InitialCreate` to be generated in Step 6.

### Testing Notes
- Build succeeded: 0 errors.
- BCrypt.Net-Next 4.2.0 installed.

### Future Improvements
- Add Swagger JWT Bearer token UI support.
