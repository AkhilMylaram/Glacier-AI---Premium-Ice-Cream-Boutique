import { CatalogMySqlConnector } from './db/mysql-connector';

export class ProductController {
  static async getProducts() {
    return await CatalogMySqlConnector.query('products');
  }

  static async createOrder(orderData: any) {
    return await CatalogMySqlConnector.insert('orders', orderData);
  }

  static async getOrdersByUser(userId: string) {
    return await CatalogMySqlConnector.query('orders', { userId });
  }
}