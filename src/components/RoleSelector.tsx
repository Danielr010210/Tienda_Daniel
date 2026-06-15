import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, X, Check, ArrowRight, AlertTriangle, Timer, Info } from 'lucide-react';
import { UserRole, Employee, StoreSettings } from '../types';
import { secureHash } from '../utils';

interface RoleSelectorProps {
  currentRole: UserRole;
  employeeName: string;
  onRoleChange: (role: UserRole, empName?: string) => void;
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onUpdateEmployees: (emps: Employee[]) => void;
  storeSettings: StoreSettings;
  onAddSecurityAlert: (type: 'Bloqueo' | 'IntentoFallido' | 'AccesoNoAutorizado' | 'CambioContrasena', details: string) => void;
  onAddShiftLog: (employeeId: string, employeeName: string, type: 'Entrada' | 'Salida') => void;
}

export default function RoleSelector({
  currentRole,
  employeeName,
  onRoleChange,
  isOpen,
  onClose,
  employees,
  storeSettings,
  onUpdateEmployees,
  onAddSecurityAlert,
  onAddShiftLog,
}: RoleSelectorProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const [errorStatus, setErrorStatus] = useState('');
  const [successStatus, setSuccessStatus] = useState('');

  // Handle countdown timer for failed attempt timeouts
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockoutSecs > 0) {
      interval = setInterval(() => {
        setLockoutSecs((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutSecs]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus('');
    setSuccessStatus('');

    const trimmedUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!trimmedUser || !cleanPass) {
      setErrorStatus('Por favor, ingresa tanto el usuario como la contraseña.');
      return;
    }

    // 1. Check if user is trying to login as admin
    if (trimmedUser === 'admin' || trimmedUser === 'administrador') {
      const expectedHash = storeSettings.adminPasswordHash || secureHash('admin123*');
      if (secureHash(cleanPass) === expectedHash) {
        setSuccessStatus('¡Autenticación de Administrador exitosa!');
        setTimeout(() => {
          onRoleChange('Admin', 'Administrador Principal');
          onClose();
        }, 800);
      } else {
        setErrorStatus('Contraseña de administrador incorrecta.');
        onAddSecurityAlert('IntentoFallido', 'Intento de inicio de sesión fallido como Administrador.');
      }
      return;
    }

    // 2. Check if user matches any employee
    const localEmployees = [...employees];
    const employeeIndex = localEmployees.findIndex(emp => emp.username.toLowerCase() === trimmedUser);

    if (employeeIndex === -1) {
      setErrorStatus('El nombre de usuario no existe.');
      onAddSecurityAlert('IntentoFallido', `Intento de login con usuario inexistente: "${trimmedUser}"`);
      return;
    }

    const employee = localEmployees[employeeIndex];

    // Check blockage status
    if (employee.isLocked) {
      setErrorStatus(`¡Acceso Denegado! El usuario "${employee.name}" ha sido BLOQUEADO. Por favor, solicita a un administrador que desbloquee tu cuenta.`);
      onAddSecurityAlert('AccesoNoAutorizado', `Intento de acceso a cuenta bloqueada: "${employee.username}".`);
      return;
    }

    // Compare hashed password
    const hashedEntered = secureHash(cleanPass);
    if (hashedEntered === employee.passwordHash) {
      // Success login
      employee.failedAttempts = 0;
      localEmployees[employeeIndex] = employee;
      onUpdateEmployees(localEmployees);

      localStorage.setItem('aether_employee_name', employee.name);
      localStorage.setItem('aether_active_employee_id', employee.id);

      onAddShiftLog(employee.id, employee.name, 'Entrada');
      setSuccessStatus(`¡Sesión iniciada correctamente como ${employee.name}!`);
      
      setTimeout(() => {
        onRoleChange('Employee', employee.name);
        onClose();
      }, 800);
    } else {
      // Failed attempts logic
      employee.failedAttempts += 1;

      if (employee.failedAttempts === 3) {
        setLockoutSecs(10);
        setErrorStatus('Contraseña incorrecta por 3ra vez. Espera 10 segundos para intentar de nuevo.');
        onAddSecurityAlert('IntentoFallido', `Bloqueo de 10 segundos para "${employee.username}" tras 3 intentos fallidos.`);
      } else if (employee.failedAttempts > 3) {
        employee.isLocked = true;
        setErrorStatus(`¡TRABAJADOR BLOQUEADO! Tu usuario "${employee.name}" ha sido suspendido. Pide un reinicio al Admin.`);
        onAddSecurityAlert('Bloqueo', `Cuenta del empleado "${employee.username}" bloqueada permanentemente.`);
      } else {
        const attemptsLeft = 3 - employee.failedAttempts;
        setErrorStatus(`Contraseña incorrecta. Te quedan ${attemptsLeft} intentos de seguridad.`);
        onAddSecurityAlert('IntentoFallido', `Contraseña incorrecta para "${employee.username}" (${employee.failedAttempts}/3)`);
      }

      localEmployees[employeeIndex] = employee;
      onUpdateEmployees(localEmployees);
    }
  };

  const handleProceedAsCustomer = () => {
    onRoleChange('Customer');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Background click overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative bg-white text-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 z-10"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-700" />
            <h3 className="text-base font-bold text-gray-950 font-sans">
              Identificación de Usuario
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 transition-colors cursor-pointer text-gray-550"
            aria-label="Cerrar diálogo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unified Login Form */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-1">
            <h4 className="text-sm font-extrabold text-gray-900">Ingresa tus Credenciales</h4>
            <p className="text-[11px] text-gray-400">
              Escribe tus datos de acceso de Trabajador o Administrador para proceder.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Input: Usuario */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Nombre de Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Ej: admin o ramon"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={lockoutSecs > 0}
                  className="w-full pl-9 pr-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            {/* Input: Contraseña */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={lockoutSecs > 0}
                  className="w-full pl-9 pr-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Helper Hint */}
            <div className="p-2.5 bg-gray-50 border border-gray-150 rounded-xl text-[10px] text-gray-500 leading-normal flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <span>
                Para Administrador usa <code className="bg-gray-200 px-1 py-0.2 rounded font-bold text-gray-800">admin</code>. Las cuentas de empleados se configuran desde el panel administrativo.
              </span>
            </div>

            {/* Locked Countdown display */}
            {lockoutSecs > 0 && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl space-y-2 text-center"
              >
                <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-900">
                  <Timer className="w-4 h-4 text-amber-700 animate-spin" />
                  <span>BLOQUEO TEMPORAL ACTIVO</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  Por favor, espera <strong className="font-mono text-xs">{lockoutSecs}s</strong> antes de intentar iniciar sesión nuevamente.
                </p>
              </motion.div>
            )}

            {/* Error notifications */}
            {errorStatus && (
              <div className="p-2.5 bg-red-50 border border-red-100 text-red-700 rounded-lg text-[11px] leading-relaxed flex items-start gap-1.5 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>{errorStatus}</div>
              </div>
            )}

            {/* Success notifications */}
            {successStatus && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <div>{successStatus}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={lockoutSecs > 0}
              className={`w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer select-none flex items-center justify-center gap-1.5 transition-colors ${
                lockoutSecs > 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Iniciar Sesión
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-[9px] text-gray-400 uppercase font-black tracking-widest">ó</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Proceed as Customer */}
          <button
            type="button"
            onClick={handleProceedAsCustomer}
            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Acceder como Cliente (Catálogo Público)</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
