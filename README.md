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