
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8080;

const SERVICES = {
  auth: 'http://localhost:3001',
  catalog: 'http://localhost:3002'
};

// Explicitly allowing the Frontend origin (Vite default port 5173)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.all('/:service/*', async (req: any, res: any) => {
  const { service } = req.params;
  const targetBase = service === 'auth' ? SERVICES.auth : SERVICES.catalog;
  const path = req.params[0] ? `/${req.params[0]}` : '';

  console.log(`[GATEWAY] Routing ${req.method} -> ${targetBase}${path}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

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
  } catch (error: any) {
    console.error(`[GATEWAY ERROR] Failed to proxy to ${service}:`, error.message);
    
    if (error.name === 'AbortError') {
      res.status(504).json({ error: `Service ${service} timed out` });
    } else {
      res.status(502).json({ error: `Service ${service} unreachable or crashed` });
    }
  }
});

app.listen(PORT, () => {
  console.log(`[GATEWAY] Edge Router active on port ${PORT}`);
});
