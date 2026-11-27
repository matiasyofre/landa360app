import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { agricolaService } from '../../services/agricolaService';
import { MargenBrutoLote, Lote, Campana } from '../../types/agricola';
import { 
  TrendingUp, 
  Calendar, 
  Lock, 
  Calculator 
} from 'lucide-react';

export const MargenBrutoTablero: React.FC = () => {
  const { tenant, rolActivo } = useAuth();
  const tenantId = tenant?.id || 'demo-tenant-id';

  // Blindaje de Seguridad FN-1.3: Ver balances y márgenes
  const puedeVerMargen = rolActivo?.funcionesIds.includes('fn_1_3_privacidad_precios') ||
                         rolActivo?.nombre.toLowerCase().includes('dueño') ||
                         rolActivo?.nombre.toLowerCase().includes('contador') ||
                         rolActivo?.nombre.toLowerCase().includes('administrador');

  const [margenes, setMargenes] = useState<MargenBrutoLote[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [campanaId, setCampanaId] = useState<string>('');

  // Modal simulador / edición
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [formRinde, setFormRinde] = useState<number>(32); // qq/ha
  const [formPrecio, setFormPrecio] = useState<number>(31.5); // USD/qq
  const [formSemilla, setFormSemilla] = useState<number>(65); // USD/ha
  const [formFertilizante, setFormFertilizante] = useState<number>(110); // USD/ha
  const [formFitosanitarios, setFormFitosanitarios] = useState<number>(85); // USD/ha
  const [formLabores, setFormLabores] = useState<number>(75); // USD/ha
  const [formCosecha, setFormCosecha] = useState<number>(68); // USD/ha

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  const cargarDatos = async () => {
    try {
      const [lotesData, campanasData] = await Promise.all([
        agricolaService.obtenerLotes(tenantId),
        agricolaService.obtenerCampanas(tenantId)
      ]);
      setLotes(lotesData);
      setCampanas(campanasData);

      const activa = campanasData.find(c => c.activa) || campanasData[0];
      const cId = activa ? activa.id : '';
      setCampanaId(cId);

      if (cId) {
        const margenesData = await agricolaService.obtenerMargenesBrutos(tenantId, cId);
        setMargenes(margenesData);
      }
    } catch (err) {
      console.error('Error al cargar margenes:', err);
    }
  };

  const cambiarCampana = async (newCampId: string) => {
    setCampanaId(newCampId);
    try {
      const margenesData = await agricolaService.obtenerMargenesBrutos(tenantId, newCampId);
      setMargenes(margenesData);
    } catch (err) {
      console.error('Error al cambiar campana:', err);
    }
  };

  const handleAbrirSimulador = (lote: Lote) => {
    setLoteSeleccionado(lote);
    const existente = margenes.find(m => m.loteId === lote.id);
    if (existente) {
      setFormRinde(existente.rindeEstimadoQqHa);
      setFormPrecio(existente.precioVentaUsdQq);
      setFormSemilla(existente.costoSemillaUsdHa);
      setFormFertilizante(existente.costoFertilizantesUsdHa);
      setFormFitosanitarios(existente.costoFitosanitariosUsdHa);
      setFormLabores(existente.costoLaboresUsdHa);
      setFormCosecha(existente.costoCosechaUsdHa);
    } else {
      // Valores estándar iniciales
      setFormRinde(32);
      setFormPrecio(31.5);
      setFormSemilla(65);
      setFormFertilizante(110);
      setFormFitosanitarios(85);
      setFormLabores(75);
      setFormCosecha(68);
    }
    setModalEditOpen(true);
  };

  const handleGuardarMargen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteSeleccionado) return;

    try {
      await agricolaService.guardarMargenBruto(tenantId, {
        loteId: loteSeleccionado.id,
        loteNombre: loteSeleccionado.nombre,
        cultivoNombre: loteSeleccionado.cultivoNombre,
        superficieHa: loteSeleccionado.superficieHa,
        campanaId,
        rindeEstimadoQqHa: formRinde,
        precioVentaUsdQq: formPrecio,
        costoSemillaUsdHa: formSemilla,
        costoFertilizantesUsdHa: formFertilizante,
        costoFitosanitariosUsdHa: formFitosanitarios,
        costoLaboresUsdHa: formLabores,
        costoCosechaUsdHa: formCosecha
      });

      setModalEditOpen(false);
      setLoteSeleccionado(null);
      await cambiarCampana(campanaId);
    } catch (err) {
      console.error('Error al guardar margen bruto:', err);
    }
  };

  // Cálculos en vivo en el simulador
  const totalCostosDirectosSim = formSemilla + formFertilizante + formFitosanitarios + formLabores + formCosecha;
  const ingresoBrutoSim = formRinde * formPrecio;
  const margenBrutoHaSim = Number((ingresoBrutoSim - totalCostosDirectosSim).toFixed(2));
  const margenTotalLoteSim = Number((margenBrutoHaSim * (loteSeleccionado?.superficieHa || 100)).toFixed(2));

  // Métricas globales del campo
  const totalSuperficie = lotes.reduce((acc, l) => acc + l.superficieHa, 0);
  const totalMargenCampoUsd = margenes.reduce((acc, m) => acc + (m.margenTotalLoteUsd || 0), 0);
  const promedioMargenHaUsd = totalSuperficie > 0 ? Number((totalMargenCampoUsd / totalSuperficie).toFixed(2)) : 0;

  if (!puedeVerMargen) {
    return (
      <div className="bg-campo-card border border-amber-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
        <Lock className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-campo-texto">Módulo Restringido por Política FN-1.3</h3>
        <p className="text-xs text-campo-muted mt-2 leading-relaxed">
          Tu rol activo no cuenta con la función <strong>FN-1.3: Ver Precios, Costos y Balances</strong>. Toda información de márgenes brutos, rindes en moneda y rentabilidad patrimonial está blindada y confidencial.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-campo-card p-5 rounded-2xl border border-campo-borde shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-campo-oliva bg-campo-arena px-2 py-0.5 rounded border border-campo-borde">
              FN-2.8 &bull; Finanzas Agrícolas & Rentabilidad por Lote
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-campo-texto">
            Tablero de Margen Bruto Agrícola ($/ha y USD)
          </h2>
          <p className="text-xs text-campo-muted">
            Comparativa de rinde cosechado vs estructura de costos directos (semilla, fertilizante, labores y cosecha)
          </p>
        </div>

        <div className="flex items-center gap-2 bg-campo-blanco px-3 py-1.5 rounded-xl border border-campo-borde text-xs">
          <Calendar className="w-4 h-4 text-campo-oliva" />
          <select
            value={campanaId}
            onChange={(e) => cambiarCampana(e.target.value)}
            className="bg-transparent text-xs font-bold text-campo-texto focus:outline-none cursor-pointer"
          >
            {campanas.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-campo-card border border-campo-borde rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-campo-muted block">Margen Bruto Total Proyectado</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-campo-verde font-mono">
              ${totalMargenCampoUsd.toLocaleString()}
            </span>
            <span className="text-xs text-campo-muted font-semibold">USD</span>
          </div>
          <span className="text-[11px] text-campo-oliva font-medium mt-1 block">
            Sobre {totalSuperficie.toFixed(0)} ha implantadas
          </span>
        </div>

        <div className="bg-campo-card border border-campo-borde rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-campo-muted block">Margen Promedio Ponderado</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-campo-texto font-mono">
              ${promedioMargenHaUsd.toFixed(1)}
            </span>
            <span className="text-xs text-campo-muted font-semibold">USD / ha</span>
          </div>
          <span className="text-[11px] text-campo-verde font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Rentabilidad positiva neta
          </span>
        </div>

        <div className="bg-campo-card border border-campo-borde rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-campo-muted block">Lotes con Análisis Cargado</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-campo-texto font-mono">
              {margenes.length} / {lotes.length}
            </span>
            <span className="text-xs text-campo-muted font-semibold">lotes</span>
          </div>
          <span className="text-[11px] text-campo-muted mt-1 block">
            Haz clic en "Calcular / Editar" para simular
          </span>
        </div>
      </div>

      {/* Tabla Desglosada de Lotes */}
      <div className="bg-campo-card border border-campo-borde rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-campo-blanco border-b border-campo-borde flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-campo-texto">
            Desglose de Costos e Ingresos por Parcela
          </h3>
          <span className="text-xs text-campo-muted">Valores expresados en USD</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-campo-arena/50 text-campo-texto font-bold border-b border-campo-borde">
              <tr>
                <th className="p-3">Lote & Cultivo</th>
                <th className="p-3">Superficie</th>
                <th className="p-3">Rinde (qq/ha)</th>
                <th className="p-3">Precio (USD/qq)</th>
                <th className="p-3">Costos Dir. ($/ha)</th>
                <th className="p-3 text-right">Margen ($/ha)</th>
                <th className="p-3 text-right">Margen Lote</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-campo-borde">
              {lotes.map((lote) => {
                const mb = margenes.find(m => m.loteId === lote.id);
                const costosHa = mb 
                  ? (mb.costoSemillaUsdHa + mb.costoFertilizantesUsdHa + mb.costoFitosanitariosUsdHa + mb.costoLaboresUsdHa + mb.costoCosechaUsdHa)
                  : 0;
                
                return (
                  <tr key={lote.id} className="hover:bg-campo-blanco/60 transition-colors">
                    <td className="p-3 font-semibold text-campo-texto">
                      <div>{lote.nombre}</div>
                      <span className="text-[10px] text-campo-oliva font-normal">{lote.cultivoNombre || 'Barbecho'}</span>
                    </td>
                    <td className="p-3 font-mono">{lote.superficieHa} ha</td>
                    <td className="p-3 font-mono">{mb ? `${mb.rindeEstimadoQqHa} qq` : '-'}</td>
                    <td className="p-3 font-mono">{mb ? `$${mb.precioVentaUsdQq}` : '-'}</td>
                    <td className="p-3 font-mono text-campo-muted">{mb ? `$${costosHa.toFixed(1)}` : '-'}</td>
                    <td className="p-3 text-right font-mono font-bold text-campo-verde">
                      {mb ? `$${mb.margenBrutoUsdHa?.toFixed(1)}/ha` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-campo-texto">
                      {mb ? `$${mb.margenTotalLoteUsd?.toLocaleString()} USD` : '-'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleAbrirSimulador(lote)}
                        className="px-2.5 py-1 text-xs font-semibold bg-campo-blanco border border-campo-borde hover:border-campo-verde text-campo-texto rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Calculator className="w-3.5 h-3.5 text-campo-oliva" />
                        <span>{mb ? 'Simular' : 'Calcular'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* MODAL SIMULADOR INTERACTIVO DE MARGEN BRUTO */}
      {/* ====================================================================== */}
      {modalEditOpen && loteSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-campo-card border border-campo-borde rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-campo-blanco border-b border-campo-borde flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-campo-texto">
                  Simulador de Margen Bruto &bull; {loteSeleccionado.nombre}
                </h3>
                <p className="text-xs text-campo-muted">
                  Cultivo: {loteSeleccionado.cultivoNombre || 'Soja 1ra'} &bull; Superficie: {loteSeleccionado.superficieHa} ha
                </p>
              </div>
              <button onClick={() => setModalEditOpen(false)} className="text-campo-muted hover:text-campo-texto">✕</button>
            </div>

            <form onSubmit={handleGuardarMargen} className="p-5 space-y-4 text-xs">
              
              {/* Rinde & Precio */}
              <div className="p-3 bg-campo-arena/40 rounded-xl border border-campo-borde grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-campo-texto mb-1">
                    Rinde Estimado (Quintales/ha)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formRinde}
                    onChange={(e) => setFormRinde(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto font-mono font-bold focus:outline-none focus:border-campo-verde"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-campo-texto mb-1">
                    Precio Estimado de Venta (USD/qq)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formPrecio}
                    onChange={(e) => setFormPrecio(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-campo-blanco border border-campo-borde rounded-lg text-campo-texto font-mono font-bold focus:outline-none focus:border-campo-verde"
                  />
                </div>
              </div>

              {/* Estructura de Costos Directos */}
              <div className="space-y-2">
                <span className="font-bold text-campo-texto block">Estructura de Costos Directos ($/ha):</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-campo-muted block">Semilla ($/ha)</label>
                    <input
                      type="number"
                      value={formSemilla}
                      onChange={(e) => setFormSemilla(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-campo-blanco border border-campo-borde rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-campo-muted block">Fertilizantes ($/ha)</label>
                    <input
                      type="number"
                      value={formFertilizante}
                      onChange={(e) => setFormFertilizante(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-campo-blanco border border-campo-borde rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-campo-muted block">Fitosanitarios ($/ha)</label>
                    <input
                      type="number"
                      value={formFitosanitarios}
                      onChange={(e) => setFormFitosanitarios(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-campo-blanco border border-campo-borde rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-campo-muted block">Labores Maquinaria ($/ha)</label>
                    <input
                      type="number"
                      value={formLabores}
                      onChange={(e) => setFormLabores(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-campo-blanco border border-campo-borde rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-campo-muted block">Cosecha ($/ha)</label>
                    <input
                      type="number"
                      value={formCosecha}
                      onChange={(e) => setFormCosecha(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-campo-blanco border border-campo-borde rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-campo-muted block">Total Costos Dir.</label>
                    <div className="w-full px-2 py-1 bg-campo-arena/60 border border-campo-borde rounded text-xs font-mono font-bold">
                      ${totalCostosDirectosSim.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resultado en Vivo */}
              <div className="p-3 bg-campo-verde/10 border border-campo-verde/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-campo-bosque block">Margen Bruto Proyectado</span>
                  <span className="text-xl font-extrabold text-campo-bosque font-mono">
                    ${margenBrutoHaSim} USD / ha
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-campo-muted block">Total Lote ({loteSeleccionado.superficieHa} ha)</span>
                  <span className="text-sm font-bold text-campo-verde font-mono">
                    ${margenTotalLoteSim.toLocaleString()} USD
                  </span>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-campo-borde">
                <button
                  type="button"
                  onClick={() => setModalEditOpen(false)}
                  className="px-4 py-2 font-semibold text-campo-muted hover:text-campo-texto rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-campo-verde hover:bg-campo-oliva text-white rounded-lg shadow-sm"
                >
                  Guardar en Tablero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
