import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_LOGS, DEFAULT_STORE_SETTINGS } from './data';
import { Product, Order, EmployeeLog, UserRole, OrderStatus, OrderItem, Employee, StoreSettings, BuyerDetails, ShiftLog, SecurityAlert } from './types';
import Navbar from './components/Navbar';
import RoleSelector from './components/RoleSelector';
import Storefront from './components/Storefront';
import AdminPortal from './components/AdminPortal';
import EmployeePortal from './components/EmployeePortal';
import { Phone, MapPin, Clock, Shield, Database, Users, HelpCircle, Undo } from 'lucide-react';
import { secureHash } from './utils';

export default function App() {
  // Sync states with persistent local storage
  const [products, setProducts] = useState<Product[]>(() => {
    const raw = localStorage.getItem('aether_products');
    return raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const raw = localStorage.getItem('aether_orders');
    return raw ? JSON.parse(raw) : INITIAL_ORDERS;
  });

  const [employeeLogs, setEmployeeLogs] = useState<EmployeeLog[]>(() => {
    const raw = localStorage.getItem('aether_logs');
    return raw ? JSON.parse(raw) : INITIAL_LOGS;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('Customer');
  const [employeeName, setEmployeeName] = useState(() => {
    return localStorage.getItem('aether_employee_name') || 'Ramón Valdés';
  });

  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isRoleSelectorOpen, setIsRoleSelectorOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Requisito 5 & Requisito 9: Manage dynamic employee records at global level (synchronized in localStorage)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const raw = localStorage.getItem('cubanos_employees');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // Fallback below
      }
    }
    // Default seed employee users
    return [
      {
        id: 'emp-1',
        name: 'Ramón Valdés',
        cargo: 'Gerente Operativo',
        username: 'ramon',
        passwordHash: secureHash('ramon123'),
        isLocked: false,
        failedAttempts: 0,
        permissions: {
          manageProducts: true,
          manageOrders: true,
          manageSettings: true,
          manageEmployees: true, // Ramón is manager hierarchy is default
        },
      },
      {
        id: 'emp-2',
        name: 'Mercedes Díaz',
        cargo: 'Preparador de Pedidos',
        username: 'mercedes',
        passwordHash: secureHash('mercedes123'),
        isLocked: false,
        failedAttempts: 0,
        permissions: {
          manageProducts: true,
          manageOrders: true,
          manageSettings: false,
          manageEmployees: false,
        },
      },
    ];
  });

  // Requisito 6 & Requisito 7: Store Settings state
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const raw = localStorage.getItem('cubanos_store_settings');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // Fallback below
      }
    }
    return DEFAULT_STORE_SETTINGS;
  });

  // Requisito 13 & Requisito 14: Shift Logs and Security Alerts
  const [shiftLogs, setShiftLogs] = useState<ShiftLog[]>(() => {
    const raw = localStorage.getItem('cubanos_shift_logs');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return [
      {
        id: 'shift-1',
        employeeId: 'emp-1',
        employeeName: 'Ramón Valdés',
        type: 'Entrada',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: 'shift-2',
        employeeId: 'emp-2',
        employeeName: 'Mercedes Díaz',
        type: 'Entrada',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      }
    ];
  });

  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(() => {
    const raw = localStorage.getItem('cubanos_security_alerts');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return [
      {
        id: 'sec-1',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        type: 'IntentoFallido',
        details: 'Intento fallido de acceso al rol de Admin.',
        resolved: false,
      },
      {
        id: 'sec-2',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        type: 'IntentoFallido',
        details: 'Intento de login con clave inválida para el operario ramon.',
        resolved: false,
      }
    ];
  });

  // Write changes to localStorage
  useEffect(() => {
    localStorage.setItem('aether_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('aether_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('aether_logs', JSON.stringify(employeeLogs));
  }, [employeeLogs]);

  useEffect(() => {
    localStorage.setItem('aether_employee_name', employeeName);
  }, [employeeName]);

  useEffect(() => {
    localStorage.setItem('cubanos_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('cubanos_store_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem('cubanos_shift_logs', JSON.stringify(shiftLogs));
  }, [shiftLogs]);

  useEffect(() => {
    localStorage.setItem('cubanos_security_alerts', JSON.stringify(securityAlerts));
  }, [securityAlerts]);

  // Security and Shift handlers
  const handleAddSecurityAlert = (type: 'Bloqueo' | 'IntentoFallido' | 'AccesoNoAutorizado' | 'CambioContrasena', details: string) => {
    const newAlert: SecurityAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      type,
      details,
      resolved: false,
    };
    setSecurityAlerts(prev => [newAlert, ...prev]);
  };

  const handleResolveSecurityAlert = (alertId: string) => {
    setSecurityAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolved: true } : a));
  };

  const handleClearSecurityAlerts = () => {
    setSecurityAlerts([]);
  };

  const handleAddShiftLog = (employeeId: string, employeeName: string, type: 'Entrada' | 'Salida') => {
    const newLog: ShiftLog = {
      id: `shift-${Date.now()}`,
      employeeId,
      employeeName,
      type,
      timestamp: new Date().toISOString(),
    };
    setShiftLogs(prev => [newLog, ...prev]);
  };

  // Handle Cart Operations
  const handleAddToCart = (product: Product, quantity: number) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      const alreadyInCart = existing ? existing.quantity : 0;
      const totalRequested = alreadyInCart + quantity;
      
      if (totalRequested > product.stock) {
        alert(`Stock insuficiente de Bodega. Stock disponible actual de este producto: ${product.stock} unidades.`);
        return prevCart;
      }

      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: totalRequested }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (prod && quantity > prod.stock) {
      alert(`Sólo quedan ${prod.stock} unidades disponibles en el stock de Little Havana.`);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Requisito 11: Decrases reserves and generates a solid Order with detailed buyer profile
  const handleCheckoutFormatted = (buyer: BuyerDetails): Order | null => {
    if (cart.length === 0) return null;

    // 1. Decrase stocks levels on store database
    const updatedProducts = products.map((prod) => {
      const cartItem = cart.find((item) => item.product.id === prod.id);
      if (cartItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartItem.quantity),
        };
      }
      return prod;
    });
    setProducts(updatedProducts);

    // 2. Format cart items (accounting for discount % if active)
    const orderItems: OrderItem[] = cart.map((item) => {
      const finalPrice = item.product.onSale && item.product.saleDiscountPercent && item.product.saleDiscountPercent > 0
        ? Number((item.product.price * (1 - item.product.saleDiscountPercent / 100)).toFixed(2))
        : item.product.price;
      return {
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: finalPrice,
      };
    });

    const total = Number(orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2));

    // 3. Increment serial order ID (Spanish formatting "ped-XXXX")
    const nextIdNum = orders.length > 0 
      ? Math.max(...orders.map(o => parseInt(o.id.replace('ped-', '')) || 1000)) + 1 
      : 1001;
    const newOrderId = `ped-${nextIdNum}`;

    const newOrder: Order = {
      id: newOrderId,
      buyer, // Captures full structured details
      items: orderItems,
      total,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      history: [
        {
          status: 'Pending',
          updatedBy: `${buyer.nombre} ${buyer.apellidos} (Cliente)`,
          timestamp: new Date().toISOString(),
          note: `Pedido registrado. Apodo: "${buyer.apodo}". Entrega a domicilio programada en Miami.`,
        },
      ],
    };

    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    setCart([]); // Clear cart
    return newOrder;
  };

  // Admin and Employee: Update Order status and append detailed history
  const handleUpdateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    updatedBy: string,
    note?: string
  ) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) => {
        if (o.id === orderId) {
          // If status transitions to Returned, we restore the inventory stock levels automatically!
          if (status === 'Returned' && o.status !== 'Returned') {
            onRestoreOrderStock(o);
          }

          const newHistoryEvent = {
            status,
            updatedBy,
            timestamp: new Date().toISOString(),
            note: note || `Estado del pedido actualizado a: ${status}.`,
          };

          return {
            ...o,
            status,
            history: [...o.history, newHistoryEvent],
          };
        }
        return o;
      })
    );

    // Write a detailed security log to history audit panel
    const logText = `Avanzó Pedido #${orderId} a estado "${status}"`;
    const logDetails = note || `Actualización procesada por ${updatedBy}.`;
    
    const newLog: EmployeeLog = {
      id: `log-${Date.now()}`,
      employeeName: updatedBy.split(' (')[0], // Extract clean name
      action: logText,
      timestamp: new Date().toISOString(),
      details: logDetails,
    };

    setEmployeeLogs((prevLogs) => [newLog, ...prevLogs]);
  };

  // Restores stock levels of products when an order is cancelled/returned
  const onRestoreOrderStock = (order: Order) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const item = order.items.find((oi) => oi.productId === p.id);
        if (item) {
          return {
            ...p,
            stock: p.stock + item.quantity,
          };
        }
        return p;
      })
    );
  };

  // Dynamic Stock refill by authenticated employees or administrators
  const handleRestockProduct = (productId: string, quantity: number, empName: string) => {
    let oldStock = 0;
    let newStock = 0;
    let prodName = '';

    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id === productId) {
          oldStock = p.stock;
          newStock = p.stock + quantity;
          prodName = p.name;
          return {
            ...p,
            stock: newStock,
          };
        }
        return p;
      })
    );

    // Register employee log
    const newLog: EmployeeLog = {
      id: `log-${Date.now()}`,
      employeeName: empName,
      action: `Ajustó Stock "+${quantity}" de "${prodName}"`,
      timestamp: new Date().toISOString(),
      details: `Reabasteció stock en depósito. Inventario anterior: ${oldStock} unids | Nuevo stock: ${newStock} unids.`,
    };

    setEmployeeLogs((prevLogs) => [newLog, ...prevLogs]);
  };

  // Catalog modification call - ADD
  const handleAddProduct = (newProdFields: Omit<Product, 'id'>) => {
    const nextIdNum = products.length > 0
      ? Math.max(...products.map(p => parseInt(p.id.replace('prod-', '')) || 0)) + 1
      : 1;
    const newId = `prod-${nextIdNum}`;

    const newProduct: Product = {
      id: newId,
      ...newProdFields,
    };

    setProducts((prev) => [...prev, newProduct]);
  };

  // Catalog modification call - UPDATE
  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  // Catalog modification call - DELETE
  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Flush and reset memory database
  const handleResetData = () => {
    if (window.confirm('¿Está seguro de que desea restablecer todos los datos del Sandbox a los por defecto, incluyendo contraseñas de Ramón y Mercedes?')) {
      localStorage.removeItem('aether_products');
      localStorage.removeItem('aether_orders');
      localStorage.removeItem('aether_logs');
      localStorage.removeItem('cubanos_store_settings');
      localStorage.removeItem('cubanos_employees');
      
      setProducts(INITIAL_PRODUCTS);
      setOrders(INITIAL_ORDERS);
      setEmployeeLogs(INITIAL_LOGS);
      setStoreSettings(DEFAULT_STORE_SETTINGS);
      
      // Seed default employees
      const seeded = [
        {
          id: 'emp-1',
          name: 'Ramón Valdés',
          cargo: 'Gerente Operativo',
          username: 'ramon',
          passwordHash: secureHash('ramon123'),
          isLocked: false,
          failedAttempts: 0,
          permissions: {
            manageProducts: true,
            manageOrders: true,
            manageSettings: true,
            manageEmployees: true
          },
        },
        {
          id: 'emp-2',
          name: 'Mercedes Díaz',
          cargo: 'Preparador de Pedidos',
          username: 'mercedes',
          passwordHash: secureHash('mercedes123'),
          isLocked: false,
          failedAttempts: 0,
          permissions: {
            manageProducts: true,
            manageOrders: true,
            manageSettings: false,
            manageEmployees: false,
          },
        }
      ];
      setEmployees(seeded);
      setCart([]);
      setCurrentRole('Customer');
      setEmployeeName('Ramón Valdés');
      alert('¡Base de datos restablecida correctamente!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans select-none antialiased">
      
      {/* Top Banner indicating switchable active roles session in Spanish (Requisito 2/4) */}
      {currentRole !== 'Customer' && (
        <div className={`px-4 py-2 border-b text-[11px] font-bold flex justify-between items-center text-white ${
          currentRole === 'Admin' ? 'bg-amber-700' : 'bg-indigo-900'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="tracking-wide">
              {currentRole === 'Admin' ? '🚨 SESIÓN DE ADMINISTRACIÓN TOTAL ACTIVA' : '💼 TERMINAL DE TRABAJADOR / PERSONAL ACTIVA'}
            </span>
            <span className="opacity-75 font-mono text-[9px] hidden sm:inline">
              ({currentRole === 'Admin' ? 'Acceso General Root' : `OPERARIO: ${employeeName}`})
            </span>
          </div>
          <button
            onClick={() => {
              if (currentRole === 'Employee') {
                const activeEmpId = localStorage.getItem('aether_active_employee_id') || 'emp-unknown';
                handleAddShiftLog(activeEmpId, employeeName, 'Salida');
              }
              setCurrentRole('Customer');
            }}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-[10px] uppercase font-black rounded-lg cursor-pointer transition-transform active:scale-95"
          >
            Volver a Tienda Pública
          </button>
        </div>
      )}

      {/* Navigation header synced dynamic brand name */}
      <Navbar
        currentRole={currentRole}
        employeeName={employeeName}
        onOpenRoleSelector={() => setIsRoleSelectorOpen(true)}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        storeSettings={storeSettings}
      />

      {/* Main content route views */}
      <main className="flex-1">
        {currentRole === 'Customer' ? (
          <Storefront
            products={products}
            onAddToCart={handleAddToCart}
            cart={cart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            isCartOpen={isCartOpen}
            onCloseCart={() => setIsCartOpen(false)}
            onCheckout={handleCheckoutFormatted}
            storeSettings={storeSettings}
          />
        ) : currentRole === 'Admin' ? (
          <AdminPortal
            products={products}
            orders={orders}
            employeeLogs={employeeLogs}
            employees={employees}
            onUpdateEmployees={setEmployees}
            storeSettings={storeSettings}
            onUpdateStoreSettings={setStoreSettings}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onResetData={handleResetData}
            shiftLogs={shiftLogs}
            securityAlerts={securityAlerts}
            onResolveSecurityAlert={handleResolveSecurityAlert}
            onClearSecurityAlerts={handleClearSecurityAlerts}
          />
        ) : (
          <EmployeePortal
            products={products}
            orders={orders}
            employeeName={employeeName}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onRestockProduct={handleRestockProduct}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            storeSettings={storeSettings}
            onUpdateStoreSettings={setStoreSettings}
            employees={employees}
            onUpdateEmployees={setEmployees}
          />
        )}
      </main>

      {/* Interactive role chooser (lockouts, attempts countdown - Requisito 4) */}
      <AnimatePresence>
        {isRoleSelectorOpen && (
          <RoleSelector
            currentRole={currentRole}
            employeeName={employeeName}
            onRoleChange={(role, empName) => {
              setCurrentRole(role);
              if (empName) setEmployeeName(empName);
            }}
            isOpen={isRoleSelectorOpen}
            onClose={() => setIsRoleSelectorOpen(false)}
            employees={employees}
            onUpdateEmployees={setEmployees}
            storeSettings={storeSettings}
            onAddSecurityAlert={handleAddSecurityAlert}
            onAddShiftLog={handleAddShiftLog}
          />
        )}
      </AnimatePresence>

      {/* Requisito 7: Detailed, custom footer containing fully synced and editable store settings & opening hours */}
      <footer className="bg-slate-900 border-t border-slate-950 text-slate-400 py-10 px-4 md:px-8 mt-auto font-sans text-xs">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
            
            {/* Store details and Description */}
            <div className="space-y-3">
              <h4 className="font-black text-white text-sm uppercase tracking-wider">
                {storeSettings.storeName}
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed max-w-xs">
                La tienda oficial de los Cubanos en Miami. Ofrecemos repuestos tradicionales de Little Havana, indumentaria de calidad y accesorios con aroma a tradición cubana.
              </p>
            </div>

            {/* Editable address & Contact with green WhatsApp Icon (Requisito 7) */}
            <div className="space-y-3 font-medium">
              <h4 className="font-extrabold text-slate-300 text-xs uppercase tracking-widest">
                Contacto de Sucursal
              </h4>
              
              <div className="space-y-2 text-[11px]">
                <div className="flex items-start gap-2.5 text-slate-350">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{storeSettings.address}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                    {/* WhatsApp styled icon */}
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.1 1.455 4.7 1.456 5.485 0 9.941-4.456 9.944-9.94.002-2.657-1.023-5.15-2.884-7.013C16.545 1.794 14.058.773 11.4.773 5.912.773 1.458 5.228 1.456 10.714c0 1.7.45 3.2 1.348 4.7l-.37 1.353 1.411-.37z" />
                    </svg>
                  </div>
                  <a
                    href={`https://wa.me/${storeSettings.whatsappPhone.replace(/[^z0-9]/g, '')}`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="text-emerald-450 hover:text-emerald-300 transition-colors font-bold flex items-center gap-0.5"
                    title="Chatear por Whatsapp"
                  >
                    <span>{storeSettings.whatsappPhone}</span>
                    <span className="text-[9px] px-1 bg-emerald-900/40 text-emerald-300 rounded font-mono font-bold uppercase ml-1">Llamar / Chat</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Editable Service Hours (Requisito 7) */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-300 text-xs uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-500" />
                Horarios de Atención
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed italic pr-2 font-medium">
                {storeSettings.businessHours}
              </p>
              <div className="text-[10px] text-slate-500">
                Aprobado por Administración y Operadores.
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px]">
            <p className="text-slate-500 font-mono">
              © 2026 {storeSettings.storeName}. Todos los derechos reservados. Diseñado en Miami, FL.
            </p>
            <div className="flex gap-4 font-bold text-slate-420">
              <button onClick={() => setCurrentRole('Customer')} className="hover:text-white cursor-pointer transition-colors">Ver Tienda</button>
              <button onClick={() => { setCurrentRole('Employee'); setIsRoleSelectorOpen(true); }} className="hover:text-white cursor-pointer transition-colors">Estación Personal</button>
              <button onClick={() => { setCurrentRole('Admin'); setIsRoleSelectorOpen(true); }} className="hover:text-white cursor-pointer transition-colors">Consola Admin</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
