# Glacier AI — Polyglot Microservices (Local Setup)

This repository implements a production-oriented microservices reference for the Glacier AI ice-cream storefront. The frontend UI, images and components remain unchanged; backend responsibilities are split into independent services that communicate through a single API Gateway.

Prerequisites
- Docker & Docker Compose (recommended)
- Go 1.22+ (if running gateway locally)
- Java 21+ & Maven (if running Auth locally)
- Python 3.12+ & pip (if running Catalog locally)
- Node.js 18+/20+ (to run frontend locally)

Ports (defaults)
- Frontend (Vite): 5173
- API Gateway (Go): 8080
- Auth Service (Java): 3001
- Catalog Service (Python/FastAPI): 3002
- MySQL: 3306

Quick Local Run (Recommended: Docker Compose)
1. From the repository root run (PowerShell):

```powershell
docker compose up --build
```

This will build images for the Gateway, Auth, and Catalog services and start a MySQL container seeded with the schema in `database/init.sql`.

Running Services Individually (optional)
- API Gateway (local):
  ```powershell
  cd apigateway-service
  go run main.go
  ```
- Auth (local, Java):
  ```powershell
  cd authentication-service
  mvn spring-boot:run
  ```
- Catalog (local, Python):
  ```powershell
  cd catalog-service
  pip install -r requirements.txt
  uvicorn main:app --host 0.0.0.0 --port 3002
  ```
- Frontend (local):
  ```powershell
  npm install
  npm run dev
  ```

Environment Variables
- Create a `.env` file (or set environment variables) for DB credentials and secrets. Example values (Docker Compose wires these automatically):

```
MYSQL_ROOT_PASSWORD=example
MYSQL_DATABASE=glacier
MYSQL_USER=glacier
MYSQL_PASSWORD=glacier
JWT_SECRET=replace-with-secure-value
```

Verifying the system
- Visit the frontend at http://localhost:5173.
- Health check for gateway: http://localhost:8080/health
- Auth endpoints behind gateway: POST http://localhost:8080/auth/login
- Catalog endpoints behind gateway: GET http://localhost:8080/catalog/products

Files and Next Steps
- `overview.txt`: architecture details and dataflow
- `docker-compose.yml`: service orchestration for local development
- `database/init.sql`: schema + seed data
- `flow.txt`: detailed request & data flow between UI, Gateway, services, and MySQL
- I will next implement a Go API Gateway and a FastAPI Catalog service and wire them into `docker-compose.yml` with a single MySQL instance.
If you'd like, I can next add Gateway JWT verification and health aggregation endpoints.

If you want me to proceed now, I will implement the gateway, the catalog service, update `docker-compose.yml`, and add the MySQL init script changes.
# 🍦 Glacier AI: Polyglot Setup Guide

This project runs a distributed microservices mesh. Follow these steps for a successful local deployment.

## 1. Environment Requirements
- **Go** v1.22+
- **Java** JDK 21+ & Maven
- **Python** 3.12+
- **MySQL** 8.0+
- **Node.js** v20+

## 2. Database Initialization
1. Ensure MySQL is running.
2. Create the database and tables:
   ```bash
   mysql -u root -p < database/init.sql
   ```

## 3. Start the Backend Services (Separate Terminals)

### Terminal A: API Gateway (Go)
```bash
cd apigateway-service
go run main.go
```
*Port: 8080*

### Terminal B: Auth Service (Java/Spring Boot)
```bash
cd authentication-service
mvn spring-boot:run
```
*Port: 3001*

### Terminal C: Catalog Service (Python/FastAPI)
```bash
cd catalog-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 3002
```
*Port: 3002*

## 4. Start the Frontend (React)
```bash
npm install
npm run dev
```
*Port: 5173*

## 5. AI Configuration
Ensure your `API_KEY` is exported in your environment:
```bash
export API_KEY='your-google-gemini-key'
```