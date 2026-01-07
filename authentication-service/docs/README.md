# 🔐 Authentication Microservice (Identity & Access)

## 📖 Overview
The **Authentication Service** is the source of truth for user identities within the Glacier AI ecosystem. It manages user registration, credential verification, and session token generation. It operates as an isolated node that only interacts with the **API Gateway**.

## 🚀 Service Specifications
- **Service Name**: `glacier-auth-service`
- **Internal Port**: `3001`
- **External Exposure**: None (Accessed via Gateway at `8080`)
- **Tech Stack**:
  - **Runtime**: Node.js (v20+)
  - **Framework**: Simulated Express.js / TypeScript
  - **Database**: MySQL 8.0 (Persistent via Identity Mesh)
  - **Auth Protocol**: JWT (JSON Web Tokens) with RS256 signing
  - **Security**: Argon2id password hashing (simulated)

## 🔄 User Flow
1. **Request Ingress**: Receives a proxied request from the **API Gateway**.
2. **Context Validation**: Checks if the user exists in the MySQL `users` table.
3. **Logic Execution**: Performs credential matching or record insertion.
4. **Token Generation**: Signs a session JWT for the client.
5. **Response Egress**: Returns the token and safe user profile to the Gateway.

## 📡 API Contract (Proxied via Gateway)

### 1. Login Authentication
- **Endpoint**: `POST /auth/login`
- **Wait For (Request)**:
  ```json
  { "email": "user@example.com", "password": "securepassword" }
  ```
- **Sends (Response)**:
  ```json
  { 
    "token": "jwt_token_string", 
    "user": { "id": "u1", "name": "...", "email": "...", "role": "..." } 
  }
  ```

### 2. User Registration
- **Endpoint**: `POST /auth/register`
- **Wait For (Request)**:
  ```json
  { "name": "New User", "email": "new@example.com", "password": "securepassword" }
  ```
- **Sends (Response)**:
  ```json
  { "token": "jwt_token_string", "user": { ... } }
  ```

## 🗺️ Detailed Flow Diagram
```text
[ Frontend App ] (Port 3000)
       |
       | HTTP POST (Auth Action)
       v
[ API Gateway ] (Port 8080)
       |
       | internal:routeRequest('auth', ...)
       v
[ AUTH SERVICE ] (Port 3001) <--- (YOU ARE HERE)
       |
       | SQL: SELECT/INSERT
       v
[ MySQL (Identity) ] (Storage)
       |
       | Success/Fail
       v
[ AUTH SERVICE ]
       |
       | JSON Response
       v
[ API Gateway ]
       |
       | Unified API Response
       v
[ Frontend App ]
```