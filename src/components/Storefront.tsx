import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ShoppingBag, ArrowRight, Minus, Plus, Trash2, 
  ChevronRight, Info, CheckCircle, ShoppingCart, X, AlertTriangle, Phone, MapPin, Smile, Gift,
  Facebook, Instagram, Send, Mail, Globe
} from 'lucide-react';
import { Product, Order, BuyerDetails, OrderItem, StoreSettings } from '../types';
import { CATEGORIES } from '../data';

interface StorefrontProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
  cart: { product: Product; quantity: number }[];
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  isCartOpen: boolean;
  onCloseCart: () => void;
  // Checkout callback updated to support Spanish BuyerDetails block (Requisito 11)
  onCheckout: (buyer: BuyerDetails) => Order | null;
  storeSettings: StoreSettings;
}

export default function Storefront({
  products,
  onAddToCart,
  cart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  isCartOpen,
  onCloseCart,
  onCheckout,
  storeSettings,
}: StorefrontProps) {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailQty, setDetailQty] = useState(1);

  // Requisito 11: Checkout Form States
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefonoCodigo, setTelefonoCodigo] = useState('+1');
  const [telefonoNum, setTelefonoNum] = useState('');
  const [direccion, setDireccion] = useState('');
  const [apodo, setApodo] = useState('');

  // Option for alternative recipient variables (recibe otra persona)
  const [recibeOtraPersona, setRecibeOtraPersona] = useState(false);
  const [otraNombre, setOtraNombre] = useState('');
  const [otraApellidos, setOtraApellidos] = useState('');
  const [otraTelefonoCodigo, setOtraTelefonoCodigo] = useState('+1');
  const [otraTelefonoNum, setOtraTelefonoNum] = useState('');
  const [otraDireccion, setOtraDireccion] = useState('');
  const [otraApodo, setOtraApodo] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccessOrder, setCheckoutSuccessOrder] = useState<Order | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [isConfirmingCheckout, setIsConfirmingCheckout] = useState(false);

  const handleCloseCartLocal = () => {
    setIsConfirmingCheckout(false);
    onCloseCart();
  };

  // Filtering
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

  const handleOpenProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setDetailQty(1);
    setCheckoutError('');
  };

  const handleDetailsAddToCart = () => {
    if (selectedProduct) {
      onAddToCart(selectedProduct, detailQty);
      setSelectedProduct(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    // Requisito 11 checks
    if (!nombre.trim() || !apellidos.trim() || !telefonoNum.trim() || !direccion.trim() || !apodo.trim()) {
      setCheckoutError('Por favor complete todos sus datos de comprador requeridos.');
      return;
    }

    if (recibeOtraPersona) {
      if (!otraNombre.trim() || !otraApellidos.trim() || !otraTelefonoNum.trim() || !otraDireccion.trim() || !otraApodo.trim()) {
        setCheckoutError('Por favor especifique el nombre, apellidos, teléfono, dirección y apodo de la persona que recibirá el pedido.');
        return;
      }
    }

    if (cart.length === 0) {
      setCheckoutError('El carrito de compras está vacío.');
      return;
    }

    // Verify stock levels in real-time
    const outOfStockItems: string[] = [];
    cart.forEach((item) => {
      if (item.quantity > item.product.stock) {
        outOfStockItems.push(`${item.product.name} (Restante en stock: ${item.product.stock})`);
      }
    });

    if (outOfStockItems.length > 0) {
      setCheckoutError(`¡Disponibilidad modificada! No es posible despachar: ${outOfStockItems.join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    const buyerData: BuyerDetails = {
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      telefonoCodigo,
      telefonoNum: telefonoNum.trim(),
      direccion: direccion.trim(),
      apodo: apodo.trim(),
      recibeOtraPersona,
      otraNombre: recibeOtraPersona ? otraNombre.trim() : undefined,
      otraApellidos: recibeOtraPersona ? otraApellidos.trim() : undefined,
      otraTelefonoCodigo: recibeOtraPersona ? otraTelefonoCodigo : undefined,
      otraTelefonoNum: recibeOtraPersona ? otraTelefonoNum.trim() : undefined,
      otraDireccion: recibeOtraPersona ? otraDireccion.trim() : undefined,
      otraApodo: recibeOtraPersona ? otraApodo.trim() : undefined,
    };

    setTimeout(() => {
      const newOrder = onCheckout(buyerData);
      setIsSubmitting(false);
      if (newOrder) {
        setCheckoutSuccessOrder(newOrder);
        // Clear checkout form
        setNombre('');
        setApellidos('');
        setTelefonoNum('');
        setDireccion('');
        setApodo('');
        setRecibeOtraPersona(false);
        setOtraNombre('');
        setOtraApellidos('');
        setOtraTelefonoNum('');
        setOtraDireccion('');
        setOtraApodo('');
        handleCloseCartLocal();
      } else {
        setCheckoutError('Ocurrió un error consolidando el despacho del pedido.');
      }
    }, 1000);
  };

  return (
    <div className="relative min-h-screen bg-gray-50/50 pb-20 text-gray-800">
      {/* Hero Banner in Spanish and Store Name */}
      <div className="bg-slate-900 text-white px-6 py-12 md:py-18 text-center relative overflow-hidden">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        <div className="max-w-2xl mx-auto relative z-10 space-y-4">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] tracking-widest font-mono uppercase bg-emerald-500/10 border border-emerald-400/20 px-3 py-1 rounded-full text-emerald-450 font-bold"
          >
            Sabor y Tradición de Little Havana
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black tracking-tight text-white font-sans"
          >
            {storeSettings.storeName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-350 text-xs md:text-sm leading-relaxed max-w-lg mx-auto"
          >
            Ordena cafeteras tradicionales, la mejor indumentaria de lino fresco, juegos de dominó tallados en madera de cedro de Little Havana y más accesorios emblemáticos.
          </motion.p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10 space-y-8">
        {/* Search & Tabs Row */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Category Tabs in Spanish */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {['Todos', ...(storeSettings.categories || [])].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-gray-950 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar in Spanish */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.2 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-[10px] text-gray-400 font-bold hover:text-black hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-150 p-16 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">No encontramos resultados</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              No se localizaron artículos para "{searchQuery}". Intente con una palabra clave diferente o explore otra categoría.
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock === 0;
                const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={product.id}
                    className="group bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300"
                  >
                    {/* Image Area */}
                    <div 
                      className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer" 
                      onClick={() => handleOpenProductDetails(product)}
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Floating Stock Badges */}
                      {isOutOfStock ? (
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-red-650 bg-red-700 text-red-50 text-[9px] font-bold uppercase tracking-wider rounded-md">
                          Agotado
                        </div>
                      ) : isLowStock ? (
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                          ¡Últimas {product.stock} unids!
                        </div>
                      ) : (
                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/45 backdrop-blur-md text-white/90 text-[8.5px] font-mono tracking-wider uppercase rounded">
                          {product.category}
                        </div>
                      )}
                    </div>

                    {/* Meta info block */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4 font-sans">
                      <div className="space-y-1.5 cursor-pointer" onClick={() => handleOpenProductDetails(product)}>
                        <h3 className="font-bold text-xs text-gray-900 group-hover:text-black line-clamp-1 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-col">
                          {product.onSale && product.saleDiscountPercent && product.saleDiscountPercent > 0 ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="bg-red-50 text-red-600 font-bold px-1 py-0.2 rounded text-[8.5px]">
                                  {product.saleDiscountPercent}% REBAJA
                                </span>
                                <span className="text-gray-400 line-through text-[10px]">
                                  {storeSettings.currencySymbol || '$'}{product.price.toFixed(2)}
                                </span>
                              </div>
                              <span className="font-extrabold text-xs text-slate-900">
                                {storeSettings.currencySymbol || '$'}{(product.price * (1 - product.saleDiscountPercent / 100)).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-black text-sm text-gray-900">
                              {storeSettings.currencySymbol || '$'}{product.price.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <button
                          disabled={isOutOfStock}
                          onClick={() => onAddToCart(product, 1)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            isOutOfStock
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-950 hover:bg-black text-white'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Agregar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Sliding Shopping Cart Drawer Overlay (Spanish terms with detailed item totals - Requisito 11) */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop click off */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCartLocal}
              className="absolute inset-0 bg-black/55 backdrop-blur-xs"
            />
            
            {/* Sidebar box */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute right-0 top-0 bottom-0 max-w-md w-full bg-white shadow-2xl flex flex-col border-l border-gray-100 font-sans"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-150 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-gray-900" />
                  <h3 className="font-bold text-gray-950 text-sm">Tu Bolsa de Compras</h3>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full">
                    {cart.reduce((s, i) => s + i.quantity, 0)} items
                  </span>
                </div>
                <button
                  onClick={handleCloseCartLocal}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List (Displays product total and quantity - Requisito 11) */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">El carrito está vacío</h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                        Explora nuestro catálogo tradicional para agregar excelentes souvenirs o prendas a tu gusto.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Visual notice representing item names and totals */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10.5px] text-slate-600">
                      📝 Tu pedido actual muestra los montos desglosados y totales individuales para cada producto.
                    </div>

                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex gap-4 p-3 rounded-xl border border-gray-150 bg-gray-50/50 hover:bg-gray-50 transition-colors text-xs"
                      >
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
                        />
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-bold text-slate-900 line-clamp-1">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={() => onRemoveFromCart(item.product.id)}
                              className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer hover:bg-white rounded transition-colors"
                              title="Remover artículo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            {/* Product unit total details (Requisito 11) */}
                            <span className="font-extrabold text-xs text-slate-805">
                              {item.quantity} × ${item.product.price} = <strong className="text-gray-900 font-black">${item.product.price * item.quantity}</strong>
                            </span>

                            {/* Quantity Controls */}
                            <div className="flex items-center border border-gray-200 bg-white rounded-lg select-none">
                              <button
                                onClick={() => onUpdateCartQuantity(item.product.id, item.quantity - 1)}
                                className="p-1 text-gray-500 hover:text-black cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-xs font-mono font-bold">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateCartQuantity(item.product.id, item.quantity + 1)}
                                className="p-1 text-gray-500 hover:text-black cursor-pointer"
                                disabled={item.quantity >= item.product.stock}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {item.quantity >= item.product.stock && (
                            <span className="text-[9px] text-amber-600 block mt-1">
                              Límite máximo disponible alcanzado
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Summary & checkout (Spanish Form with precise data structures - Requisito 11) */}
              {cart.length > 0 && (
                <div className="border-t border-gray-150 p-5 bg-gray-50 space-y-4 max-h-[480px] overflow-y-auto">
                  <div className="space-y-1 text-xs text-slate-600 leading-normal">
                    <div className="flex justify-between">
                      <span>Monto Subtotal</span>
                      <span className="font-bold text-gray-950">${cartTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entrega a Domicilio</span>
                      <span className="text-emerald-700 font-bold">GRATUITO</span>
                    </div>
                    <div className="border-t border-gray-200 pt-1.5 flex justify-between text-xs font-extrabold text-gray-900">
                      <span>Total Neto</span>
                      <span className="font-black text-sm text-gray-950">${cartTotal}</span>
                    </div>
                  </div>

                  {/* Formulario de Checkout (Requisito 11) */}
                  <form onSubmit={handleFormSubmit} className="space-y-3.5 pt-2 font-sans text-xs">
                    <div className="border-b pb-1.5 flex items-center gap-1.5 text-slate-900 font-extrabold tracking-tight">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <h4>Datos de Registro de Facturación</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nombre</label>
                        <input
                          type="text"
                          placeholder="Ej. Carlos"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          className="w-full px-3 py-1.8 border border-gray-200 rounded-lg text-xs bg-white"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Apellidos</label>
                        <input
                          type="text"
                          placeholder="Ej. Rodríguez"
                          value={apellidos}
                          onChange={(e) => setApellidos(e.target.value)}
                          className="w-full px-3 py-1.8 border border-gray-200 rounded-lg text-xs bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cód. País</label>
                        <select
                          value={telefonoCodigo}
                          onChange={(e) => setTelefonoCodigo(e.target.value)}
                          className="w-full px-3 py-1.8 border border-gray-200 rounded-lg text-xs bg-white"
                        >
                          <option value="+1">+1 (EUA/Miami)</option>
                          <option value="+53">+53 (Cuba)</option>
                          <option value="+34">+34 (España)</option>
                          <option value="+52">+52 (México)</option>
                          <option value="+57">+57 (Colombia)</option>
                        </select>
                      </div>

                      <div className="col-span-2 space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Teléfono de Contacto</label>
                        <input
                          type="tel"
                          placeholder="Ej. 3055550241"
                          value={telefonoNum}
                          onChange={(e) => setTelefonoNum(e.target.value)}
                          className="w-full px-3 py-1.8 border border-gray-200 rounded-lg text-xs bg-white font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1 col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Apodo del Comprador</label>
                        <input
                          type="text"
                          placeholder="Ej. Carlitos"
                          value={apodo}
                          onChange={(e) => setApodo(e.target.value)}
                          className="w-full px-3 py-1.8 border border-gray-200 rounded-lg text-xs bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dirección de Despacho Física</label>
                      <textarea
                        placeholder="Escriba su dirección completa en Miami o alrededores..."
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-1.8 border border-gray-200 rounded-lg text-xs bg-white resize-none"
                        required
                      />
                    </div>

                    {/* Requisito 11: Option showing "la compra la recibira otra persona" */}
                    <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={recibeOtraPersona}
                          onChange={(e) => setRecibeOtraPersona(e.target.checked)}
                          className="w-4.5 h-4.5 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-800">¿La compra la recibirá otra persona en su lugar?</span>
                      </label>

                      {recibeOtraPersona && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="space-y-3 pt-2.5 border-t border-gray-150"
                        >
                          <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50/50 px-2 py-0.5 rounded block">
                            🎁 Datos Necesarios del Destinatario Alterno:
                          </span>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <label className="block text-[9px] font-bold text-gray-400">Nombre</label>
                              <input
                                type="text"
                                placeholder="Ej. José"
                                value={otraNombre}
                                onChange={(e) => setOtraNombre(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded bg-gray-50 focus:bg-white text-xs"
                                required={recibeOtraPersona}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[9px] font-bold text-gray-400">Apellidos</label>
                              <input
                                type="text"
                                placeholder="Ej. Pérez"
                                value={otraApellidos}
                                onChange={(e) => setOtraApellidos(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded bg-gray-50 focus:bg-white text-xs"
                                required={recibeOtraPersona}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1.5">
                              <label className="block text-[9px] font-bold text-gray-400">Cód. País</label>
                              <select
                                value={otraTelefonoCodigo}
                                onChange={(e) => setOtraTelefonoCodigo(e.target.value)}
                                className="w-full px-2 py-1.5 border rounded bg-gray-50 text-xs"
                              >
                                <option value="+1">+1</option>
                                <option value="+53">+53</option>
                                <option value="+34">+34</option>
                              </select>
                            </div>

                            <div className="col-span-2 space-y-1.5">
                              <label className="block text-[9px] font-bold text-gray-400">Teléfono</label>
                              <input
                                type="tel"
                                placeholder="Ej. 3055557711"
                                value={otraTelefonoNum}
                                onChange={(e) => setOtraTelefonoNum(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded bg-gray-50 focus:bg-white text-xs font-mono"
                                required={recibeOtraPersona}
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[9px] font-bold text-gray-400">Dirección donde Recibirá</label>
                            <textarea
                              placeholder="Escriba la dirección de entrega de esta otra persona..."
                              value={otraDireccion}
                              onChange={(e) => setOtraDireccion(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-1.5 border rounded bg-gray-50 focus:bg-white text-xs resize-none"
                              required={recibeOtraPersona}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[9px] font-bold text-gray-400">Apodo o Sobrenombre</label>
                            <input
                              type="text"
                              placeholder="Ej. Pepito"
                              value={otraApodo}
                              onChange={(e) => setOtraApodo(e.target.value)}
                              className="w-full px-3 py-1.5 border rounded bg-gray-50 focus:bg-white text-xs"
                              required={recibeOtraPersona}
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {checkoutError && (
                      <div className="p-2.5 bg-red-50 border border-red-105 text-red-700 rounded-lg text-[10.5px] leading-relaxed flex items-start gap-1">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                        <span>{checkoutError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.8 bg-gray-950 text-white font-extrabold rounded-xl text-xs hover:bg-black active:scale-98 cursor-pointer select-none transition-transform flex items-center justify-center gap-1.5 bg-emerald-650 hover:bg-emerald-700"
                    >
                      {isSubmitting ? (
                        <>Procesando Conexión de Pago Segura...</>
                      ) : (
                        <>
                          Confirmar Pedido y Enviar • ${cartTotal}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl border border-gray-100 max-w-2xl w-full overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row font-sans"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-500 hover:text-black cursor-pointer shadow"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Image side */}
              <div className="md:w-1/2 aspect-square md:aspect-auto md:h-full relative bg-gray-100">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Detail side */}
              <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between space-y-6 text-xs">
                <div className="space-y-4">
                  <div>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono">
                      {selectedProduct.category}
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900 mt-2 tracking-tight">
                      {selectedProduct.name}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                        Precio de Venta
                      </span>
                      {selectedProduct.onSale && selectedProduct.saleDiscountPercent && selectedProduct.saleDiscountPercent > 0 ? (
                        <div className="space-y-0.5">
                          <span className="text-xs bg-red-100 text-red-650 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide inline-block mr-1.5">
                            {selectedProduct.saleDiscountPercent}% REBAJA
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {storeSettings.currencySymbol || '$'}{selectedProduct.price.toFixed(2)}
                          </span>
                          <div className="text-xl font-black text-emerald-700">
                            {storeSettings.currencySymbol || '$'}{(selectedProduct.price * (1 - selectedProduct.saleDiscountPercent / 100)).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xl font-extrabold text-gray-900 mt-0.5">
                          {storeSettings.currencySymbol || '$'}{selectedProduct.price.toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Disponibilidad
                      </span>
                      {selectedProduct.stock === 0 ? (
                        <div className="text-xs font-bold text-red-600 mt-1 uppercase">Agotado Temporalmente</div>
                      ) : selectedProduct.stock <= selectedProduct.minStockAlert ? (
                        <div className="text-xs font-bold text-amber-600 mt-1 uppercase animate-pulse">
                          Pocas Unidades ({selectedProduct.stock})
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-emerald-750 mt-1 uppercase">
                          En Stock ({selectedProduct.stock})
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedProduct.stock > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">Cantidad Solicitada</span>
                      <div className="flex items-center border border-gray-250 rounded-xl bg-gray-50">
                        <button
                          onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                          className="p-1.5 text-gray-500 hover:text-black cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-bold">
                          {detailQty}
                        </span>
                        <button
                          onClick={() => setDetailQty(Math.min(selectedProduct.stock, detailQty + 1))}
                          className="p-1.5 text-gray-500 hover:text-black cursor-pointer"
                          disabled={detailQty >= selectedProduct.stock}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    disabled={selectedProduct.stock === 0}
                    onClick={handleDetailsAddToCart}
                    className="w-full py-2.8 bg-gray-950 hover:bg-black text-white font-extrabold rounded-xl text-xs transition-transform cursor-pointer flex items-center justify-center gap-1.5 text-center active:scale-98"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {selectedProduct.stock === 0 ? 'Agotado' : 'Agregar a la Bolsa'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Success Modal (Requisito 4/11 response popup) */}
      <AnimatePresence>
        {checkoutSuccessOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-100 max-w-md w-full p-6 text-center shadow-2xl relative space-y-6 font-sans text-xs"
            >
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 border-dashed animate-pulse">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-mono font-bold tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  NÚMERO DE PEDIDO GENERADO: {checkoutSuccessOrder.id}
                </span>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  ¡Compra Confirmada Exitosamente!
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Gracias por tu compra, <span className="font-bold text-gray-800">{checkoutSuccessOrder.buyer?.nombre || ''} {checkoutSuccessOrder.buyer?.apellidos || ''}</span>. El pedido ha sido registrado en la cola logística de empaque y envíos.
                </p>
              </div>

              {/* Informative Sandbox panel */}
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-2.5 text-left text-xs leading-normal">
                <h4 className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-widest flex items-center gap-1">
                  <span className="block w-2.5 h-2.5 rounded-full bg-indigo-650 animate-ping" />
                  Prueba de Flujo de Trabajadores
                </h4>
                <p className="text-[10.5px] text-indigo-750 leading-relaxed">
                  Para auditar y empacar esta compra simulada, haz clic en el botón inferior para abrir el diálogo de roles e iniciar sesión como <strong>Empleado</strong> (puedes ingresar con la cuenta de <strong>ramon</strong> o <strong>mercedes</strong>).
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setCheckoutSuccessOrder(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50/80 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Seguir Comprando
                </button>
                <button
                  onClick={() => {
                    setCheckoutSuccessOrder(null);
                    // Switch to employee portal
                    const btn = document.querySelector('[title="Switch Role Session"]');
                    if (btn instanceof HTMLElement) btn.click();
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  Estación Empleados
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
