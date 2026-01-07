
# 🛡️ API Gateway Service (Edge Router)

## 📖 Overview
The **API Gateway** acts as the single entry point and secure shield for the entire Glacier AI backend. It simplifies frontend integration by providing a unified interface to downstream microservices, orchestrating the data flow between the UI and the Catalog/Auth clusters.

## 🚀 Service Specifications
- **Public Port**: `8080`
- **Logic**: Dynamic Path-based Routing
- **Normalization**: Standardizes all service responses into a consistent `ApiResponse<T>` structure for the Glacier AI frontend.

## 🔄 Routing Table
- `/auth/*` -> Proxies to **Authentication Service** (Identity Mesh)
- `/product/list` -> Proxies to **Catalog Service** (Artisanal Archive)
- `/order/create` -> Proxies to **Catalog Service** (Transaction Ledger)
- `/order/my-orders` -> **[NEW]** High-speed retrieval of user transaction history via the persistent MySQL cluster.

## 📡 AI Integration Note
While the **Flavor AI** (Text/Voice) communicates directly with Gemini 2.5/3.0 nodes, the resulting transaction data (selections, orders) is funneled through the Gateway to maintain strict synchronization with the user's persistent profile logs.
