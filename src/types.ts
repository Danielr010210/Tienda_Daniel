export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  minStockAlert: number;
  onSale?: boolean;
  saleDiscountPercent?: number; // e.g. 15 for 15% off
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'Pending' | 'Packed' | 'Shipped' | 'Delivered' | 'Returned';

export interface OrderHistoryEvent {
  status: OrderStatus;
  updatedBy: string;
  timestamp: string;
  note?: string;
}

// Buyer details as specified in requirement 11
export interface BuyerDetails {
  nombre: string;
  apellidos: string;
  telefonoCodigo: string; // Country code e.g. +1, +34, +53
  telefonoNum: string;
  direccion: string;
  apodo: string;
  recibeOtraPersona: boolean;
  otraNombre?: string;
  otraApellidos?: string;
  otraTelefonoCodigo?: string;
  otraTelefonoNum?: string;
  otraDireccion?: string;
  otraApodo?: string;
}

export interface Order {
  id: string;
  buyer: BuyerDetails;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  history: OrderHistoryEvent[];
}

export type UserRole = 'Customer' | 'Employee' | 'Admin';

export interface EmployeeLog {
  id: string;
  employeeName: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface SalesMetric {
  date: string;
  sales: number;
  revenue: number;
}

export interface EmployeePermissions {
  manageProducts: boolean;  // Agregar, editar, eliminar productos
  manageOrders: boolean;    // Ver y procesar pedidos
  manageSettings: boolean;  // Editar información de la tienda en Ajustes
  manageEmployees: boolean; // Crear o eliminar otros empleados
}

export interface Employee {
  id: string;
  name: string;          // Nombre del trabajador
  cargo: string;         // Puesto o jerarquía
  username: string;      // Nombre de usuario de acceso
  passwordHash: string;  // Contraseña almacenada de forma segura (Hash SHA-250)
  isLocked: boolean;     // Bloqueado hasta verificación de Admin
  failedAttempts: number;// Contador de errores (máx 3 consecutivas)
  permissions: EmployeePermissions;
  isGerente?: boolean;   // Special manager permission (Requisito 21)
}

export interface SocialLink {
  id: string;
  platform: 'Facebook' | 'Instagram' | 'Telegram' | 'Email' | 'Web' | 'WhatsApp';
  url: string;
  enabled: boolean;
}

export interface CargoPermissionConfig {
  cargo: string;
  manageProducts: boolean;
  manageOrders: boolean;
  manageSettings: boolean;
  manageEmployees: boolean;
}

export interface CustomTab {
  id: string;
  title: string;
  content: string; // Custom descriptive text shown when selected
  isPublic: boolean;
  type: 'Custom' | 'Standard';
}

export interface ShiftLog {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Entrada' | 'Salida';
  timestamp: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  type: 'Bloqueo' | 'IntentoFallido' | 'AccesoNoAutorizado' | 'CambioContrasena';
  details: string;
  resolved: boolean;
}

export interface StoreSettings {
  storeName: string;
  address: string;
  whatsappPhone: string;
  businessHours: string;
  currency: 'USD' | 'EUR' | 'CUP' | 'MLC';
  currencySymbol: string;
  socialLinks: SocialLink[];
  categories: string[];
  customTabs: CustomTab[];
  adminPasswordHash: string;
  adminPasswordChanged: boolean;
  cargoPermissions?: CargoPermissionConfig[];
}
