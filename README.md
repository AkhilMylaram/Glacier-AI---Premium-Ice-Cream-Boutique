# 🍦 Glacier AI: Premium Sensory Ice Cream Boutique

Glacier AI is a next-generation, microservices-driven storefront that merges artisanal ice cream with agentic AI workflows. It features real-time voice consultations via Gemini Live and a robust, distributed backend architecture.

## 🏗️ Architecture & Service Flow

The system follows a **Microservice Mesh** pattern optimized for scalability and low-latency sensory interactions.

### The Flow
1. **Discovery & Auth**: The Frontend initiates a secure handshake via the **API Gateway**, which routes requests to the **Authentication Service** (MySQL Node 4-B).
2. **Artisanal Consultation**: 
   - **Neural Text**: Direct synthesis via `gemini-3-flash-preview` for flavor matching.
   - **Sensory Voice**: Real-time PCM audio stream to `gemini-2.5-flash-native-audio-preview` for immersive consultation.
3. **Transaction Ledger**: Orders are funneled through the Gateway to the **Catalog Service**, persisting the transaction in a relational ledger for archival profile logs.
4. **Asset Delivery**: High-fidelity visuals are served via an optimized Unsplash CDN layer.

---

## 📁 Directory Structure

```text
.
├── apigateway-service/      # Edge Router (Routes: /auth, /product, /order)
│   ├── docs/                # Gateway specific documentation
│   └── router.ts            # Dynamic routing logic
├── authentication-service/  # Identity Mesh (MySQL Node 4-B)
│   ├── db/                  # Persistent identity storage
│   └── auth-controller.ts   # JWT & Handshake logic
├── catalog-service/         # Resource Manager (MySQL Ledger)
│   ├── db/                  # Relational inventory storage
│   └── product-controller.ts # Inventory & Order logic
├── components/              # Atomic UI Components (React + Tailwind)
│   ├── Layout.tsx           # Premium Brand Shell
│   └── ProductCard.tsx      # Sensory Asset Display
├── docker-files/            # Production Environment Definitions
│   ├── frontend.Dockerfile  # Multi-stage Nginx Build
│   ├── apigateway.Dockerfile # Node-optimized Proxy
│   ├── authentication.Dockerfile
│   └── catalog.Dockerfile
├── services/                # Core Logic Bridge
│   ├── apiGateway.ts        # Unified Backend Client
│   ├── geminiService.ts     # Generative AI Orchestrator
│   └── audioUtils.ts        # PCM & Base64 Binary Handlers
├── App.tsx                  # Application Orchestrator (View State)
├── constants.tsx            # Global Brand Tokens & Endpoints
├── types.ts                 # Shared Interface Definitions
├── docker-compose.yml       # Production Orchestration
└── package.json             # Workspace Dependency Manifest
```

---

## 🚀 Build & Running Steps

### Prerequisites
- Docker & Docker Compose installed.
- A valid **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).

### Local Development (Direct)
1. Install dependencies: `npm install`
2. Set your API Key: `export API_KEY=your_key_here`
3. Run dev server: `npm run dev`

### Production Deployment (Docker)
Run the entire mesh with a single command:
```bash
# Build and start all services in detached mode
API_KEY=your_key_here docker-compose up --build -d
```

---

## ☁️ Cloud Deployment (AWS EC2)

This project is configured for production-grade stability on AWS EC2 instances.

### 1. Security Group Configuration
Ensure your EC2 Security Group has the following ports open:
- **Port 80**: Frontend Access (HTTP)
- **Port 8080**: API Gateway Access (CORS-ready)

### 2. Environment Setup
1. SSH into your EC2 instance.
2. Clone the repository and navigate to the root.
3. Create a `.env` file or export the variable:
   ```bash
   echo "API_KEY=your_actual_gemini_api_key" > .env
   ```

### 3. Launching the Mesh
The `docker-compose.yml` uses the `frontend.Dockerfile` which implements a **multi-stage Nginx build**. This ensures high performance and low memory footprint on your EC2 instance.

```bash
docker-compose --env-file .env up --build -d
```

### 4. Health Check
- Frontend: `http://<your-ec2-ip>/`
- API Health: `http://<your-ec2-ip>:8080/product/list`

---

## 🛡️ Reliability Features
- **Auto-Healing**: Services are set to `restart: always` in Docker.
- **Data Persistence**: Uses a simulated MySQL Persistent Ledger (`localStorage` versioned) for immediate mock-production testing.
- **Responsive Mesh**: The UI dynamically switches between localhost and remote IP for API calls based on the environment.
