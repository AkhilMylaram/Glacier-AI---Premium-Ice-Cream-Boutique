import mysql from 'mysql2/promise';

export class MySqlConnector {
  private static pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'glacier_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  static async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as T[];
  }

  static async execute(sql: string, params: any[] = []): Promise<any> {
    const [result] = await this.pool.execute(sql, params);
    return result;
  }
}