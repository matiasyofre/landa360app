// ==============================================================================
// LANDA360: FN-3.4 INGESTA INTELIGENTE & PARSER HEURÍSTICO DE BASTÓN RFID
// & FN-3.5 DETECCIÓN AUTOMÁTICA DE INCONSISTENCIAS GANADERAS
// ==============================================================================

import React, { useState } from 'react';
import { ganaderiaService } from '../../services/ganaderiaService';
import { InconsistenciaGanadera, Rodeo, PotreroGanadero, Animal } from '../../types/ganaderia';
import { Cpu, UploadCloud, AlertTriangle, CheckCircle2, ShieldAlert, FileText, Check, Database } from 'lucide-react';

interface Props {
  onLecturaConsolidada?: () => void;
}

export const IngestaRfidView: React.FC<Props> = ({ onLecturaConsolidada }) => {
  const [rodeos] = useState<Rodeo[]>(ganaderiaService.getRodeos());
  const [potreros] = useState<PotreroGanadero[]>(ganaderiaService.getPotreros());

  const [rodeoSeleccionado, setRodeoSeleccionado] = useState(rodeos[0]?.id || '');
  const [potreroSeleccionado, setPotreroSeleccionado] = useState(potreros[0]?.id || '');
  const [csvText, setCsvText] = useState('');
  const [nombreArchivo, setNombreArchivo] = useState('');

  const [resultadoParser, setResultadoParser] = useState<{
    lecturas: { rfid?: string; visual?: string; peso?: number; fecha?: string }[];
    inconsistencias: InconsistenciaGanadera[];
  } | null>(null);

  const [consolidadoExitoso, setConsolidadoExitoso] = useState(false);

  // Muestra de archivo real de bastón Tru-Test / Allflex
  const cargarArchivoMuestra = () => {
    const muestra = `RFID,Visual_ID,Weight_kg,DateTime
982000412891001,A-101,446.5,2026-11-27 08:32:10
982000412891002,A-102,431.0,2026-11-27 08:33:45
982000412891003,N-201,365.2,2026-11-27 08:35:12
982000412891004,N-202,371.8,2026-11-27 08:36:50
982000412891001,A-101,446.5,2026-11-27 08:38:05
982000412891005,T-01,690.0,2026-11-27 08:40:22
982000412891009,A-109,380.0,2026-11-27 08:42:15`;
    setCsvText(muestra);
    setNombreArchivo('TruTest_SRS2_MangaPrincipal_20261127.csv');
    setConsolidadoExitoso(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNombreArchivo(file.name);
    setConsolidadoExitoso(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleProcesar = () => {
    if (!csvText.trim()) return;
    const res = ganaderiaService.parsearLecturaBastones(csvText);
    setResultadoParser(res);
    setConsolidadoExitoso(false);
  };

  const handleConsolidarEnStock = () => {
    if (!resultadoParser || resultadoParser.lecturas.length === 0) return;

    const animalesExistentes = ganaderiaService.getAnimales();
    const categorias = ganaderiaService.getCategorias();
    const catDefault = categorias[0]?.id || '';

    resultadoParser.lecturas.forEach(l => {
      const exist = animalesExistentes.find(a => (l.rfid && a.caravana_rfid === l.rfid) || (l.visual && a.caravana_visual === l.visual));

      if (exist) {
        // Registrar pesada y actualizar
        if (l.peso) {
          ganaderiaService.registrarPesada({
            animal_id: exist.id,
            fecha: l.fecha ? l.fecha.split(' ')[0] : new Date().toISOString().split('T')[0],
            peso_kg: l.peso,
            origen_pesada: 'Bastón RFID Tru-Test'
          });
        }
        if (rodeoSeleccionado) exist.rodeo_id = rodeoSeleccionado;
        if (potreroSeleccionado) exist.potrero_id = potreroSeleccionado;
        ganaderiaService.saveAnimal(exist);
      } else {
        // Dar de alta nuevo animal detectado en la manga
        const nuevo: Animal = {
          id: `ani-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          tenant_id: 'default',
          caravana_rfid: l.rfid,
          caravana_visual: l.visual || (l.rfid ? `CAR-${l.rfid.slice(-4)}` : `SIN-${Date.now()}`),
          categoria_id: catDefault,
          rodeo_id: rodeoSeleccionado,
          potrero_id: potreroSeleccionado,
          raza: 'Angus Negro',
          sexo: 'Hembra',
          peso_actual_kg: l.peso || 350,
          fecha_ultima_pesada: l.fecha ? l.fecha.split(' ')[0] : new Date().toISOString().split('T')[0],
          gdp_historica_kg_dia: 0,
          estado: 'Activo',
          origen: 'Propio (Nacido)'
        };
        ganaderiaService.saveAnimal(nuevo);
      }
    });

    setConsolidadoExitoso(true);
    onLecturaConsolidada?.();
  };

  return (
    <div className="space-y-6">
      {/* HEADER DE INGESTA */}
      <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DDDCD1] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#83A653]" />
            <h3 className="text-lg font-bold text-[#24382C]">Ingesta Inteligente de Bastón RFID & Auditoría de Manga</h3>
          </div>
          <p className="text-xs text-[#74796D] mt-0.5">
            Parser heurístico tolerante a fallas para lectores Tru-Test, Allflex, Gallagher y Datamars con detección preventiva de inconsistencias (FN-3.4 y FN-3.5).
          </p>
        </div>

        <button
          onClick={cargarArchivoMuestra}
          className="text-xs font-bold text-[#536747] hover:text-[#24382C] px-3 py-1.5 bg-[#F7F7F2] hover:bg-[#E9E5D9] border border-[#DDDCD1] rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          Cargar Archivo Muestra Tru-Test
        </button>
      </div>

      {/* ZONA DE CARGA Y PARSEO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL IZQUIERDO: CONFIGURACIÓN DE MANGA & SUBIDA */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-[#24382C] pb-2 border-b border-[#DDDCD1]">
            1. Parámetros de la Pasada de Manga
          </h4>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#343B2D] mb-1">Rodeo en Manga</label>
              <select
                value={rodeoSeleccionado}
                onChange={e => setRodeoSeleccionado(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
              >
                {rodeos.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#343B2D] mb-1">Potrero Asignado Post-Manga</label>
              <select
                value={potreroSeleccionado}
                onChange={e => setPotreroSeleccionado(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDDCD1] rounded-lg focus:outline-none focus:border-[#83A653]"
              >
                {potreros.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            {/* Zona Dropfile */}
            <div className="mt-4 pt-4 border-t border-[#DDDCD1]">
              <label className="block font-semibold text-[#343B2D] mb-2">Archivo CSV / TXT del Bastón</label>
              <div className="border-2 border-dashed border-[#DDDCD1] hover:border-[#83A653] rounded-xl p-4 text-center cursor-pointer bg-[#F7F7F2]/50 transition-colors relative">
                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-[#83A653] mx-auto mb-2" />
                <span className="text-xs font-bold text-[#24382C] block">
                  {nombreArchivo || 'Arrastre su archivo o haga clic aquí'}
                </span>
                <span className="text-[10px] text-[#74796D] block mt-1">
                  Detecta columnas automáticamente (RFID, Visual, Peso, Fecha)
                </span>
              </div>
            </div>

            <button
              onClick={handleProcesar}
              disabled={!csvText.trim()}
              className="w-full py-2.5 bg-[#83A653] hover:bg-[#536747] disabled:bg-gray-300 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 mt-2"
            >
              <Cpu className="w-4 h-4" />
              Procesar y Auditar Lectura
            </button>
          </div>
        </div>

        {/* PANEL CENTRAL Y DERECHO: RESULTADOS & AUDITORÍA PREVENTIVA */}
        <div className="lg:col-span-2 space-y-4">
          {resultadoParser ? (
            <div className="space-y-4">
              {/* ALERTA DE INCONSISTENCIAS (FN-3.5) */}
              {resultadoParser.inconsistencias.length > 0 ? (
                <div className="bg-[#C65B50]/10 border border-[#C65B50]/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-[#C65B50]">
                    <ShieldAlert className="w-5 h-5 font-bold" />
                    <h4 className="font-bold text-sm">
                      FN-3.5: Se detectaron {resultadoParser.inconsistencias.length} Inconsistencias en la Manga
                    </h4>
                  </div>
                  <p className="text-xs text-[#343B2D] mb-3">
                    El auditor automático identificó lecturas duplicadas o saltos anómalos de peso antes de alterar el inventario:
                  </p>
                  <div className="space-y-2">
                    {resultadoParser.inconsistencias.map((inc, i) => (
                      <div key={i} className="bg-white p-2.5 rounded-xl border border-[#C65B50]/30 flex items-start gap-2 text-xs">
                        <AlertTriangle className="w-4 h-4 text-[#C65B50] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold font-mono text-[#24382C] mr-2">[{inc.caravana}]</span>
                          <span className="text-[#343B2D]">{inc.descripcion}</span>
                          {inc.fila && <span className="text-[10px] text-[#74796D] ml-2">(Fila {inc.fila})</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#38845A]/10 border border-[#38845A]/30 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#38845A]" />
                  <div>
                    <h4 className="font-bold text-xs text-[#38845A]">Auditoría Limpia: Cero Inconsistencias</h4>
                    <p className="text-[11px] text-[#343B2D]">Todos los chips y pesadas son biológicamente coherentes y sin duplicados.</p>
                  </div>
                </div>
              )}

              {/* TABLA DE LECTURAS DETECTADAS */}
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-xs text-[#24382C] uppercase tracking-wider">
                    Animales Leídos ({resultadoParser.lecturas.length} registros)
                  </h4>

                  {!consolidadoExitoso ? (
                    <button
                      onClick={handleConsolidarEnStock}
                      className="px-4 py-2 bg-[#24382C] hover:bg-[#343B2D] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Database className="w-3.5 h-3.5" />
                      Consolidar en Stock e Historial
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-[#38845A]/15 text-[#38845A] font-bold text-xs rounded-xl flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Lectura Consolidada con Éxito
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs text-[#343B2D]">
                    <thead className="bg-[#F7F7F2] text-[#74796D] uppercase text-[10px] tracking-wider sticky top-0 border-b border-[#DDDCD1]">
                      <tr>
                        <th className="py-2.5 px-3">RFID Transponder</th>
                        <th className="py-2.5 px-3">Caravana Visual</th>
                        <th className="py-2.5 px-3 text-right">Peso Registrado</th>
                        <th className="py-2.5 px-3 text-right">Fecha / Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDDCD1]">
                      {resultadoParser.lecturas.map((lec, idx) => (
                        <tr key={idx} className="hover:bg-[#F7F7F2]/60">
                          <td className="py-2 px-3 font-mono text-[#536747] font-semibold">
                            {lec.rfid || <span className="text-gray-400 italic">No leído</span>}
                          </td>
                          <td className="py-2 px-3 font-bold text-[#24382C]">{lec.visual}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            {lec.peso ? `${lec.peso.toFixed(1)} kg` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right text-[#74796D] font-mono text-[11px]">
                            {lec.fecha}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#FFFFFF] rounded-2xl border border-dashed border-[#DDDCD1] p-12 text-center text-[#74796D]">
              <Cpu className="w-12 h-12 text-[#B6A77D] mx-auto mb-3" />
              <h4 className="font-bold text-sm text-[#24382C] mb-1">Sin archivo procesado</h4>
              <p className="text-xs max-w-sm mx-auto">
                Seleccione un archivo de su bastón o haga clic en "Cargar Archivo Muestra Tru-Test" para probar el parser y auditoría.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
