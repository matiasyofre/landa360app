import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { agricolaService } from '../../services/agricolaService';
import { MonitoreoPlaga, Lote, TipoPlaga, SeveridadPlaga } from '../../types/agricola';
import { 
  Bug, 
  Plus, 
  Calendar, 
  Filter 
} from 'lucide-react';

export const MonitoreoPlagasView: React.FC = () => {
  const { tenant } = useAuth();
  const tenantId = tenant?.id || 'demo-tenant-id';

  const [monitoreos, setMonitoreos] = useState<MonitoreoPlaga[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteFiltro, setLoteFiltro] = useState<string>('todos');
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);

  // Formulario nuevo monitoreo
  const [formLoteId, setFormLoteId] = useState('');
  const [formTipo, setFormTipo] = useState<TipoPlaga>('insecto');
  const [formPlaga, setFormPlaga] = useState('');
  const [formSeveridad, setFormSeveridad] = useState<SeveridadPlaga>('media');
  const [formEstadio, setFormEstadio] = useState('V4 - 4ta hoja desplegada');
  const [formObs, setFormObs] = useState('');
  const [formAccion, setFormAccion] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  const cargarDatos = async () => {
    try {
      const [lotesData, monitoreosData] = await Promise.all([
        agricolaService.obtenerLotes(tenantId),
        agricolaService.obtenerMonitoreos(tenantId)
      ]);
      setLotes(lotesData);
      setMonitoreos(monitoreosData);
      if (lotesData.length > 0 && !formLoteId) {
        setFormLoteId(lotesData[0].id);
      }
    } catch (err) {
      console.error('Error al cargar monitoreos:', err);
    }
  };

  const handleCrearMonitoreo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlaga.trim() || !formLoteId) return;

    const loteSeleccionado = lotes.find(l => l.id === formLoteId);

    try {
      await agricolaService.crearMonitoreo(tenantId, {
        loteId: formLoteId,
        loteNombre: loteSeleccionado?.nombre,
        fecha: new Date().toISOString().split('T')[0],
        tipo: formTipo,
        plagaNombre: formPlaga.trim(),
        severidad: formSeveridad,
        estadioCultivo: formEstadio,
        observaciones: formObs,
        accionRecomendada: formAccion
      });

      setModalNuevoOpen(false);
      setFormPlaga('');
      setFormObs('');
      setFormAccion('');
      await cargarDatos();
    } catch (err) {
      console.error('Error al registrar monitoreo:', err);
    }
  };

  const monitoreosFiltrados = monitoreos.filter(m => {
    if (loteFiltro === 'todos') return true;
    return m.loteId === loteFiltro;
  });

  const getSeveridadBadge = (sev: SeveridadPlaga) => {
    switch (sev) {
      case 'critica':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">Crítica / Umbral Superado</span>;
      case 'alta':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">Alta &bull; Alerta</span>;
      case 'media':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">Media &bull; Seguimiento</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Baja &bull; Controlada</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-campo-card p-5 rounded-2xl border border-campo-borde shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-campo-oliva bg-campo-arena px-2 py-0.5 rounded border border-campo-borde">
              FN-2.7 &bull; Sanidad Vegetal & Monitoreo a Campo
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-campo-texto">
            Monitoreo de Plagas, Malezas y Enfermedades
          </h2>
          <p className="text-xs text-campo-muted">
            Registro fitosanitario georreferenciado por lote, evaluación de umbral de daño y disparador de pulverización
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-campo-blanco px-3 py-1.5 rounded-xl border border-campo-borde text-xs">
            <Filter className="w-3.5 h-3.5 text-campo-oliva" />
            <select
              value={loteFiltro}
              onChange={(e) => setLoteFiltro(e.target.value)}
              className="bg-transparent text-xs font-bold text-campo-texto focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos los lotes</option>
              {lotes.map(l => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setModalNuevoOpen(true)}
            className="px-4 py-2 text-xs font-bold bg-campo-verde hover:bg-campo-oliva text-white rounded-xl shadow-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Registro a Campo</span>
          </button>
        </div>
      </div>

      {/* Grid de Monitoreos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {monitoreosFiltrados.map((m) => (
          <div
            key={m.id}
            className="bg-campo-card border border-campo-borde hover:border-campo-verde rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-campo-borde">
                <div>
                  <span className="text-[10px] font-mono text-campo-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {m.fecha} &bull; Lote: <strong>{m.loteNombre || 'Lote'}</strong>
                  </span>
                  <h3 className="text-base font-bold text-campo-texto mt-1 flex items-center gap-1.5">
                    <Bug className="w-4 h-4 text-campo-oliva" />
                    <span>{m.plagaNombre}</span>
                  </h3>
                </div>
                {getSeveridadBadge(m.severidad)}
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-campo-texto">
                <p>
                  <strong className="text-campo-muted">Tipo:</strong> <span className="capitalize">{m.tipo}</span>
                </p>
                {m.estadioCultivo && (
                  <p>
                    <strong className="text-campo-muted">Estadío fenológico:</strong> {m.estadioCultivo}
                  </p>
                )}
                {m.observaciones && (
                  <p className="text-campo-muted italic bg-campo-blanco p-2.5 rounded-lg border border-campo-borde">
                    "{m.observaciones}"
                  </p>
                )}
              </div>
            </div>

            {m.accionRecomendada && (
              <div className="mt-4 pt-3 border-t border-campo-borde bg-campo-arena/40 p-2.5 rounded-xl text-xs">
                <span className="text-[10px] uppercase font-bold text-campo-oliva block mb-0.5">
                  Recomendación Agronómica:
                </span>
                <span className="text-campo-texto font-medium">{m.accionRecomendada}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {monitoreosFiltrados.length === 0 && (
        <div className="text-center py-16 bg-campo-card border border-dashed border-campo-borde rounded-2xl">
          <Bug className="w-10 h-10 text-campo-oliva mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-campo-texto">Sin registros de plagas en este lote</h3>
          <p className="text-xs text-campo-muted mt-1">
            Los monitoreos a campo permiten detectar malezas resistentes y orugas antes de superar el umbral económico.
          </p>
          <button
            onClick={() => setModalNuevoOpen(true)}
            className="mt-3 px-4 py-2 text-xs font-bold bg-campo-verde text-white rounded-xl shadow-sm"
          >
            Registrar Monitoreo Ahora
          </button>
        </div>
      )}

      {/* Modal Nuevo Monitoreo */}
      {modalNuevoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-campo-card border border-campo-borde rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-campo-blanco border-b border-campo-borde flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-campo-verde/20 text-campo-bosque flex items-center justify-center">
                  <Bug className="w-4 h-4 text-campo-oliva" />
                </span>
                <h3 className="text-sm font-bold text-campo-texto">
                  Registro de Monitoreo Sanitario (FN-2.7)
                </h3>
              </div>
              <button onClick={() => setModalNuevoOpen(false)} className="text-campo-muted hover:text-campo-texto">✕</button>
            </div>

            <form onSubmit={handleCrearMonitoreo} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-campo-texto mb-1">Lote Intervenido *</label>
                  <select
                    value={formLoteId}
                    onChange={(e) => setFormLoteId(e.target.value)}
                    className="w-full px-3 py-2 bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                  >
                    {lotes.map(l => (
                      <option key={l.id} value={l.id}>{l.nombre} ({l.superficieHa} ha)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-campo-texto mb-1">Tipo de Amenaza</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as TipoPlaga)}
                    className="w-full px-3 py-2 bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde capitalize"
                  >
                    <option value="insecto">Insecto / Oruga / Chinche</option>
                    <option value="maleza">Maleza Resistente</option>
                    <option value="enfermedad">Enfermedad Fúngica / Roya</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-campo-texto mb-1">Nombre de la Plaga o Maleza *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Oruga Militar (Spodoptera), Yuyo Colorado, Roya de la Soja..."
                  value={formPlaga}
                  onChange={(e) => setFormPlaga(e.target.value)}
                  className="w-full px-3 py-2 bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-campo-texto mb-1">Severidad / Umbral</label>
                  <select
                    value={formSeveridad}
                    onChange={(e) => setFormSeveridad(e.target.value as SeveridadPlaga)}
                    className="w-full px-3 py-2 bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde capitalize"
                  >
                    <option value="baja">Baja (Monitoreo regular)</option>
                    <option value="media">Media (Seguimiento estrecho)</option>
                    <option value="alta">Alta (Alerta agronómica)</option>
                    <option value="critica">Crítica (Supera umbral de daño)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-campo-texto mb-1">Estadío Fenológico</label>
                  <input
                    type="text"
                    value={formEstadio}
                    onChange={(e) => setFormEstadio(e.target.value)}
                    className="w-full px-3 py-2 bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-campo-texto mb-1">Observaciones a Campo</label>
                <textarea
                  rows={2}
                  value={formObs}
                  onChange={(e) => setFormObs(e.target.value)}
                  placeholder="Densidad de orugas por metro lineal, porcentaje de defoliación..."
                  className="w-full px-3 py-2 bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-campo-texto mb-1">Acción / Recomendación Inmediata</label>
                <input
                  type="text"
                  placeholder="ej: Emitir OT de pulverización con insecticida en 48 hs..."
                  value={formAccion}
                  onChange={(e) => setFormAccion(e.target.value)}
                  className="w-full px-3 py-2 bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-campo-borde">
                <button
                  type="button"
                  onClick={() => setModalNuevoOpen(false)}
                  className="px-4 py-2 font-semibold text-campo-muted hover:text-campo-texto rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-campo-verde hover:bg-campo-oliva text-white rounded-lg shadow-sm"
                >
                  Guardar Monitoreo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
