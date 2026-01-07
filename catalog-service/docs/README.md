# 🍦 Catalog & Order Microservice (Resource Manager)

## 📖 Overview
The **Catalog Service** is the central authority for Glacier AI's artisanal product database and transaction ledger. It ensures that the premium boutique experience is backed by consistent, high-fidelity data.

## 🚀 Service Specifications
- **Service Name**: `glacier-catalog-service`
- **Internal Port**: `3002`
- **Database**: MySQL 8.0 (Relational Inventory & Orders)
- **Asset Strategy**: High-resolution photorealistic visuals served via verified Unsplash CDN.

## 🖼️ Image Sourcing
To guarantee a "Ready-to-Serve" experience in the developer sandbox, the Catalog Service manages a collection of high-definition Unsplash URLs. 
- **Reliability**: No local broken paths. 
- **Consistency**: All clients see identical, high-quality artisanal scoops.
- **Migration**: The service includes an auto-healing script that replaces any relative `/assets/` paths with CDN links upon database initialization.

## 📡 API Contract (Gateway Proxied)

### 1. Product Discovery
- **Endpoint**: `GET /product/list`
- **Response**: Array of `Product` objects including names, artisanal descriptions, and premium CDN `imageUrl` strings.

### 2. Order Management
- **Endpoint**: `POST /order/create`: Records a new transaction.
- **Endpoint**: `POST /order/my-orders`: Retrieves history for a specific authenticated `userId`.

## 🔄 Interaction Diagram
```text
[ Catalog Service ]
       |
       |--> Queries MySQL (Inventory Table)
       |--> Validates Image URLs
       |--> Returns Optimized JSON to Gateway
```