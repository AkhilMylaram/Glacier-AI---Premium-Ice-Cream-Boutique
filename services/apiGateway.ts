import { ApiResponse } from '../types';

// API Gateway Service for Microservices Communication
// This service handles all communication between frontend and backend microservices

class ApiGatewayClient {
  private static instance: ApiGatewayClient;
  private baseUrl = 'http://localhost:8080';
  private authToken: string | null = null;

  private constructor() {}

  static getInstance(): ApiGatewayClient {
    if (!ApiGatewayClient.instance) {
      ApiGatewayClient.instance = new ApiGatewayClient();
    }
    return ApiGatewayClient.instance;
  }

  // Set authentication token
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Generic request method
  async request<T>(
    service: 'auth' | 'catalog',
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Build URL based on service and endpoint
    let url: string;
    
    if (service === 'auth') {
      // Auth service routes
      url = `${this.baseUrl}/api/auth${endpoint}`;
    } else if (service === 'catalog') {
      // Catalog service routes
      if (endpoint === '/list') {
        url = `${this.baseUrl}/api/products`;
      } else if (endpoint === '/order/my-orders') {
        // Extract userId from body if available
        let userId = '';
        if (options.body) {
          try {
            const body = JSON.parse(options.body as string);
            userId = body.userId || '';
          } catch {}
        }
        url = `${this.baseUrl}/api/orders/user/${userId}`;
      } else if (endpoint.startsWith('/order')) {
        url = `${this.baseUrl}/api/orders`;
      } else if (endpoint.startsWith('/categories')) {
        url = `${this.baseUrl}/api/categories`;
      } else if (endpoint.startsWith('/search')) {
        const query = endpoint.split('?')[1] || '';
        url = `${this.baseUrl}/api/search?${query}`;
      } else {
        url = `${this.baseUrl}/api/catalog${endpoint}`;
      }
    } else {
      url = `${this.baseUrl}${endpoint}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors'
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { 
          error: data.error || data.message || 'Request failed', 
          status: response.status,
          success: false 
        };
      }

      return { 
        data: (data.data || data) as T, 
        status: response.status,
        success: true 
      };
    } catch (error: any) {
      console.error(`[FRONTEND GATEWAY ERROR]`, error.message);
      return { 
        error: 'Gateway Connection Failed', 
        status: 503,
        success: false 
      };
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    return this.request<{ token: string; refreshToken: string; user: any }>(
      'auth',
      '/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }
    );
  }

  async register(name: string, email: string, password: string) {
    return this.request<{ token: string; refreshToken: string; user: any }>(
      'auth',
      '/register',
      {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      }
    );
  }

  async validateToken() {
    return this.request<any>('auth', '/validate', {
      method: 'GET'
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<{ token: string; refreshToken: string }>(
      'auth',
      '/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      }
    );
  }

  // Catalog methods
  async getProducts() {
    return this.request<any[]>('catalog', '/list', {
      method: 'GET'
    });
  }

  async getCategories() {
    return this.request<any[]>('catalog', '/categories', {
      method: 'GET'
    });
  }

  async searchProducts(query: string) {
    return this.request<any[]>('catalog', `/search?query=${encodeURIComponent(query)}`, {
      method: 'GET'
    });
  }

  // Order methods
  async createOrder(orderData: {
    userId: string;
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod?: string;
    notes?: string;
  }) {
    return this.request<any>('catalog', '/order', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getUserOrders(userId: string) {
    return this.request<any[]>('catalog', `/order/my-orders`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.request<any>('catalog', `/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // Inventory management
  async updateInventory(productId: string, quantity: number) {
    return this.request<any>('catalog', `/products/${productId}/inventory`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const gateway = ApiGatewayClient.getInstance();

// Legacy compatibility - maintain old interface
export const apiGateway = {
  request: gateway.request.bind(gateway),
  setAuthToken: gateway.setAuthToken.bind(gateway),
  login: gateway.login.bind(gateway),
  register: gateway.register.bind(gateway),
  getProducts: gateway.getProducts.bind(gateway),
  createOrder: gateway.createOrder.bind(gateway),
  getUserOrders: gateway.getUserOrders.bind(gateway)
};