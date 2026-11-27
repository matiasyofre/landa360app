import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { agricolaService } from '../../services/agricolaService';
import { Cultivo, Campana, TipoCultivo } from '../../types/agricola';
import { 
  Plus, 
  Check, 
  Edit3, 
  Trash2, 
  Calendar, 
  Sprout, 
  Palette, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

const TIPOS_CULTIVO: { value: TipoCultivo; label: string }[] = [
  { value: 'agricola', label: 'Agrícola (Cosecha)' },
  { value: 'forrajero', label: 'Forrajero / Pastura' },
  { value: 'cobertura', label: 'Cultivo de Cobertura / Servicio' },
  { value: 'barbecho', label: 'Barbecho Químico / Mecánico' },
  { value: 'ganadero', label: 'Uso Ganadero / Silopack' },
  { value: 'otro', label: 'Otro Destino' }
];

const COLORES_PREDEFINIDOS = [
  '#83A653', // Verde natural
  '#536747', // Verde oliva
  '#38845A', // Verde éxito
  '#D9A441', // Amarillo alerta / Maíz
  '#E5A93C', // Ámbar Maíz temprano
  '#EAB308', // Girasol
  '#B6A77D', // Trigo / Fino
  '#C8B27B', // Cebada
  '#74796D', // Barbecho / Gris
  '#52849A', // Azul info
  '#8B5CF6', // Violeta
  '#EC4899', // Rosa
  '#06B6D4', // Cian
  '#F97316'  // Naranja
];

export const CultivosParamManager: React.FC = () => {
  const { tenant } = useAuth();
  const tenantId = tenant?.id || 'demo-tenant-id';

  const [activeTab, setActiveTab] = useState<'cultivos' | 'campanas'>('cultivos');
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Modal / Form state para Cultivo
  const [modalCultivoOpen, setModalCultivoOpen] = useState(false);
  const [editingCultivo, setEditingCultivo] = useState<Cultivo | null>(null);
  const [cultivoForm, setCultivoForm] = useState<{
    nombre: string;
    tipo: TipoCultivo;
    colorHex: string;
    esActivo: boolean;
    descripcion: string;
  }>({
    nombre: '',
    tipo: 'agricola',
    colorHex: '#83A653',
    esActivo: true,
    descripcion: ''
  });

  // Modal / Form state para Campaña
  const [modalCampanaOpen, setModalCampanaOpen] = useState(false);
  const [campanaForm, setCampanaForm] = useState<{
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
    activa: boolean;
  }>({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    activa: false
  });

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [cultivosData, campanasData] = await Promise.all([
        agricolaService.obtenerCultivos(tenantId),
        agricolaService.obtenerCampanas(tenantId)
      ]);
      setCultivos(cultivosData);
      setCampanas(campanasData);
    } catch (err) {
      console.error('Error al cargar parámetros agrícolas:', err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (tipo: 'success' | 'error', texto: string) => {
    setFeedbackMsg({ tipo, texto });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // --------------------------------------------------------------------------
  // HANDLERS CULTIVOS
  // --------------------------------------------------------------------------

  const handleOpenNuevoCultivo = () => {
    setEditingCultivo(null);
    setCultivoForm({
      nombre: '',
      tipo: 'agricola',
      colorHex: COLORES_PREDEFINIDOS[Math.floor(Math.random() * COLORES_PREDEFINIDOS.length)],
      esActivo: true,
      descripcion: ''
    });
    setModalCultivoOpen(true);
  };

  const handleOpenEditarCultivo = (c: Cultivo) => {
    setEditingCultivo(c);
    setCultivoForm({
      nombre: c.nombre,
      tipo: c.tipo,
      colorHex: c.colorHex,
      esActivo: c.esActivo,
      descripcion: c.descripcion || ''
    });
    setModalCultivoOpen(true);
  };

  const handleGuardarCultivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cultivoForm.nombre.trim()) {
      showFeedback('error', 'El nombre del cultivo es obligatorio.');
      return;
    }

    try {
      if (editingCultivo) {
        await agricolaService.actualizarCultivo(tenantId, editingCultivo.id, cultivoForm);
        showFeedback('success', `Cultivo "${cultivoForm.nombre}" actualizado con éxito.`);
      } else {
        await agricolaService.crearCultivo(tenantId, cultivoForm);
        showFeedback('success', `Cultivo "${cultivoForm.nombre}" incorporado al catálogo del campo.`);
      }
      setModalCultivoOpen(false);
      await cargarDatos();
    } catch (err) {
      showFeedback('error', 'Error al guardar cultivo.');
    }
  };

  const handleEliminarCultivo = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el cultivo "${nombre}" del catálogo? Los lotes que lo utilicen quedarán sin asignar.`)) return;
    try {
      await agricolaService.eliminarCultivo(tenantId, id);
      showFeedback('success', `Cultivo "${nombre}" eliminado.`);
      await cargarDatos();
    } catch (err) {
      showFeedback('error', 'No se pudo eliminar el cultivo.');
    }
  };

  const handleToggleActivoCultivo = async (c: Cultivo) => {
    try {
      await agricolaService.actualizarCultivo(tenantId, c.id, { esActivo: !c.esActivo });
      await cargarDatos();
    } catch (err) {
      showFeedback('error', 'Error al cambiar estado.');
    }
  };

  const handleRestablecerSugeridos = async () => {
    if (!confirm('¿Deseas restablecer los cultivos sugeridos base (Soja 1ra, Maíz Tardío, Trigo, Girasol, etc.)?')) return;
    try {
      await agricolaService.sembrarCultivosIniciales(tenantId);
      showFeedback('success', 'Catálogo restablecido con cultivos sugeridos estándar.');
      await cargarDatos();
    } catch (err) {
      showFeedback('error', 'Error al restablecer catálogo.');
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS CAMPAÑAS
  // --------------------------------------------------------------------------

  const handleCrearCampana = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campanaForm.nombre.trim()) {
      showFeedback('error', 'El nombre de la campaña es obligatorio.');
      return;
    }

    try {
      await agricolaService.crearCampana(tenantId, campanaForm);
      showFeedback('success', `Campaña "${campanaForm.nombre}" creada.`);
      setModalCampanaOpen(false);
      setCampanaForm({ nombre: '', fechaInicio: '', fechaFin: '', activa: false });
      await cargarDatos();
    } catch (err) {
      showFeedback('error', 'Error al crear campaña.');
    }
  };

  const handleActivarCampana = async (id: string, nombre: string) => {
    try {
      await agricolaService.establecerCampanaActiva(tenantId, id);
      showFeedback('success', `Campaña activa establecida: "${nombre}".`);
      await cargarDatos();
    } catch (err) {
      showFeedback('error', 'Error al activar campaña.');
    }
  };

  return (
    <div className="bg-campo-card border border-campo-borde rounded-xl shadow-sm overflow-hidden">
      {/* Header del Componente */}
      <div className="p-6 bg-campo-blanco border-b border-campo-borde">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-lg bg-campo-bosque text-white flex items-center justify-center shadow-sm">
                <Sprout className="w-5 h-5 text-campo-verde" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-campo-texto">
                  Parámetros Agrícolas & Catálogo de Cultivos
                </h2>
                <p className="text-xs text-campo-muted">
                  Configuración dinámica por establecimiento &bull; Los cultivos y campañas se adaptan a tu zona productiva
                </p>
              </div>
            </div>
          </div>

          {/* Selector de pestañas */}
          <div className="flex bg-campo-arena/60 p-1 rounded-lg border border-campo-borde">
            <button
              onClick={() => setActiveTab('cultivos')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'cultivos'
                  ? 'bg-campo-card text-campo-texto shadow-sm'
                  : 'text-campo-muted hover:text-campo-texto'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>Cultivos & Destinos ({cultivos.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('campanas')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'campanas'
                  ? 'bg-campo-card text-campo-texto shadow-sm'
                  : 'text-campo-muted hover:text-campo-texto'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Campañas ({campanas.length})</span>
            </button>
          </div>
        </div>

        {/* Banner Informativo */}
        <div className="mt-4 p-3 bg-campo-arena/40 border border-campo-borde rounded-lg flex items-start gap-2.5 text-xs text-campo-texto">
          <Info className="w-4 h-4 text-campo-oliva flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-campo-bosque">Personalización Total:</strong> Los cultivos creados aquí estarán inmediatamente disponibles en el 
            <strong> Catastro de Lotes (FN-2.1)</strong> y en el <strong>Importador Satelital KML (FN-2.2)</strong>. El color asignado se reflejará directamente en el mapa satelital.
          </p>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedbackMsg && (
        <div
          className={`px-6 py-2.5 text-xs font-medium border-b flex items-center justify-between ${
            feedbackMsg.tipo === 'success'
              ? 'bg-campo-verde/15 text-campo-bosque border-campo-verde/30'
              : 'bg-campo-error/15 text-campo-error border-campo-error/30'
          }`}
        >
          <span>{feedbackMsg.texto}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs hover:opacity-75">✕</button>
        </div>
      )}

      {/* Contenido según pestaña */}
      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center text-sm text-campo-muted animate-pulse">
            Cargando catálogo agronómico...
          </div>
        ) : activeTab === 'cultivos' ? (
          <div>
            {/* Barra de Acciones de Cultivos */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-sm font-bold text-campo-texto">Cultivos Registrados en el Campo</h3>
                <p className="text-xs text-campo-muted">
                  Gestiona la lista disponible para siembras, rotaciones y proyección cartográfica.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRestablecerSugeridos}
                  className="px-3 py-1.5 text-xs font-medium text-campo-muted hover:text-campo-texto border border-campo-borde rounded-lg hover:bg-campo-blanco flex items-center gap-1.5 transition-colors"
                  title="Cargar catálogo estándar pampeano"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Sugeridos</span>
                </button>
                <button
                  onClick={handleOpenNuevoCultivo}
                  className="px-4 py-1.5 text-xs font-semibold bg-campo-verde hover:bg-campo-oliva text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Cultivo</span>
                </button>
              </div>
            </div>

            {/* Grid de Cultivos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {cultivos.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border transition-all ${
                    c.esActivo
                      ? 'bg-campo-card border-campo-borde hover:border-campo-verde/50 shadow-sm'
                      : 'bg-campo-blanco/60 border-campo-borde/70 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-5 h-5 rounded-full flex-shrink-0 border border-black/10 shadow-inner"
                        style={{ backgroundColor: c.colorHex }}
                        title={`Color en mapa: ${c.colorHex}`}
                      />
                      <div>
                        <h4 className="text-sm font-bold text-campo-texto flex items-center gap-1.5">
                          {c.nombre}
                          {!c.esActivo && (
                            <span className="text-[10px] font-normal px-1.5 py-0.2 bg-campo-arena text-campo-muted rounded">
                              Inactivo
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-campo-muted font-medium">
                          {TIPOS_CULTIVO.find(t => t.value === c.tipo)?.label || c.tipo}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditarCultivo(c)}
                        className="p-1.5 text-campo-muted hover:text-campo-texto hover:bg-campo-arena rounded-md transition-colors"
                        title="Editar cultivo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEliminarCultivo(c.id, c.nombre)}
                        className="p-1.5 text-campo-muted hover:text-campo-error hover:bg-campo-arena rounded-md transition-colors"
                        title="Eliminar cultivo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {c.descripcion && (
                    <p className="mt-2 text-xs text-campo-muted line-clamp-2">
                      {c.descripcion}
                    </p>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-campo-borde/60 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-campo-muted">{c.colorHex}</span>
                    <button
                      onClick={() => handleToggleActivoCultivo(c)}
                      className={`font-semibold hover:underline ${
                        c.esActivo ? 'text-campo-oliva' : 'text-campo-muted'
                      }`}
                    >
                      {c.esActivo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {cultivos.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-campo-borde rounded-xl bg-campo-blanco">
                <Sprout className="w-10 h-10 text-campo-muted mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-campo-texto">No hay cultivos dados de alta</p>
                <p className="text-xs text-campo-muted mt-1">Crea tu primer cultivo o carga la lista sugerida pampeana.</p>
                <button
                  onClick={handleRestablecerSugeridos}
                  className="mt-3 px-4 py-1.5 text-xs font-semibold bg-campo-verde text-white rounded-lg shadow-sm"
                >
                  Cargar Cultivos Sugeridos
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Barra de Acciones de Campañas */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-sm font-bold text-campo-texto">Campañas Agrícolas del Establecimiento</h3>
                <p className="text-xs text-campo-muted">
                  Define los ciclos productivos para agrupar labores, órdenes de trabajo y balances.
                </p>
              </div>
              <button
                onClick={() => setModalCampanaOpen(true)}
                className="px-4 py-1.5 text-xs font-semibold bg-campo-verde hover:bg-campo-oliva text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Campaña</span>
              </button>
            </div>

            {/* Listado de Campañas */}
            <div className="space-y-3">
              {campanas.map((camp) => (
                <div
                  key={camp.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    camp.activa
                      ? 'bg-campo-verde/5 border-campo-verde shadow-sm'
                      : 'bg-campo-card border-campo-borde hover:border-campo-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                        camp.activa
                          ? 'bg-campo-verde text-white'
                          : 'bg-campo-arena text-campo-muted'
                      }`}
                    >
                      <Calendar className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-campo-texto">{camp.nombre}</h4>
                        {camp.activa && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-campo-verde text-white rounded-full">
                            Vigente / Activa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-campo-muted mt-0.5">
                        {camp.fechaInicio && camp.fechaFin
                          ? `Período: ${camp.fechaInicio} al ${camp.fechaFin}`
                          : 'Período anual abierto'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!camp.activa ? (
                      <button
                        onClick={() => handleActivarCampana(camp.id, camp.nombre)}
                        className="px-3 py-1.5 text-xs font-semibold bg-campo-blanco border border-campo-borde hover:border-campo-verde text-campo-texto rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-campo-verde" />
                        <span>Establecer como Activa</span>
                      </button>
                    ) : (
                      <span className="text-xs text-campo-oliva font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Campaña en curso</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================== */}
      {/* MODAL CREAR / EDITAR CULTIVO */}
      {/* ====================================================================== */}
      {modalCultivoOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-campo-card border border-campo-borde rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-campo-blanco border-b border-campo-borde flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-campo-verde/20 text-campo-bosque flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-campo-texto">
                  {editingCultivo ? 'Editar Cultivo' : 'Nuevo Cultivo en el Campo'}
                </h3>
              </div>
              <button
                onClick={() => setModalCultivoOpen(false)}
                className="text-campo-muted hover:text-campo-texto text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarCultivo} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-campo-texto mb-1">
                  Nombre del Cultivo / Destino *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Soja 1ra, Maíz Tardío, Poroto, Girasol..."
                  value={cultivoForm.nombre}
                  onChange={(e) => setCultivoForm({ ...cultivoForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-campo-texto mb-1">
                  Tipo / Clasificación Agronómica
                </label>
                <select
                  value={cultivoForm.tipo}
                  onChange={(e) => setCultivoForm({ ...cultivoForm, tipo: e.target.value as TipoCultivo })}
                  className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                >
                  {TIPOS_CULTIVO.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-campo-texto mb-1.5">
                  Color Representativo en el Mapa Satelital
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-8 h-8 rounded-lg border border-campo-borde shadow-inner flex-shrink-0"
                    style={{ backgroundColor: cultivoForm.colorHex }}
                  />
                  <input
                    type="color"
                    value={cultivoForm.colorHex}
                    onChange={(e) => setCultivoForm({ ...cultivoForm, colorHex: e.target.value })}
                    className="w-10 h-8 p-0 border border-campo-borde rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cultivoForm.colorHex}
                    onChange={(e) => setCultivoForm({ ...cultivoForm, colorHex: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto uppercase"
                  />
                </div>
                {/* Paleta rápida */}
                <div className="flex flex-wrap gap-1.5">
                  {COLORES_PREDEFINIDOS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setCultivoForm({ ...cultivoForm, colorHex: color })}
                      className={`w-6 h-6 rounded-md border transition-transform ${
                        cultivoForm.colorHex.toLowerCase() === color.toLowerCase()
                          ? 'scale-125 border-campo-bosque ring-1 ring-campo-verde'
                          : 'border-black/10 hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-campo-texto mb-1">
                  Descripción / Observaciones (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles de ciclo, destino comercial o manejo agronómico..."
                  value={cultivoForm.descripcion}
                  onChange={(e) => setCultivoForm({ ...cultivoForm, descripcion: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-campo-borde">
                <button
                  type="button"
                  onClick={() => setModalCultivoOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-campo-muted hover:text-campo-texto rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-campo-verde hover:bg-campo-oliva text-white rounded-lg shadow-sm"
                >
                  {editingCultivo ? 'Guardar Cambios' : 'Crear Cultivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL NUEVA CAMPAÑA */}
      {/* ====================================================================== */}
      {modalCampanaOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-campo-card border border-campo-borde rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-campo-blanco border-b border-campo-borde flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-campo-verde/20 text-campo-bosque flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-campo-texto">Nueva Campaña Agrícola</h3>
              </div>
              <button
                onClick={() => setModalCampanaOpen(false)}
                className="text-campo-muted hover:text-campo-texto text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearCampana} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-campo-texto mb-1">
                  Nombre de la Campaña *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Campaña 2025/2026, Campaña 2026/2027..."
                  value={campanaForm.nombre}
                  onChange={(e) => setCampanaForm({ ...campanaForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-campo-texto mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={campanaForm.fechaInicio}
                    onChange={(e) => setCampanaForm({ ...campanaForm, fechaInicio: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-campo-texto mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={campanaForm.fechaFin}
                    onChange={(e) => setCampanaForm({ ...campanaForm, fechaFin: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="campanaActivaCheck"
                  checked={campanaForm.activa}
                  onChange={(e) => setCampanaForm({ ...campanaForm, activa: e.target.checked })}
                  className="rounded border-campo-borde text-campo-verde focus:ring-campo-verde"
                />
                <label htmlFor="campanaActivaCheck" className="text-xs text-campo-texto font-medium cursor-pointer">
                  Establecer inmediatamente como campaña activa / vigente
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-campo-borde">
                <button
                  type="button"
                  onClick={() => setModalCampanaOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-campo-muted hover:text-campo-texto rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-campo-verde hover:bg-campo-oliva text-white rounded-lg shadow-sm"
                >
                  Crear Campaña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
