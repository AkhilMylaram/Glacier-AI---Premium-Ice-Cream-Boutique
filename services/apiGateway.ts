
import { ApiResponse } from '../types';

/**
 * PRODUCTION ARCHITECTURE NOTE:
 * This Gateway service acts as the ONLY bridge between the UI and the Backend.
 * It simulates JWT validation, CORS handling, and Microservice routing.
 */
class ApiGateway {
  private static instance: ApiGateway;
  
  private constructor() {}

  static getInstance(): ApiGateway {
    if (!ApiGateway.instance) {
      ApiGateway.instance = new ApiGateway();
    }
    return ApiGateway.instance;
  }

  async request<T>(
    service: 'auth' | 'product' | 'order' | 'user',
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : null;
    
    await new Promise(resolve => setTimeout(resolve, 350));
    console.debug(`[GATEWAY] Routing request to ${service}-service at ${endpoint}`);

    try {
      const result = await this.routeInternal<T>(service, endpoint, method, body);
      return { data: result, status: 200 };
    } catch (error: any) {
      return { error: error.message || 'Gateway Timeout', status: 500 };
    }
  }

  private async routeInternal<T>(service: string, endpoint: string, method: string, body: any): Promise<T> {
    const db = this.getDatabase();

    switch(service) {
      case 'product':
        if (endpoint === '/list') return db.products as T;
        if (endpoint.startsWith('/detail/')) {
          const id = endpoint.split('/').pop();
          return db.products.find((p: any) => p.id === id) as T;
        }
        break;
      
      case 'auth':
        if (endpoint === '/login') {
          const user = db.users.find((u: any) => u.email === body.email && u.password === body.password);
          if (!user) throw new Error('Invalid credentials');
          return { token: 'jwt_simulated_token_' + Date.now(), user } as T;
        }
        break;

      case 'order':
        if (method === 'POST' && endpoint === '/create') {
          const newOrder = { ...body, id: 'ORD-' + Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
          db.orders.push(newOrder);
          this.saveDatabase(db);
          return newOrder as T;
        }
        if (endpoint === '/my-orders') {
          return db.orders.filter((o: any) => o.userId === body?.userId) as T;
        }
        break;
    }

    throw new Error('Endpoint not found');
  }

  private getDatabase() {
    const data = localStorage.getItem('glacier_db');
    if (data) return JSON.parse(data);
    
    const seed = {
      users: [{ id: 'u1', email: 'scoops@glacier.ai', name: 'John Doe', password: 'password123', role: 'customer' }],
      products: [
        { 
          id: 'p1', name: 'Midnight Charcoal', 
          description: 'Activated charcoal with rich dark chocolate and black sea salt. A mysterious, deep cocoa experience.', 
          price: 8.50, category: 'Signature', 
          imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=400&fit=crop',
          inventory: 45, tags: ['Bold', 'Unique', 'Vegan Available']
        },
        { 
          id: 'p2', name: 'Celestial Saffron Glow', 
          description: 'A ethereal blend of hand-picked Kashmiri saffron and golden turmeric honey. Radiant, warm, and deeply aromatic.', 
          price: 10.50, category: 'Limited', 
          imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800&q=80',
          inventory: 12, tags: ['Exotic', 'Golden', 'Premium']
        },
        { 
          id: 'p3', name: 'Salted Miso Caramel', 
          description: 'Umami-rich white miso swirled into buttery homemade caramel. The ultimate sweet and savory balance.', 
          price: 9.00, category: 'Signature', 
          imageUrl: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=400&h=400&fit=crop',
          inventory: 18, tags: ['Savory', 'Sweet', 'Top Seller']
        },
        { 
          id: 'p4', name: 'Dragonfruit Lychee Sorbet', 
          description: 'Vibrant pink dragonfruit paired with delicate lychee pearls. A refreshing tropical getaway in every bite.', 
          price: 7.00, category: 'Vegan', 
          imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=400&fit=crop',
          inventory: 22, tags: ['Dairy-Free', 'Refreshing', 'Fruity']
        },
        { 
          id: 'p5', name: 'Matcha White Truffle', 
          description: 'Ceremonial grade matcha dusted with white chocolate truffle shavings. Deep earthy tones meet creamy luxury.', 
          price: 11.50, category: 'Limited', 
          imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
          inventory: 10, tags: ['Rare', 'Earthy', 'Gourmet']
        },
        { 
          id: 'p6', name: 'Espresso Gold Dust', 
          description: 'Double-shot espresso bean infusion topped with edible 24k gold leaf. For the sophisticated caffeine lover.', 
          price: 12.00, category: 'Limited', 
          imageUrl: 'https://images.unsplash.com/photo-1557142046-c704a3adf364?w=400&h=400&fit=crop',
          inventory: 15, tags: ['Gold', 'Caffeine', 'Luxury']
        },
        { 
          id: 'p7', name: 'Wild Berry Hibiscus', 
          description: 'Hand-picked forest berries steeped with crimson hibiscus petals. Tart, sweet, and incredibly vibrant.', 
          price: 8.00, category: 'Classic', 
          imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop',
          inventory: 28, tags: ['Berry', 'Zesty', 'Organic']
        },
        { 
          id: 'p8', name: 'Rosewater Pistachio', 
          description: 'Premium Iranian pistachios crushed into a delicate Persian rosewater base. A timeless middle-eastern delight.', 
          price: 9.50, category: 'Signature', 
          imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop',
          inventory: 20, tags: ['Nutty', 'Fragrant', 'Artisan']
        },
        { 
          id: 'p9', name: 'Yuzu Ginger Blast', 
          description: 'Sharp Japanese Yuzu citrus paired with a warm ginger kick. A palate-cleansing explosion of flavor.', 
          price: 8.50, category: 'Vegan', 
          imageUrl: 'https://images.unsplash.com/photo-1505394033223-43c0ad696bc7?w=400&h=400&fit=crop',
          inventory: 25, tags: ['Citrus', 'Spicy', 'Vegan']
        }
      ],
      orders: []
    };
    this.saveDatabase(seed);
    return seed;
  }

  private saveDatabase(data: any) {
    localStorage.setItem('glacier_db', JSON.stringify(data));
  }
}

export const gateway = ApiGateway.getInstance();
