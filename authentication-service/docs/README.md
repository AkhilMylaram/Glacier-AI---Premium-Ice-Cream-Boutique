
# 🔐 Authentication Microservice (Identity & Access)

## 📖 Overview
The **Authentication Service** manages user identities, registration flows, and secure credential verification. It operates on a zero-trust model, serving as the first handshake in the Glacier AI sensory experience.

## 🚀 Service Specifications
- **Internal Port**: `3001`
- **Database**: MySQL 8.0 (Persistent Identity DB - Node 4-B)
- **Security**: JWT-based session management with encrypted production handshakes.

## 📡 API Endpoints
- `POST /auth/login`: Verifies credentials and generates a secure session token.
- `POST /auth/register`: Initializes a new user profile in the Identity Mesh.

## 🔄 Persistence & Synchronization
User records are stored in the `glacier_mysql_identity_db` cluster. 
- **Auto-Sync**: The frontend triggers an immediate fetch of order history upon successful authentication to ensure a seamless "Profile View" transition.
- **Developer Preview**: Includes pre-seeded accounts (e.g., `customer1@glacier.ai`) to facilitate immediate testing of the order log synchronization.
