import { MySqlConnector } from './db/mysql-connector';
import { User } from '../types';

/**
 * AuthController handles the business logic for identity management.
 * This would be the core of an Express/NestJS service in production.
 */
export class AuthController {
  static async login(body: any) {
    const users = await MySqlConnector.query<any>(
      'SELECT * FROM users WHERE email = ?', 
      [body.email]
    );

    const user = users[0];

    if (!user) {
      throw new Error('Invalid user. Please create an account.');
    }

    if (user.password !== body.password) {
      throw new Error('Invalid credentials.');
    }

    // Return simulated JWT and clean User Object
    const { password, ...safeUser } = user;
    return { 
      token: 'jwt_secure_session_' + btoa(user.email + Date.now()), 
      user: safeUser as User 
    };
  }

  static async register(body: any) {
    const existing = await MySqlConnector.query<any>(
      'SELECT * FROM users WHERE email = ?', 
      [body.email]
    );

    if (existing.length > 0) {
      throw new Error('Account with this email already exists.');
    }

    const newUser = {
      id: 'u' + Math.floor(Math.random() * 10000),
      name: body.name,
      email: body.email,
      password: body.password, // In production, we use Argon2 hashing here
      role: 'customer' as const
    };

    await MySqlConnector.execute('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [newUser]);
    
    const { password, ...safeUser } = newUser;
    return { 
      token: 'jwt_secure_init_' + btoa(newUser.email), 
      user: safeUser as User 
    };
  }
}