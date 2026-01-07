
# 🍦 Catalog & Order Microservice (Resource Manager)

## 📖 Overview
The **Catalog Service** is the central authority for Glacier AI's artisanal product database and transaction ledger. It ensures that the premium boutique experience is backed by consistent, high-fidelity data, managing both the "Artisanal Archive" and "User Order Logs."

## 🚀 Service Specifications
- **Service Name**: `glacier-catalog-service`
- **Internal Port**: `3002`
- **Database**: MySQL 8.0 (Relational Inventory & Persistent Order Ledger)
- **Asset Strategy**: High-resolution photorealistic visuals served via verified Unsplash CDN.

## 📡 API Contract (Gateway Proxied)

### 1. Product Discovery
- **Endpoint**: `GET /product/list`
- **Response**: Array of `Product` objects including names, artisanal descriptions, and premium CDN `imageUrl` strings.

### 2. Order Management (Ledger)
- **Endpoint**: `POST /order/create`: Records a new synthesis transaction.
- **Endpoint**: `POST /order/my-orders`: **[CRITICAL]** Retrieves the complete history for a specific authenticated `userId`. Used by the frontend to populate the "Order Logs" section in the Profile View.

## 🔄 Sensory Loop Interaction
1. **AI Consultation**: User receives recommendation via Gemini Live/Text.
2. **Synthesis**: User adds to bag and checkouts.
3. **Ledger Update**: Catalog Service persists the order in MySQL.
4. **UI Synchronization**: Frontend calls `/my-orders` to refresh the Profile view immediately after checkout or upon login.
