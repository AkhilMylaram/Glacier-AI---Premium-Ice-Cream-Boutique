import express from 'express';
import cors from 'cors';
import { AuthController } from './auth-controller';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/login', async (req, res) => {
  try {
    const result = await AuthController.login(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

app.post('/register', async (req, res) => {
  try {
    const result = await AuthController.register(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[AUTH SERVICE] Identity Mesh running on port ${PORT}`);
});
