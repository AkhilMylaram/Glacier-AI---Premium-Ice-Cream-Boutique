# 🔐 Authentication Microservice (Identity & Access)

## 📖 Overview
The **Authentication Service** manages user identities, registration flows, and secure credential verification. It operates on a zero-trust model, only accessible via the internal network.

## 🚀 Service Specifications
- **Internal Port**: `3001`
- **Database**: MySQL 8.0 (Persistent Identity DB)
- **Security**: JWT-based session management.

## 📡 API Endpoints
- `POST /auth/login`: Verifies credentials and generates a secure session token.
- `POST /auth/register`: Initializes a new user profile in the Identity Mesh.

## 🔄 Persistence
User records are stored in the `glacier_mysql_identity_db` cluster. The service includes seed accounts for developer testing, ensuring consistent access across environments.