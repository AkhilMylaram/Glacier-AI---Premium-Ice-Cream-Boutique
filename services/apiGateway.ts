
import { ApiResponse, User, RegisterRequest } from '../types';

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
    
    // Simulate real network and DB latency
    await new Promise(resolve => setTimeout(resolve, 800)); 

    try {
      const result = await this.routeInternal<T>(service, endpoint, method, body);
      return { data: result, status: 200 };
    } catch (error: any) {
      return { error: error.message || 'Internal Server Error', status: 401 };
    }
  }

  private async routeInternal<T>(service: string, endpoint: string, method: string, body: any): Promise<T> {
    const db = this.getDatabase();

    switch(service) {
      case 'auth':
        if (endpoint === '/login') {
          const user = db.users.find((u: any) => u.email === body.email);
          if (!user) {
            // Requirement: "invalid user create account" popup trigger
            throw new Error('Invalid user. Please create an account.');
          }
          if (user.password !== body.password) {
            throw new Error('Invalid credentials.');
          }
          // Return simulated JWT and User Object
          return { token: 'jwt_' + btoa(user.email + Date.now()), user } as T;
        }
        
        if (endpoint === '/register') {
          const existing = db.users.find((u: any) => u.email === body.email);
          if (existing) throw new Error('Account with this email already exists.');
          
          const newUser: User & {password: string} = {
            id: 'u' + (db.users.length + 1),
            name: body.name,
            email: body.email,
            password: body.password, 
            role: 'customer'
          };
          
          db.users.push(newUser);
          this.saveDatabase(db);
          return { token: 'jwt_' + btoa(newUser.email), user: newUser } as T;
        }
        break;
      
      case 'product':
        if (endpoint === '/list') return db.products as T;
        break;

      case 'order':
        if (method === 'POST' && endpoint === '/create') {
          const newOrder = { 
            ...body, 
            id: 'ORD-' + Math.random().toString(36).substr(2, 5).toUpperCase(), 
            createdAt: new Date().toISOString() 
          };
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
    
    // Seed data with requested users and expanded products
    const seed = {
      users: [
        { id: 'u1', email: 'admin@glacier.ai', name: 'Admin User', password: 'Admin@123', role: 'admin' },
        { id: 'u2', email: 'customer1@glacier.ai', name: 'James Scoop', password: 'Scoop123!', role: 'customer' },
        { id: 'u3', email: 'customer2@glacier.ai', name: 'Sarah Flavour', password: 'Flavour456!', role: 'customer' }
      ],
      products: [
        { id: 'p1', name: 'Midnight Charcoal', description: 'Activated charcoal with dark chocolate.', price: 8.50, category: 'Signature', imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&fit=crop', inventory: 45, tags: ['Bold'] },
        { id: 'p2', name: 'Celestial Saffron Glow', description: 'Kashmiri saffron and golden turmeric honey.', price: 10.50, category: 'Limited', imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&fit=crop', inventory: 12, tags: ['Premium'] },
        { id: 'p3', name: 'Salted Miso Caramel', description: 'Creamy miso swirled into butter caramel.', price: 9.00, category: 'Signature', imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&fit=crop', inventory: 18, tags: ['Savory'] },
        { id: 'p4', name: 'Dragonfruit Lychee', description: 'Vibrant pink pitaya and delicate lychee.', price: 7.50, category: 'Vegan', imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&fit=crop', inventory: 30, tags: ['Refreshing'] },
        { id: 'p5', name: 'Matcha White Truffle', description: 'Uji Matcha with white chocolate shavings.', price: 11.50, category: 'Limited', imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&fit=crop', inventory: 15, tags: ['Luxury'] },
        { id: 'p6', name: 'Wild Berry Hibiscus', description: 'Berry compote steeped with dried hibiscus.', price: 8.00, category: 'Classic', imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&fit=crop', inventory: 22, tags: ['Floral'] },
        { id: 'p7', name: 'Blue Velvet Crumble', description: 'Butterfly pea flower vanilla with cake crumbs.', price: 9.50, category: 'Signature', imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&fit=crop', inventory: 25, tags: ['Creamy'] },
        { id: 'p8', name: 'Spiced Fig & Balsamic', description: 'Mediterranean figs with a drizzle of 12-year balsamic.', price: 10.00, category: 'Signature', imageUrl: 'https://images.unsplash.com/photo-1516559828984-fb3b92374751?w=600&fit=crop', inventory: 14, tags: ['Gourmet'] },
        { id: 'p9', name: 'Toasted Black Sesame', description: 'Smoky, nutty profile using double-roasted sesame seeds.', price: 8.50, category: 'Classic', imageUrl: 'https://images.unsplash.com/photo-1549395156-e0c1fe6fc7a5?w=600&fit=crop', inventory: 40, tags: ['Nutty'] }
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
