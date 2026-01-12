
import mysql from 'mysql2/promise';

export class CatalogMySqlConnector {
  private static pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'glacier_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  static async query(table: 'products' | 'orders', filters?: any): Promise<any[]> {
    try {
      if (table === 'products') {
        const [rows] = await this.pool.execute(`
          SELECT p.*, GROUP_CONCAT(t.tag) as tags 
          FROM products p 
          LEFT JOIN product_tags t ON p.id = t.product_id 
          GROUP BY p.id
        `);
        
        return (rows as any[]).map(row => ({
          ...row,
          tags: row.tags ? row.tags.split(',') : []
        }));
      }

      if (table === 'orders' && filters?.userId) {
        const [rows] = await this.pool.execute('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC', [filters.userId]);
        return rows as any[];
      }
    } catch (error: any) {
      console.error(`[CATALOG DB ERROR] Table ${table} query failed:`, error.message);
      return []; // Return empty array so the UI can show empty state instead of crashing
    }

    return [];
  }

  static async insert(table: 'orders', data: any): Promise<any> {
    const id = 'ORD-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    await this.pool.execute(
      'INSERT INTO orders (id, userId, total, status, createdAt) VALUES (?, ?, ?, ?, ?)',
      [id, data.userId, data.total, data.status, new Date()]
    );
    return { ...data, id, createdAt: new Date() };
  }
}
