import { useAuth } from '../../context/AuthContext';
import { Lock, Eye, EyeOff, DollarSign, Tractor } from 'lucide-react';

export function PrivacyDemoCard() {
  const { rolActivo, puedeVerPrecios } = useAuth();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              FN-1.3 &bull; Matriz de Privacidad Estricta
            </span>
            <span className="text-xs text-slate-400">Prueba en Vivo según Rol</span>
          </div>
          <h3 className="text-base font-bold text-white mt-1">
            Simulación de Visualización de Orden de Trabajo (OT)
          </h3>
        </div>

        {/* Badge de Estado del Permiso */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
          puedeVerPrecios
            ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
            : 'bg-amber-950/60 border-amber-600/60 text-amber-300'
        }`}>
          {puedeVerPrecios ? (
            <>
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Precios Visibles ({rolActivo?.nombre})</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 text-amber-400" />
              <span>Costos Ocultos ({rolActivo?.nombre})</span>
            </>
          )}
        </div>
      </div>

      {/* Explicación de la Política */}
      <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
        puedeVerPrecios
          ? 'bg-slate-950 border-emerald-900/40 text-slate-300'
          : 'bg-amber-950/30 border-amber-900/40 text-amber-200/90'
      }`}>
        {puedeVerPrecios ? (
          <p>
            El rol actual tiene activa la función <code className="text-emerald-400 font-mono">FN-1.3</code>. Tiene autorización para auditar tarifas de contratistas, costos PPP de insumos y márgenes económicos brutos.
          </p>
        ) : (
          <p className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Blindaje Activo:</strong> El rol <strong>{rolActivo?.nombre}</strong> no posee la función <code className="text-amber-300 font-mono">FN-1.3</code>. Toda tarifa de maquinista, costo por litro y saldo de caja se sanitiza en el backend y se oculta en la UI.
            </span>
          </p>
        )}
      </div>

      {/* Tarjeta de la Orden de Trabajo de Muestra */}
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
          <div className="flex items-center gap-2">
            <Tractor className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs font-bold text-white">OT #2026-0042 &bull; Pulverización Terrestre</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">
            Lote 1 - El Bajo (120 ha)
          </span>
        </div>

        {/* Grilla con 3 Indicadores (1 físico, 1 técnico, 1 económico) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Indicador 1: Físico (Visible para todos) */}
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Superficie & Dosis
            </span>
            <span className="text-sm font-bold text-white">120 ha &bull; 3.0 lt/ha</span>
            <span className="block text-[11px] text-slate-400 mt-1">Glifosato 66% + Coadyuvante</span>
          </div>

          {/* Indicador 2: Receta / Maquinaria (Visible para todos) */}
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Equipo Asignado
            </span>
            <span className="text-sm font-bold text-white">Pla MAP 3 3250</span>
            <span className="block text-[11px] text-emerald-400 mt-1">Ventana Delta T: Óptima</span>
          </div>

          {/* Indicador 3: ECONÓMICO (Sensible / Blindado por FN-1.3) */}
          <div className={`p-3 rounded-lg border transition-all ${
            puedeVerPrecios
              ? 'bg-emerald-950/30 border-emerald-800/60'
              : 'bg-slate-900/40 border-slate-800 border-dashed'
          }`}>
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between mb-1">
              <span>Tarifa Contratista</span>
              <DollarSign className="w-3 h-3 text-emerald-400" />
            </span>

            {puedeVerPrecios ? (
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-emerald-300 font-mono">$12.50 USD / ha</span>
                <span className="block text-[11px] font-mono text-slate-300">Total: $1.500 USD</span>
              </div>
            ) : (
              <div className="py-1 flex items-center gap-2 text-slate-500">
                <Lock className="w-4 h-4 text-amber-500/80" />
                <span className="text-xs font-mono italic">Tarifa Confidencial</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
