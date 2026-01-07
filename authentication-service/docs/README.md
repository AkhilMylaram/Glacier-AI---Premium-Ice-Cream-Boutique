# Authentication Microservice (Glacier AI)

## Overview
This service handles all identity and access management for the Glacier AI platform. It is designed as an independent microservice that communicates with the API Gateway.

## Tech Stack
- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **Database**: MySQL 8.0 (Relational Storage)
- **Auth Strategy**: JWT (JSON Web Tokens) with RS256 signing
- **Encryption**: Argon2id for password hashing

## Database Connection
The service connects to a MySQL cluster via a persistent connection pool. 
Configuration is handled via environment variables:
- `DB_HOST`: mysql-auth-cluster.internal
- `DB_USER`: glacier_auth_svc
- `DB_NAME`: identity_db

## API Endpoints (via Gateway)
- `POST /v1/auth/login`: Verifies credentials and issues JWT.
- `POST /v1/auth/register`: Creates a new user entry in MySQL and initializes profile.

## Security Features
- Rate limiting on login attempts.
- SQL Injection protection via prepared statements.
- XSS protection via secure cookie headers.