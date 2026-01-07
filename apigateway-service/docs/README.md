# API Gateway Service

## Overview
The API Gateway acts as the single entry point for the frontend application. It handles request routing, protocol translation, and simulated cross-cutting concerns like authentication verification and rate limiting.

## Tech Stack
- **Role**: Edge Service / Reverse Proxy
- **Routing**: Path-based routing to internal microservices
- **Communication**: Inter-service method calls (simulating gRPC/HTTP)

## Flow
1. **Frontend** calls `gateway.request()`
2. **API Gateway** validates the endpoint path.
3. **API Gateway** identifies the target service (e.g., `auth-service`, `catalog-service`).
4. **API Gateway** forwards the payload to the specific microservice controller.
5. **Microservice** returns data to the Gateway.
6. **API Gateway** sends a unified response back to the Frontend.

## Future Extensibility
- JWT Validation Middleware
- Request Logging
- Response Caching
- Circuit Breakers for downstream services