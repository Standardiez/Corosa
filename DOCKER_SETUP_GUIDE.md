# Docker Setup Guide for Corosa

## Overview

This guide explains how to run your Corosa application in Docker containers, allowing you to:
- Run Node.js API, PHP API, MySQL, and Redis in isolated containers
- Easily deploy to production servers
- Maintain consistent environments across development and production

---

## Prerequisites

1. **Install Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
   - Download from: https://www.docker.com/products/docker-desktop
   - Verify installation: `docker --version`

2. **Install Docker Compose** (usually included with Docker Desktop)
   - Verify: `docker-compose --version`

---

## Quick Start

### 1. Update Database Configuration

Update `backend/config/database.js` to use environment variables:

```javascript
const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "corosa_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4"
});

module.exports = db;
```

Update `backend/config/database.php` similarly:

```php
<?php
class Database {
    private $host = null;
    private $db_name = null;
    private $username = null;
    private $password = null;
    private $conn = null;

    public function __construct() {
        $this->host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost';
        $this->db_name = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'corosa_db';
        $this->username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root';
        $this->password = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '';
    }

    public function getConnection() {
        // ... rest of your existing code
    }
}
?>
```

### 2. Create package.json (if not exists)

Create `backend/package.json`:

```json
{
  "name": "corosa-backend",
  "version": "1.0.0",
  "description": "Corosa Node.js API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### 3. Build and Start Containers

```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## Service URLs

After starting containers:

- **Node.js API**: http://localhost:3000
- **PHP API**: http://localhost:8080
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

---

## Environment Variables

Create a `.env` file in project root (optional, for local overrides):

```env
# Database
DB_HOST=mysql
DB_PORT=3306
DB_USER=corosa_user
DB_PASSWORD=corosa_password
DB_NAME=corosa_db

# Node.js
NODE_ENV=production
PORT=3000

# PHP
PHP_ENV=production
```

---

## Database Initialization

The `schema.sql` file will automatically run when MySQL container starts for the first time.

To manually import:

```bash
# Copy schema to container
docker cp backend/database/schema.sql corosa_mysql:/tmp/schema.sql

# Execute in container
docker exec -i corosa_mysql mysql -uroot -prootpassword corosa_db < backend/database/schema.sql
```

---

## Development Workflow

### Hot Reload (Node.js)

For development, mount your code as a volume and use nodemon:

```yaml
# In docker-compose.yml, add to node-api service:
volumes:
  - ./backend:/app
  - /app/node_modules
command: npm run dev  # Uses nodemon for auto-reload
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f node-api
docker-compose logs -f php-api
docker-compose logs -f mysql
```

### Accessing Containers

```bash
# Node.js container
docker exec -it corosa_node_api sh

# MySQL container
docker exec -it corosa_mysql mysql -uroot -prootpassword

# PHP container
docker exec -it corosa_php_api bash
```

---

## Production Deployment

### 1. Update docker-compose.yml for Production

```yaml
services:
  node-api:
    environment:
      NODE_ENV: production
    # Remove volume mounts for production (use built image)
    # volumes:
    #   - ./backend:/app
```

### 2. Build Production Images

```bash
docker-compose -f docker-compose.yml build --no-cache
```

### 3. Push to Registry (optional)

```bash
docker tag corosa_node_api:latest your-registry/corosa-node:latest
docker push your-registry/corosa-node:latest
```

### 4. Deploy to Server

```bash
# On production server
docker-compose pull
docker-compose up -d
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs node-api

# Check if port is in use
netstat -an | grep 3000
```

### Database Connection Issues

```bash
# Test MySQL connection
docker exec -it corosa_mysql mysql -uroot -prootpassword -e "SHOW DATABASES;"

# Check if MySQL is healthy
docker-compose ps
```

### Permission Issues (Linux)

```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

### Clear Everything and Start Fresh

```bash
# Stop and remove all containers, volumes
docker-compose down -v

# Remove images
docker-compose rm -f

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

---

## Network Configuration

All services communicate via the `corosa_network` bridge network:

- **Node.js** → MySQL: `mysql:3306`
- **PHP** → MySQL: `mysql:3306`
- **Node.js** → Redis: `redis:6379`

Frontend should call:
- Node.js API: `http://localhost:3000/api/trips`
- PHP API: `http://localhost:8080/backend/api/trip.php`

---

## Security Considerations

### Production Checklist

- [ ] Change default MySQL passwords
- [ ] Use environment variables for secrets (never commit `.env`)
- [ ] Enable HTTPS (use nginx reverse proxy)
- [ ] Restrict database access (only allow connections from app containers)
- [ ] Use Docker secrets for sensitive data
- [ ] Regularly update base images
- [ ] Scan images for vulnerabilities: `docker scan corosa_node_api`

---

## Performance Optimization

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  node-api:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Database Connection Pooling

Already configured in `database.js` with `connectionLimit: 10`.

---

## Next Steps

1. **Add Nginx Reverse Proxy** (for production)
2. **Set up SSL/TLS** certificates
3. **Configure monitoring** (Prometheus, Grafana)
4. **Add backup strategy** for MySQL data
5. **Implement health checks** for all services

---

## Additional Resources

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices

