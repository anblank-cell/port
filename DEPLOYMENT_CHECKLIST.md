# Portfolio Management Platform - Deployment Checklist

## Pre-Deployment Checklist

### 1. Database Setup
- [ ] PostgreSQL 18 installed and running
- [ ] Database created: `portfolio_db`
- [ ] Connection string updated in `appsettings.json`
- [ ] Migrations applied: `dotnet ef database update`
- [ ] Seed data executed (admin user created)

### 2. Security Configuration
- [ ] JWT Secret changed to secure random string (min 32 chars)
- [ ] Database password changed from default
- [ ] CORS policy updated with specific origins (remove `AllowAll`)
- [ ] HTTPS certificate configured
- [ ] Environment variables set for sensitive data

### 3. Dependencies
- [ ] Update AutoMapper package (currently has vulnerability warning)
- [ ] All NuGet packages up to date
- [ ] .NET 8 SDK installed on server

### 4. Application Settings

#### Development (`appsettings.Development.json`)
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  }
}
```

#### Production (`appsettings.Production.json`)
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Error"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=your-prod-db;Port=5432;Database=portfolio_db;Username=prod_user;Password=SECURE_PASSWORD"
  },
  "JwtSettings": {
    "Secret": "PRODUCTION_SECRET_KEY_MINIMUM_32_CHARACTERS_LONG",
    "Issuer": "PortfolioServer",
    "Audience": "PortfolioClient",
    "ExpiryMinutes": 15,
    "RefreshTokenExpiryDays": 7
  },
  "AllowedHosts": "yourdomain.com"
}
```

### 5. Code Review
- [ ] All controllers have proper authorization attributes
- [ ] Error handling middleware configured
- [ ] Input validation implemented
- [ ] SQL injection prevention (EF Core parameterized queries)
- [ ] XSS protection configured

### 6. Testing
- [ ] All API endpoints tested with Swagger
- [ ] Authentication flow tested
- [ ] Token refresh tested
- [ ] CRUD operations verified for all entities
- [ ] Soft delete functionality confirmed
- [ ] Public endpoints accessible without auth
- [ ] Admin endpoints require valid JWT

---

## Deployment Steps

### Option 1: Windows Server (IIS)

1. **Install Prerequisites**
   ```powershell
   # Install .NET 8 Hosting Bundle
   # Download from: https://dotnet.microsoft.com/download/dotnet/8.0
   ```

2. **Publish Application**
   ```bash
   cd Backend
   dotnet publish -c Release -o ./publish
   ```

3. **Configure IIS**
   - Create new Application Pool (.NET CLR Version: No Managed Code)
   - Create new Website pointing to publish folder
   - Set proper permissions for IIS_IUSRS

4. **Configure Database Connection**
   - Ensure PostgreSQL is accessible from server
   - Update connection string in `appsettings.Production.json`

5. **Apply Migrations**
   ```bash
   dotnet ef database update --configuration Release
   ```

### Option 2: Linux Server (Ubuntu with Nginx)

1. **Install Prerequisites**
   ```bash
   # Install .NET 8 Runtime
   wget https://dot.net/v1/dotnet-install.sh
   chmod +x dotnet-install.sh
   ./dotnet-install.sh --channel 8.0 --runtime aspnetcore
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib
   
   # Install Nginx
   sudo apt install nginx
   ```

2. **Publish Application**
   ```bash
   cd Backend
   dotnet publish -c Release -o /var/www/portfolio-api
   ```

3. **Create Systemd Service**
   ```bash
   sudo nano /etc/systemd/system/portfolio-api.service
   ```
   
   Content:
   ```ini
   [Unit]
   Description=Portfolio API
   
   [Service]
   WorkingDirectory=/var/www/portfolio-api
   ExecStart=/usr/bin/dotnet /var/www/portfolio-api/Backend.dll
   Restart=always
   RestartSec=10
   KillSignal=SIGINT
   SyslogIdentifier=portfolio-api
   User=www-data
   Environment=ASPNETCORE_ENVIRONMENT=Production
   Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false
   
   [Install]
   WantedBy=multi-user.target
   ```

4. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/portfolio-api
   ```
   
   Content:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection keep-alive;
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

5. **Enable and Start Services**
   ```bash
   sudo systemctl enable portfolio-api
   sudo systemctl start portfolio-api
   sudo ln -s /etc/nginx/sites-available/portfolio-api /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

6. **Apply Migrations**
   ```bash
   cd /var/www/portfolio-api
   dotnet ef database update --configuration Release
   ```

