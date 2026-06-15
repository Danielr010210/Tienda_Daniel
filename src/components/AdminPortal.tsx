import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, Box, ClipboardList, Clock, Trash2, Plus, Edit3, 
  RotateCcw, ShieldCheck, DollarSign, ArrowUpRight, AlertTriangle, 
  Search, X, Check, Save, UserCheck, CalendarDays, ExternalLink, RefreshCw, Key, HelpCircle, ToggleLeft, ToggleRight, Settings, Share2, Facebook, Instagram, Send, Mail, Globe
} from 'lucide-react';
import { Product, Order, EmployeeLog, OrderStatus, Employee, StoreSettings, ShiftLog, SecurityAlert } from '../types';
import { formatStatusInSpanish, secureHash, isPasswordSecure } from '../utils';

interface AdminPortalProps {
  products: Product[];
  orders: Order[];
  employeeLogs: EmployeeLog[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, updatedBy: string, note?: string) => void;
  onResetData: () => void;
  // Dynamic settings and employees
  storeSettings: StoreSettings;
  onUpdateStoreSettings: (settings: StoreSettings) => void;
  employees: Employee[];
  onUpdateEmployees: (emps: Employee[]) => void;
  // Shifts and Security alerts
  shiftLogs: ShiftLog[];
  securityAlerts: SecurityAlert[];
  onResolveSecurityAlert: (alertId: string) => void;
  onClearSecurityAlerts: () => void;
}

