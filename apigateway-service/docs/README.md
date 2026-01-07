# 🛡️ API Gateway Service (Edge Router)

## 📖 Overview
The **API Gateway** acts as the single entry point and secure shield for the entire Glacier AI backend. It simplifies frontend integration by providing a unified interface to downstream microservices.

## 🚀 Service Specifications
- **Public Port**: `8080`
- **Logic**: Dynamic Path-based Routing
- **Normalization**: Standardizes all service responses into a consistent `ApiResponse<T>` structure.

## 🔄 Routing Table
- `/auth/*` -> Proxies to **Authentication Service** (Port 3001)
- `/product/*` -> Proxies to **Catalog Service** (Port 3002)
- `/order/*` -> Proxies to **Catalog Service** (Port 3002)

## 📡 standard Response Structure
```json
{
  "data": { ... },
  "error": null,
  "status": 200
}
```