### Option 3: Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
   WORKDIR /app
   EXPOSE 80
   EXPOSE 443
   
   FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
   WORKDIR /src
   COPY ["Backend/Backend.csproj", "Backend/"]
   RUN dotnet restore "Backend/Backend.csproj"
   COPY . .
   WORKDIR "/src/Backend"
   RUN dotnet build "Backend.csproj" -c Release -o /app/build
   
   FROM build AS publish
   RUN dotnet publish "Backend.csproj" -c Release -o /app/publish
   
   FROM base AS final
   WORKDIR /app
   COPY --from=publish /app/publish .
   ENTRYPOINT ["dotnet", "Backend.dll"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   
   services:
     postgres:
       image: postgres:18
       environment:
         POSTGRES_DB: portfolio_db
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: YOUR_SECURE_PASSWORD
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
     api:
       build:
         context: .
         dockerfile: Dockerfile
       ports:
         - "5000:80"
       depends_on:
         - postgres
       environment:
         - ASPNETCORE_ENVIRONMENT=Production
         - ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=portfolio_db;Username=postgres;Password=YOUR_SECURE_PASSWORD
   
   volumes:
     postgres_data:
   ```

3. **Build and Run**
   ```bash
   docker-compose up -d
   ```

### Option 4: Cloud Platforms

#### Azure App Service
1. Create Azure App Service (Linux, .NET 8)
2. Create Azure Database for PostgreSQL
3. Configure connection strings in App Service settings
4. Deploy via GitHub Actions or Azure DevOps
5. Apply migrations using Azure Cloud Shell

#### AWS Elastic Beanstalk
1. Create Elastic Beanstalk environment (.NET on Linux)
2. Create RDS PostgreSQL instance
3. Configure environment variables
4. Deploy application package
5. Apply migrations using AWS Systems Manager

#### Google Cloud Run
1. Build Docker image
2. Push to Google Container Registry
3. Deploy to Cloud Run
4. Create Cloud SQL PostgreSQL instance
5. Configure connection via Cloud SQL Proxy

---

## Post-Deployment Verification

### 1. Health Check
- [ ] API responds at base URL
- [ ] Swagger UI accessible (dev only)
- [ ] Database connection successful

### 2. Authentication Test
```bash
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@portfolio.com","password":"Admin@123456"}'
```

### 3. Public Endpoints Test
```bash
curl https://api.yourdomain.com/api/projects
curl https://api.yourdomain.com/api/skills
curl https://api.yourdomain.com/api/herosection/active
```

### 4. Protected Endpoints Test
```bash
curl -X GET https://api.yourdomain.com/api/contactmessages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Performance Check
- [ ] Average response time < 200ms
- [ ] Database query optimization verified
- [ ] No N+1 query issues
- [ ] Proper indexing on frequently queried fields

---

## Security Hardening

### Application Level
- [ ] Disable Swagger in production
- [ ] Remove detailed error messages in production
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Enable CORS with specific origins only
- [ ] Implement audit logging

### Database Level
- [ ] Use dedicated database user (not postgres)
- [ ] Grant minimum required permissions
- [ ] Enable SSL connections
- [ ] Regular backups configured
- [ ] Implement connection pooling

### Infrastructure Level
- [ ] HTTPS enforced (redirect HTTP)
- [ ] Security headers configured
- [ ] Firewall rules configured
- [ ] DDoS protection enabled
- [ ] Regular security updates

---

## Monitoring & Logging

### Setup Logging
```csharp
// Add to Program.cs
builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.AddDebug();
    logging.AddEventLog();
});
```

### Recommended Tools
- Application Insights (Azure)
- CloudWatch (AWS)
- Stackdriver (GCP)
- Serilog for structured logging
- ELK Stack (Elasticsearch, Logstash, Kibana)

### Metrics to Monitor
- [ ] Request count and response times
- [ ] Error rate and types
- [ ] Database connection pool status
- [ ] Memory and CPU usage
- [ ] Active user sessions

---

## Maintenance Tasks

### Daily
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Review security alerts

### Weekly
- [ ] Database backup verification
- [ ] Review audit logs
- [ ] Check disk space

### Monthly
- [ ] Update dependencies
- [ ] Security patches
- [ ] Performance optimization review
- [ ] Database maintenance (vacuum, reindex)

---

## Documentation

### For Developers
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Architecture documentation
- [ ] Database schema diagram
- [ ] Authentication flow diagram

### For Operations
- [ ] Deployment runbook
- [ ] Backup and restore procedures
- [ ] Incident response plan
- [ ] Scaling guidelines

---

## 🆘 Troubleshooting Guide

### Issue: Application won't start
**Solution:**
1. Check logs: `dotnet Backend.dll` or view systemd logs
2. Verify .NET runtime installed
3. Check file permissions
4. Verify configuration files present

### Issue: Database connection fails
**Solution:**
1. Test PostgreSQL connection: `psql -h host -U user -d database`
2. Verify connection string format
3. Check firewall rules
4. Ensure database exists

### Issue: Authentication fails
**Solution:**
1. Verify JWT settings in configuration
2. Check token expiration
3. Validate issuer and audience
4. Ensure clock synchronization

### Issue: High memory usage
**Solution:**
1. Check for memory leaks
2. Optimize entity tracking in EF Core
3. Implement pagination
4. Review connection pool settings

---

## Final Checklist

Before going live:
- [ ] All tests passing
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] Team trained on operations
- [ ] Rollback plan ready

---

**Ready for Production!**
