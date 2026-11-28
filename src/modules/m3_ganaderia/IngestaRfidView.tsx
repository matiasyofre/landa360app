// ==============================================================================
// LANDA360: FN-3.4 INGESTA INTELIGENTE & PARSER OFICIAL DE BASTÓN TRU-TEST
// & FN-3.5 DETECCIÓN AUTOMÁTICA DE INCONSISTENCIAS GANADERAS
// Compatible con archivos oficiales Tru-Test (Sesion4.csv y COLOC_VQ.csv)
// ==============================================================================

import React, { useState } from 'react';
import { ganaderiaService } from '../../services/ganaderiaService';
import { InconsistenciaGanadera, Rodeo, PotreroGanadero, Animal, LecturaRFID } from '../../types/ganaderia';
import { Cpu, UploadCloud, AlertTriangle, CheckCircle2, ShieldAlert, Check, Database, Scale, Heart } from 'lucide-react';

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
    lecturas: LecturaRFID[];
    inconsistencias: InconsistenciaGanadera[];
  } | null>(null);

  const [consolidadoExitoso, setConsolidadoExitoso] = useState(false);

  // Cargar archivo real de referencia: Sesión 4 (Pesadas en columna NOTA)
  const cargarMuestraSesion4 = () => {
    const raw = `EID,VID,Date,Time,NOTA
032 010012369503,9503,2026-08-14,02:11:13,290
032 010012369438,9438,2026-08-14,02:14:38,260
032 010012369302,9302,2026-08-14,02:15:31,250
032 010012369446,9446,2026-08-14,02:16:10,215
032 010012369341,9341,2026-08-14,02:16:40,180
032 010012369443,9443,2026-08-14,02:18:16,240
032 010012369456,9456,2026-08-14,02:18:57,235
032 010012369334,9334,2026-08-14,02:19:20,230
032 010012369483,9483,2026-08-14,02:19:42,270
032 010012369486,9486,2026-08-14,02:20:10,235
032 010012369467,9467,2026-08-14,02:24:06,290
032 010012369453,9453,2026-08-14,02:25:28,195
032 010012369468,9468,2026-08-14,02:26:12,210
032 010012369450,9450,2026-08-14,02:26:38,300
032 010012369434,9434,2026-08-14,02:27:27,2 10
032 010012369487,9487,2026-08-14,02:28:01,245
032 010012369451,9451,2026-08-14,02:28:55,285
032 010012369506,9506,2026-08-14,02:29:34,180
032 010012369470,9470,2026-08-14,02:31:12,245
032 010012369319,9319,2026-08-14,02:31:56,255
032 010012369332,9332,2026-08-14,02:32:28,390`;
    setCsvText(raw);
    setNombreArchivo('Tru-Test_2026-08-14_Sesion4.csv');
    setConsolidadoExitoso(false);
    const parsed = ganaderiaService.parsearLecturaBastones(raw);
    setResultadoParser(parsed);
  };

  // Cargar archivo real de referencia: Colocación y Tacto VQ (Condición, Tacto)
  const cargarMuestraColocVq = () => {
    const raw = `EID,VID,Date,Time,ADVERTENCIA,CONDICIÓN,TACTO,NOTA
032 010012369546,9546,2026-01-10,03:18:46,,6,PRENADA,
032 010013277285,7285,2026-01-10,03:21:48,,6,,
032 010013275754,5754,2026-01-10,03:23:53,,6,CICLICA,
032 010013277241,7241,2026-01-10,03:25:34,,6,CICLICA,
032 010013277235,7235,2026-01-10,03:27:12,,6,CICLICA,
032 010013277215,7215,2026-01-10,03:28:07,,7,CICLICA,
032 010013277174,7174,2026-01-10,03:29:32,,7,PRENADA,
032 010013277212,7212,2026-01-10,03:30:17,,7,PRENADA,
032 010013277262,7262,2026-01-10,03:31:17,,7,CICLICA,
032 010012369397,9397,2026-01-10,03:36:04,,5,NO APTA,
032 010012369332,9332,2026-01-10,03:36:36,,6,CICLICA,
032 010012369355,9355,2026-01-10,03:37:06,,6,CICLICA,
032 010012369311,9311,2026-01-10,03:37:44,,6,CICLICA,
032 010012369309,9309,2026-01-10,03:38:22,,6,CICLICA,
032 010012369357,9357,2026-01-10,03:39:12,,6,NO APTA,
032 010012369327,9327,2026-01-10,03:39:34,,6,CICLICA,
032 010012369302,9302,2026-01-10,03:40:07,,6,CICLICA,
032 010012369313,9313,2026-01-10,03:40:45,,6,CICLICA,
032 010012369344,9344,2026-01-10,03:41:41,,6,NO CICLICA,
032 010012369303,9303,2026-01-10,03:41:57,,6,CICLICA,
032 010012369334,9334,2026-01-10,03:42:26,,5,CICLICA,
032 010012369356,9356,2026-01-10,03:42:59,,7,CICLICA,
032 010012369348,9348,2026-01-10,03:43:39,,6,CICLICA,
032 010012369368,9368,2026-01-10,03:44:15,,6,CICLICA,
032 010012369458,9458,2026-01-10,03:44:52,,7,CICLICA,
032 010012369338,9338,2026-01-10,03:45:34,,6,NO APTA,`;
    setCsvText(raw);
    setNombreArchivo('Tru-Test_2026-10-01_COLOC_VQ.csv');
    setConsolidadoExitoso(false);
    const parsed = ganaderiaService.parsearLecturaBastones(raw);
    setResultadoParser(parsed);
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
      const parsed = ganaderiaService.parsearLecturaBastones(content);
      setResultadoParser(parsed);
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
      const eidKey = l.eid.replace(/\s+/g, '');
      const exist = animalesExistentes.find(a =>
        (eidKey && a.caravana_rfid?.replace(/\s+/g, '') === eidKey) ||
        (l.vid && a.caravana_visual === l.vid)
      );

      if (exist) {
        // Actualizar datos del animal existente
        if (l.peso && l.peso > 0) {
          ganaderiaService.registrarPesada({
            animal_id: exist.id,
            fecha: l.fecha,
            hora: l.hora,
            peso_kg: l.peso,
            condicion_corporal: l.condicion,
            tacto: l.tacto,
            origen_pesada: 'Bastón RFID Tru-Test'
          });
        }
        if (l.condicion) exist.condicion_corporal = l.condicion;
        if (l.tacto) exist.tacto = l.tacto;
        if (l.nota) exist.notas = l.nota;
        if (rodeoSeleccionado) exist.rodeo_id = rodeoSeleccionado;
        if (potreroSeleccionado) exist.potrero_id = potreroSeleccionado;
        ganaderiaService.saveAnimal(exist);
      } else {
        // Dar de alta nuevo animal registrado por la manga
        const nuevo: Animal = {
          id: `animal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          tenant_id: 'default',
          caravana_rfid: l.eid,
          caravana_visual: l.vid,
          categoria_id: catDefault,
          rodeo_id: rodeoSeleccionado,
          potrero_id: potreroSeleccionado,
          raza: 'Angus Negro',
          sexo: 'Hembra',
          peso_actual_kg: l.peso || 0,
          condicion_corporal: l.condicion,
          tacto: l.tacto,
          advertencia: l.advertencia,
          fecha_ultima_pesada: l.peso ? l.fecha : undefined,
          hora_ultima_pesada: l.hora,
          gdp_historica_kg_dia: 0,
          estado: 'Activo',
          origen: 'Propio (Nacido)',
          notas: l.nota
        };
        ganaderiaService.saveAnimal(nuevo);

        if (l.peso && l.peso > 0) {
          ganaderiaService.registrarPesada({
            animal_id: nuevo.id,
            fecha: l.fecha,
            hora: l.hora,
            peso_kg: l.peso,
            condicion_corporal: l.condicion,
            tacto: l.tacto,
            origen_pesada: 'Bastón RFID Tru-Test'
          });
        }
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
            <h3 className="text-lg font-bold text-[#24382C]">Ingesta de Archivo Oficial Tru-Test (FN-3.4 & FN-3.5)</h3>
          </div>
          <p className="text-xs text-[#74796D] mt-0.5">
            Parser de alta fidelidad para sesiones de balanza y bastón Tru-Test (columnas: EID, VID, Date, Time, Condición, Tacto, NOTA).
          </p>
        </div>

        {/* BOTONES DE ARCHIVO DE REFERENCIA REAL */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={cargarMuestraSesion4}
            className="text-xs font-bold text-[#24382C] hover:text-white hover:bg-[#536747] px-3 py-1.5 bg-[#F7F7F2] border border-[#DDDCD1] rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            title="Cargar archivo real de pesadas Sesion4.csv"
          >
            <Scale className="w-3.5 h-3.5 text-[#83A653]" />
            Cargar Sesión 4 (Pesadas)
          </button>
          <button
            onClick={cargarMuestraColocVq}
            className="text-xs font-bold text-[#24382C] hover:text-white hover:bg-[#536747] px-3 py-1.5 bg-[#F7F7F2] border border-[#DDDCD1] rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            title="Cargar archivo real de tacto y condición COLOC_VQ.csv"
          >
            <Heart className="w-3.5 h-3.5 text-[#C65B50]" />
            Cargar Tacto / Colocación VQ
          </button>
        </div>
      </div>

      {/* ZONA DE CARGA Y PARSEO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL IZQUIERDO: CONFIGURACIÓN DE MANGA & SUBIDA */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-[#24382C] pb-2 border-b border-[#DDDCD1]">
            1. Destino de los Animales Leídos
          </h4>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#343B2D] mb-1">Rodeo Asignado</label>
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
              <label className="block font-semibold text-[#343B2D] mb-1">Potrero Post-Manga</label>
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
              <label className="block font-semibold text-[#343B2D] mb-2">Subir Archivo CSV Tru-Test</label>
              <div className="border-2 border-dashed border-[#DDDCD1] hover:border-[#83A653] rounded-xl p-4 text-center cursor-pointer bg-[#F7F7F2]/50 transition-colors relative">
                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-[#83A653] mx-auto mb-2" />
                <span className="text-xs font-bold text-[#24382C] block">
                  {nombreArchivo || 'Arrastre su archivo Tru-Test aquí'}
                </span>
                <span className="text-[10px] text-[#74796D] block mt-1">
                  Reconoce EID, VID, Date, Time, NOTA, Condición y Tacto
                </span>
              </div>
            </div>

            <button
              onClick={handleProcesar}
              disabled={!csvText.trim()}
              className="w-full py-2.5 bg-[#83A653] hover:bg-[#536747] disabled:bg-gray-300 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 mt-2"
            >
              <Cpu className="w-4 h-4" />
              Re-analizar Archivo
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
                      FN-3.5: Auditoría de Inconsistencias ({resultadoParser.inconsistencias.length} detectadas)
                    </h4>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
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
                    <h4 className="font-bold text-xs text-[#38845A]">Lectura Verificada: Archivo Válido</h4>
                    <p className="text-[11px] text-[#343B2D]">
                      Se reconocieron correctamente {resultadoParser.lecturas.length} registros sin inconsistencias críticas.
                    </p>
                  </div>
                </div>
              )}

              {/* TABLA DE LECTURAS DETECTADAS */}
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#DDDCD1] p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-bold text-xs text-[#24382C] uppercase tracking-wider">
                      Registros Parseados ({resultadoParser.lecturas.length} animales)
                    </h4>
                    <span className="text-[11px] text-[#74796D]">{nombreArchivo}</span>
                  </div>

                  {!consolidadoExitoso ? (
                    <button
                      onClick={handleConsolidarEnStock}
                      className="px-4 py-2 bg-[#24382C] hover:bg-[#343B2D] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Database className="w-3.5 h-3.5" />
                      Consolidar en Stock e Historial
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-[#38845A]/15 text-[#38845A] font-bold text-xs rounded-xl flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      {resultadoParser.lecturas.length} Animales Consolidados
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs text-[#343B2D]">
                    <thead className="bg-[#F7F7F2] text-[#74796D] uppercase text-[10px] tracking-wider sticky top-0 border-b border-[#DDDCD1]">
                      <tr>
                        <th className="py-2.5 px-3">EID (RFID)</th>
                        <th className="py-2.5 px-3">VID (Caravana)</th>
                        <th className="py-2.5 px-3">Fecha y Hora</th>
                        <th className="py-2.5 px-3 text-right">Peso (kg)</th>
                        <th className="py-2.5 px-3 text-center">Condición</th>
                        <th className="py-2.5 px-3">Tacto</th>
                        <th className="py-2.5 px-3">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDDCD1]">
                      {resultadoParser.lecturas.map((lec, idx) => (
                        <tr key={idx} className="hover:bg-[#F7F7F2]/60">
                          <td className="py-2 px-3 font-mono text-[#536747] font-semibold">
                            {lec.eid}
                          </td>
                          <td className="py-2 px-3 font-bold text-[#24382C]">
                            <span className="px-2 py-0.5 bg-[#E9E5D9] rounded font-mono text-xs">
                              {lec.vid}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[#74796D] font-mono text-[11px]">
                            {lec.fecha} {lec.hora ? `• ${lec.hora}` : ''}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            {lec.peso ? (
                              <span className="text-[#24382C] font-extrabold">{lec.peso} kg</span>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">
                            {lec.condicion ? (
                              <span className="px-2 py-0.5 bg-[#B6A77D]/20 text-[#343B2D] rounded-full font-bold">
                                {lec.condicion}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-2 px-3">
                            {lec.tacto ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                lec.tacto === 'PRENADA' ? 'bg-[#38845A]/15 text-[#38845A]' :
                                lec.tacto === 'CICLICA' ? 'bg-[#52849A]/15 text-[#52849A]' :
                                'bg-[#C65B50]/15 text-[#C65B50]'
                              }`}>
                                {lec.tacto}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-2 px-3 text-[#74796D] text-[11px]">
                            {lec.nota || lec.advertencia || '-'}
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
              <h4 className="font-bold text-sm text-[#24382C] mb-1">Sin archivo cargado</h4>
              <p className="text-xs max-w-sm mx-auto mb-4">
                Haga clic arriba en <b>"Cargar Sesión 4 (Pesadas)"</b> o <b>"Cargar Tacto / Colocación VQ"</b> para ver la ingesta oficial, o arrastre su archivo .csv de balanza o bastón.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
