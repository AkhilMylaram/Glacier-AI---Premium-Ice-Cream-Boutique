import { ApiResponse } from '../types';

class ApiGatewayClient {
  private static instance: ApiGatewayClient;
  private baseUrl = 'http://localhost:8080';
  
  private constructor() {}

  static getInstance(): ApiGatewayClient {
    if (!ApiGatewayClient.instance) {
      ApiGatewayClient.instance = new ApiGatewayClient();
    }
    return ApiGatewayClient.instance;
  }

  async request<T>(
    service: 'auth' | 'catalog',
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/${service}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { error: data.error || 'Request failed', status: response.status };
      }

      return { data: data as T, status: response.status };
    } catch (error: any) {
      console.error(`[FRONTEND GATEWAY ERROR]`, error.message);
      return { error: 'Gateway Connection Failed', status: 503 };
    }
  }
}

export const gateway = ApiGatewayClient.getInstance();