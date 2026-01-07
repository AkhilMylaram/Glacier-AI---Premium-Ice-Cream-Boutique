import { Product } from '../../types';

export class CatalogMySqlConnector {
  private static STORAGE_KEY = 'glacier_mysql_catalog_db';
  private static DB_VERSION = 5; // Updated version to trigger fresh seed data

  private static SEED_DATA: Product[] = [
    { 
      id: 'p1', 
      name: 'Midnight Charcoal', 
      description: 'Hand-crafted activated charcoal infused with 70% dark Venezuelan chocolate and a hint of sea salt.', 
      price: 8.50, 
      category: 'Signature', 
      imageUrl: 'https://images.unsplash.com/photo-1557142046-c704a3adf364?auto=format&fit=crop&q=80&w=800', 
      inventory: 45, 
      tags: ['Bold', 'Dark'] 
    },
    { 
      id: 'p2', 
      name: 'Celestial Saffron Glow', 
      description: 'Premium Kashmiri saffron threads steeped in organic whole milk with a swirl of golden turmeric honey.', 
      price: 10.50, 
      category: 'Limited', 
      imageUrl: 'https://images.unsplash.com/photo-1543255006-d6395b6f1171?auto=format&fit=crop&q=80&w=800', 
      inventory: 12, 
      tags: ['Premium', 'Exotic'] 
    },
    { 
      id: 'p3', 
      name: 'Salted Miso Caramel', 
      description: 'Traditional Japanese red miso paste folded into our signature 48-hour slow-cooked butter caramel.', 
      price: 9.00, 
      category: 'Signature', 
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=800', 
      inventory: 18, 
      tags: ['Savory', 'Creamy'] 
    },
    { 
      id: 'p4', 
      name: 'Dragonfruit Lychee', 
      description: 'Fresh pink pitaya pearls blended with sweet, fragrant lychee nectar for a refreshing tropical finish.', 
      price: 7.50, 
      category: 'Vegan', 
      imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800', 
      inventory: 30, 
      tags: ['Refreshing', 'Floral'] 
    },
    { 
      id: 'p5', 
      name: 'Matcha White Truffle', 
      description: 'Ceremonial grade Uji Matcha paired with delicate white chocolate shavings and a hint of vanilla bean.', 
      price: 11.50, 
      category: 'Limited', 
      imageUrl: 'https://images.unsplash.com/photo-1502760882462-8172bdeda0d2?auto=format&fit=crop&q=80&w=800', 
      inventory: 15, 
      tags: ['Luxury', 'Earthy'] 
    },
    { 
      id: 'p6', 
      name: 'Wild Berry Hibiscus', 
      description: 'Foraged mountain berries reduced into a thick compote and steeped with dried Egyptian hibiscus petals.', 
      price: 8.00, 
      category: 'Classic', 
      imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&q=80&w=800', 
      inventory: 22, 
      tags: ['Tart', 'Botanical'] 
    },
    { 
      id: 'p7', 
      name: 'Blue Velvet Crumble', 
      description: 'Naturally vibrant butterfly pea flower vanilla base mixed with velvet cake chunks and cream cheese frosting.', 
      price: 9.50, 
      category: 'Signature', 
      imageUrl: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&q=80&w=800', 
      inventory: 25, 
      tags: ['Indulgent', 'Novelty'] 
    },
    { 
      id: 'p8', 
      name: 'Spiced Fig & Balsamic', 
      description: 'Caramelized Mediterranean figs drizzled with a 12-year aged Modena balsamic reduction.', 
      price: 10.00, 
      category: 'Signature', 
      imageUrl: 'https://images.unsplash.com/photo-1534706936160-d5ee67737249?auto=format&fit=crop&q=80&w=800', 
      inventory: 14, 
      tags: ['Gourmet', 'Complex'] 
    },
    { 
      id: 'p9', 
      name: 'Toasted Black Sesame', 
      description: 'Slow-roasted black sesame seeds ground into a fine paste, creating a deep, nutty, and smoky profile.', 
      price: 8.50, 
      category: 'Classic', 
      imageUrl: 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?auto=format&fit=crop&q=80&w=800', 
      inventory: 40, 
      tags: ['Nutty', 'Traditional'] 
    }
  ];

  static async query<T>(table: 'products' | 'orders', filters?: any): Promise<T[]> {
    await new Promise(resolve => setTimeout(resolve, 100)); // DB Latency
    const db = this.getDb();
    
    if (table === 'products') {
      return db.products as T[];
    }
    
    if (table === 'orders' && filters?.userId) {
      return db.orders.filter((o: any) => o.userId === filters.userId) as T[];
    }
    
    return [] as T[];
  }

  static async insert(table: 'orders', data: any): Promise<any> {
    const db = this.getDb();
    const newItem = { ...data, id: 'ORD-' + Math.random().toString(36).substr(2, 5).toUpperCase(), createdAt: new Date().toISOString() };
    db[table].push(newItem);
    this.saveDb(db);
    return newItem;
  }

  private static getDb() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      const initial = { version: this.DB_VERSION, products: this.SEED_DATA, orders: [] };
      this.saveDb(initial);
      return initial;
    }
    
    const parsed = JSON.parse(data);
    
    // Auto-fix migration: Force update if version is outdated or contains broken assets
    const isOutdated = parsed.version !== this.DB_VERSION;
    const hasBrokenImages = parsed.products.some((p: Product) => p.imageUrl.startsWith('/assets'));

    if (isOutdated || hasBrokenImages) {
      console.log("[DB MIGRATION] Restoring premium image catalog...");
      parsed.products = this.SEED_DATA;
      parsed.version = this.DB_VERSION;
      this.saveDb(parsed);
    }
    
    return parsed;
  }

  private static saveDb(data: any) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }
}