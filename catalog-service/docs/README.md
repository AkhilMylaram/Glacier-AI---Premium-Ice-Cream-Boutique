# Catalog & Order Microservice

## Overview
This service manages the product inventory (Ice Cream archive) and handles order processing. It maintains its own isolated MySQL instance for catalog data and transaction logs.

## Tech Stack
- **Runtime**: Node.js
- **Database**: MySQL (Inventory & Orders)
- **Features**: Inventory tracking, Order synthesis, Category filtering.

## Data Flow
- `GET /list`: Retrieves all available micro-batches from the inventory table.
- `POST /create`: Records a new order transaction.
- `POST /my-orders`: Filters transaction history by User ID.

## Database Seeding
Upon first initialization, the service populates the `products` table with the 9 signature Glacier AI flavors if the database is empty.