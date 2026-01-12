import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8080;

// Internal Microservice Mapping
const SERVICES = {
  auth: 'http://localhost:3001',      // Java Authentication Service
  catalog: 'http://localhost:3002'   // Node Catalog & Order Service
};

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Log Middleware
app.use((req, res, next) => {
  console.log(`[GATEWAY] ${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

// Dynamic Path-Based Routing
app.all('/:service/*', async (req: any, res: any) => {
  const { service } = req.params;
  const path = req.params[0] ? `/${req.params[0]}` : '';
  
  const targetBase = SERVICES[service as keyof typeof SERVICES];

  if (!targetBase) {
    return res.status(404).json({ error: `Service '${service}' is not registered in the Mesh.` });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for Java startup buffers

    const response = await fetch(`${targetBase}${path}`, {
      method: req.method,
      headers: { 
        'Content-Type': 'application/json'
      },
      body: (req.method !== 'GET' && req.method !== 'HEAD') ? JSON.stringify(req.body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));
    res.status(response.status).json(data);
  } catch (error