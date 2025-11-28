
export enum Page {
  Dashboard = 'DASHBOARD',
  Upload = 'UPLOAD',
  Validation = 'VALIDATION',
  MasterData = 'MASTER_DATA',
  Reports = 'REPORTS',
}

export interface User {
  name: string;
  role: 'admin' | 'inventory_manager' | 'staff';
  avatarUrl: string;
}

export interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  costPrice: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
}

export interface InventoryLot {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  lotNumber?: string;
  expiryDate?: string; // ISO string format
}

export interface Transaction {
  id: string;
  type: 'INBOUND' | 'OUTBOUND';
  productId: string;
  warehouseId: string;
  quantity: number;
  date: string; // ISO string format
  documentId?: string;
  relatedPartyName?: string; // Supplier for INBOUND, customer for OUTBOUND
}

// Data structure extracted by AI from an uploaded document
export interface ExtractedItem {
  productCode?: string;
  productName: string;
  quantity: number;
  unit: string;
  costPrice?: number;
  lotNumber?: string;
  expiryDate?: string; // Expects YYYY-MM-DD
}

export interface ExtractedTransactionData {
  type: 'INBOUND' | 'OUTBOUND';
  documentId?: string;
  date?: string; // Expects YYYY-MM-DD
  warehouseName?: string;
  supplierName?: string;
  items: ExtractedItem[];
}
