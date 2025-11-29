# Start All Services:
```bash
docker-compose up -d
```

# Check Status:
```bash
docker-compose ps
```

# View Logs:
```bash
docker-compose logs -f node-api
```

# Stop All Services:
```bash
docker-compose down
```

# Rebuild After Code Changes:
```bash
docker-compose build --no-cache node-api
docker-compose up -d
```