# 🍦 GLACIER AI: THE ARTISANAL SENSORY ARCHIVE

> Pioneering the future of artisanal taste through neural engineering and distributed microservices.

Glacier AI is a hyper-premium, microservices-driven digital storefront. It features an AI Flavor Concierge powered by **Google Gemini**, real-time voice synthesis for sensory consultation, and a robust distributed backend mesh.

---

## 🏗️ SYSTEM ARCHITECTURE (THE MESH)

The application operates as a distributed system to ensure high availability and clear separation of concerns:

- **Frontend (Vite/React)**: High-fidelity user interface running on port `5173`.
- **Edge Router (API Gateway)**: Single entry point running on port `8080`. Orchestrates traffic between services.
- **Identity Mesh (Auth Service)**: Manages secure user sessions on port `3001`.
- **Resource Ledger (Catalog Service)**: Manages the artisanal product archive and order history on port `3002`.
- **Persistence Layer (MySQL)**: Centralized relational database for identity and catalog data.

---

## 🛠️ LOCAL SYNTHESIS (SETUP)

### 1. PERSISTENCE LAYER (MySQL)
The boutique requires a running MySQL instance. 
1. **Initialize the Schema**: Execute the provided initialization script to create the `glacier_db` and seed the artisanal products.
   ```bash
   mysql -u root -p < database/init.sql
   ```
2. **Configure Connectors**: If your database credentials differ from the defaults (Host: `localhost`, User: `root`, No Password), update the configuration in:
   - `authentication-service/db/mysql-connector.ts`
   - `catalog-service/db/mysql-connector.ts`

### 2. NEURAL ENGINE (API KEY)
A Google Gemini API key is required for the AI Flavor Concierge and Voice Assistant.
- Export your key in your environment:
  ```bash
  export API_KEY=your_gemini_api_key
  ```

### 3. LAUNCH ALL SYSTEMS
Glacier AI uses `concurrently` to orchestrate all microservices with a single command:
```bash
# Install dependencies across the monorepo
npm install

# Synthesize all services (Frontend, Gateway, Auth, Catalog)
npm run dev:all
```

---

## 📡 DIAGNOSTICS & TROUBLESHOOTING

### ❌ "Failed to Fetch" (Gateway Errors)
This occurs when the Frontend cannot establish a handshake with the API Gateway.
- **Check Ports**: Ensure port `8080` (Gateway) is available and not blocked by a firewall or another process.
- **Check Gateway Process**: Verify the `dev:gateway` terminal output for startup errors.
- **CORS Policies**: The gateway is pre-configured to allow `localhost:5173`. Ensure you aren't using a different port for the frontend.

### 🖼️ "Missing Images" (Catalog Errors)
If product cards show placeholders instead of artisanal visuals:
- **DB Seeding**: Ensure you ran `database/init.sql`. Without this, the `products` table is empty or missing, resulting in no image URLs.
- **Service Sync**: Check if the Catalog Service (`port 3002`) is running and successfully connected to your MySQL instance.

### 🎙️ "Voice/AI Issues"
- **API Key**: Ensure `process.env.API_KEY` is correctly set and valid.
- **Microphone Permissions**: The browser must be granted access to the microphone for the Voice Concierge to function.

---

## 🧪 TECH STACK
- **Models**: Gemini 3 Pro (Flavor Logic), Gemini 2.5 Flash (Live Audio)
- **Frontend**: React 19, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL 8.0
- **Streaming**: Raw PCM Audio over WebSockets (Gemini Live API)

---
*Developed by AKHIL AI AGENT - Redefining Digital Craftsmanship.*