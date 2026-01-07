# 🛡️ API Gateway Service (Edge Router)

## 📖 Overview
The **API Gateway** acts as the single entry point and secure shield for the entire Glacier AI backend. It is responsible for request routing, cross-cutting concerns (logging, error handling), and protocol translation between the Frontend and internal Microservices.

## 🚀 Service Specifications
- **Service Name**: `glacier-api-gateway`
- **Public Port**: `8080` (Primary endpoint for the Frontend)
- **Tech Stack**:
  - **Role**: Edge Proxy / Reverse Proxy
  - **Logic**: Dynamic Path-based Routing
  - **Runtime**: TypeScript / Node.js
  - **Communication**: Inter-service Method Calls (Simulating gRPC/Internal HTTP)

## 🔄 User Flow
1. **Frontend Call**: The React app makes a single call to `gateway.request()`.
2. **Analysis**: Gateway inspects the `service` parameter (e.g., `auth`, `product`).
3. **Routing**: Forwards the request to the specific internal controller.
4. **Aggregation**: Collects the response from the downstream service.
5. **Normalization**: Returns a standardized `ApiResponse<T>` to the frontend.

## 📡 API Management

### Incoming Requests
The Gateway waits for **ANY** request from the Frontend client targeting:
- `/auth/*` -> Routed to **Auth Service** (Port 3001)
- `/product/*` -> Routed to **Catalog Service** (Port 3002)
- `/order/*` -> Routed to **Catalog Service** (Port 3002)

### Outgoing Responses
Standardized wrapper sent to Frontend:
```json
{
  "data": { ... },
  "error": "Optional error string",
  "status": 200
}
```

## 🗺️ Detailed Flow Diagram
```text
[ Frontend Application ]
       |
       | HTTP Request (Port 3000 -> 8080)
       v
[ API GATEWAY ] <--- (YOU ARE HERE)
       |
       |-- IF path starts with /auth --> [ Auth Service ] (Port 3001)
       |-- IF path starts with /prod --> [ Catalog Service ] (Port 3002)
       |-- IF path starts with /ordr --> [ Catalog Service ] (Port 3002)
       |
[ API GATEWAY ]
       |
       | Unified JSON Output
       v
[ Frontend Application ]
```