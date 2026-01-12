import express from 'express';
import cors from 'cors';
import { ProductController } from './product-controller';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.get('/list', async (req, res) => {
  try {
    const products = await ProductController.getProducts();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/order/create', async (req, res) => {
  try {
    const order = await ProductController.createOrder(req.body);
    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/order/my-orders', async (req, res) => {
  try {
    const orders = await ProductController.getOrdersByUser(req.body.userId);
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[CATALOG SERVICE] Resource Ledger running on port ${PORT}`);
});
