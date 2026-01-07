/**
 * Simulated MySQL Connector for Identity Service
 * Mimics a real SQL driver using localStorage for persistence with versioning.
 */
export class MySqlConnector {
  private static STORAGE_KEY = 'glacier_mysql_identity_db';
  private static DB_VERSION = 2; // Incremented to ensure seed users are reset/repaired

  static async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    // Simulate network latency to DB cluster
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const db = this.getDb();
    
    // Simulate basic SELECT by email
    if (sql.includes('SELECT * FROM users WHERE email = ?')) {
      const email = params[0];
      return db.users.filter((u: any) => u.email === email) as T[];
    }

    return [];
  }

  static async execute(sql: string, params: any[] = []): Promise<{insertId?: string}> {
    const db = this.getDb();

    // Simulate INSERT
    if (sql.includes('INSERT INTO users')) {
      const newUser = params[0]; 
      db.users.push(newUser);
      this.saveDb(db);
      return { insertId: newUser.id };
    }

    return {};
  }

  private static getDb() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    const initialUsers = [
      { id: 'u1', email: 'admin@glacier.ai', name: 'Admin User', password: 'Admin@123', role: 'admin' },
      { id: 'u2', email: 'customer1@glacier.ai', name: 'James Scoop', password: 'Scoop123!', role: 'customer' }
    ];

    if (!data) {
      const initial = { version: this.DB_VERSION, users: initialUsers };
      this.saveDb(initial);
      return initial;
    }

    const parsed = JSON.parse(data);
    
    // Auto-repair if version is outdated or missing seed users
    if (parsed.version !== this.DB_VERSION) {
      console.log("[IDENTITY DB MIGRATION] Refreshing identity archives...");
      const updated = { version: this.DB_VERSION, users: initialUsers };
      this.saveDb(updated);
      return updated;
    }

    return parsed;
  }

  private static saveDb(data: any) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }
}