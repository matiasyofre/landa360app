import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OnboardingWizard } from './modules/m1_nucleo/OnboardingWizard';
import { RolesManager } from './modules/m1_nucleo/RolesManager';
import { PrivacyDemoCard } from './modules/m1_nucleo/PrivacyDemoCard';
import { 
  Layers, 
  Building2, 
  Wifi, 
  ShieldCheck, 
  Eye, 
  RefreshCw,
  HelpCircle,
  Sparkles
} from 'lucide-react';

function DashboardView() {
  const { tenant, rolActivo, cambiarRolActivo, roles } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'privacidad' | 'onboarding'>('roles');

  // Si no hay tenant o eligió abrir el wizard
  if (!tenant || showWizard) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex flex-col justify-center">
        <OnboardingWizard onComplete={() => setShowWizard(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-emerald-950/80 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">Campo360</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Escenario A • Módulo 1 Activo
              </span>
            </div>
            {/* Establecimiento activo */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Building2 className="w-3 h-3 text-emerald-400" />
              <span className="text-white font-medium">{tenant.nombreFantasia}</span>
              <span className="font-mono text-slate-500">CUIT: {tenant.cuit}</span>
            </div>
          </div>
        </div>

        {/* Simulador Rápido de Rol en Header */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Rol Activo:</span>
            <select
              value={rolActivo?.id || ''}
              onChange={(e) => cambiarRolActivo(e.target.value)}
              className="bg-transparent text-emerald-300 font-bold focus:outline-none cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-900/60">
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PWA Offline</span>
          </div>

          <button
            onClick={() => setShowWizard(true)}
            title="Reconfigurar Campo (Asistente)"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        
        {/* Tarjeta de Resumen del Campo (Tenant FN-1.1 & FN-1.6) */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-950 p-5 rounded-2xl border border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
                M1: Núcleo del Sistema & Seguridad
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800/50">
                Aislamiento RLS Activo
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Gestión de Permisos por Rol y Matriz de Privacidad
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl">
              Configurá los roles de tu establecimiento, prendé o apagá funciones técnicas y corroborá cómo la Matriz de Privacidad oculta tarifas y costos al personal a campo.
            </p>
          </div>

          {/* Quick Stats del Tenant */}
          <div className="flex items-center gap-3 self-start sm:self-auto text-xs font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">Superficie</span>
              <span className="text-white font-bold">{tenant.hectareasTotales || 1250} ha</span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-slate-500 block text-[10px]">Perfil</span>
              <span className="text-emerald-400 font-bold capitalize">{tenant.perfilProductivo || 'Mixto'}</span>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación del Módulo 1 */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'roles'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Gestor de Roles Dinámicos (FN-1.2)</span>
          </button>

          <button
            onClick={() => setActiveTab('privacidad')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'privacidad'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Simulador de Privacidad a Campo (FN-1.3)</span>
          </button>

          <button
            onClick={() => setShowWizard(true)}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors ml-auto flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Asistente "Armá tu campo" (FN-1.6)</span>
          </button>
        </div>

        {/* Vista Activa */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <RolesManager />
            <PrivacyDemoCard />
          </div>
        )}

        {activeTab === 'privacidad' && (
          <div className="space-y-6">
            <PrivacyDemoCard />
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>¿Cómo funciona el Ocultamiento Automático de Costos?</span>
              </h4>
              <p>
                En el campo argentino, es práctica habitual que el capataz, tractoristas y aplicadores registren labores en tablets o celulares sin tener acceso a las tarifas pactadas con contratistas ni a los precios de compra de los insumos en galpón.
              </p>
              <p>
                Campo360 implementa la <strong>Matriz de Privacidad Estricta</strong>: si el rol asignado no cuenta con la función <code className="text-emerald-300 font-mono">FN-1.3 (Ver Precios y Finanzas)</code>, las respuestas del backend son sanitizadas a nivel de datos físicos (kilos, litros, hectáreas), garantizando confidencialidad absoluta.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 p-4 text-center text-xs text-slate-500 font-mono">
        Campo360 &bull; Núcleo de Seguridad y Aislamiento Multi-Tenant &bull; Supabase PostgreSQL 16
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <DashboardView />
    </AuthProvider>
  );
}

export default App;
