import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Box, CheckSquare, Truck, Package, RotateCcw, 
  ChevronRight, ArrowRight, User, AlertTriangle, Play, HelpCircle, 
  MapPin, CheckCircle, ExternalLink, X, RefreshCw, Key, Settings, Plus, Edit3, Trash2, UserCheck, Save, Search
} from 'lucide-react';
import { Product, Order, OrderStatus, Employee, StoreSettings } from '../types';
import { formatStatusInSpanish, secureHash } from '../utils';

interface EmployeePortalProps {
  products: Product[];
  orders: Order[];
  employeeName: string;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, updatedBy: string, note?: string) => void;
  onRestockProduct: (productId: string, quantity: number, employeeName: string) => void;
  // Product callback permissions (granted dynamically by admin)
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  // Settings callback permissions
  storeSettings: StoreSettings;
  onUpdateStoreSettings: (settings: StoreSettings) => void;
  // Employees list callback (for manager hierarchical creation)
  employees: Employee[];
  onUpdateEmployees: (emps: Employee[]) => void;
}

export default function EmployeePortal({
  products,
  orders,
  employeeName,
  onUpdateOrderStatus,
  onRestockProduct,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  storeSettings,
  onUpdateStoreSettings,
  employees,
  onUpdateEmployees,
}: EmployeePortalProps) {
  // Locate current active worker record to verify real-time permission scopes
  const [activeEmp, setActiveEmp] = useState<Employee | null>(null);

  useEffect(() => {
    const activeId = localStorage.getItem('aether_active_employee_id');
    const match = employees.find(e => e.id === activeId) || employees.find(e => e.name === employeeName);
    if (match) {
      setActiveEmp(match);
    }
  }, [employees, employeeName]);

  // Read resolved permissions (fallback to safe values if not found)
  const isManager = activeEmp?.cargo.toLowerCase().includes('gerente') || activeEmp?.cargo.toLowerCase().includes('admin');
  const canManageProducts = activeEmp ? activeEmp.permissions.manageProducts : true; 
  const canManageOrders = activeEmp ? activeEmp.permissions.manageOrders : true;
  const canManageSettings = activeEmp ? activeEmp.permissions.manageSettings : false;
  const canManageEmployees = activeEmp ? activeEmp.permissions.manageEmployees : false;

  // Tabs layout
  const [activeTab, setActiveTab] = useState<'fulfillment' | 'products' | 'employees' | 'settings'>('fulfillment');
  const [activeFulfillmentTab, setActiveFulfillmentTab] = useState<'pending' | 'all'>('pending');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Staging form states in Spanish
  const [shippingNote, setShippingNote] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [restockQtyInput, setRestockQtyInput] = useState<{ [key: string]: string }>({});

  // Product management modal/states in Spanish (if permitted)
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');

  // Fields for Products
  const [frmName, setFrmName] = useState('');
  const [frmCat, setFrmCat] = useState('Café y Cocina');
  const [frmDesc, setFrmDesc] = useState('');
  const [frmPrice, setFrmPrice] = useState('30');
  const [frmStock, setFrmStock] = useState('15');
  const [frmAlert, setFrmAlert] = useState('5');
  const [frmImage, setFrmImage] = useState('');

  // Settings states
  const [setStoreName, setSetStoreName] = useState(storeSettings.storeName);
  const [setAddress, setSetAddress] = useState(storeSettings.address);
  const [setWhatsappPhone, setSetWhatsappPhone] = useState(storeSettings.whatsappPhone);
  const [setBusinessHours, setSetBusinessHours] = useState(storeSettings.businessHours);

  // Employee Management states
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [empName, setEmpName] = useState('');
  const [empCargo, setEmpCargo] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [permProducts, setPermProducts] = useState(true);
  const [permOrders, setPermOrders] = useState(true);
  const [permSettings, setPermSettings] = useState(false);
  const [permEmployees, setPermEmployees] = useState(false);

  // Self password change states (REQUISITO: los empleados también pueden cambiar su contraseña)
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const lowStockItems = products.filter(p => p.stock <= p.minStockAlert);
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Packed' || o.status === 'Shipped');

  // Sync inputs with settings updates
  useEffect(() => {
    setSetStoreName(storeSettings.storeName);
    setSetAddress(storeSettings.address);
    setSetWhatsappPhone(storeSettings.whatsappPhone);
    setSetBusinessHours(storeSettings.businessHours);
  }, [storeSettings]);

  // Quicly restock product count
  const handleQuickRestockSubmit = (productId: string, name: string) => {
    if (!canManageProducts) {
      alert('Error de Seguridad: No dispones de privilegios para gestionar stock de inventario.');
      return;
    }
    const rawVal = restockQtyInput[productId] || '10';
    const parsed = parseInt(rawVal) || 10;
    if (parsed <= 0) return;

    onRestockProduct(productId, parsed, employeeName);
    setRestockQtyInput(prev => ({ ...prev, [productId]: '' }));
    alert(`Reabastecimiento Exitoso: Se agregaron +${parsed} unidades de "${name}".`);
  };

  // Step fulfillment process
  const handleStepFulfillment = (order: Order, nextStatus: OrderStatus) => {
    if (!canManageOrders) {
      alert('Error de Seguridad: No dispones de privilegios para gestionar los pedidos de clientes.');
      return;
    }

    let customNote = '';
    if (nextStatus === 'Packed') {
      customNote = shippingNote.trim() || 'Pedido cubano clasificado con sellado de garantía y empacado.';
    } else if (nextStatus === 'Shipped') {
      customNote = `Despachado al servicio de mensajería Express. Referencia de Rastreo: ${trackingId.trim() || `CUB-${Math.floor(Math.random() * 900000 + 100000)}`}. ${shippingNote.trim()}`;
    } else if (nextStatus === 'Delivered') {
      customNote = 'Entregado de manera segura en el domicilio indicado.';
    } else if (nextStatus === 'Returned') {
      customNote = 'Devolución procesada. El stock de artículos ha sido retornado a bodega.';
    }

    onUpdateOrderStatus(order.id, nextStatus, `${employeeName} (Personal de Despacho)`, customNote);
    
    // Update local modal state
    const updated = orders.find(o => o.id === order.id);
    if (updated) {
      setSelectedOrder({
        ...order,
        status: nextStatus,
        history: [
          ...order.history,
          {
            status: nextStatus,
            updatedBy: `${employeeName} (Personal de Despacho)`,
            timestamp: new Date().toISOString(),
            note: customNote
          }
        ]
      });
    }

    setShippingNote('');
    setTrackingId('');
    
    if (nextStatus === 'Delivered' || nextStatus === 'Returned') {
      setSelectedOrder(null);
    }
  };

  // Create Product handler
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageProducts) return;

    onAddProduct({
      name: frmName.trim(),
      category: frmCat,
      description: frmDesc.trim(),
      price: Math.max(1, parseFloat(frmPrice) || 0),
      stock: Math.max(0, parseInt(frmStock) || 0),
      minStockAlert: Math.max(1, parseInt(frmAlert) || 0),
      imageUrl: frmImage.trim() || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=600',
    });

    setFrmName('');
    setFrmDesc('');
    setFrmPrice('30');
    setFrmStock('30');
    setFrmAlert('5');
    setFrmImage('');
    setShowAddProductModal(false);
    alert('Producto creado y publicado en tienda exitosamente.');
  };

  // Start edit product
  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setFrmName(prod.name);
    setFrmCat(prod.category);
    setFrmDesc(prod.description);
    setFrmPrice(prod.price.toString());
    setFrmStock(prod.stock.toString());
    setFrmAlert(prod.minStockAlert.toString());
    setFrmImage(prod.imageUrl);
  };

  // Save edit product
  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !canManageProducts) return;

    onUpdateProduct({
      id: editingProduct.id,
      name: frmName.trim(),
      category: frmCat,
      description: frmDesc.trim(),
      price: Math.max(1, parseFloat(frmPrice) || 0),
      stock: Math.max(0, parseInt(frmStock) || 0),
      minStockAlert: Math.max(1, parseInt(frmAlert) || 0),
      imageUrl: frmImage.trim() || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=600',
    });

    setEditingProduct(null);
    setFrmName('');
    setFrmDesc('');
    alert('Información del producto actualizada en catálogo.');
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) return;

    onUpdateStoreSettings({
      ...storeSettings,
      storeName: setStoreName.trim(),
      address: setAddress.trim(),
      whatsappPhone: setWhatsappPhone.trim(),
      businessHours: setBusinessHours.trim(),
    });
    alert('Los ajustes de la tienda han sido modificados por el empleado.');
  };

  // Create or Edit Employee Profile
  const handleSaveEmployeeByManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageEmployees) return;

    const trimmedName = empName.trim();
    const trimmedCargo = empCargo.trim();
    const trimmedUser = empUsername.trim().toLowerCase();

    if (!trimmedName || !trimmedCargo || !trimmedUser) {
      alert('Por favor complete todos los datos requeridos.');
      return;
    }

    if (!editingEmployee) {
      if (employees.some(emp => emp.username.toLowerCase() === trimmedUser)) {
        alert('Este nombre de usuario ya está registrado.');
        return;
      }
      if (!empPassword.trim()) {
        alert('Por favor asigne una contraseña inicial para el nuevo empleado.');
        return;
      }
    }

    const securePassHash = empPassword.trim() ? secureHash(empPassword.trim()) : (editingEmployee ? editingEmployee.passwordHash : '');

    const newPermissions = {
      manageProducts: permProducts,
      manageOrders: permOrders,
      manageSettings: permSettings,
      manageEmployees: permEmployees,
    };

    if (editingEmployee) {
      const updated = employees.map(emp => {
        if (emp.id === editingEmployee.id) {
          return {
            ...emp,
            name: trimmedName,
            cargo: trimmedCargo,
            username: trimmedUser,
            passwordHash: securePassHash,
            permissions: newPermissions
          };
        }
        return emp;
      });
      onUpdateEmployees(updated);
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        name: trimmedName,
        cargo: trimmedCargo,
        username: trimmedUser,
        passwordHash: securePassHash,
        isLocked: false,
        failedAttempts: 0,
        permissions: newPermissions
      };
      onUpdateEmployees([...employees, newEmp]);
    }

    handleCloseEmployeeModal();
    alert('Registro de empleado guardado.');
  };

  const handleCloseEmployeeModal = () => {
    setShowEmployeeModal(false);
    setEditingEmployee(null);
    setEmpName('');
    setEmpCargo('');
    setEmpUsername('');
    setEmpPassword('');
    setPermProducts(true);
    setPermOrders(true);
    setPermSettings(false);
    setPermEmployees(false);
  };

  const startEditEmployeeByManager = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpName(emp.name);
    setEmpCargo(emp.cargo);
    setEmpUsername(emp.username);
    setEmpPassword('');
    setPermProducts(emp.permissions.manageProducts);
    setPermOrders(emp.permissions.manageOrders);
    setPermSettings(emp.permissions.manageSettings);
    setPermEmployees(emp.permissions.manageEmployees);
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployeeByManager = (id: string, name: string) => {
    if (window.confirm(`¿Seguro que desea eliminar la cuenta de "${name}"?`)) {
      onUpdateEmployees(employees.filter(e => e.id !== id));
    }
  };

  const handleUnlockEmployeeByManager = (id: string) => {
    const updated = employees.map(emp => {
      if (emp.id === id) {
        return {
          ...emp,
          isLocked: false,
          failedAttempts: 0
        };
      }
      return emp;
    });
    onUpdateEmployees(updated);
    alert('Usuario desbloqueado e intentos fallidos restablecidos.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      alert('Por favor ingrese su nueva contraseña.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert('Las contraseñas no coinciden. Verifique de nuevo.');
      return;
    }
    
    // Find active employee record and update with SHA256 hashed password
    const activeId = localStorage.getItem('aether_active_employee_id');
    const updated = employees.map(emp => {
      if (emp.id === activeId || emp.name === employeeName) {
        return {
          ...emp,
          passwordHash: secureHash(newPassword.trim()),
          failedAttempts: 0,
          isLocked: false
        };
      }
      return emp;
    });
    
    onUpdateEmployees(updated);
    alert('¡Tu contraseña se ha actualizado con éxito! Por favor úsala de ahora en adelante.');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowPasswordChangeModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 md:px-8 space-y-8">
      {/* Employee Greeting Banner in Spanish */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-black text-sm shrink-0 uppercase tracking-tight">
            {employeeName.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs tracking-wider uppercase font-mono">
              <Truck className="w-3.5 h-3.5" />
              Terminal Operativa • {activeEmp ? activeEmp.cargo : 'Personal'}
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mt-0.5">
              ¡Hola de nuevo, <span className="text-indigo-850">{employeeName}!</span>
            </h2>
            <p className="text-xs text-gray-450 mt-0.5">
              Bienvenido al sistema de back-office. Tu cuenta tiene asignados permisos específicos por la administración de la tienda.
            </p>
            <button
              onClick={() => setShowPasswordChangeModal(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 text-[11px] font-bold text-gray-700 hover:text-indigo-950 rounded-lg cursor-pointer transition-all active:scale-97"
            >
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              Cambiar mi Contraseña de Acceso
            </button>
          </div>
        </div>

        {/* Locked Feature Alert */}
        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-150 flex items-start gap-2 max-w-xs text-[11px] text-gray-700 leading-normal">
          <ShieldAlert className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-indigo-900 block">Tus privilegios:</span>
            <div className="text-[10px] grid grid-cols-2 gap-x-2 text-indigo-805">
              <span>{canManageProducts ? '✓ Prod.' : '✗ Prod.'}</span>
              <span>{canManageOrders ? '✓ Pedidos' : '✗ Pedidos'}</span>
              <span>{canManageSettings ? '✓ Ajustes' : '✗ Ajustes'}</span>
              <span>{canManageEmployees ? '✓ Trabajadores' : '✗ Trabajadores'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Tabs list for Employees based on allowed permissions */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setActiveTab('fulfillment')}
          className={`flex items-center gap-1.5 px-4.5 py-2.5 border-b-2 text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'fulfillment' ? 'border-indigo-605 text-indigo-900' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <CheckSquare className="w-3.8 h-3.8" />
          Gestión de Pedidos
        </button>

        {canManageProducts && (
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 border-b-2 text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'products' ? 'border-indigo-605 text-indigo-900' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Box className="w-3.8 h-3.8" />
            Catálogo / Inventario
          </button>
        )}

        {canManageEmployees && (
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 border-b-2 text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'employees' ? 'border-indigo-605 text-indigo-900' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <UserCheck className="w-3.8 h-3.8" />
            Control de Trabajadores
          </button>
        )}

        {canManageSettings && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 border-b-2 text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'settings' ? 'border-indigo-605 text-indigo-900' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Settings className="w-3.8 h-3.8" />
            Ajustes Básicos
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* TAB Fulfillment */}
        {activeTab === 'fulfillment' && (
          <motion.div
            key="fulfillment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Side: Reposiciones / Alertas */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Box className="w-4 h-4 text-indigo-600" />
                  Punto de Reabastecimiento
                </h3>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded">
                  {lowStockItems.length} Alertas
                </span>
              </div>
              
              <p className="text-xs text-gray-400 leading-relaxed">
                Repón la cantidad de existencias directamente desde bodega si observa unidades escasas o agotadas en el catálogo.
              </p>

              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                {products.map((p) => {
                  const isUnderAlert = p.stock <= p.minStockAlert;
                  return (
                    <div 
                      key={p.id} 
                      className={`p-3.5 rounded-xl border transition-colors flex flex-col space-y-2.5 ${
                        isUnderAlert ? 'bg-red-50/30 border-red-150' : 'bg-gray-50/40 border-gray-150'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1 pr-2">
                          <h4 className="font-bold text-xs text-gray-900 leading-normal truncate">{p.name}</h4>
                          <span className="text-[9.5px] text-gray-400 block font-mono mt-0.5">{p.id}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] uppercase font-bold text-gray-450 block">Stock Actual</span>
                          <span className={`text-xs font-mono font-black ${
                            p.stock === 0 ? 'text-red-700' :
                            isUnderAlert ? 'text-amber-700' : 'text-gray-900'
                          }`}>
                            {p.stock} unids
                          </span>
                        </div>
                      </div>

                      {/* Stock Refiller action panel */}
                      <div className="flex items-center gap-2 pt-1.5 border-t border-gray-100">
                        <input
                          type="number"
                          placeholder="Cant"
                          value={restockQtyInput[p.id] || ''}
                          onChange={(e) => setRestockQtyInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                          disabled={!canManageProducts}
                          className="w-16 px-2 py-1 bg-white border border-gray-250 rounded-lg text-xs font-mono font-bold focus:outline-none"
                          min="1"
                        />
                        <button
                          onClick={() => handleQuickRestockSubmit(p.id, p.name)}
                          disabled={!canManageProducts}
                          className={`flex-1 py-1 text-white bg-indigo-650 hover:bg-indigo-750 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                            !canManageProducts ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Reponer Stock
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Active dispatch queue list */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    Pizarrón de Despacho Logístico
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Procesa las compras ordenadamente. Empaca los artículos, asigna guías de envío y despacha los cortaditos o guayaberas a los clientes.
                  </p>
                </div>

                {/* Sub tabs filtering */}
                <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-semibold shrink-0">
                  <button
                    onClick={() => setActiveFulfillmentTab('pending')}
                    className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                      activeFulfillmentTab === 'pending' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    Por Entregar ({pendingOrders.length})
                  </button>
                  <button
                    onClick={() => setActiveFulfillmentTab('all')}
                    className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                      activeFulfillmentTab === 'all' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    Todos ({orders.length})
                  </button>
                </div>
              </div>

              {/* Orders checklist layout */}
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {(activeFulfillmentTab === 'pending' ? pendingOrders : orders).length === 0 ? (
                  <div className="text-center py-16 text-gray-400 space-y-2">
                    <Package className="w-10 h-10 mx-auto text-gray-300" />
                    <h4 className="font-bold text-gray-800">Cola vacía o despejada</h4>
                    <p className="text-xs text-gray-400">Todos los pedidos se han despachado exitosamente. Cambie a Cliente para simular nuevas compras en la tienda.</p>
                  </div>
                ) : (
                  (activeFulfillmentTab === 'pending' ? pendingOrders : orders).map((order) => {
                    return (
                      <div 
                        key={order.id} 
                        className="p-4 border border-gray-150 rounded-2xl hover:border-indigo-200 bg-white shadow-3xs transition-all space-y-3 hover:shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-gray-950">{order.id}</span>
                              <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase tracking-wider ${
                                order.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                                order.status === 'Packed' ? 'bg-purple-100 text-purple-700' :
                                order.status === 'Shipped' ? 'bg-cyan-100 text-cyan-800' :
                                order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {formatStatusInSpanish(order.status)}
                              </span>
                            </div>
                            <span className="text-[9.5px] text-gray-400 font-mono mt-0.5 block">
                              Registrado el {new Date(order.createdAt).toLocaleDateString()} a las {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="text-right text-xs">
                            <span className="font-bold text-gray-900 block">{order.buyer?.nombre || 'Comprador'} {order.buyer?.apellidos || 'Anónimo'}</span>
                            <span className="text-[10px] text-gray-400 block">Apodo: "{order.buyer?.apodo || 'Cliente'}" • Tel: {order.buyer?.telefonoCodigo || ''} {order.buyer?.telefonoNum || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Items previews list */}
                        <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex flex-wrap gap-2 text-[11px] leading-relaxed">
                          {order.items.map((i) => (
                            <span key={i.productId} className="px-2 py-1 bg-white rounded border border-gray-200 text-gray-800 font-medium">
                              <strong>{i.name}</strong> × {i.quantity}
                            </span>
                          ))}
                        </div>

                        {/* Timeline status quick summary */}
                        <div className="flex justify-between items-center text-xs pt-1.5 border-t border-gray-100">
                          <p className="text-[10.5px] text-gray-500 italic max-w-[280px] truncate">
                            Status: "{order.history[order.history.length - 1]?.note || 'Pedido registrado en fila.'}"
                          </p>

                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-3.5 py-1.8 bg-gray-900 hover:bg-black text-white text-[10.5px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-0.5"
                          >
                            Operar Pedido
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB Catalog/Products (granted by admin) */}
        {activeTab === 'products' && canManageProducts && (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header products row */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-gray-200">
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-150 text-xs focus:outline-none"
                />
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setFrmName('');
                  setFrmDesc('');
                  setFrmPrice('25');
                  setFrmStock('30');
                  setFrmAlert('5');
                  setFrmImage('');
                  setShowAddProductModal(true);
                }}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Nuevo Producto
              </button>
            </div>

            {/* Editing Box inline */}
            {editingProduct && (
              <motion.div
                className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-sm text-gray-900">
                      Modificar Producto: <span className="text-amber-855 font-black">{editingProduct.name}</span>
                    </h4>
                  </div>
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="p-1.5 rounded-full hover:bg-amber-100 text-gray-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveProductEdit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre del Producto</label>
                    <input
                      type="text"
                      value={frmName}
                      onChange={(e) => setFrmName(e.target.value)}
                      className="w-full px-3 py-1.8 border rounded-lg bg-white font-semibold text-gray-950"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Categoría</label>
                    <select
                      value={frmCat}
                      onChange={(e) => setFrmCat(e.target.value)}
                      className="w-full px-3 py-1.8 border rounded-lg bg-white"
                    >
                      <option value="Café y Cocina">Café y Cocina</option>
                      <option value="Moda y Carries">Moda y Carries</option>
                      <option value="Tabacos y Souvenirs">Tabacos y Souvenirs</option>
                      <option value="Música y Audio">Música y Audio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Precio Unitario ($)</label>
                    <input
                      type="number"
                      value={frmPrice}
                      onChange={(e) => setFrmPrice(e.target.value)}
                      className="w-full px-3 py-1.8 border rounded-lg bg-white font-mono animate-pulse-short"
                      min="1"
                      required
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Descripción de Exhibición</label>
                    <textarea
                      value={frmDesc}
                      onChange={(e) => setFrmDesc(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.8 border rounded-lg bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stock Disponible</label>
                    <input
                      type="number"
                      value={frmStock}
                      onChange={(e) => setFrmStock(e.target.value)}
                      className="w-full px-3 py-1.8 border rounded-lg bg-white font-mono"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Alerta Stock Mínimo</label>
                    <input
                      type="number"
                      value={frmAlert}
                      onChange={(e) => setFrmAlert(e.target.value)}
                      className="w-full px-3 py-1.8 border rounded-lg bg-white font-mono"
                      min="1"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">URL de Imagen</label>
                    <input
                      type="text"
                      value={frmImage}
                      onChange={(e) => setFrmImage(e.target.value)}
                      className="w-full px-3 py-1.8 border rounded-lg bg-white"
                    />
                  </div>

                  <div className="md:col-span-4 flex justify-end gap-2 pt-2 border-t mt-1">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 font-bold text-white rounded-lg cursor-pointer"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Table catalog */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Producto</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4 text-right">Precio</th>
                      <th className="py-3 px-4 text-center">Stock Bodega</th>
                      <th className="py-3 px-4 text-center">Alerta Mínima</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-705">
                    {products
                      .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                      .map((p) => {
                        const isUnderAlert = p.stock <= p.minStockAlert;
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="py-3 px-4 flex items-center gap-3">
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-gray-900 block">{p.name}</span>
                                <span className="text-[10px] text-gray-450 font-mono italic">{p.id}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-semibold">
                                {p.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">${p.price}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                p.stock === 0 ? 'bg-red-100 text-red-700' :
                                isUnderAlert ? 'bg-amber-100 text-amber-700' : 'text-gray-900'
                              }`}>
                                {p.stock} unids
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-gray-400">{p.minStockAlert} unids</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => startEditProduct(p)}
                                  className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-amber-700 rounded-lg cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`¿Estás seguro de que deseas eliminar el producto "${p.name}"?`)) {
                                      onDeleteProduct(p.id);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-650 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB Employee hierarchy (granted by admin) */}
        {activeTab === 'employees' && canManageEmployees && (
          <motion.div
            key="employees"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-750">
                  Gestión Jerárquica de Trabajadores Co-operantes
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Como personal administrativo autorizado por el Administrador, tienes el encargo de crear y unificar los accesos.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setEmpName('');
                  setEmpCargo('');
                  setEmpUsername('');
                  setEmpPassword('');
                  setPermProducts(true);
                  setPermOrders(true);
                  setPermSettings(false);
                  setPermEmployees(false);
                  setShowEmployeeModal(true);
                }}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Registrar Empleado
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map(emp => (
                <div key={emp.id} className="relative bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-colors">
                  {emp.isLocked && (
                    <div className="absolute top-4 right-4 bg-red-100 border border-red-200 text-red-700 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> ¡Bloqueado!
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[9.5px] uppercase font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full inline-block">
                      {emp.cargo}
                    </span>
                    <h4 className="text-sm font-extrabold text-gray-900 mt-1.5">{emp.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">Usuario: <strong className="text-gray-800">@{emp.username}</strong></p>
                    
                    <div className="text-[9.5px] text-gray-400 bg-gray-50 p-1.5 border rounded-lg mt-1 block">
                      🗝️ Hash de Seguridad en BD: 
                      <span className="font-mono text-[8px] truncate block opacity-75">{emp.passwordHash}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2 text-[11px] text-gray-650">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-gray-400 block">Permisos Autorizados:</span>
                    <div className="grid grid-cols-2 gap-1.5 font-sans leading-normal">
                      <span className={`inline-flex items-center gap-1 font-semibold ${emp.permissions.manageProducts ? 'text-emerald-700' : 'text-gray-300 line-through'}`}>
                        {emp.permissions.manageProducts ? '✓' : '✗'} Productos
                      </span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${emp.permissions.manageOrders ? 'text-emerald-700' : 'text-gray-300 line-through'}`}>
                        {emp.permissions.manageOrders ? '✓' : '✗'} Pedidos
                      </span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${emp.permissions.manageSettings ? 'text-emerald-700' : 'text-gray-300 line-through'}`}>
                        {emp.permissions.manageSettings ? '✓' : '✗'} Ajustes Tienda
                      </span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${emp.permissions.manageEmployees ? 'text-emerald-700' : 'text-gray-300 line-through'}`}>
                        {emp.permissions.manageEmployees ? '✓' : '✗'} Jerarquías
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-3 flex flex-wrap gap-2 justify-end">
                    {emp.isLocked && (
                      <button
                        onClick={() => handleUnlockEmployeeByManager(emp.id)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin-slow" /> Desbloquear Cuenta
                      </button>
                    )}
                    <button
                      onClick={() => startEditEmployeeByManager(emp)}
                      className="px-2.5 py-1 text-[11px] font-bold border hover:bg-gray-50 text-gray-700 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3 h-3" /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteEmployeeByManager(emp.id, emp.name)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-red-50 hover:bg-red-100 text-red-650 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB Store Settings (granted by admin) */}
        {activeTab === 'settings' && canManageSettings && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 max-w-xl">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-500" />
                  Ajustes Estructura de la Tienda (Empleado Autorizado)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Tienes permiso para editar la información corporativa de la tienda. Los datos modificados se mostrarán dinámicamente en el pie de página de la web de Cubanos en Miami.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-sans">
                <div className="space-y-1.5">
                  <label className="block font-bold text-gray-505 uppercase tracking-wide">
                    Nombre Completo de la Tienda
                  </label>
                  <input
                    type="text"
                    value={setStoreName}
                    onChange={(e) => setSetStoreName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white text-gray-950 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-gray-505 uppercase tracking-wide">
                    Dirección Física / Sucursal
                  </label>
                  <input
                    type="text"
                    value={setAddress}
                    onChange={(e) => setSetAddress(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-gray-505 uppercase tracking-wide">
                    Teléfono de Contacto (Enlace WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={setWhatsappPhone}
                    onChange={(e) => setSetWhatsappPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-gray-505 uppercase tracking-wide">
                    Horarios de Atención al Público
                  </label>
                  <textarea
                    rows={2}
                    value={setBusinessHours}
                    onChange={(e) => setSetBusinessHours(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white font-semibold"
                  />
                </div>

                <div className="pt-3 border-t flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-900 hover:bg-black text-white font-bold rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 transition-transform active:scale-98"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Parámetros de Tienda
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff Operations fulfillment Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-x3 rounded-3xl border border-gray-100 max-w-xl w-full p-6 shadow-2xl relative space-y-6 text-xs text-gray-700"
            >
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-baseline gap-2">
                <h3 className="text-base font-bold text-gray-900 font-sans">
                  Terminal de Logística de Pedidos: {selectedOrder.id}
                </h3>
                <span className="text-[10px] font-mono text-gray-450">
                  Total de Factura: ${selectedOrder.total}
                </span>
              </div>

              {/* Order Information panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-150 space-y-2">
                  <h4 className="font-bold text-gray-800 uppercase tracking-widest text-[9px] flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                    Destino Física del Comprador
                  </h4>
                  <div className="space-y-1.5 text-[11px] leading-relaxed">
                    <span className="font-bold text-gray-900 block">{selectedOrder.buyer?.nombre || 'Comprador'} {selectedOrder.buyer?.apellidos || 'Anónimo'}</span>
                    <span className="text-gray-500 block">Apodo: <strong className="text-gray-800">"{selectedOrder.buyer?.apodo || 'Cliente'}"</strong></span>
                    <span className="text-gray-550 block font-mono">Tel: {selectedOrder.buyer?.telefonoCodigo || ''} {selectedOrder.buyer?.telefonoNum || 'N/A'}</span>
                    <p className="text-gray-550 border-t border-gray-200 mt-2 pt-2 leading-relaxed">
                      📍 Dirección: <span className="font-medium">"{selectedOrder.buyer?.direccion || 'N/A'}"</span>
                    </p>
                    
                    {/* Recipient check if active (Requisito 11) */}
                    {selectedOrder.buyer?.recibeOtraPersona ? (
                      <div className="mt-2.5 pt-2 border-t border-indigo-200/50 bg-indigo-50 p-2 rounded text-[10px] space-y-0.5 text-indigo-900">
                        <span className="font-bold uppercase tracking-wider block text-[8px] text-indigo-700">🎁 Persona Autorizada Destinataria:</span>
                        <p>Nombre: {selectedOrder.buyer?.otraNombre || 'José Pérez'}</p>
                        <p>Apodo: "{selectedOrder.buyer?.otraApodo || 'Pepito'}"</p>
                        <p>Tel: {selectedOrder.buyer?.otraTelefonoCodigo || ''} {selectedOrder.buyer?.otraTelefonoNum || ''}</p>
                      </div>
                    ) : (
                      <p className="text-[9.5px] italic text-emerald-600 font-bold">✓ El cliente recibirá la compra personalmente.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-gray-850 uppercase tracking-wide text-[9px]">
                    Artículos Adquiridos
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item) => (
                      <div key={item.productId} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-150 rounded-lg">
                        <span className="font-bold text-gray-800">{item.name} × {item.quantity}</span>
                        <span className="font-mono text-gray-900 font-bold">${item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Flow step fulfillment */}
              <div className="border-t border-gray-150 pt-5 space-y-4 text-xs font-sans">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">
                  Paso del Flujo del Despacho
                </h4>

                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-150 space-y-4">
                  {/* Step 1: Pending -> Packed */}
                  {selectedOrder.status === 'Pending' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-650" />
                        <div>
                          <h5 className="font-bold text-indigo-950">Inspección de Materiales y Empacado</h5>
                          <p className="text-[10px] text-indigo-750 leading-normal">
                            Verifique que los productos coincidan y que los acabados (ej. sellos de tazas, telas de la guayabera, maderas del dominó) sean óptimos antes de sellar la caja.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-indigo-850 uppercase tracking-wide">
                          Notas de Caja o Control de Calidad
                        </label>
                        <input
                          type="text"
                          value={shippingNote}
                          onChange={(e) => setShippingNote(e.target.value)}
                          placeholder="Ej. Cafetera y dominó impecables. Bolsas de moka selladas. Verificado."
                          className="w-full px-3 py-2 border border-indigo-250 bg-white rounded-lg text-xs"
                        />
                      </div>

                      <button
                        onClick={() => handleStepFulfillment(selectedOrder, 'Packed')}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Certificar Empacado y Marcar Listo (Empacado)
                      </button>
                    </div>
                  )}

                  {/* Step 2: Packed -> Shipped */}
                  {selectedOrder.status === 'Packed' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-indigo-650" />
                        <div>
                          <h5 className="font-bold text-indigo-950">Asignar Guía y Enviar al Transporte</h5>
                          <p className="text-[10px] text-indigo-750 leading-normal">
                            Despache la caja sellada al chofer de ruta en Little Havana. Ingrese el código de rastreo para el seguimiento del cliente.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-indigo-850 uppercase tracking-wide">
                            Guía Postal de Rastreo
                          </label>
                          <input
                            type="text"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            placeholder="Ej. CUB-739201"
                            className="w-full px-3 py-2 border border-indigo-250 bg-white rounded-lg text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-indigo-850 uppercase tracking-wide">
                            Transportadora Terrestre
                          </label>
                          <select className="w-full px-3 py-2 border border-indigo-250 bg-white rounded-lg text-xs">
                            <option>Mensajería Express Little Havana</option>
                            <option>Envío Postal Local USA</option>
                            <option>Recogida Presencial calle 8</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStepFulfillment(selectedOrder, 'Shipped')}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-4 h-4" />
                        Confirmar Envío y Registrar Tránsito
                      </button>
                    </div>
                  )}

                  {/* Step 3: Shipped -> Delivered */}
                  {selectedOrder.status === 'Shipped' && (
                    <div className="space-y-3 text-center py-2">
                      <Truck className="w-8 h-8 text-indigo-655 mx-auto animate-bounce-short" />
                      <div>
                        <h5 className="font-bold text-indigo-950">Confirmación de Entrega Física</h5>
                        <p className="text-[10px] text-indigo-700 leading-relaxed max-w-sm mx-auto">
                          Una vez que el chofer confirme la firma de Pepito o Carlitos, complete el pedido para darlo por entregado y registrar el cobro definitivo.
                        </p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleStepFulfillment(selectedOrder, 'Returned')}
                          className="flex-1 py-2 border border-red-200 text-red-650 hover:bg-red-50 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Registrar como Devuelto
                        </button>
                        <button
                          onClick={() => handleStepFulfillment(selectedOrder, 'Delivered')}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar Entrega Exitosa
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Archieced Delivered/Returned */}
                  {(selectedOrder.status === 'Delivered' || selectedOrder.status === 'Returned') && (
                    <div className="text-center py-4 space-y-2">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-650 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900">Servicio Completado</h5>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Este pedido ya se encuentra en su estado final ({formatStatusInSpanish(selectedOrder.status)}) de forma histórica.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-over employee manager modal (Inside employee portal for Manager hierarchical use) */}
      <AnimatePresence>
        {showEmployeeModal && canManageEmployees && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseEmployeeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl border border-gray-100 max-w-lg w-full p-6 shadow-2xl z-10 space-y-5"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-605" />
                  <h3 className="font-extrabold text-base text-gray-900 leading-tight">
                    {editingEmployee ? `Modificar Perfil: ${editingEmployee.name}` : 'Registrar Nuevo Empleado'}
                  </h3>
                </div>
                <button
                  onClick={handleCloseEmployeeModal}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEmployeeByManager} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="col-span-2 space-y-1">
                    <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">Nombre Completo del Trabajador</label>
                    <input
                      type="text"
                      placeholder="Ej. Ramón Valdés"
                      value={empName}
                      onChange={(e) => setEmpName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">Cargo, Rol o Puesto</label>
                    <input
                      type="text"
                      placeholder="Ej. Preparador de Pedidos o Despachador"
                      value={empCargo}
                      onChange={(e) => setEmpCargo(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">Nombre de Usuario (Login)</label>
                    <input
                      type="text"
                      placeholder="Ej. ramon"
                      value={empUsername}
                      onChange={(e) => setEmpUsername(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white lowercase"
                      required
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">
                        Contraseña {editingEmployee ? '(Dejar vacío para mantener la actual)' : 'de Seguridad'}
                      </label>
                      <span className="text-[8px] text-gray-405 italic text-right">Se guarda usando hash criptográfico SHA-250</span>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 w-3.5 text-gray-400" />
                      <input
                        type="password"
                        placeholder={editingEmployee ? 'Opcional: asignar nueva clave' : 'Escriba la clave de inicio'}
                        value={empPassword}
                        onChange={(e) => setEmpPassword(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 border rounded-lg bg-gray-50 focus:bg-white font-mono"
                        required={!editingEmployee}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <span className="font-bold text-[9px] uppercase tracking-widest text-gray-500 block">Configuración de Permisos Jerárquicos:</span>
                  
                  <div className="space-y-2 text-[11.5px] leading-relaxed">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={permProducts}
                        onChange={(e) => setPermProducts(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-650 cursor-pointer"
                      />
                      <span><strong>Gestionar Productos:</strong> Permitir agregar, editar, reabastecer y eliminar productos.</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={permOrders}
                        onChange={(e) => setPermOrders(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-650 cursor-pointer"
                      />
                      <span><strong>Gestionar Pedidos:</strong> Procesar despachos de clientes y avanzar estados de logística.</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={permSettings}
                        onChange={(e) => setPermSettings(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-650 cursor-pointer"
                      />
                      <span><strong>Gestionar Ajustes:</strong> Modificar nombres de sucursal, teléfonos y dirección física (Ajustes).</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={permEmployees}
                        onChange={(e) => setPermEmployees(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-650 cursor-pointer"
                      />
                      <span><strong>Gestionar Empleados:</strong> Alta/Baja de personal, claves de olvido y desbloqueos.</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={handleCloseEmployeeModal}
                    className="px-4 py-2 border rounded-xl hover:bg-gray-100 cursor-pointer"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    {editingEmployee ? 'Guardar Cambios' : 'Confirmar Registro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-over product creator modal (For employee with product permissions) */}
      <AnimatePresence>
        {showAddProductModal && canManageProducts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddProductModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl border border-gray-100 max-w-lg w-full p-6 shadow-2xl z-10 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-gray-900" />
                  <h3 className="font-extrabold text-base text-gray-900 leading-tight">Agregar Nuevo Producto Tradicional</h3>
                </div>
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div className="col-span-2 space-y-1">
                  <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">Título del Producto</label>
                  <input
                    type="text"
                    placeholder="Ej. Cafetera Moka Express Grande"
                    value={frmName}
                    onChange={(e) => setFrmName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">Categoría</label>
                  <select
                    value={frmCat}
                    onChange={(e) => setFrmCat(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="Café y Cocina">Café y Cocina</option>
                    <option value="Moda y Carries">Moda y Carries</option>
                    <option value="Tabacos y Souvenirs">Tabacos y Souvenirs</option>
                    <option value="Música y Audio">Música y Audio</option>
                  </select>
                </div>

                <div className="space-y-1 font-sans">
                  <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">Precio de Venta ($)</label>
                  <input
                    type="number"
                    placeholder="Ej. 35"
                    value={frmPrice}
                    onChange={(e) => setFrmPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                    min="1"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">Descripción Detallada</label>
                  <textarea
                    placeholder="Describe los materiales, dimensiones e historia cubana detrás del artículo..."
                    value={frmDesc}
                    onChange={(e) => setFrmDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">Unidades en Stock Inicial</label>
                  <input
                    type="number"
                    placeholder="Ej. 15"
                    value={frmStock}
                    onChange={(e) => setFrmStock(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                    min="0"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">Límite Crítico Alerta</label>
                  <input
                    type="number"
                    placeholder="Ej. 5"
                    value={frmAlert}
                    onChange={(e) => setFrmAlert(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                    min="1"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">URL de Imagen del Producto</label>
                  <input
                    type="text"
                    placeholder="Copie enlace de imagen de Unsplash o web..."
                    value={frmImage}
                    onChange={(e) => setFrmImage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="col-span-2 flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(false)}
                    className="px-4 py-2 border rounded-xl hover:bg-gray-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-xl cursor-pointer"
                  >
                    Publicar Producto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Self password change modal (REQUISITO: los empleados también pueden cambiar su contraseña) */}
      <AnimatePresence>
        {showPasswordChangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordChangeModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl border border-gray-100 max-w-sm w-full p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-650" />
                  <h3 className="font-extrabold text-base text-gray-900 leading-tight">
                    Cambiar mi Contraseña
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordChangeModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-sans">
                <p className="text-[11px] text-gray-400 leading-normal">
                  Modifica tu clave de acceso personal con total seguridad. Esta nueva clave se aplicará en tu próximo inicio de sesión.
                </p>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">Nueva Contraseña</label>
                  <input
                    type="password"
                    placeholder="Escribe la nueva contraseña de seguridad"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white font-mono text-gray-900 font-bold"
                    required
                    minLength={4}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    placeholder="Re-escribe la contraseña para validar"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white font-mono text-gray-900 font-bold"
                    required
                    minLength={4}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowPasswordChangeModal(false)}
                    className="px-4 py-2 border rounded-xl hover:bg-gray-100 cursor-pointer font-bold text-gray-650"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-605 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Guardar Nueva Clave
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
