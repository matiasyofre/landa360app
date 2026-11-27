import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { agricolaService } from '../../services/agricolaService';
import { OrdenTrabajo, Lote, TipoLabor, OTInsumo } from '../../types/agricola';
import { 
  Tractor, 
  Plus, 
  FileCheck, 
  CheckCircle, 
  Lock, 
  Printer, 
  X,
  Droplets
} from 'lucide-react';

const TIPOS_LABOR: { value: TipoLabor; label: string }[] = [
  { value: 'pulverizacion', label: 'Pulverización Terrestre' },
  { value: 'siembra', label: 'Siembra Directa / Convencional' },
  { value: 'fertilizacion', label: 'Fertilización al Voleo / Líquida' },
  { value: 'barbecho', label: 'Barbecho Químico' },
  { value: 'cosecha', label: 'Cosecha de Grano' },
  { value: 'otra', label: 'Otra Labor Mecánica' }
];

export const OrdenesTrabajoManager: React.FC = () => {
  const { tenant, rolActivo } = useAuth();
  const tenantId = tenant?.id || 'demo-tenant-id';

  // Blindaje de Seguridad FN-1.3: Ver Precios y Costos
  const puedeVerPrecios = rolActivo?.funcionesIds.includes('fn_1_3_privacidad_precios') ?? false;

  const [ots, setOts] = useState<OrdenTrabajo[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [campanaActivaId, setCampanaActivaId] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');

  // Modales
  const [modalNuevaOTOpen, setModalNuevaOTOpen] = useState(false);
  const [modalCierreOpen, setModalCierreOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [otSeleccionada, setOtSeleccionada] = useState<OrdenTrabajo | null>(null);

  // Formulario Nueva OT
  const [tipoLabor, setTipoLabor] = useState<TipoLabor>('pulverizacion');
  const [contratista, setContratista] = useState('');
  const [maquinaria, setMaquinaria] = useState('');
  const [tarifaContratista, setTarifaContratista] = useState<number>(12); // USD/ha
  const [lotesSeleccionadosIds, setLotesSeleccionadosIds] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [insumosPrescriptos, setInsumosPrescriptos] = useState<OTInsumo[]>([
    { productoNombre: 'Glifosato 66%', dosisHa: 2.5, unidad: 'lt/ha', cantidadTotalCalculada: 0 },
    { productoNombre: '2,4-D Éster', dosisHa: 0.6, unidad: 'lt/ha', cantidadTotalCalculada: 0 }
  ]);

  // Formulario Cierre
  const [superficieReal, setSuperficieReal] = useState<number>(0);
  const [fechaCierre, setFechaCierre] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  const cargarDatos = async () => {
    try {
      const [lotesData, campanasData, otsData] = await Promise.all([
        agricolaService.obtenerLotes(tenantId),
        agricolaService.obtenerCampanas(tenantId),
        agricolaService.obtenerOTs(tenantId)
      ]);
      setLotes(lotesData);
      setOts(otsData);

      const activa = campanasData.find(c => c.activa) || campanasData[0];
      if (activa) setCampanaActivaId(activa.id);
    } catch (err) {
      console.error('Error al cargar OTs:', err);
    }
  };

  // Cálculo de superficie total seleccionada
  const superficieTotalSeleccionada = lotes
    .filter(l => lotesSeleccionadosIds.includes(l.id))
    .reduce((acc, l) => acc + l.superficieHa, 0);

  // Recalcular volumen total de insumos según superficie
  const insumosCalculados = insumosPrescriptos.map(ins => ({
    ...ins,
    cantidadTotalCalculada: Number((ins.dosisHa * superficieTotalSeleccionada).toFixed(1))
  }));

  const costoTotalEstimado = Number((superficieTotalSeleccionada * tarifaContratista).toFixed(2));

  const handleCrearOT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lotesSeleccionadosIds.length === 0) {
      alert('Debes seleccionar al menos un lote para la prescripción.');
      return;
    }

    const lotesParaOT = lotes
      .filter(l => lotesSeleccionadosIds.includes(l.id))
      .map(l => ({
        loteId: l.id,
        loteNombre: l.nombre,
        superficieHa: l.superficieHa,
        porcentajeProrrateo: 0 // Se calcula en el servicio
      }));

    const numeroOt = `OT-${new Date().getFullYear()}-${String(ots.length + 1).padStart(4, '0')}`;

    try {
      await agricolaService.crearOrdenTrabajo(tenantId, {
        campanaId: campanaActivaId,
        numeroOt,
        tipoLabor,
        contratista: contratista.trim() || 'Equipo Propio / Pulverizadora',
        maquinaria: maquinaria.trim() || 'Pla MAP 3 3250',
        fechaEmision: new Date().toISOString().split('T')[0],
        estado: 'pendiente',
        superficieTotalHa: superficieTotalSeleccionada,
        tarifaContratistaUsdHa: tarifaContratista,
        costoTotalEstimadoUsd: costoTotalEstimado,
        observaciones,
        lotes: lotesParaOT,
        insumos: insumosCalculados
      });

      setModalNuevaOTOpen(false);
      // Reset
      setLotesSeleccionadosIds([]);
      setObservaciones('');
      await cargarDatos();
    } catch (err) {
      console.error('Error al emitir OT:', err);
    }
  };

  const handleAbrirCierre = (ot: OrdenTrabajo) => {
    setOtSeleccionada(ot);
    setSuperficieReal(ot.superficieTotalHa);
    setFechaCierre(new Date().toISOString().split('T')[0]);
    setModalCierreOpen(true);
  };

  const handleConfirmarCierre = async () => {
    if (!otSeleccionada) return;
    try {
      await agricolaService.cerrarLaborOT(tenantId, otSeleccionada.id, {
        superficieRealHa: superficieReal,
        fechaCierre
      });
      setModalCierreOpen(false);
      setOtSeleccionada(null);
      await cargarDatos();
    } catch (err) {
      console.error('Error al cerrar labor:', err);
    }
  };

  const otsFiltradas = ots.filter(ot => {
    if (filtroEstado === 'todas') return true;
    return ot.estado === filtroEstado;
  });

  return (
    <div className="space-y-6">
      
      {/* Header del Bloque B */}
      <div className="bg-campo-card p-5 rounded-2xl border border-campo-borde shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-campo-oliva bg-campo-arena px-2 py-0.5 rounded border border-campo-borde">
              FN-2.3 a FN-2.6 &bull; Operaciones de Campo & Órdenes de Trabajo
            </span>
            {!puedeVerPrecios && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                FN-1.3 Blindaje: Tarifas Contratista Confidenciales
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-campo-texto">
            Prescripciones Técnicas y Órdenes de Trabajo (OT)
          </h2>
          <p className="text-xs text-campo-muted">
            Recetas agronómicas, cálculo de caldo, emisión formal para maquinistas y cierre de labor con rebaja de insumos
          </p>
        </div>

        <button
          onClick={() => {
            if (lotes.length > 0 && lotesSeleccionadosIds.length === 0) {
              setLotesSeleccionadosIds([lotes[0].id]);
            }
            setModalNuevaOTOpen(true);
          }}
          className="px-4 py-2 text-xs font-bold bg-campo-verde hover:bg-campo-oliva text-white rounded-xl shadow-sm flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Prescripción / OT</span>
        </button>
      </div>

      {/* Filtros de Estado */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['todas', 'pendiente', 'en_curso', 'completada'].map((est) => (
          <button
            key={est}
            onClick={() => setFiltroEstado(est)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
              filtroEstado === est
                ? 'bg-campo-bosque text-white shadow-xs'
                : 'bg-campo-blanco text-campo-muted hover:text-campo-texto border border-campo-borde'
            }`}
          >
            {est === 'todas' ? 'Todas las Órdenes' : est.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Grid de Órdenes de Trabajo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {otsFiltradas.map((ot) => (
          <div
            key={ot.id}
            className="bg-campo-card border border-campo-borde hover:border-campo-verde rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              {/* Cabecera de la Tarjeta */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-campo-borde">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-campo-texto">{ot.numeroOt}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ot.estado === 'completada'
                          ? 'bg-campo-verde/20 text-campo-bosque'
                          : ot.estado === 'en_curso'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-campo-arena text-campo-muted'
                      }`}
                    >
                      {ot.estado.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-campo-texto mt-1 flex items-center gap-1.5">
                    <Tractor className="w-4 h-4 text-campo-oliva" />
                    <span className="capitalize">{ot.tipoLabor}</span>
                  </h3>
                </div>

                <span className="font-mono text-xs font-bold text-campo-verde bg-campo-verde/10 px-2 py-1 rounded-lg">
                  {ot.superficieTotalHa} ha
                </span>
              </div>

              {/* Lotes Intervenidos & Prorrateo (FN-2.6) */}
              <div className="mt-3 space-y-1.5">
                <span className="text-[11px] font-semibold text-campo-muted block">
                  Lotes Asignados ({ot.lotes.length}) &bull; Prorrateo Multi-Lote:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ot.lotes.map((l, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[11px] font-medium bg-campo-blanco border border-campo-borde rounded-md text-campo-texto flex items-center gap-1"
                    >
                      <span>{l.loteNombre || `Lote ${i + 1}`}</span>
                      <b className="text-campo-oliva font-mono">{l.superficieHa} ha</b>
                      {ot.lotes.length > 1 && (
                        <span className="text-[10px] text-campo-muted">({l.porcentajeProrrateo}%)</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Receta de Insumos Prescriptos */}
              <div className="mt-3 pt-2.5 border-t border-campo-borde/70 space-y-1">
                <span className="text-[11px] font-semibold text-campo-muted block">
                  Insumos Prescriptos (FN-2.3):
                </span>
                {ot.insumos.map((ins, i) => (
                  <div key={i} className="flex justify-between items-center text-xs text-campo-texto">
                    <span>{ins.productoNombre}</span>
                    <span className="font-mono text-campo-muted">
                      {ins.dosisHa} {ins.unidad} &bull; <b className="text-campo-texto">{ins.cantidadTotalCalculada} total</b>
                    </span>
                  </div>
                ))}
              </div>

              {/* Tarifas Contratista & Blindaje FN-1.3 */}
              <div className="mt-3 pt-2.5 border-t border-campo-borde flex items-center justify-between text-xs">
                <span className="text-campo-muted">Contratista: <strong>{ot.contratista}</strong></span>
                {puedeVerPrecios ? (
                  <div className="text-right">
                    <span className="text-[10px] text-campo-muted block">Costo Estimado</span>
                    <span className="font-mono font-bold text-campo-texto text-xs">
                      ${ot.costoTotalEstimadoUsd?.toLocaleString()} USD
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Tarifa Confidencial
                  </span>
                )}
              </div>
            </div>

            {/* Acciones de la OT */}
            <div className="mt-4 pt-3 border-t border-campo-borde flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setOtSeleccionada(ot);
                  setModalDetalleOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-campo-texto hover:bg-campo-arena border border-campo-borde rounded-lg flex items-center gap-1.5 transition-colors"
                title="Emisión formal para el contratista"
              >
                <Printer className="w-3.5 h-3.5 text-campo-oliva" />
                <span>Emitir OT (FN-2.4)</span>
              </button>

              {ot.estado !== 'completada' ? (
                <button
                  onClick={() => handleAbrirCierre(ot)}
                  className="px-3 py-1.5 text-xs font-bold bg-campo-verde hover:bg-campo-oliva text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Cerrar Labor (FN-2.5)</span>
                </button>
              ) : (
                <span className="text-xs text-campo-verde font-bold flex items-center gap-1">
                  <FileCheck className="w-4 h-4" />
                  <span>Labor Asentada</span>
                </span>
              )}
            </div>

          </div>
        ))}
      </div>

      {ots.length === 0 && (
        <div className="text-center py-16 bg-campo-card border border-dashed border-campo-borde rounded-2xl">
          <Tractor className="w-10 h-10 text-campo-oliva mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-campo-texto">No hay Órdenes de Trabajo emitidas</h3>
          <p className="text-xs text-campo-muted mt-1">
            Crea la primera prescripción técnica para pulverización, siembra o cosecha.
          </p>
          <button
            onClick={() => setModalNuevaOTOpen(true)}
            className="mt-3 px-4 py-2 text-xs font-bold bg-campo-verde text-white rounded-xl shadow-sm"
          >
            Nueva Prescripción Técnica
          </button>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL NUEVA PRESCRIPCIÓN TÉCNICA / ORDEN DE TRABAJO */}
      {/* ====================================================================== */}
      {modalNuevaOTOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-campo-card border border-campo-borde rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-campo-blanco border-b border-campo-borde flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-campo-verde/20 text-campo-bosque flex items-center justify-center">
                  <Tractor className="w-5 h-5 text-campo-oliva" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-campo-texto">
                    Prescripción Técnica de Labores e Insumos (FN-2.3)
                  </h3>
                  <p className="text-xs text-campo-muted">
                    Confección de receta agronómica y cálculo de dosis y caldo total
                  </p>
                </div>
              </div>
              <button onClick={() => setModalNuevaOTOpen(false)} className="text-campo-muted hover:text-campo-texto">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearOT} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Tipo de Labor & Contratista & Maquinaria */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-campo-texto mb-1">Tipo de Labor *</label>
                  <select
                    value={tipoLabor}
                    onChange={(e) => setTipoLabor(e.target.value as TipoLabor)}
                    className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                  >
                    {TIPOS_LABOR.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-campo-texto mb-1">Contratista / Maquinista</label>
                  <input
                    type="text"
                    placeholder="ej: Contratista Don Carlos, Equipo Propio..."
                    value={contratista}
                    onChange={(e) => setContratista(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-campo-texto mb-1">Equipo / Maquinaria</label>
                  <input
                    type="text"
                    placeholder="ej: Pla MAP 3 3250, John Deere..."
                    value={maquinaria}
                    onChange={(e) => setMaquinaria(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                  />
                </div>
              </div>

              {/* Selección Multi-Lote & Prorrateo (FN-2.6) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-campo-texto">
                    Lotes Asignados &bull; Superficie Total: <span className="text-campo-verde font-mono font-bold">{superficieTotalSeleccionada.toFixed(1)} ha</span>
                  </label>
                  <span className="text-[11px] text-campo-oliva font-semibold">
                    {lotesSeleccionadosIds.length > 1 ? '📐 Prorrateo Multi-Lote Activo' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 bg-campo-blanco border border-campo-borde rounded-xl">
                  {lotes.map(lote => {
                    const selected = lotesSeleccionadosIds.includes(lote.id);
                    return (
                      <button
                        type="button"
                        key={lote.id}
                        onClick={() => {
                          if (selected) {
                            setLotesSeleccionadosIds(lotesSeleccionadosIds.filter(id => id !== lote.id));
                          } else {
                            setLotesSeleccionadosIds([...lotesSeleccionadosIds, lote.id]);
                          }
                        }}
                        className={`p-2 rounded-lg text-left text-xs border transition-all flex items-center justify-between ${
                          selected
                            ? 'bg-campo-verde/15 border-campo-verde text-campo-bosque font-bold'
                            : 'bg-campo-card border-campo-borde text-campo-texto'
                        }`}
                      >
                        <span className="truncate">{lote.nombre}</span>
                        <span className="font-mono text-[10px] text-campo-muted ml-1">{lote.superficieHa} ha</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Receta de Insumos (FN-2.3) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-campo-texto flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-campo-oliva" />
                    <span>Receta Técnica & Insumos por Hectárea (Cálculo de Caldo)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setInsumosPrescriptos([
                        ...insumosPrescriptos,
                        { productoNombre: '', dosisHa: 1.0, unidad: 'lt/ha', cantidadTotalCalculada: 0 }
                      ]);
                    }}
                    className="text-xs font-semibold text-campo-verde hover:underline flex items-center gap-1"
                  >
                    + Agregar Insumo
                  </button>
                </div>

                <div className="space-y-2">
                  {insumosPrescriptos.map((ins, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Nombre del insumo / principio activo"
                          value={ins.productoNombre}
                          onChange={(e) => {
                            const updated = [...insumosPrescriptos];
                            updated[idx].productoNombre = e.target.value;
                            setInsumosPrescriptos(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-campo-blanco border border-campo-borde rounded text-xs text-campo-texto focus:outline-none focus:border-campo-verde"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Dosis"
                          value={ins.dosisHa || ''}
                          onChange={(e) => {
                            const updated = [...insumosPrescriptos];
                            updated[idx].dosisHa = parseFloat(e.target.value) || 0;
                            setInsumosPrescriptos(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-campo-blanco border border-campo-borde rounded text-xs text-campo-texto font-mono focus:outline-none focus:border-campo-verde"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={ins.unidad}
                          onChange={(e) => {
                            const updated = [...insumosPrescriptos];
                            updated[idx].unidad = e.target.value;
                            setInsumosPrescriptos(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-campo-blanco border border-campo-borde rounded text-xs text-campo-texto focus:outline-none focus:border-campo-verde"
                        >
                          <option value="lt/ha">lt/ha</option>
                          <option value="kg/ha">kg/ha</option>
                          <option value="cc/ha">cc/ha</option>
                          <option value="bolsas/ha">bolsas/ha</option>
                        </select>
                      </div>
                      <div className="col-span-2 text-right font-mono font-bold text-campo-oliva">
                        {(ins.dosisHa * superficieTotalSeleccionada).toFixed(1)} {ins.unidad.split('/')[0]}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setInsumosPrescriptos(insumosPrescriptos.filter((_, i) => i !== idx));
                          }}
                          className="text-campo-muted hover:text-campo-error"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tarifa Contratista */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-campo-borde">
                <div>
                  <label className="block text-xs font-semibold text-campo-texto mb-1">
                    Tarifa Contratista (USD/ha)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={tarifaContratista}
                    onChange={(e) => setTarifaContratista(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto font-mono focus:outline-none focus:border-campo-verde"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-campo-texto mb-1">
                    Costo Total Estimado (USD)
                  </label>
                  <div className="px-3 py-2 text-xs bg-campo-arena/60 border border-campo-borde rounded-lg text-campo-texto font-mono font-bold">
                    ${costoTotalEstimado.toLocaleString()} USD
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-campo-texto mb-1">Instrucciones al Maquinista</label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Volumen de agua por ha, tamaño de gota, condiciones de viento..."
                  className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-campo-borde">
                <button
                  type="button"
                  onClick={() => setModalNuevaOTOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-campo-muted hover:text-campo-texto rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-campo-verde hover:bg-campo-oliva text-white rounded-lg shadow-sm"
                >
                  Emitir Orden de Trabajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL CIERRE DE LABOR (FN-2.5) */}
      {/* ====================================================================== */}
      {modalCierreOpen && otSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-campo-card border border-campo-borde rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-campo-blanco border-b border-campo-borde flex items-center justify-between">
              <h3 className="text-sm font-bold text-campo-texto">
                Cierre de Labor a Campo & Rebaja de Insumos (FN-2.5)
              </h3>
              <button onClick={() => setModalCierreOpen(false)} className="text-campo-muted hover:text-campo-texto">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-campo-arena/40 p-3 rounded-xl border border-campo-borde text-xs space-y-1">
                <p><strong>OT:</strong> {otSeleccionada.numeroOt} &bull; <span className="capitalize">{otSeleccionada.tipoLabor}</span></p>
                <p><strong>Contratista:</strong> {otSeleccionada.contratista}</p>
                <p><strong>Hectáreas Teóricas:</strong> {otSeleccionada.superficieTotalHa} ha</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-campo-texto mb-1">
                  Superficie Real Efectivamente Aplicada (ha) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={superficieReal}
                  onChange={(e) => setSuperficieReal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto font-mono font-bold focus:outline-none focus:border-campo-verde"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-campo-texto mb-1">
                  Fecha de Cierre / Finalización
                </label>
                <input
                  type="date"
                  value={fechaCierre}
                  onChange={(e) => setFechaCierre(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto focus:outline-none focus:border-campo-verde"
                />
              </div>

              <div className="p-3 bg-campo-verde/10 border border-campo-verde/30 rounded-xl text-xs text-campo-bosque">
                <CheckCircle className="w-4 h-4 text-campo-verde inline mr-1.5" />
                Al confirmar el cierre, los insumos prescriptos se descontarán automáticamente del inventario y el costo quedará asentado.
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-campo-borde">
                <button
                  onClick={() => setModalCierreOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-campo-muted hover:text-campo-texto rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarCierre}
                  className="px-5 py-2 text-xs font-bold bg-campo-verde hover:bg-campo-oliva text-white rounded-lg shadow-sm"
                >
                  Confirmar Cierre de Labor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL EMISIÓN FORMAL DE OT (FN-2.4) */}
      {/* ====================================================================== */}
      {modalDetalleOpen && otSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-campo-card border border-campo-borde rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-campo-bosque text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded text-campo-arena font-semibold">
                  Orden de Trabajo Oficial &bull; {otSeleccionada.numeroOt}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Establecimiento {tenant?.nombreFantasia || 'La Juanita'}
                </h3>
              </div>
              <button onClick={() => setModalDetalleOpen(false)} className="text-campo-arena hover:text-white">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-campo-texto flex-1 bg-campo-blanco">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-campo-borde">
                <div>
                  <span className="text-campo-muted block">Labor a Ejecutar:</span>
                  <strong className="text-sm capitalize">{otSeleccionada.tipoLabor}</strong>
                </div>
                <div>
                  <span className="text-campo-muted block">Fecha de Emisión:</span>
                  <strong>{otSeleccionada.fechaEmision}</strong>
                </div>
                <div>
                  <span className="text-campo-muted block">Contratista / Maquinista:</span>
                  <strong>{otSeleccionada.contratista}</strong>
                </div>
                <div>
                  <span className="text-campo-muted block">Superficie Total:</span>
                  <strong className="font-mono text-campo-verde text-sm">{otSeleccionada.superficieTotalHa} ha</strong>
                </div>
              </div>

              {/* Lotes */}
              <div>
                <h4 className="font-bold text-campo-texto mb-2">Parcelas Asignadas:</h4>
                <div className="space-y-1">
                  {otSeleccionada.lotes.map((l, i) => (
                    <div key={i} className="flex justify-between p-2 bg-campo-card border border-campo-borde rounded-lg">
                      <span>{l.loteNombre || `Lote ${i + 1}`}</span>
                      <span className="font-mono font-bold text-campo-oliva">{l.superficieHa} ha</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insumos y Dosis */}
              <div>
                <h4 className="font-bold text-campo-texto mb-2">Receta de Insumos y Dosis:</h4>
                <div className="border border-campo-borde rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-campo-arena/60 text-campo-texto font-bold">
                      <tr>
                        <th className="p-2.5">Insumo</th>
                        <th className="p-2.5">Dosis / ha</th>
                        <th className="p-2.5 text-right">Volumen Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-campo-borde">
                      {otSeleccionada.insumos.map((ins, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-medium">{ins.productoNombre}</td>
                          <td className="p-2.5 font-mono">{ins.dosisHa} {ins.unidad}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-campo-oliva">
                            {ins.cantidadTotalCalculada} {ins.unidad.split('/')[0]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {otSeleccionada.observaciones && (
                <div className="p-3 bg-campo-arena/40 border border-campo-borde rounded-xl">
                  <span className="text-campo-muted block font-semibold mb-0.5">Observaciones Técnicas:</span>
                  <p>{otSeleccionada.observaciones}</p>
                </div>
              )}

              {/* Indicador de Privacidad */}
              <div className="text-[11px] text-campo-muted border-t border-campo-borde pt-2 flex items-center justify-between">
                <span>Impresión operativa sin precios para el contratista</span>
                {puedeVerPrecios && (
                  <span className="font-mono text-campo-texto">Tarifa Dueño: ${otSeleccionada.costoTotalEstimadoUsd} USD</span>
                )}
              </div>
            </div>

            <div className="p-4 bg-campo-card border-t border-campo-borde flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold bg-campo-blanco border border-campo-borde hover:border-campo-verde text-campo-texto rounded-lg flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-campo-oliva" />
                <span>Imprimir OT</span>
              </button>
              <button
                onClick={() => setModalDetalleOpen(false)}
                className="px-4 py-2 text-xs font-bold bg-campo-verde text-white rounded-lg shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
