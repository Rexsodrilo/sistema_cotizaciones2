import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://127.0.0.1:8090');

// Tipos para PocketBase
export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  cost: number;
  user: string;
}

export interface Quotation {
  id: string;
  quote_number: string;
  product_name: string;
  product_type: string;
  validity_days: number;
  total_cost: number;
  sale_price: number;
  profit_margin: number;
  margin_percentage: number;
  user: string;
}

export interface QuotationMaterial {
  id: string;
  quotation: string;
  raw_material: string;
  percentage: number;
  cost: number;
}

export interface UserRole {
  id: string;
  user: string;
  role: 'admin' | 'user';
}