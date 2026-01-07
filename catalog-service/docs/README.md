# 🍦 Catalog & Order Microservice (Resource Manager)

## 📖 Overview
The **Catalog Service** manages the core business assets: the ice cream micro-batch database and the transaction ledger (orders). It maintains strict data isolation and handles all inventory-related logic.

## 🚀 Service Specifications
- **Service Name**: `glacier-catalog-service`
- **Internal Port**: `3002`
- **External Exposure**: None (Accessed via Gateway at `8080`)
- **Tech Stack**:
  - **Runtime**: Node.js (v20+)
  - **Database**: MySQL 8.0 (Relational Inventory & Orders)
  - **Inventory**: Atomic inventory decrement logic (simulated)
  - **Storage**: Persistent MySQL via Catalog Cluster

## 🔄 User Flow
1. **Discovery**: Client requests the menu via the Gateway.
2. **Retrieval**: Service queries MySQL for all active ice cream archives.
3. **Transaction**: Client submits a cart for synthesis.
4. **Persistence**: Service records order in `orders` table and adjusts `inventory`.
5. **History**: Service retrieves previous transactions filtered by User ID.

## 📡 API Contract (Proxied via Gateway)

### 1. Catalog Retrieval
- **Endpoint**: `GET /product/list`
- **Wait For (Request)**: Empty Body / No Auth Required for Read
- **Sends (Response)**:
  ```json
  [ { "id": "p1", "name": "Midnight Charcoal", "price": 8.50, ... }, ... ]
  ```

### 2. Order Synthesis
- **Endpoint**: `POST /order/create`
- **Wait For (Request)**:
  ```json
  { "userId": "u1", "items": [...], "total": 24.50 }
  ```
- **Sends (Response)**:
  ```json
  { "id": "ORD-12345", "status": "PENDING", "createdAt": "..." }
  ```

### 3. Personal History
- **Endpoint**: `POST /order/my-orders`
- **Wait For (Request)**: `{ "userId": "u1" }`
- **Sends (Response)**: Array of historical `Order` objects.

## 🗺️ Detailed Flow Diagram
```text
[ Frontend App ] (Port 3000)
       |
       | HTTP GET/POST (Catalog Action)
       v
[ API Gateway ] (Port 8080)
       |
       | internal:routeRequest('product' | 'order', ...)
       v
[ CATALOG SERVICE ] (Port 3002) <--- (YOU ARE HERE)
       |
       | SQL: SELECT products / INSERT orders
       v
[ MySQL (Inventory) ] (Storage)
       |
       | Success/Fail
       v
[ CATALOG SERVICE ]
       |
       | JSON Resource Object
       v
[ API Gateway ]
       |
       | Unified API Response
       v
[ Frontend App ]
```