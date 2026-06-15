import React from 'react';
import { ShoppingCart, ShieldCheck, User, Users, Store } from 'lucide-react';
import { UserRole, StoreSettings } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  employeeName: string;
  onOpenRoleSelector: () => void;
  cartCount: number;
  onOpenCart: () => void;
  storeSettings: StoreSettings;
}

export default function Navbar({
  currentRole,
  employeeName,
  onOpenRoleSelector,
  cartCount,
  onOpenCart,
  storeSettings,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-150 px-4 md:px-8 py-3 flex items-center justify-between font-sans">
      {/* Brand Logo - Dynamic Store name (Requisito 3) */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-indigo-950 flex items-center justify-center text-white shrink-0 shadow-3xs">
          <Store className="w-5 h-5 text-indigo-200" />
        </div>
        <div>
          <span className="font-black tracking-tight text-gray-900 block leading-tight text-xs md:text-sm uppercase">
            {storeSettings.storeName}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-emerald-600 block mt-0.5 font-bold">
            Little Havana, Miami
          </span>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2.5">
        {/* Active Session Status in Spanish */}
        {currentRole !== 'Customer' && (
          <button
            onClick={onOpenRoleSelector}
            className="flex items-center gap-1.5 px-3 py-1.8 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer text-[11px] font-bold"
          >
            {currentRole === 'Employee' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-gray-650">Personal: <span className="text-indigo-850 font-black">{employeeName}</span></span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                <span className="text-gray-655 font-black">Admin: Completo</span>
              </>
            )}
          </button>
        )}

        {/* Portal Switch Button - Icon only (Requisito 18) */}
        <button
          onClick={onOpenRoleSelector}
          className="p-2 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer text-[11px] font-bold flex items-center justify-center"
          title="Cambiar Sesión de Rol"
        >
          <Users className="w-5 h-5 text-indigo-750" />
        </button>

        {/* Shopping Cart button in Spanish */}
        {currentRole === 'Customer' && (
          <button
            onClick={onOpenCart}
            className="relative p-2.2 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-800 cursor-pointer flex items-center justify-center border border-emerald-150"
            aria-label="Abrir Carrito"
          >
            <ShoppingCart className="w-4.5 h-4.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-600 text-white font-black text-[9px] rounded-full flex items-center justify-center border border-white animate-bounce-short">
                {cartCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
