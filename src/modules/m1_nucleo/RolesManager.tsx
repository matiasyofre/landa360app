import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CATALOGO_FUNCIONES, ModuloId } from '../../types/rbac';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  ChevronRight, 
  Lock, 
  MapPin, 
  Layers, 
  FileSpreadsheet, 
  Sparkles, 
  Wifi, 
  Database,
  Save,
  Check
} from 'lucide-react';

export function RolesManager() {
  const { 
    roles, 
    rolActivo, 
    cambiarRolActivo, 
    crearNuevoRol, 
    actualizarFuncionesRol
  } = useAuth();

  const [selectedModule, setSelectedModule] = useState<ModuloId>('M1');
  const [modalNuevoRol, setModalNuevoRol] = useState<boolean>(false);
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevaDesc, setNuevaDesc] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  const modulos: { id: ModuloId; nombre: string; icon: typeof ShieldCheck }[] = [
    { id: 'M1', nombre: 'M1: Núcleo y Seguridad', icon: ShieldCheck },
    { id: 'M2', nombre: 'M2: Agrícola y KML', icon: MapPin },
    { id: 'M3', nombre: 'M3: Ganadería RFID', icon: Layers },
    { id: 'M4', nombre: 'M4: Stock e Insumos', icon: FileSpreadsheet },
    { id: 'M5', nombre: 'M5: Finanzas & OCR', icon: Sparkles },
    { id: 'M6', nombre: 'M6: Clima y Maquinaria', icon: Wifi },
    { id: 'M7', nombre: 'M7: Dashboard Central', icon: Database },
  ];

  const funcionesDelModulo = CATALOGO_FUNCIONES.filter((f) => f.modulo === selectedModule);

  const toggleFuncion = async (funcionId: string) => {
    if (!rolActivo) return;
    const tiene = rolActivo.funcionesIds.includes(funcionId);
    const nuevas = tiene
      ? rolActivo.funcionesIds.filter((id) => id !== funcionId)
      : [...rolActivo.funcionesIds, funcionId];

    setIsSaving(true);
    await actualizarFuncionesRol(rolActivo.id, nuevas);
    setIsSaving(false);
    setMensajeGuardado('Permisos actualizados y persistidos en Supabase');
    setTimeout(() => setMensajeGuardado(null), 3000);
  };

  const handleCrearRol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    setIsSaving(true);
    const funcionesIniciales = ['fn_2_5_cierre_labor', 'fn_4_1_stock_galpon', 'fn_6_1_pluviometro'];
    await crearNuevoRol(nuevoNombre, nuevaDesc, funcionesIniciales);
    setIsSaving(false);
    setNuevoNombre('');
    setNuevaDesc('');
    setModalNuevoRol(false);
    setMensajeGuardado(`Rol "${nuevoNombre}" creado exitosamente`);
    setTimeout(() => setMensajeGuardado(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Notificación de guardado */}
      {mensajeGuardado && (
        <div className="p-3 bg-emerald-50 border border-campo-exito/40 rounded-xl text-campo-exito text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-campo-exito" />
            <span className="font-semibold">{mensajeGuardado}</span>
          </div>
          <span className="font-mono text-[10px] text-campo-bosque bg-campo-arena px-2 py-0.5 rounded border border-campo-borde">
            Auto-Sync Supabase
          </span>
        </div>
      )}

      {/* Grid Principal: Roles a la Izquierda, Funciones a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: Roles (FN-1.2) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-campo-texto font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-campo-verde" />
              <span>Roles del Establecimiento</span>
            </h3>

            <button
              onClick={() => setModalNuevoRol(true)}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-campo-verde text-white hover:bg-campo-oliva transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Rol</span>
            </button>
          </div>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = rolActivo?.id === r.id;
              const tienePermisoPrecios = r.funcionesIds.includes('fn_1_3_privacidad_precios');

              return (
                <div
                  key={r.id}
                  onClick={() => cambiarRolActivo(r.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-campo-arena border-campo-verde shadow-sm'
                      : 'bg-campo-card border-campo-borde hover:border-campo-oliva'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-campo-bosque' : 'text-campo-texto'}`}>
                        {r.nombre}
                      </span>
                      {r.esSistema && (
                        <span className="text-[9px] font-mono uppercase bg-campo-blanco text-campo-muted px-1.5 py-0.5 rounded border border-campo-borde font-semibold shrink-0">
                          Nativo
                        </span>
                      )}
                    </div>
                    {r.descripcion && (
                      <p className="text-[11px] text-campo-muted truncate mt-0.5">{r.descripcion}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono text-campo-texto bg-campo-card px-2 py-0.5 rounded border border-campo-borde">
                        {r.funcionesIds.length} funciones
                      </span>

                      {!tienePermisoPrecios ? (
                        <span className="text-[9px] font-mono text-campo-alerta bg-amber-50 px-1.5 py-0.5 rounded border border-campo-alerta/30 flex items-center gap-1 font-semibold">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Sin costos</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-campo-exito bg-emerald-50 px-1.5 py-0.5 rounded border border-campo-exito/30 font-semibold">
                          Finanzas OK
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-campo-verde translate-x-1' : 'text-campo-muted'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA DERECHA: Asignación Granular de Funciones */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-campo-card p-4 rounded-2xl border border-campo-borde shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-campo-verde" />
                <span className="text-xs font-mono uppercase text-campo-muted">Editando permisos para:</span>
                <span className="text-sm font-bold text-campo-texto">{rolActivo?.nombre}</span>
              </div>
              <p className="text-xs text-campo-muted mt-0.5">
                Activá o desactivá funciones para este rol. Cada cambio impacta en la tabla <code className="text-campo-oliva font-mono text-[11px]">rol_funciones</code>.
              </p>
            </div>

            {isSaving && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-campo-oliva bg-campo-arena px-2.5 py-1 rounded-lg border border-campo-borde shrink-0">
                <Save className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </span>
            )}
          </div>

          {/* Tabs de Módulos M1 a M7 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-campo-borde">
            {modulos.map((m) => {
              const isSelected = selectedModule === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModule(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-campo-verde text-white font-bold shadow-xs'
                      : 'bg-campo-card text-campo-muted hover:text-campo-texto border border-campo-borde'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.nombre}</span>
                </button>
              );
            })}
          </div>

          {/* Lista de Funciones del Módulo */}
          <div className="space-y-2">
            {funcionesDelModulo.map((func) => {
              const isChecked = rolActivo?.funcionesIds.includes(func.id);

              return (
                <div
                  key={func.id}
                  onClick={() => toggleFuncion(func.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isChecked
                      ? 'bg-campo-card border-campo-verde shadow-xs'
                      : 'bg-campo-blanco border-campo-borde opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-campo-bosque bg-campo-arena px-2 py-0.5 rounded border border-campo-borde">
                        {func.codigo}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-campo-texto">
                        {func.nombre}
                      </span>
                      {func.esSensiblePrecio && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-50 text-campo-alerta border border-campo-alerta/30 flex items-center gap-1 font-semibold">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Dato Económico Sensible</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-campo-muted leading-snug">{func.descripcion}</p>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-campo-verde text-white shadow-xs' : 'border border-campo-borde bg-campo-blanco'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Crear Nuevo Rol */}
      {modalNuevoRol && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-campo-card border border-campo-borde rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-campo-texto">
            <div className="flex items-center gap-2 font-bold text-base text-campo-texto">
              <Users className="w-5 h-5 text-campo-verde" />
              <span>Crear Rol Personalizado</span>
            </div>
            <p className="text-xs text-campo-muted">
              Creá un rol a medida (ej: Tractorista, Veterinario, Asesor Agronómico) y luego asignale funciones específicas.
            </p>

            <form onSubmit={handleCrearRol} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-campo-texto">Nombre del Rol *</label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Tractorista / Maquinista"
                  className="w-full bg-campo-blanco border border-campo-borde rounded-xl px-3 py-2 text-xs text-campo-texto focus:outline-none focus:border-campo-verde"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-campo-texto">Descripción u Objetivo</label>
                <input
                  type="text"
                  value={nuevaDesc}
                  onChange={(e) => setNuevaDesc(e.target.value)}
                  placeholder="Ej: Cierre de labores mecánicas y pulverización a campo"
                  className="w-full bg-campo-blanco border border-campo-borde rounded-xl px-3 py-2 text-xs text-campo-texto focus:outline-none focus:border-campo-verde"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-campo-borde">
                <button
                  type="button"
                  onClick={() => setModalNuevoRol(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-campo-arena text-campo-texto hover:bg-campo-borde"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!nuevoNombre.trim()}
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-campo-verde text-white hover:bg-campo-oliva font-mono disabled:opacity-50"
                >
                  Crear Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
