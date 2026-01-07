
export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Classic' | 'Signature' | 'Vegan' | 'Limited';
  imageUrl: string;
  inventory: number;
  tags: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
