import { Product, Order, EmployeeLog, StoreSettings } from './types';
import { secureHash } from './utils';

export const CATEGORIES = [
  'Todos',
  'Café y Cocina',
  'Moda y Carries',
  'Tabacos y Souvenirs',
  'Música y Audio'
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Cafetera Moka Express Cubana',
    description: 'Cafetera de aluminio premium pulido de 6 tazas ideal para colar el clásico café cubano fuerte y dulce con su perfecta espumita azucarada.',
    price: 29,
    stock: 50,
    category: 'Café y Cocina',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=600',
    minStockAlert: 10,
    onSale: true,
    saleDiscountPercent: 20
  },
  {
    id: 'prod-2',
    name: 'Guayabera Blanca Tradicional de Lino',
    description: 'Guayabera clásica de lino 100% transpirable con finas alforzas verticales, bolsillos funcionales y botones de gala. Estilo impecable para el calor de Miami.',
    price: 65,
    stock: 12,
    category: 'Moda y Carries',
    imageUrl: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=600',
    minStockAlert: 4
  },
  {
    id: 'prod-3',
    name: 'Juego de Dominó Cubano Doble Nueve',
    description: 'Fichas de dominó profesionales doble 9 en caja de madera de cedro maciza grabada con motivos de Miami. El clásico pasatiempo familiar de la Calle Ocho.',
    price: 49,
    stock: 25,
    category: 'Tabacos y Souvenirs',
    imageUrl: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=600',
    minStockAlert: 5
  },
  {
    id: 'prod-4',
    name: 'Humidor de Cedro para Tabacos',
    description: 'Cofre artesanal de cedro con higrómetro integrado para preservar óptimamente el aroma, frescura y sabor de tus puros cubanos favoritos.',
    price: 110,
    stock: 6,
    category: 'Tabacos y Souvenirs',
    imageUrl: 'https://images.unsplash.com/photo-1511216399124-747f4803986a?auto=format&fit=crop&q=80&w=600',
    minStockAlert: 3
  },
  {
    id: 'prod-5',
    name: 'Altavoz Bluetooth Vintage "Cuban Beats"',
    description: 'Altavoz portátil de alta fidelidad con carcasa de madera retro y rejilla tejida. Recrea el cálido sonido del son cubano y la salsa en cualquier habitación.',
    price: 125,
    stock: 15,
    category: 'Música y Audio',
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=600',
    minStockAlert: 3
  },
  {
    id: 'prod-6',
    name: 'Juego de Tazas de Cerámica Calle Ocho',
    description: 'Set de dos tazas de cerámica artesanal con el clásico mapa de la Calle Ocho y un gallito colorido. Soportan lavavajillas y microondas; ideales para cortaditos.',
    price: 24,
    stock: 45,
    category: 'Café y Cocina',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600',
    minStockAlert: 8
  },
  {
    id: 'prod-7',
    name: 'Bolso Playero "Miami Tropic Check"',
    description: 'Amplio bolso de transporte fabricado en lona náutica y asas de soga reforzada. Ideal para viajes a la playa, compras locales y domingos de sol.',
    price: 39,
    stock: 0, // Sin stock para probar reabastecimiento rápido
    category: 'Moda y Carries',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=600',
    minStockAlert: 5
  }
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Cubanos en Miami',
  address: '1420 SW 8th St, Little Havana, Miami, FL 33135',
  whatsappPhone: '+1 (305) 555-0824',
  businessHours: 'Lunes a Sábado: 8:00 AM - 9:00 PM | Domingos: 9:00 AM - 6:00 PM',
  currency: 'USD',
  currencySymbol: '$',
  socialLinks: [
    { id: 's-1', platform: 'WhatsApp', url: 'https://wa.me/13055550824', enabled: true },
    { id: 's-2', platform: 'Instagram', url: 'https://instagram.com/cubanosenmiami_tienda', enabled: true },
    { id: 's-3', platform: 'Facebook', url: 'https://facebook.com/cubanosenmiami_tienda', enabled: true },
    { id: 's-4', platform: 'Telegram', url: 'https://t.me/cubanosenmiami', enabled: false },
    { id: 's-5', platform: 'Email', url: 'mailto:contacto@cubanosenmiami.com', enabled: false },
    { id: 's-6', platform: 'Web', url: 'https://cubanosenmiami.com', enabled: false }
  ],
  categories: [
    'Café y Cocina',
    'Moda y Carries',
    'Tabacos y Souvenirs',
    'Música y Audio'
  ],
  customTabs: [
    { id: 'tab-orig', title: 'Nuestra Historia', content: 'Nacimos en el corazón de Little Havana con la misión de celebrar y preservar las ricas tradiciones familiares cubanas. Ofrecemos artículos auténticos traídos con amor y nostalgia para toda la comunidad de Miami.', isPublic: true, type: 'Custom' }
  ],
  adminPasswordHash: secureHash('admin123*'),
  adminPasswordChanged: false,
  cargoPermissions: [
    { cargo: 'Gerente', manageProducts: true, manageOrders: true, manageSettings: true, manageEmployees: true },
    { cargo: 'Despachador', manageProducts: false, manageOrders: true, manageSettings: false, manageEmployees: false },
    { cargo: 'Vendedor', manageProducts: true, manageOrders: true, manageSettings: false, manageEmployees: false },
    { cargo: 'Supervisor', manageProducts: true, manageOrders: false, manageSettings: false, manageEmployees: false }
  ]
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ped-1001',
    buyer: {
      nombre: 'Carlos',
      apellidos: 'Rodríguez',
      telefonoCodigo: '+1',
      telefonoNum: '3055550143',
      direccion: '742 NW 22nd Ave, Miami FL 33125',
      apodo: 'Carlitos',
      recibeOtraPersona: false
    },
    items: [
      {
        productId: 'prod-1',
        name: 'Cafetera Moka Express Cubana',
        quantity: 2,
        price: 29
      },
      {
        productId: 'prod-6',
        name: 'Juego de Tazas de Cerámica Calle Ocho',
        quantity: 1,
        price: 24
      }
    ],
    total: 82,
    status: 'Delivered',
    createdAt: '2026-06-15T09:30:00-07:05',
    history: [
      {
        status: 'Pending',
        updatedBy: 'Carlos Rodríguez (Cliente)',
        timestamp: '2026-06-15T09:30:00-07:05',
        note: 'Pedido registrado en línea.'
      },
      {
        status: 'Packed',
        updatedBy: 'Ramon Valdes (Gerente)',
        timestamp: '2026-06-15T10:15:00-07:05',
        note: 'Inspeccionado y empacado con protección para cerámica.'
      },
      {
        status: 'Shipped',
        updatedBy: 'Ramon Valdes (Gerente)',
        timestamp: '2026-06-15T10:45:00-07:05',
        note: 'Despachado con mensajero local de Miami.'
      },
      {
        status: 'Delivered',
        updatedBy: 'Mensajería Express',
        timestamp: '2026-06-15T11:45:00-07:05',
        note: 'Entregado en puerta trasera según instrucciones.'
      }
    ]
  },
  {
    id: 'ped-1002',
    buyer: {
      nombre: 'María',
      apellidos: 'García Pérez',
      telefonoCodigo: '+1',
      telefonoNum: '7865550291',
      direccion: '3400 SW 27th Ave, Coconut Grove FL 33133',
      apodo: 'Mary',
      recibeOtraPersona: true,
      recibeNombre: 'José Pérez',
      recibeTelefonoCodigo: '+1',
      recibeTelefonoNum: '3055557711',
      recibeApodo: 'Pepito'
    } as any,
    items: [
      {
        productId: 'prod-2',
        name: 'Guayabera Blanca Tradicional de Lino',
        quantity: 1,
        price: 65
      }
    ],
    total: 65,
    status: 'Pending',
    createdAt: '2026-06-15T12:00:00-07:05',
    history: [
      {
        status: 'Pending',
        updatedBy: 'María García Pérez (Cliente)',
        timestamp: '2026-06-15T12:00:00-07:05',
        note: 'Pedido registrado. Requiere que reciba Pepito.'
      }
    ]
  }
];

export const INITIAL_LOGS: EmployeeLog[] = [
  {
    id: 'log-1',
    employeeName: 'Ramón Valdés',
    action: 'Empacó Pedido #ped-1001',
    timestamp: '2026-06-15T10:15:00-07:05',
    details: 'Verificó que las tazas de cerámica no tengan raspaduras. Todo en orden.'
  },
  {
    id: 'log-2',
    employeeName: 'Mercedes Díaz',
    action: 'Reabasteció "Guayabera Blanca Tradicional de Lino"',
    timestamp: '2026-06-15T08:45:00-07:05',
    details: 'Recibidos 12 unidades del taller de costura local.'
  }
];
