import { AuthController } from '../authentication-service/auth-controller';
import { ProductController } from '../catalog-service/product-controller';

/**
 * API Gateway Router
 * This service sits between the Frontend and the Microservices.
 */
export class GatewayRouter {
  static async routeRequest(service: string, endpoint: string, method: string, body: any) {
    console.log(`[API GATEWAY] Routing ${method} request to ${service}${endpoint}`);

    switch (service) {
      case 'auth':
        return await this.handleAuthRoute(endpoint, body);
      case 'product':
        return await this.handleProductRoute(endpoint);
      case 'order':
        return await this.handleOrderRoute(endpoint, method, body);
      default:
        throw new Error(`Service ${service} is not registered in the gateway routing table.`);
    }
  }

  private static async handleAuthRoute(endpoint: string, body: any) {
    if (endpoint === '/login') return await AuthController.login(body);
    if (endpoint === '/register') return await AuthController.register(body);
    throw new Error('Auth endpoint not found');
  }

  private static async handleProductRoute(endpoint: string) {
    if (endpoint === '/list') {
      return await ProductController.getProducts();
    }
    throw new Error('Product endpoint not found');
  }

  private static async handleOrderRoute(endpoint: string, method: string, body: any) {
    if (method === 'POST' && endpoint === '/create') {
      return await ProductController.createOrder(body);
    }

    if (endpoint === '/my-orders') {
      return await ProductController.getOrdersByUser(body?.userId);
    }

    throw new Error('Order endpoint not found');
  }
}