import { ApiResponse } from '../types';
import { GatewayRouter } from '../apigateway-service/router';

class ApiGatewayClient {
  private static instance: ApiGatewayClient;
  
  private constructor() {}

  static getInstance(): ApiGatewayClient {
    if (!ApiGatewayClient.instance) {
      ApiGatewayClient.instance = new ApiGatewayClient();
    }
    return ApiGatewayClient.instance;
  }

  /**
   * Universal Request Handler
   * This is the Frontend's interface to the API Gateway.
   */
  async request<T>(
    service: 'auth' | 'product' | 'order' | 'user',
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : null;
    
    // Simulate network overhead to the Gateway
    await new Promise(resolve => setTimeout(resolve, 300)); 

    try {
      // Logic: The client calls the Gateway Service, not the downstream microservices directly.
      const responseData = await GatewayRouter.routeRequest(service, endpoint, method, body);
      return { data: responseData as T, status: 200 };
    } catch (error: any) {
      // Distinction: Only log system-level "Gateway" errors to console. 
      // Business logic errors (like 'User not found') are passed silently to the UI response.
      const isBusinessError = error.message && (
        error.message.includes('Invalid') || 
        error.message.includes('exists') || 
        error.message.includes('found')
      );

      if (!isBusinessError) {
        console.error(`[GATEWAY SYSTEM ERROR]`, error);
      }
      
      return { error: error.message || 'Gateway connection failed', status: 500 };
    }
  }
}

export const gateway = ApiGatewayClient.getInstance();