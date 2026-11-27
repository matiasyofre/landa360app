// ==============================================================================
// LANDA360: FN-3.9 COSTOS GANADEROS POR RODEO Y CATEGORÍA
// Cálculo algorítmico: Costo por Kilo Producido ($/kg) = Costos Directos / Kilos Ganados
// Con estricta protección de privacidad financiera (FN-1.3)
// ==============================================================================

import React, { useState } from 'react';
import { ganaderiaService } from '../../services/ganaderiaService';
import { CostoGanadero, Rodeo, RubroCostoGanadero } from '../../types/ganaderia';
import { DollarSign, Plus, Lock, TrendingDown, PieChart, ShieldCheck } from 'lucide-react';

interface Props {
  canViewFinancials?: boolean; // FN-1.3
}

export const CostosGanaderosView: React.FC<Props> = ({ canViewFinancials = true }) => {
  const [costos, setCostos] = useState<CostoGanadero[]>(ganaderiaService.getCostos());
  const [rodeos] = useState<Rodeo[]>(ganaderiaService.getRodeos());

  const [modalCosto, setModalCosto] = useState(false);
  const [formCosto, setFormCosto] = useState<Partial<CostoGanadero>>({
    fecha: new Date().toISOString().split('T')[0],
    rodeo_id: rodeos[0]?.id || '',
    rubro: 'Alimentación y Pasturas',
    monto_usd: 500,
    monto_ars: 625000,
    descripcion: '',
    comprobante_nro: ''
  });

  // Si no tiene permisos FN-1.3 (e.g. Capataz o Contratista)
  if (!canViewFinancials) {
    return (
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] p-12 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#C65B50]/15 flex items-center justify-center text-[#C65B50] mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#24382C] mb-1">Módulo de Costos Protegido (FN-1.3)</h3>
        <p className="text-xs text-[#74796D] max-w-md mx-auto">
          Su rol operativo actual no cuenta con autorización para visualizar márgenes y costos directos de hacienda.
        </p>
      </div>
    );
  }

  const handleGuardarCosto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCosto.descripcion || !formCosto.monto_usd) return;

    const item: CostoGanadero = {
      id: `cst-${Date.now()}`,
      tenant_id: 'default',
      fecha: formCosto.fecha || new Date().toISOString().split('T')[0],
      rodeo_id: formCosto.rodeo_id,
      rubro: formCosto.rubro || 'Alimentación y Pasturas',
      monto_usd: Number(formCosto.monto_usd),
      monto_ars: Number(formCosto.monto_ars) || Number(formCosto.monto_usd) * 1250,
      descripcion: formCosto.descripcion,
      comprobante_nro: formCosto.comprobante_nro
    };

    const updated = ganaderiaService.saveCosto(item);
    setCostos(updated);
    setModalCosto(false);
  };

  // Cálculos de costo por kilo
  const totalCostosUSD = costos.reduce((acc, c) => acc + c.monto_usd, 0);
  const totalCostosARS = costos.reduce((acc, c) => acc + c.monto_ars, 0);
  // Estimación de kilos ganados (ej. 1850 kg en el período)
  const kilosGanadosEstimados = 2450;
  const costoPorKiloUSD = kilosGanadosEstimados > 0 ? (totalCostosUSD / kilosGanadosEstimados).toFixed(2) : '0.00';
  const costoPorKiloARS = kilosGanadosEstimados > 0 ? (totalCostosARS / kilosGanadosEstimados).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* HEADER DE COSTOS */}
      <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#83A653]" />
            <h3 className="text-lg font-bold text-[#24382C]">Costos Ganaderos & Costo por Kilo Producido ($/kg)</h3>
          </div>
          <p className="text-xs text-[#74796D] mt-0.5">
            Asignación directa de suplementación, pasturas, sanidad y jornales para calcular el costo real de conversión (FN-3.9).
          </p>
        </div>

        <button
          onClick={() => setModalCosto(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Imputar Costo Ganadero
        </button>
      </div>

      {/* MÉTRICAS DE COSTO & $/KG */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#83A653]/15 flex items-center justify-center text-[#83A653]">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">Costo por Kilo Producido</p>
            <p className="text-2xl font-bold font-mono text-[#24382C]">
              USD {costoPorKiloUSD} <span className="text-xs text-[#74796D]">/kg</span>
            </p>
            <p className="text-[11px] font-mono text-[#536747] font-semibold">${costoPorKiloARS} ARS /kg</p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#24382C]/10 flex items-center justify-center text-[#24382C]">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">Costos Directos Totales</p>
            <p className="text-2xl font-bold font-mono text-[#24382C]">
              USD {totalCostosUSD.toLocaleString('es-AR')}
            </p>
            <p className="text-[11px] font-mono text-[#74796D]">${totalCostosARS.toLocaleString('es-AR')} ARS</p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#B6A77D]/20 flex items-center justify-center text-[#83A653]">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">Kilos Producidos Período</p>
            <p className="text-2xl font-bold font-mono text-[#536747]">
              {kilosGanadosEstimados.toLocaleString()} <span className="text-xs font-normal text-[#74796D]">kg carne</span>
            </p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#38845A]/15 flex items-center justify-center text-[#38845A]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#74796D] uppercase">Seguridad FN-1.3</p>
            <p className="text-sm font-bold text-[#38845A]">Acceso Restringido</p>
            <p className="text-[11px] text-[#74796D]">Oculto para personal de manga</p>
          </div>
        </div>
      </div>

      {/* TABLA DE IMPUTACIONES DE COSTO */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DDDCD1] flex justify-between items-center bg-[#F7F7F2]/60">
          <h4 className="font-bold text-sm text-[#24382C]">Detalle de Gastos Directos Imputados</h4>
          <span className="text-xs text-[#74796D]">FN-3.9 Finanzas Ganaderas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#343B2D]">
            <thead className="bg-[#F7F7F2] text-[#74796D] uppercase text-[10px] tracking-wider border-b border-[#DDDCD1]">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Rodeo Asignado</th>
                <th className="py-3 px-4">Rubro</th>
                <th className="py-3 px-4">Descripción del Gasto</th>
                <th className="py-3 px-4 text-right">Monto (USD)</th>
                <th className="py-3 px-4 text-right">Monto (ARS)</th>
                <th className="py-3 px-4">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDCD1]">
              {costos.map(c => (
                <tr key={c.id} className="hover:bg-[#F7F7F2]/60">
                  <td className="py-3 px-4 font-mono text-[#74796D]">{c.fecha}</td>
                  <td className="py-3 px-4 font-bold text-[#24382C]">{c.rodeo_nombre || 'General'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E9E5D9] text-[#24382C]">
                      {c.rubro}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium">{c.descripcion}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#24382C]">
                    USD {c.monto_usd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#74796D]">
                    ${c.monto_ars.toLocaleString('es-AR')}
                  </td>
                  <td className="py-3 px-4 text-[#74796D] font-mono text-[11px]">{c.comprobante_nro || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REGISTRAR COSTO */}
      {modalCosto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleGuardarCosto} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DDDCD1]">
            <h3 className="text-base font-bold text-[#24382C] mb-4">Imputar Costo Ganadero</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Descripción del Concepto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Compra de 50 rollos de alfalfa"
                  value={formCosto.descripcion}
                  onChange={e => setFormCosto({ ...formCosto, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Rubro de Costo</label>
                  <select
                    value={formCosto.rubro}
                    onChange={e => setFormCosto({ ...formCosto, rubro: e.target.value as RubroCostoGanadero })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  >
                    <option value="Alimentación y Pasturas">Alimentación y Pasturas</option>
                    <option value="Sanidad y Veterinaria">Sanidad y Veterinaria</option>
                    <option value="Manga y Personal">Manga y Personal</option>
                    <option value="Fletes y Guías">Fletes y Guías</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Rodeo Asignado</label>
                  <select
                    value={formCosto.rodeo_id}
                    onChange={e => setFormCosto({ ...formCosto, rodeo_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                  >
                    {rodeos.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Monto (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formCosto.monto_usd}
                    onChange={e => {
                      const usd = parseFloat(e.target.value) || 0;
                      setFormCosto({ ...formCosto, monto_usd: usd, monto_ars: Math.round(usd * 1250) });
                    }}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono font-bold text-[#24382C] focus:outline-none focus:border-[#83A653]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#343B2D] mb-1">Monto (ARS)</label>
                  <input
                    type="number"
                    value={formCosto.monto_ars}
                    onChange={e => setFormCosto({ ...formCosto, monto_ars: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg font-mono focus:outline-none focus:border-[#83A653]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#343B2D] mb-1">Factura / Remito N°</label>
                <input
                  type="text"
                  placeholder="Ej. FC A 0001-0004928"
                  value={formCosto.comprobante_nro}
                  onChange={e => setFormCosto({ ...formCosto, comprobante_nro: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalCosto(false)}
                className="px-4 py-2 border border-[#DDDCD1] rounded-lg text-xs font-semibold text-[#74796D] hover:bg-[#F7F7F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white rounded-lg text-xs font-bold transition-colors"
              >
                Imputar Gasto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
