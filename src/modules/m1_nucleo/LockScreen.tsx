import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, ShieldCheck, KeyRound, LogOut, ArrowRight, AlertCircle } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { user, tenant, logout } = useAuth();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setErrorMsg('Ingresá tu PIN o clave de seguridad (mínimo 4 caracteres).');
      return;
    }
    setErrorMsg(null);
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-campo-card border border-campo-borde rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 text-campo-texto">
        
        {/* Candado de Seguridad */}
        <div className="w-16 h-16 rounded-2xl bg-campo-arena border border-campo-borde text-campo-bosque flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8 text-campo-verde" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-campo-oliva font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Seguridad Zero-Trust Activa</span>
          </div>
          <h2 className="text-xl font-extrabold text-campo-texto">
            Sesión Bloqueada por Inactividad
          </h2>
          <p className="text-xs text-campo-muted">
            Por protección de datos financieros en {tenant?.nombreFantasia || 'el campo'}, tu sesión se bloqueó tras 15 minutos sin uso.
          </p>
        </div>

        {/* Info del Usuario */}
        <div className="bg-campo-blanco p-3 rounded-xl border border-campo-borde text-xs">
          <span className="text-campo-muted block text-[10px] uppercase font-mono font-semibold">Usuario activo</span>
          <span className="text-campo-texto font-bold">{user?.nombreCompleto}</span>
          <span className="text-campo-muted text-[11px] block font-mono">{user?.email}</span>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-campo-error/30 rounded-xl text-xs text-campo-error flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario de Desbloqueo */}
        <form onSubmit={handleUnlock} className="space-y-3">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-campo-muted absolute left-3 top-3" />
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Ingresá tu clave o PIN..."
              className="w-full bg-campo-blanco border border-campo-borde rounded-xl pl-9 pr-3 py-2.5 text-xs text-campo-texto focus:outline-none focus:border-campo-verde font-mono text-center tracking-widest"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-campo-verde hover:bg-campo-oliva text-white font-bold text-xs uppercase tracking-wider font-mono transition-all shadow-sm"
          >
            <span>Desbloquear Pantalla</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Botón Salir */}
        <div className="pt-2 border-t border-campo-borde">
          <button
            type="button"
            onClick={logout}
            className="text-xs text-campo-muted hover:text-campo-error flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión completamente</span>
          </button>
        </div>

      </div>
    </div>
  );
}