export default function AdminPortal({
  products,
  orders,
  employeeLogs,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onResetData,
  storeSettings,
  onUpdateStoreSettings,
  employees,
  onUpdateEmployees,
  shiftLogs,
  securityAlerts,
  onResolveSecurityAlert,
  onClearSecurityAlerts,
}: AdminPortalProps) {
  // Translate tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'logs' | 'employees' | 'settings' | 'shifts' | 'security' | 'social'>('overview');
  
  // Search & Filter state
  const [productSearch, setProductSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('All');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields for Products
  const [frmName, setFrmName] = useState('');
  const [frmCat, setFrmCat] = useState('Café y Cocina');
  const [frmDesc, setFrmDesc] = useState('');
  const [frmPrice, setFrmPrice] = useState('30');
  const [frmStock, setFrmStock] = useState('15');
  const [frmAlert, setFrmAlert] = useState('5');
  const [frmImage, setFrmImage] = useState('');
  const [frmOnSale, setFrmOnSale] = useState(false);
  const [frmDiscountPercent, setFrmDiscountPercent] = useState('0');

  // Selected Order for Detail Modal
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [adminStatusNote, setAdminStatusNote] = useState('');

  // Staff creation / modification state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [empName, setEmpName] = useState('');
  const [empCargo, setEmpCargo] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empPassword, setEmpPassword] = useState(''); // Text password (hashed securely before saving)

  // Requisito 24: Admin default password change prompt states
  const [showPasswordChangePrompt, setShowPasswordChangePrompt] = useState(!storeSettings.adminPasswordChanged);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const handleChgAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    const cleanPass = newAdminPassword;
    if (!cleanPass) {
      setPwdError('La contraseña no puede estar vacía.');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setPwdError('Las contraseñas ingresadas no coinciden.');
      return;
    }
    // Validate strength
    if (!isPasswordSecure(newAdminPassword)) {
      setPwdError('Contraseña insegura: Debe incluir al menos 6 caracteres, combinar letras, números y símbolos especiales (como #, $, *, @, !), sin espacios.');
      return;
    }

    // Save hashed password
    const updated = {
      ...storeSettings,
      adminPasswordHash: secureHash(newAdminPassword),
      adminPasswordChanged: true,
    };
    onUpdateStoreSettings(updated);
    setPwdSuccess('¡Contraseña de Administrador actualizada correctamente!');
    
    // Auto-dismiss soon
    setTimeout(() => {
      setShowPasswordChangePrompt(false);
    }, 2000);
  };
  
  const [permProducts, setPermProducts] = useState(true);
  const [permOrders, setPermOrders] = useState(true);
  const [permSettings, setPermSettings] = useState(false);
  const [permEmployees, setPermEmployees] = useState(false);

  // Adjustes dynamic states
  const [setStoreName, setSetStoreName] = useState(storeSettings.storeName);
  const [setAddress, setSetAddress] = useState(storeSettings.address);
  const [setWhatsappPhone, setSetWhatsappPhone] = useState(storeSettings.whatsappPhone);
  const [setBusinessHours, setSetBusinessHours] = useState(storeSettings.businessHours);

  // KPI calculations in Spanish terms
  const totalRevenue = orders
    .filter(o => o.status === 'Delivered' || o.status === 'Shipped' || o.status === 'Packed')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalUnitsInWarehouse = products.reduce((sum, p) => sum + p.stock, 0);

  // Add Product Handler
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!frmName.trim() || !frmDesc.trim() || !frmPrice || !frmStock) return;

    onAddProduct({
      name: frmName.trim(),
      category: frmCat,
      description: frmDesc.trim(),
      price: Math.max(1, parseFloat(frmPrice) || 0),
      stock: Math.max(0, parseInt(frmStock) || 0),
      minStockAlert: Math.max(1, parseInt(frmAlert) || 0),
      imageUrl: frmImage.trim() || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=600',
      onSale: frmOnSale,
      saleDiscountPercent: frmOnSale ? Math.max(0, Math.min(100, parseInt(frmDiscountPercent) || 0)) : 0,
    });

    setFrmName('');
    setFrmDesc('');
    setFrmPrice('30');
    setFrmStock('15');
    setFrmAlert('5');
    setFrmImage('');
    setFrmOnSale(false);
    setFrmDiscountPercent('0');
    setShowAddModal(false);
  };

  // Start Edit Product
  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setFrmName(prod.name);
    setFrmCat(prod.category);
    setFrmDesc(prod.description);
    setFrmPrice(prod.price.toString());
    setFrmStock(prod.stock.toString());
    setFrmAlert(prod.minStockAlert.toString());
    setFrmImage(prod.imageUrl);
    setFrmOnSale(!!prod.onSale);
    setFrmDiscountPercent((prod.saleDiscountPercent || 0).toString());
  };

  // Save Edit Product
  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    onUpdateProduct({
      id: editingProduct.id,
      name: frmName.trim(),
      category: frmCat,
      description: frmDesc.trim(),
      price: Math.max(1, parseFloat(frmPrice) || 0),
      stock: Math.max(0, parseInt(frmStock) || 0),
      minStockAlert: Math.max(1, parseInt(frmAlert) || 0),
      imageUrl: frmImage.trim() || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=600',
      onSale: frmOnSale,
      saleDiscountPercent: frmOnSale ? Math.max(0, Math.min(100, parseInt(frmDiscountPercent) || 0)) : 0,
    });

    setEditingProduct(null);
    setFrmName('');
    setFrmDesc('');
    setFrmOnSale(false);
    setFrmDiscountPercent('0');
  };

  // Update Settings Form Submit
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStoreSettings({
      ...storeSettings,
      storeName: setStoreName.trim(),
      address: setAddress.trim(),
      whatsappPhone: setWhatsappPhone.trim(),
      businessHours: setBusinessHours.trim(),
    });
    alert('Ajustes de la tienda actualizados exitosamente.');
  };

  // Create or Edit Employee Profile
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = empName.trim();
    const trimmedCargo = empCargo.trim();
    const trimmedUser = empUsername.trim().toLowerCase();

    if (!trimmedName || !trimmedCargo || !trimmedUser) {
      alert('Por favor complete todos los datos requeridos.');
      return;
    }

    // If creating new: check duplicate username
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
      // Modify existing
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
      // Add brand new employee
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

  const startEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpName(emp.name);
    setEmpCargo(emp.cargo);
    setEmpUsername(emp.username);
    setEmpPassword(''); // Leave empty unless modifying
    setPermProducts(emp.permissions.manageProducts);
    setPermOrders(emp.permissions.manageOrders);
    setPermSettings(emp.permissions.manageSettings);
    setPermEmployees(emp.permissions.manageEmployees);
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    if (window.confirm(`¿Seguro que desea eliminar la cuenta de "${name}"?`)) {
      onUpdateEmployees(employees.filter(e => e.id !== id));
    }
  };

  const handleUnlockEmployee = (id: string) => {
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

  const handleAdminStatusOverride = (status: OrderStatus) => {
    if (!selectedOrderDetail) return;
    onUpdateOrderStatus(
      selectedOrderDetail.id,
      status,
      'Administrador Principal (Anulación)',
      adminStatusNote.trim() || 'Estado modificado por el administrador desde el panel de control'
    );
    
    // Update local modal state
    const updated = orders.find(o => o.id === selectedOrderDetail.id);
    if (updated) {
      setSelectedOrderDetail({
        ...selectedOrderDetail,
        status,
        history: [
          ...selectedOrderDetail.history,
          {
            status,
            updatedBy: 'Administrador Principal (Anulación)',
            timestamp: new Date().toISOString(),
            note: adminStatusNote.trim() || 'Estado modificado por el administrador desde el panel de control'
          }
        ]
      });
    }
    setAdminStatusNote('');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 md:px-8 space-y-6 text-gray-800">
      {/* Requisito 24 change default password banner */}
      <AnimatePresence>
        {showPasswordChangePrompt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 space-y-3 shadow-xs text-xs"
          >
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-amber-800 text-sm">⚠️ ¡Cambia tu contraseña por defecto!</h4>
                <p className="text-amber-700 leading-relaxed max-w-2xl">
                  Estás utilizando actualmente la contraseña por defecto de administrador (<code className="bg-amber-100 px-1 py-0.5 rounded text-[10px] font-mono font-bold">admin123*</code>). Para garantizar un entorno seguro frente a auditorías, debes actualizarla ahora o pulsar "Hacerlo más tarde".
                </p>
              </div>
            </div>

            <form onSubmit={handleChgAdminPassword} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 items-end max-w-3xl">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-amber-700">Nueva Contraseña Segura</label>
                <input
                  type="password"
                  required
                  placeholder="Ej: Secreta99*"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-3 py-1.5 border border-amber-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-amber-700">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="Ej: Secreta99*"
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  className="w-full px-3 py-1.5 border border-amber-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shadow-xs text-xs transition-colors"
                >
                  Confirmar Cambio
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordChangePrompt(false)}
                  className="px-3 py-2 border border-amber-350 hover:bg-amber-100 text-amber-800 rounded-xl cursor-pointer font-semibold transition-colors"
                >
                  Más tarde
                </button>
              </div>
            </form>

            {pwdError && (
              <div className="text-red-750 font-bold p-2 bg-red-50/50 border border-red-105 rounded-xl text-[11px] max-w-3xl mt-2 animate-pulse">
                ❌ {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div className="text-emerald-700 font-bold p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] max-w-3xl mt-2 flex items-center gap-1">
                ✓ {pwdSuccess}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-widest font-mono">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            Panel de Control Principal • {storeSettings.storeName}
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 mt-1">
            Administración General
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Agrega productos, audita los pedidos de clientes, controla roles de trabajadores y actualiza la información básica de la tienda.
          </p>
        </div>

        {/* Global Reset Switch */}
        <button
          onClick={() => {
            if (window.confirm('¿Seguro que deseas restablecer los valores iniciales de la base de datos? Esto borrará modificaciones del inventario y pedidos actuales.')) {
              onResetData();
              setSetStoreName('Cubanos en Miami');
              setSetAddress('1420 SW 8th St, Little Havana, Miami, FL 33135');
              setSetWhatsappPhone('+1 (305) 555-0824');
              setSetBusinessHours('Lunes a Sábado: 8:00 AM - 9:00 PM | Domingos: 9:00 AM - 6:00 PM');
            }
          }}
          className="flex items-center gap-2 px-3.5 py-2 border border-red-200 hover:border-red-300 bg-white text-red-600 hover:bg-red-50/50 rounded-xl text-xs font-semibold cursor-pointer duration-200"
        >
          <RotateCcw className="w-3.5 h-3.5 text-red-500" />
          Restaurar Base de Datos
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex gap-1.5 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { id: 'overview', label: 'Métricas Financieras', icon: BarChart3 },
          { id: 'products', label: 'Catálogo de Productos', icon: Box },
          { id: 'orders', label: 'Cola de Pedidos', icon: ClipboardList },
          { id: 'employees', label: 'Gestión de Empleados', icon: UserCheck },
          { id: 'settings', label: 'Ajustes de Tienda', icon: Settings },
          { id: 'social', label: 'Redes Sociales', icon: Share2 },
          { id: 'logs', label: 'Bitácora Laboral', icon: Clock },
          { id: 'shifts', label: 'Control de Asistencia', icon: CalendarDays },
          { id: 'security', label: 'Alertas de Seguridad', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4.5 py-2.5 border-b-2 text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-gray-950 text-gray-950'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-3.8 h-3.8" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Workspace */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
              <div className="bg-white rounded-2xl border border-gray-200 p-4.5 space-y-3 shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Ingresos Totales
                  </span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-gray-900">${totalRevenue}</div>
                  <span className="text-[9.5px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                    <ArrowUpRight className="w-3 h-3" />
                    Facturado por despachos
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4.5 space-y-3 shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Pedidos Pendientes
                  </span>
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-gray-900">{pendingOrdersCount}</div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Esperando empaque o entrega
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4.5 space-y-3 shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Productos Sin Stock
                  </span>
                  <div className="p-1.5 bg-red-50 text-red-650 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-gray-900">{outOfStockCount}</div>
                  <span className="text-[10px] text-red-600 font-semibold block mt-0.5">
                    Requieren reabastecimiento
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4.5 space-y-3 shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Volumen Bodega
                  </span>
                  <div className="p-1.5 bg-gray-100 text-gray-600 rounded-lg">
                    <Box className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-gray-900">{totalUnitsInWarehouse}</div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Colección de unidades físicas
                  </span>
                </div>
              </div>
            </div>

            {/* Grid distribution lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left detail: Recent sales */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 lg:col-span-2 space-y-4">
                <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                  Distribución de Transacciones Recientes
                </h3>
                
                {orders.length === 0 ? (
                  <p className="text-xs text-gray-400">No se registran compras todavía.</p>
                ) : (
                  <div className="space-y-2.5">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50/40">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            order.status === 'Delivered' ? 'bg-emerald-500' :
                            order.status === 'Shipped' ? 'bg-blue-500' :
                            order.status === 'Packed' ? 'bg-purple-500' : 'bg-amber-500'
                          }`} />
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">{order.buyer?.nombre || 'Comprador'} {order.buyer?.apellidos || 'Anónimo'} ({order.buyer?.apodo || 'Cliente'})</span>
                            <span className="text-[9px] text-gray-400 block font-mono mt-0.5">{order.id} • {new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold font-mono text-gray-900">${order.total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right panel: inventory safety */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                  Mínimos Críticos de Seguridad
                </h3>

                <div className="space-y-3">
                  {products.filter(p => p.stock <= p.minStockAlert).length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <p className="text-xs font-bold text-emerald-600">Niveles de inventario óptimos</p>
                    </div>
                  ) : (
                    products
                      .filter(p => p.stock <= p.minStockAlert)
                      .slice(0, 4)
                      .map((p) => (
                        <div key={p.id} className="p-2.8 bg-red-50/40 rounded-xl border border-red-100 flex items-start justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">{p.name}</h4>
                            <p className="text-[10px] text-gray-500 mt-1">
                              Stock: <span className="font-mono text-red-650 font-bold">{p.stock}</span> / Mínimo: {p.minStockAlert}
                            </p>
                          </div>
                          <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">ALERTA</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Products */}
        {activeTab === 'products' && (
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
                  setShowAddModal(true);
                }}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl select-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Nuevo Producto
              </button>
            </div>

            {/* Edit Product subform */}
            {editingProduct && (
              <motion.div
                className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-sm text-gray-900">
                      Modificar Producto: <span className="text-amber-850 font-black">{editingProduct.name}</span>
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
                      className="w-full px-3 py-1.8 border rounded-lg bg-white font-semibold text-gray-900"
                    >
                      {(storeSettings.categories || []).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Precio Unitario ($)</label>
                    <input
                      type="number"
                      value={frmPrice}
                      onChange={(e) => setFrmPrice(e.target.value)}
                      className="w-full px-3 py-1.8 border rounded-lg bg-white font-mono"
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

                  <div className="md:col-span-4 bg-white/75 p-3.5 rounded-xl border border-gray-150 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="frmOnSaleEdit"
                        checked={frmOnSale}
                        onChange={(e) => setFrmOnSale(e.target.checked)}
                        className="rounded text-indigo-650 focus:ring-indigo-550 w-4 h-4 ml-1"
                      />
                      <label htmlFor="frmOnSaleEdit" className="font-bold text-gray-750 select-none text-[11px] cursor-pointer">
                        ¿Aplicar descuento / rebaja a este producto?
                      </label>
                    </div>
                    {frmOnSale && (
                      <div className="flex items-center gap-4.5 animate-fadeIn">
                        <div className="space-y-1 w-40">
                          <label className="block font-bold text-gray-400 uppercase tracking-widest text-[8px]">
                            % de Descuento
                          </label>
                          <input
                            type="number"
                            placeholder="Ej. 15"
                            min="0"
                            max="100"
                            value={frmDiscountPercent}
                            onChange={(e) => setFrmDiscountPercent(e.target.value)}
                            className="w-full px-2.5 py-1 border bg-white rounded font-mono text-xs"
                          />
                        </div>
                        <div className="text-[10px] text-gray-500 italic mt-3">
                          Precio actual con rebaja: <strong className="text-emerald-705">${(Math.max(1, parseFloat(frmPrice) || 0) * (1 - (Math.max(0, Math.min(100, parseInt(frmDiscountPercent) || 0))) / 100)).toFixed(2)} {storeSettings.currency}</strong>
                        </div>
                      </div>
                    )}
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

            {/* Catalog list table */}
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
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
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
                                <span className="text-[10px] text-gray-400 font-mono italic">{p.id}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-semibold">
                                {p.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-gray-900">
                              {p.onSale && p.saleDiscountPercent && p.saleDiscountPercent > 0 ? (
                                <div className="text-right space-y-0.5">
                                  <div className="text-[10px] text-gray-400 line-through">
                                    {storeSettings.currencySymbol || '$'}{p.price.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-red-600 font-extrabold">
                                    {storeSettings.currencySymbol || '$'}{(p.price * (1 - p.saleDiscountPercent / 100)).toFixed(2)}
                                  </div>
                                  <span className="text-[8px] font-bold px-1 bg-red-50 border border-red-155 text-red-500 rounded">
                                    -{p.saleDiscountPercent}%
                                  </span>
                                </div>
                              ) : (
                                <span className="font-bold">{storeSettings.currencySymbol || '$'}{p.price.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                p.stock === 0 ? 'bg-red-55/6 bg-red-100 text-red-700' :
                                isUnderAlert ? 'bg-amber-100 text-amber-700' : 'text-gray-900 font-medium'
                              }`}>
                                {p.stock} unids
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-gray-500 font-medium">{p.minStockAlert} unids</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => startEditProduct(p)}
                                  className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-amber-700 rounded-lg cursor-pointer"
                                  title="Editar producto"
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
                                  title="Eliminar producto"
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

        {/* Tab: Orders */}
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filter controls toolbar */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {[
                { id: 'All', label: 'Todos los Pedidos' },
                { id: 'Pending', label: 'Pendientes' },
                { id: 'Packed', label: 'Empacados' },
                { id: 'Shipped', label: 'Enviados' },
                { id: 'Delivered', label: 'Entregados' },
                { id: 'Returned', label: 'Devueltos' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setOrderFilter(st.id)}
                  className={`px-3.5 py-1.8 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all ${
                    orderFilter === st.id
                      ? 'bg-gray-905 bg-black text-white'
                      : 'bg-white border text-gray-500 hover:text-gray-900 border-gray-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Orders list table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Pedido ID</th>
                      <th className="py-3 px-4">Datos del Comprador</th>
                      <th className="py-3 px-4 text-center">Unidades</th>
                      <th className="py-3 px-4 text-right font-bold">Total Facturado</th>
                      <th className="py-3 px-4 text-center">Estado actual</th>
                      <th className="py-3 px-4 text-center">Inspección</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                    {orders
                      .filter(o => orderFilter === 'All' || o.status === orderFilter)
                      .map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-gray-900">{o.id}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-900 block leading-tight">{o.buyer?.nombre || 'Comprador'} {o.buyer?.apellidos || 'Anónimo'}</span>
                            <span className="text-[10px] text-gray-450 block mt-0.5 font-sans">
                              Apodo: <strong className="text-gray-600">"{o.buyer?.apodo || 'Cliente'}"</strong> • Tel: {o.buyer?.telefonoCodigo || ''} {o.buyer?.telefonoNum || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full font-bold text-[10px] text-gray-700">
                              {o.items.reduce((acc, i) => acc + i.quantity, 0)} u
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-gray-950">${o.total}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                              o.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                              o.status === 'Packed' ? 'bg-purple-105 text-purple-800' :
                              o.status === 'Shipped' ? 'bg-cyan-100 text-cyan-800' :
                              o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {formatStatusInSpanish(o.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {o.status === 'Pending' && (
                                <button
                                  onClick={() => {
                                    onUpdateOrderStatus(o.id, 'Packed', 'Administrador Principal', 'Pedido verificado y verificado por el Administrador.');
                                    alert(`¡Pedido ${o.id} confirmado con éxito!`);
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer inline-flex items-center gap-0.5"
                                  title="Confirmar y Empacar Pedido"
                                >
                                  Confirmar
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedOrderDetail(o)}
                                className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white rounded-lg text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                              >
                                Detalles
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Employees Management (REQUISITO 2, 5, 9) */}
        {activeTab === 'employees' && (
          <motion.div
            key="employees"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-800">
                  Establecer Cargos y Jerarquías
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Registra trabajadores, define sus claves de acceso y asigna permisos específicos para realizar cambios.
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

            {/* List Employees */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map(emp => (
                <div key={emp.id} className="relative bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-colors">
                  
                  {/* Lock Badge if blocked or unlocked */}
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
                    
                    {/* Secure password notice */}
                    <div className="text-[9.5px] text-gray-400 bg-gray-50 p-1.5 border rounded-lg mt-1 block">
                      🗝️ Hash de Seguridad en BD: 
                      <span className="font-mono text-[8px] truncate block opacity-75">{emp.passwordHash}</span>
                    </div>
                  </div>

                  {/* Permissions table preview */}
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

                  {/* Actions line */}
                  <div className="border-t pt-3 flex flex-wrap gap-2 justify-end">
                    {emp.isLocked && (
                      <button
                        onClick={() => handleUnlockEmployee(emp.id)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin-slow" /> Desbloquear Cuenta
                      </button>
                    )}
                    <button
                      onClick={() => startEditEmployee(emp)}
                      className="px-2.5 py-1 text-[11px] font-bold border hover:bg-gray-50 text-gray-700 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3 h-3" /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cargo Permissions Configuration Editor (REQUISITO: El admin puede cambiar qué permisos lleva cada cargo) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-3xs">
              <div>
                <h3 className="text-sm font-bold text-gray-950 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Configurar Permisos por Cargo de Empleado
                </h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Define cargos personalizados (como Gerente, Despachador, Cajero) y asocia los permisos específicos que posee cada puesto. Al crear un empleado con este cargo, sus autorizaciones se aplicarán de forma automática.
                </p>
              </div>

              {/* Add Cargo form */}
              <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl space-y-3">
                <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider block">Registrar Nuevo Cargo Personalizado</span>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Nombre del Cargo</label>
                    <input
                      type="text"
                      placeholder="Ej. Cajero Principal"
                      id="newCargoName"
                      className="w-full px-3 py-1.8 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-900"
                    />
                  </div>
                  <div className="md:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-2 text-[10px] font-semibold text-gray-750 pb-1.5">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" id="cPermProd" className="rounded text-emerald-650" />
                      <span>Prod. (Catálago)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" id="cPermOrd" className="rounded text-emerald-650" defaultChecked />
                      <span>Ped. (Cola)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" id="cPermSet" className="rounded text-emerald-650" />
                      <span>Tienda (Ajustes)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" id="cPermEmp" className="rounded text-emerald-650" />
                      <span>Empleados</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const nameInput = document.getElementById('newCargoName') as HTMLInputElement;
                      const cName = nameInput?.value.trim();
                      if (!cName) {
                        alert('Por favor ingresa un nombre para el cargo.');
                        return;
                      }
                      const existing = (storeSettings.cargoPermissions || []).find(cp => cp.cargo.toLowerCase() === cName.toLowerCase());
                      if (existing) {
                        alert('Un cargo con este nombre ya existe.');
                        return;
                      }
                      
                      const updatedCP = [
                        ...(storeSettings.cargoPermissions || []),
                        {
                          cargo: cName,
                          manageProducts: (document.getElementById('cPermProd') as HTMLInputElement).checked,
                          manageOrders: (document.getElementById('cPermOrd') as HTMLInputElement).checked,
                          manageSettings: (document.getElementById('cPermSet') as HTMLInputElement).checked,
                          manageEmployees: (document.getElementById('cPermEmp') as HTMLInputElement).checked,
                        }
                      ];
                      
                      onUpdateStoreSettings({
                        ...storeSettings,
                        cargoPermissions: updatedCP
                      });
                      
                      nameInput.value = '';
                      (document.getElementById('cPermProd') as HTMLInputElement).checked = false;
                      (document.getElementById('cPermOrd') as HTMLInputElement).checked = true;
                      (document.getElementById('cPermSet') as HTMLInputElement).checked = false;
                      (document.getElementById('cPermEmp') as HTMLInputElement).checked = false;
                      alert(`¡Cargo "${cName}" creado y guardado con éxito!`);
                    }}
                    className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-transform active:scale-97"
                  >
                    Guardar Nuevo Cargo
                  </button>
                </div>
              </div>

              {/* Cargos List with specific sliders */}
              <div className="space-y-3">
                <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block">Listado de Cargos y Sus Permisos Detallados</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(storeSettings.cargoPermissions || []).map((cp, idx) => {
                    return (
                      <div key={idx} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl space-y-3 relative hover:shadow-xs transition-shadow">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                          <span className="font-extrabold text-xs text-gray-900 bg-white border px-2.5 py-1 rounded-xl block">
                            💼 {cp.cargo}
                          </span>
                          
                          {/* We do not allow deleting built-in Gerente of Miami but can edit them */}
                          {cp.cargo !== 'Gerente' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de que deseas eliminar el cargo "${cp.cargo}"? Los empleados con este cargo mantendrán su cargo pero no tendrán un perfil de permisos modificable.`)) {
                                  const updatedCP = (storeSettings.cargoPermissions || []).filter(c => c.cargo !== cp.cargo);
                                  onUpdateStoreSettings({
                                    ...storeSettings,
                                    cargoPermissions: updatedCP
                                  });
                                }
                              }}
                              className="text-[10px] text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                            >
                              Eliminar Cargo
                            </button>
                          )}
                        </div>

                        {/* Interactive toggle checkboxes for cargo permissions */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={cp.manageProducts}
                              onChange={(e) => {
                                const updatedCP = (storeSettings.cargoPermissions || []).map(item => {
                                  if (item.cargo === cp.cargo) {
                                    return { ...item, manageProducts: e.target.checked };
                                  }
                                  return item;
                                });
                                onUpdateStoreSettings({ ...storeSettings, cargoPermissions: updatedCP });
                              }}
                              className="rounded text-emerald-650 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <span className={cp.manageProducts ? "text-gray-900 font-bold" : "text-gray-400"}>Productos</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={cp.manageOrders}
                              onChange={(e) => {
                                const updatedCP = (storeSettings.cargoPermissions || []).map(item => {
                                  if (item.cargo === cp.cargo) {
                                    return { ...item, manageOrders: e.target.checked };
                                  }
                                  return item;
                                });
                                onUpdateStoreSettings({ ...storeSettings, cargoPermissions: updatedCP });
                              }}
                              className="rounded text-emerald-650 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <span className={cp.manageOrders ? "text-gray-900 font-bold" : "text-gray-400"}>Pedidos (Cola)</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={cp.manageSettings}
                              onChange={(e) => {
                                const updatedCP = (storeSettings.cargoPermissions || []).map(item => {
                                  if (item.cargo === cp.cargo) {
                                    return { ...item, manageSettings: e.target.checked };
                                  }
                                  return item;
                                });
                                onUpdateStoreSettings({ ...storeSettings, cargoPermissions: updatedCP });
                              }}
                              className="rounded text-emerald-650 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <span className={cp.manageSettings ? "text-gray-900 font-bold" : "text-gray-400"}>Ajustes Tienda</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={cp.manageEmployees}
                              onChange={(e) => {
                                const updatedCP = (storeSettings.cargoPermissions || []).map(item => {
                                  if (item.cargo === cp.cargo) {
                                    return { ...item, manageEmployees: e.target.checked };
                                  }
                                  return item;
                                });
                                onUpdateStoreSettings({ ...storeSettings, cargoPermissions: updatedCP });
                              }}
                              className="rounded text-emerald-650 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <span className={cp.manageEmployees ? "text-gray-900 font-bold" : "text-gray-400"}>Personal / Jerarquías</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {/* Tab: Settings (REQUISITOS 6, 7) */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-amber-500" />
                  Ajustes Estructura de la Tienda
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Aquí puedes editar la información general de la tienda. Los datos modificados se mostrarán dinámicamente en el pie de página de la web.
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
                    className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 transition-transform active:scale-98"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Parámetros de Tienda
                  </button>
                </div>
              </form>
            </div>

            {/* Box 2: Categories Management (NUEVO REQUISITO) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-3xs">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-amber-500" />
                  Mantenimiento de Categorías
                </h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Agrega, edita, renombra o elimina categorías generales de productos para organizar tu catálogo en tiempo real.
                </p>
              </div>

              {/* Create Category form */}
              <div className="space-y-2 border-b pb-4.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Crear Nueva Categoría</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. Dulces y Postres"
                    id="newCatInput"
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          if (storeSettings.categories.includes(val)) {
                            alert('La categoría ya existe.');
                            return;
                          }
                          onUpdateStoreSettings({
                            ...storeSettings,
                            categories: [...storeSettings.categories, val]
                          });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('newCatInput') as HTMLInputElement;
                      const val = input?.value.trim();
                      if (val) {
                        if (storeSettings.categories.includes(val)) {
                          alert('La categoría ya existe.');
                          return;
                        }
                        onUpdateStoreSettings({
                          ...storeSettings,
                          categories: [...storeSettings.categories, val]
                        });
                        input.value = '';
                      }
                    }}
                    className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-lg text-xs cursor-pointer shrink-0 transition-all active:scale-95"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Categories list */}
              <div className="space-y-2 font-sans max-h-80 overflow-y-auto">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Categorías Activas</label>
                {storeSettings.categories.length === 0 ? (
                  <div className="text-xs text-gray-450 italic">No hay categorías configuradas.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {storeSettings.categories.map((cat, idx) => {
                      return (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-850 hover:text-indigo-600 transition-colors">{cat}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const newVal = prompt('Ingresa el nuevo nombre para la categoría:', cat);
                                if (newVal && newVal.trim() && newVal.trim() !== cat) {
                                  const renameVal = newVal.trim();
                                  if (storeSettings.categories.includes(renameVal)) {
                                    alert('Ya existe una categoría con ese nombre.');
                                    return;
                                  }
                                  const updatedCats = storeSettings.categories.map(c => c === cat ? renameVal : c);
                                  onUpdateStoreSettings({
                                    ...storeSettings,
                                    categories: updatedCats
                                  });
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-800 font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              Renombrar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de que deseas eliminar la categoría "${cat}"? En caso de haber productos asignados, estos mantendrán su categoría actual pero no se podrán asociar otros.`)) {
                                  const updatedCats = storeSettings.categories.filter(c => c !== cat);
                                  onUpdateStoreSettings({
                                    ...storeSettings,
                                    categories: updatedCats
                                  });
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] bg-red-50 hover:bg-red-100 text-red-650 font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
          </motion.div>
        )}

        {/* Tab: Social Networks Enable/Disable (REQUISITO 4) */}
        {activeTab === 'social' && (
          <motion.div
            key="social"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 max-w-xl">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-indigo-550" />
                  Habilitar / Deshabilitar Iconos de Plataformas
                </h3>
                <p className="text-xs text-gray-450 mt-1 leading-relaxed">
                  Configura cuáles iconos de contacto se habilitarán públicamente. Cuando estén activos, los clientes podrán hacer clic en ellos para ser redirigidos automáticamente a tus perfiles oficiales.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {(storeSettings.socialLinks || []).map((link) => {
                  return (
                    <div key={link.id} className="p-4 bg-gray-55 border border-gray-150 rounded-2xl space-y-3.5 transition-shadow hover:shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-xs flex items-center gap-2">
                          {link.platform === 'WhatsApp' && <span className="p-1 px-1.5 bg-emerald-50 text-emerald-600 rounded-md font-bold text-[10px]">WA</span>}
                          {link.platform === 'Instagram' && <span className="p-1 px-1.5 bg-pink-50 text-pink-600 rounded-md font-bold text-[10px]">IG</span>}
                          {link.platform === 'Facebook' && <span className="p-1 px-1.5 bg-blue-50 text-blue-600 rounded-md font-bold text-[10px]">FB</span>}
                          {link.platform === 'Telegram' && <span className="p-1 px-1.5 bg-sky-50 text-sky-500 rounded-md font-bold text-[10px]">TG</span>}
                          {link.platform === 'Email' && <span className="p-1 px-1.5 bg-indigo-50 text-indigo-650 rounded-md font-bold text-[10px]">MAIL</span>}
                          {link.platform === 'Web' && <span className="p-1 px-1.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">WEB</span>}
                          Canal Oficial de {link.platform}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const updatedLinks = (storeSettings.socialLinks || []).map(sl => {
                              if (sl.id === link.id) {
                                return { ...sl, enabled: !sl.enabled };
                              }
                              return sl;
                            });
                            onUpdateStoreSettings({
                              ...storeSettings,
                              socialLinks: updatedLinks
                            });
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-colors ${
                            link.enabled
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-250'
                          }`}
                        >
                          {link.enabled ? '✓ Habilitado' : '✗ Deshabilitado'}
                        </button>
                      </div>

                      {link.enabled ? (
                        <div className="space-y-1.5 animate-fadeIn">
                          <label className="block text-[9px] font-bold text-gray-450 uppercase tracking-wider">Dirección de Redireccionamiento (Enlace URL)</label>
                          <input
                            type="text"
                            value={link.url}
                            onChange={(e) => {
                              const updatedLinks = (storeSettings.socialLinks || []).map(sl => {
                                if (sl.id === link.id) {
                                  return { ...sl, url: e.target.value };
                                }
                                return sl;
                              });
                              onUpdateStoreSettings({
                                ...storeSettings,
                                socialLinks: updatedLinks
                              });
                            }}
                            placeholder={link.platform === 'Email' ? 'mailto:correo@detienda.com' : `https://${link.platform.toLowerCase()}.com/tu_cuenta`}
                            className="w-full px-3 py-1.8 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-400 italic">El botón de este canal está deshabilitado en el pie de página de la tienda.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Real-time logs auditing */}
        {activeTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                  Bitácora de Eventos de Trabajadores Autorizados
                </h3>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded font-bold font-mono">
                  Registros: {employeeLogs.length}
                </span>
              </div>

              {employeeLogs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No se registran eventos laborales en la bitácora.</p>
              ) : (
                <div className="relative border-l border-gray-200 pl-4 space-y-5 ml-2 py-2">
                  {employeeLogs.map((log) => (
                    <div key={log.id} className="relative text-xs">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-gray-950 flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.2 bg-indigo-50 border border-indigo-150 text-indigo-805 font-bold rounded text-[9px]">
                            {log.employeeName}
                          </span>
                          {log.action}
                        </span>
                        <span className="text-[9.5px] text-gray-400 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-gray-500 bg-gray-50 p-2 border border-gray-100 rounded-lg leading-relaxed max-w-2xl mt-1">
                          {log.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab: Shifts (REQUISITO 13) */}
        {activeTab === 'shifts' && (
          <motion.div
            key="shifts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                    Asistencia Laboral (Entradas y Salidas)
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Historial cronológico de reporte de entrada y salida de los empleados de la tienda.
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded font-bold font-mono">
                  Reportes: {shiftLogs.length}
                </span>
              </div>

              {shiftLogs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No se registran marcas de asistencia en la base de datos.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-widest text-[9px] bg-gray-50/50">
                        <th className="py-2.5 px-3">Empleado</th>
                        <th className="py-2.5 px-3">Suceso</th>
                        <th className="py-2.5 px-3">Fecha y Hora</th>
                        <th className="py-2.5 px-3">Puesto / Cargo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {shiftLogs.map((log) => {
                        const matchedEmp = employees.find(e => e.id === log.employeeId);
                        const isEntrada = log.type === 'Entrada';
                        return (
                          <tr key={log.id} className="hover:bg-gray-50/30">
                            <td className="py-3 px-3 font-bold text-gray-900">{log.employeeName}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase ${
                                isEntrada ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                              }`}>
                                {isEntrada ? '📥 Entrada (Reloj Iniciador)' : '📤 Salida (Reloj Final)'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-gray-600">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="py-3 px-3 text-gray-500 italic">{matchedEmp?.cargo || 'Trabajador de Piso'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab: Security Alerts (REQUISITO 14) */}
        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
                    Historial de Alertas de Seguridad
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Auditoría de eventos críticos, intentos de accesos erróneos e inhabilitación por clave.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-750 text-[10px] rounded font-bold font-mono">
                    Incidentes: {securityAlerts.length}
                  </span>
                  {securityAlerts.length > 0 && (
                    <button
                      onClick={onClearSecurityAlerts}
                      className="text-red-600 hover:text-red-700 font-bold text-[10.5px] border border-red-100 hover:border-red-200 px-2.5 py-1 rounded-xl bg-red-50/50 cursor-pointer"
                    >
                      Limpiar Todo
                    </button>
                  )}
                </div>
              </div>

              {securityAlerts.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-emerald-600">¡Ningún riesgo detectado! Todo el sistema se encuentra seguro.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {securityAlerts.map((alert) => {
                    const isResolved = alert.resolved;
                    const isLock = alert.type === 'Bloqueo' || alert.type === 'AccesoNoAutorizado';
                    return (
                      <div
                        key={alert.id}
                        className={`p-3.5 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 duration-150 ${
                          isResolved 
                            ? 'bg-gray-50/40 border-gray-250 text-gray-400' 
                            : isLock 
                              ? 'bg-red-50/30 border-red-150 text-gray-800' 
                              : 'bg-amber-50/20 border-amber-150 text-gray-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isResolved ? 'text-gray-300' : isLock ? 'text-red-500' : 'text-amber-500'}`} />
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[8.5px] uppercase ${
                                isResolved ? 'bg-gray-200 text-gray-500' : isLock ? 'bg-red-150 text-red-700' : 'bg-amber-150 text-amber-700'
                              }`}>
                                {alert.type}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {new Date(alert.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs font-medium leading-relaxed">{alert.details}</p>
                          </div>
                        </div>

                        {!isResolved && (
                          <button
                            onClick={() => onResolveSecurityAlert(alert.id)}
                            className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 hover:text-white border border-emerald-200 hover:bg-emerald-600 bg-white rounded-lg cursor-pointer duration-150 shrink-0 self-end sm:self-center"
                          >
                            ✓ Marcar como Revisado
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over product creator modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
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
                  <h3 className="font-black text-base text-gray-900 leading-tight">Agregar Nuevo Producto Tradicional</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
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
                    {(storeSettings.categories || []).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
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

                <div className="col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-150 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="frmOnSale"
                      checked={frmOnSale}
                      onChange={(e) => setFrmOnSale(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <label htmlFor="frmOnSale" className="font-bold text-gray-750 select-none text-[11px] cursor-pointer">
                      ¿Aplicar descuento / rebaja a este producto?
                    </label>
                  </div>
                  {frmOnSale && (
                    <div className="flex items-center gap-3 animate-fadeIn">
                      <div className="space-y-1 w-40">
                        <label className="block font-bold text-gray-400 uppercase tracking-widest text-[8px]">
                          % de Descuento
                        </label>
                        <input
                          type="number"
                          placeholder="Ej. 15"
                          min="0"
                          max="100"
                          value={frmDiscountPercent}
                          onChange={(e) => setFrmDiscountPercent(e.target.value)}
                          className="w-full px-2.5 py-1 border bg-white rounded font-mono text-xs"
                        />
                      </div>
                      <div className="text-[10px] text-gray-500 italic mt-3">
                        Precio con rebaja: <strong className="text-emerald-700">${(Math.max(1, parseFloat(frmPrice) || 0) * (1 - (Math.max(0, Math.min(100, parseInt(frmDiscountPercent) || 0))) / 100)).toFixed(2)} {storeSettings.currency}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-2 flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
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

      {/* Slide-over employee manager modal */}
      <AnimatePresence>
        {showEmployeeModal && (
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

              <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs font-sans">
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
                    <label className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">Cargo en la Empresa</label>
                    <select
                      value={empCargo}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmpCargo(val);
                        // Auto-apply specific permissions from storeSettings.cargoPermissions
                        const matched = (storeSettings.cargoPermissions || []).find(cp => cp.cargo === val);
                        if (matched) {
                          setPermProducts(matched.manageProducts);
                          setPermOrders(matched.manageOrders);
                          setPermSettings(matched.manageSettings);
                          setPermEmployees(matched.manageEmployees);
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white text-gray-900 font-bold"
                      required
                    >
                      <option value="" disabled>Seleccione un Cargo...</option>
                      {(storeSettings.cargoPermissions || []).map(cp => (
                        <option key={cp.cargo} value={cp.cargo}>{cp.cargo}</option>
                      ))}
                    </select>
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
                      <span className="text-[8px] text-gray-405 italic">Se almacena de forma segura usando hash criptográfico SHA-250</span>
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
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[9px] uppercase tracking-widest text-indigo-805 block">Permisos del Cargo Seleccionado:</span>
                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Vinculado</span>
                  </div>
                  <p className="text-[9.5px] text-gray-400 mt-1 leading-relaxed">
                    ⚙️ Los permisos de acceso están pre-calculados a partir de la definición oficial del <strong>Cargo</strong> seleccionado. El Administrador puede editarlos directamente desde la lista de cargos.
                  </p>
                  
                  <div className="space-y-2 text-[11.5px] leading-relaxed opacity-85 select-none font-sans">
                    <label className="flex items-center gap-2 cursor-not-allowed">
                      <input
                        type="checkbox"
                        checked={permProducts}
                        disabled
                        className="w-4 h-4 rounded text-indigo-501 bg-gray-100 cursor-not-allowed opacity-75"
                      />
                      <span className="text-gray-500"><strong>Gestionar Productos:</strong> Agregar, editar, reabastecer y eliminar productos.</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-not-allowed">
                      <input
                        type="checkbox"
                        checked={permOrders}
                        disabled
                        className="w-4 h-4 rounded text-indigo-501 bg-gray-100 cursor-not-allowed opacity-75"
                      />
                      <span className="text-gray-500"><strong>Gestionar Pedidos:</strong> Procesar despachos de clientes y avanzar estados de logística.</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-not-allowed">
                      <input
                        type="checkbox"
                        checked={permSettings}
                        disabled
                        className="w-4 h-4 rounded text-indigo-501 bg-gray-100 cursor-not-allowed opacity-75"
                      />
                      <span className="text-gray-500"><strong>Gestionar Ajustes:</strong> Modificar nombres de sucursal, teléfonos y dirección física (Ajustes).</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-not-allowed">
                      <input
                        type="checkbox"
                        checked={permEmployees}
                        disabled
                        className="w-4 h-4 rounded text-indigo-501 bg-gray-100 cursor-not-allowed opacity-75"
                      />
                      <span className="text-gray-500"><strong>Gestionar Empleados:</strong> Alta/Baja de personal, claves de olvido y desbloqueos.</span>
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

      {/* Dynamic Detail Modal Auditing orders */}
      <AnimatePresence>
        {selectedOrderDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-100 max-w-2xl w-full p-6 shadow-2xl relative space-y-6 text-xs text-gray-750"
            >
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                  Auditoría Completa de Facturación: {selectedOrderDetail.id}
                </h3>
                <span className="text-[10px] font-mono text-gray-450">
                  Emitido: {new Date(selectedOrderDetail.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Form buyer details showing all specified fields (Requisito 11) */}
                <div className="space-y-4">
                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-150 space-y-2.5">
                    <h4 className="font-extrabold text-gray-800 uppercase tracking-widest text-[9.5px]">
                      Ficha de Registro del Comprador
                    </h4>
                    <div className="space-y-1 text-[11.5px] leading-relaxed">
                      <p>👤 <strong>Cliente:</strong> {selectedOrderDetail.buyer?.nombre || 'Comprador'} {selectedOrderDetail.buyer?.apellidos || 'Anónimo'}</p>
                      <p>🏷️ <strong>Apodo:</strong> "{selectedOrderDetail.buyer?.apodo || 'Cliente'}"</p>
                      <p>📞 <strong>Teléfono:</strong> <span className="font-mono">{selectedOrderDetail.buyer?.telefonoCodigo || ''} {selectedOrderDetail.buyer?.telefonoNum || 'N/A'}</span></p>
                      <p>📍 <strong>Dirección de Entrega:</strong> <span className="font-medium italic text-gray-700">"{selectedOrderDetail.buyer?.direccion || 'N/A'}"</span></p>
                    </div>

                    {/* Recipient check if active (Requisito 11 subopción) */}
                    {selectedOrderDetail.buyer?.recibeOtraPersona ? (
                      <div className="mt-3 pt-3 border-t border-gray-250 bg-amber-50/40 p-3 rounded-lg border border-amber-140/50 space-y-1">
                        <span className="text-[9px] font-extrabold text-amber-805 uppercase tracking-wider block mb-1">🎁 Recibe otra persona autorizada:</span>
                        <p>👤 <strong>Nombre:</strong> {selectedOrderDetail.buyer?.otraNombre || 'José Pérez'}</p>
                        <p>🏷️ <strong>Apodo:</strong> "{selectedOrderDetail.buyer?.otraApodo || 'Pepito'}"</p>
                        <p>📞 <strong>Contacto:</strong> <span className="font-mono">{selectedOrderDetail.buyer?.otraTelefonoCodigo || '+1'} {selectedOrderDetail.buyer?.otraTelefonoNum || '3055557711'}</span></p>
                      </div>
                    ) : (
                      <div className="text-[9px] text-emerald-700 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100 mt-2">
                        ✓ El comprador original recibirá la compra en persona.
                      </div>
                    )}
                  </div>

                  {/* Items list */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-800 uppercase tracking-widest text-[9px]">
                      Contenido del Pedido
                    </h4>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {selectedOrderDetail.items.map((item) => (
                        <div key={item.productId} className="flex justify-between items-center p-2 bg-gray-50 border rounded-lg text-[11.5px]">
                          <div>
                            <span className="font-extrabold text-gray-900">{item.name}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">Precio Unitario: ${item.price}</span>
                          </div>
                          <span className="font-mono font-bold text-gray-800">
                            {item.quantity} u. = ${item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Audit & Override */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 space-y-2">
                    <h4 className="font-bold text-gray-850 uppercase tracking-wider text-[9px]">
                      Bitácora de Logística del Pedido
                    </h4>
                    <div className="space-y-3.5 max-h-40 overflow-y-auto pr-1 text-[11px]">
                      {selectedOrderDetail.history.map((h, idx) => (
                        <div key={idx} className="relative border-l pl-3 ml-1 pb-1">
                          <span className="absolute -left-[16px] top-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <div className="flex justify-between">
                            <span className="font-bold text-gray-950">{formatStatusInSpanish(h.status)}</span>
                            <span className="text-[8px] text-gray-400 font-mono">{new Date(h.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-450 font-mono text-[8.5px] mt-0.2">Operador: {h.updatedBy}</p>
                          {h.note && <p className="text-gray-650 italic mt-0.5 font-semibold">"{h.note}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Root Admin Status Override */}
                  <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2.5">
                    <span className="text-[9.5px] uppercase font-bold text-amber-900 flex items-center gap-1">
                      Anulación para Administradores
                    </span>

                    <input
                      type="text"
                      placeholder="Ej. Anulación de seguridad - Forzar estado"
                      value={adminStatusNote}
                      onChange={(e) => setAdminStatusNote(e.target.value)}
                      className="w-full px-2.8 py-1.8 bg-white border border-amber-205 rounded-lg text-xs"
                    />

                    <div className="flex flex-wrap gap-1.5">
                      {['Pending', 'Packed', 'Shipped', 'Delivered', 'Returned'].map((st) => (
                        <button
                          key={st}
                          onClick={() => handleAdminStatusOverride(st as OrderStatus)}
                          className="px-2 py-1 bg-white hover:bg-amber-100/60 text-[10px] font-bold border border-amber-200 text-amber-800 rounded cursor-pointer transition-colors"
                        >
                          {formatStatusInSpanish(st)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
