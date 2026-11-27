// ==============================================================================
// LANDA360: MAPA TÁCTICO INTERACTIVO Y ANIMADO DE POTREROS (FN-3.2 & FN-3.3)
// Interfaz inspirada en Campo Claro, táctil, drag & drop, con simulación de EV
// ==============================================================================

import React, { useState } from 'react';
import { ganaderiaService } from '../../services/ganaderiaService';
import { PotreroGanadero, Rodeo, Animal } from '../../types/ganaderia';
import {
  Compass,
  Plus,
  CheckCircle2,
  Undo2,
  Trees,
  GripVertical,
  X,
  Sparkles,
  Info
} from 'lucide-react';

interface Props {
  potreros: PotreroGanadero[];
  rodeos: Rodeo[];
  animales: Animal[];
  onDataChanged: () => void;
  onAbrirNuevoPotrero: () => void;
}

interface RodeoEnPotrero {
  rodeoId: string;
  nombre: string;
  color: string;
  finalidad: string;
  cabezas: number;
  pesoPromedio: number;
  cargaEV: number;
  origenPotreroId: string;
  origenPotreroNombre: string;
}

export const MapaInteractivoPotreros: React.FC<Props> = ({
  potreros,
  rodeos,
  animales,
  onDataChanged,
  onAbrirNuevoPotrero
}) => {
  // Estado de selección interactiva (Click to Move - Modo Mobile/Tablet)
  const [rodeoSeleccionado, setRodeoSeleccionado] = useState<RodeoEnPotrero | null>(null);

  // Estado de Drag & Drop (Desktop)
  const [draggedRodeo, setDraggedRodeo] = useState<RodeoEnPotrero | null>(null);
  const [potreroDestinoHover, setPotreroDestinoHover] = useState<string | null>(null);

  // Motivo rápido del movimiento
  const [motivoMovimiento, setMotivoMovimiento] = useState<string>('Rotación de pasturas');

  // Notificación de éxito con capacidad de Deshacer (Undo)
  const [toastExito, setToastExito] = useState<{
    mensaje: string;
    rodeoId: string;
    potreroPrevioId: string;
    potreroNuevoId: string;
    cabezas: number;
  } | null>(null);

  // Animación activa (id del rodeo que acaba de moverse para spring anim)
  const [animatingRodeoId, setAnimatingRodeoId] = useState<string | null>(null);

  // Reproducir un suave chime sintético con Web Audio API para feedback háptico
  const playSoftChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio no permitido o silenciado
    }
  };

  // Construir mapa de qué rodeos están en qué potreros
  // Si hay animales, se agrupan por rodeo; si no hay animales aún, se usa el potrero_id del Rodeo
  const getRodeosEnPotrero = (potreroId: string): RodeoEnPotrero[] => {
    const items: RodeoEnPotrero[] = [];
    const pot = potreros.find(p => p.id === potreroId);
    const potNombre = pot ? pot.nombre : 'Potrero';

    // 1. Rodeos con animales asignados en este potrero
    const animalesEnPot = animales.filter(a => a.potrero_id === potreroId && a.estado === 'Activo');
    const rodeosIdsConAnimales = new Set<string>();

    if (animalesEnPot.length > 0) {
      const mapRodeos = new Map<string, Animal[]>();
      animalesEnPot.forEach(a => {
        const rId = a.rodeo_id || 'sin-rodeo';
        if (!mapRodeos.has(rId)) mapRodeos.set(rId, []);
        mapRodeos.get(rId)!.push(a);
      });

      mapRodeos.forEach((anis, rId) => {
        rodeosIdsConAnimales.add(rId);
        const rod = rodeos.find(r => r.id === rId);
        const totalKg = anis.reduce((acc, a) => acc + (a.peso_actual_kg || 0), 0);
        const pesoProm = anis.length > 0 ? Math.round(totalKg / anis.length) : 350;
        const totalEV = anis.reduce((acc, a) => acc + (a.factor_ev || 1.0), 0);

        items.push({
          rodeoId: rId,
          nombre: rod ? rod.nombre : (anis[0].rodeo_nombre || 'Rodeo General'),
          color: rod?.color_identificador || '#83A653',
          finalidad: rod?.finalidad || 'Cría',
          cabezas: anis.length,
          pesoPromedio: pesoProm,
          cargaEV: totalEV,
          origenPotreroId: potreroId,
          origenPotreroNombre: potNombre
        });
      });
    }

    // 2. Rodeos sin animales individuales pero vinculados directamente a este potrero
    rodeos
      .filter(r => r.potrero_id === potreroId && !rodeosIdsConAnimales.has(r.id))
      .forEach(r => {
        items.push({
          rodeoId: r.id,
          nombre: r.nombre,
          color: r.color_identificador || '#83A653',
          finalidad: r.finalidad || 'Cría',
          cabezas: 30, // Estimado operativo
          pesoPromedio: 360,
          cargaEV: 30,
          origenPotreroId: potreroId,
          origenPotreroNombre: potNombre
        });
      });

    return items;
  };

  // Tropas disponibles en corral o sin potrero asignado
  const getRodeosEnCorral = (): RodeoEnPotrero[] => {
    const rodeosAsignados = new Set<string>();
    potreros.forEach(p => {
      getRodeosEnPotrero(p.id).forEach(r => rodeosAsignados.add(r.rodeoId));
    });

    return rodeos
      .filter(r => !rodeosAsignados.has(r.id) && (!r.potrero_id || r.potrero_id === 'corral'))
      .map(r => {
        const anis = animales.filter(a => a.rodeo_id === r.id && a.estado === 'Activo');
        const cab = anis.length > 0 ? anis.length : 25;
        const peso = anis.length > 0
          ? Math.round(anis.reduce((acc, a) => acc + a.peso_actual_kg, 0) / anis.length)
          : 320;
        const ev = anis.length > 0 ? anis.reduce((acc, a) => acc + (a.factor_ev || 1.0), 0) : cab;

        return {
          rodeoId: r.id,
          nombre: r.nombre,
          color: r.color_identificador || '#83A653',
          finalidad: r.finalidad || 'Cría',
          cabezas: cab,
          pesoPromedio: peso,
          cargaEV: ev,
          origenPotreroId: 'corral',
          origenPotreroNombre: 'Corral / Manga'
        };
      });
  };

  // Ejecución del movimiento entre potreros
  const ejecutarMovimiento = (rodeo: RodeoEnPotrero, potreroDestinoId: string) => {
    if (rodeo.origenPotreroId === potreroDestinoId) {
      setRodeoSeleccionado(null);
      return;
    }

    const potDest = potreros.find(p => p.id === potreroDestinoId);
    if (!potDest) return;

    // Disparar feedback sonoro
    playSoftChime();

    // Registrar en el servicio oficial
    ganaderiaService.registrarMovimiento({
      tenant_id: 'default',
      rodeo_id: rodeo.rodeoId,
      potrero_origen_id: rodeo.origenPotreroId,
      potrero_destino_id: potreroDestinoId,
      cantidad_cabezas: rodeo.cabezas,
      motivo: motivoMovimiento,
      responsable: 'Operador de Campo (Táctil Landa360)'
    });

    // Activar animación en el destino
    setAnimatingRodeoId(rodeo.rodeoId);
    setTimeout(() => setAnimatingRodeoId(null), 1200);

    // Mostrar Toast de confirmación con Deshacer
    setToastExito({
      mensaje: `✓ ${rodeo.nombre} ahora en ${potDest.nombre}. Quedó en el historial del potrero.`,
      rodeoId: rodeo.rodeoId,
      potreroPrevioId: rodeo.origenPotreroId,
      potreroNuevoId: potreroDestinoId,
      cabezas: rodeo.cabezas
    });

    // Reset de selecciones
    setRodeoSeleccionado(null);
    setDraggedRodeo(null);
    setPotreroDestinoHover(null);

    // Notificar al padre para refrescar listas y cálculos
    onDataChanged();
  };

  // Deshacer el último movimiento
  const handleDeshacer = () => {
    if (!toastExito) return;
    const { rodeoId, potreroPrevioId, potreroNuevoId, cabezas } = toastExito;

    ganaderiaService.registrarMovimiento({
      tenant_id: 'default',
      rodeo_id: rodeoId,
      potrero_origen_id: potreroNuevoId,
      potrero_destino_id: potreroPrevioId,
      cantidad_cabezas: cabezas,
      motivo: 'Corrección / Deshacer movimiento',
      responsable: 'Operador de Campo'
    });

    setToastExito(null);
    onDataChanged();
  };

  // Cargar demostración interactiva
  const handleCargarDemo = () => {
    ganaderiaService.cargarDemostracionInteractiva();
    onDataChanged();
  };

  const rodeosEnCorral = getRodeosEnCorral();

  return (
    <div className="bg-[#FFFFFF] rounded-3xl border border-[#DDDCD1] p-5 md:p-6 shadow-sm mb-6 select-none transition-all">
      {/* CABECERA DEL TABLERO TÁCTICO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DDDCD1] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#83A653] animate-pulse" />
            <h3 className="text-base md:text-lg font-black text-[#24382C] tracking-tight">
              Mapa Táctico de Potreros
            </h3>
            <span className="text-[11px] font-semibold text-[#74796D] hidden md:inline">
              • Rotación y pastoreo en 2 toques
            </span>
          </div>
          <p className="text-xs text-[#74796D] mt-0.5">
            Mueva sus tropas de un potrero a otro tocando o arrastrando. Actualiza automáticamente la receptividad (EV/ha) y el historial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {potreros.length === 0 && (
            <button
              onClick={handleCargarDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#83A653]/15 text-[#38845A] hover:bg-[#83A653]/25 font-bold text-xs rounded-xl transition-colors"
              title="Cargar mapa idéntico al de demostración"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Cargar Mapa Demo
            </button>
          )}

          <button
            onClick={onAbrirNuevoPotrero}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#24382C] hover:bg-[#343B2D] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#83A653]" />
            Nuevo Potrero
          </button>
        </div>
      </div>

      {/* DOCK SUPERIOR: TROPAS EN CORRAL / MANGA (LISTAS PARA INGRESAR) */}
      {rodeosEnCorral.length > 0 && (
        <div className="my-4 p-3 bg-[#E9E5D9]/40 rounded-2xl border border-[#DDDCD1] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#536747] uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-[#83A653]" />
              Corral / Manga:
            </span>
            <span className="text-xs text-[#74796D]">
              {rodeosEnCorral.length} tropas listas para ingresar a pastoreo
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {rodeosEnCorral.map(rod => {
              const isSelected = rodeoSeleccionado?.rodeoId === rod.rodeoId;
              return (
                <div
                  key={rod.rodeoId}
                  draggable={true}
                  onDragStart={() => setDraggedRodeo(rod)}
                  onDragEnd={() => setDraggedRodeo(null)}
                  onClick={() => setRodeoSeleccionado(isSelected ? null : rod)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 border shadow-sm ${
                    isSelected
                      ? 'bg-[#24382C] text-white border-[#24382C] scale-105 shadow-md ring-2 ring-[#83A653]'
                      : 'bg-[#FFFFFF] text-[#24382C] border-[#DDDCD1] hover:border-[#83A653]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: rod.color }}
                  />
                  <span>{rod.nombre}</span>
                  <span className="text-[10px] opacity-75 font-mono">({rod.cabezas} cab.)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ESTADO VACÍO SI NO HAY POTREROS REGISTRADOS */}
      {potreros.length === 0 ? (
        <div className="my-8 py-12 px-4 rounded-3xl border border-dashed border-[#DDDCD1] text-center bg-[#F7F7F2]/40">
          <Compass className="w-12 h-12 text-[#B6A77D] mx-auto mb-3 opacity-60" />
          <h4 className="text-base font-bold text-[#24382C] mb-1">
            No hay potreros configurados para el mapa
          </h4>
          <p className="text-xs text-[#74796D] max-w-md mx-auto mb-5">
            Cree los potreros de su campo para visualizarlos en cuadrícula interactiva o cargue el mapa de demostración para probar el movimiento ágil de hacienda.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleCargarDemo}
              className="px-4 py-2 bg-[#83A653] hover:bg-[#536747] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Cargar Demostración (4 Potreros y 4 Rodeos)
            </button>
            <button
              onClick={onAbrirNuevoPotrero}
              className="px-4 py-2 border border-[#DDDCD1] bg-white text-[#24382C] hover:bg-[#F7F7F2] text-xs font-semibold rounded-xl transition-all"
            >
              Crear Potrero Manualmente
            </button>
          </div>
        </div>
      ) : (
        /* GRID DE POTREROS TÁCTICOS (LAYOUT IDÉNTICO AL VIDEO PERO ELEVADO) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
          {potreros.map(pot => {
            const rodeosEnEstePotrero = getRodeosEnPotrero(pot.id);
            const isHovered = potreroDestinoHover === pot.id;
            const isTargetCandidate =
              (rodeoSeleccionado && rodeoSeleccionado.origenPotreroId !== pot.id) ||
              (draggedRodeo && draggedRodeo.origenPotreroId !== pot.id);

            // Simulación en tiempo real de EV proyectado si se muda el rodeo seleccionado aquí
            let evProyectado: number = pot.carga_actual_ev_ha || 0;
            if (isTargetCandidate) {
              const r = rodeoSeleccionado || draggedRodeo;
              if (r && pot.superficie_ha > 0) {
                const totalEvNuevo = (pot.carga_total_ev || 0) + r.cargaEV;
                evProyectado = Number((totalEvNuevo / pot.superficie_ha).toFixed(2));
              }
            }

            return (
              <div
                key={pot.id}
                onDragOver={e => {
                  e.preventDefault();
                  if (draggedRodeo && draggedRodeo.origenPotreroId !== pot.id) {
                    setPotreroDestinoHover(pot.id);
                  }
                }}
                onDragLeave={() => setPotreroDestinoHover(null)}
                onDrop={e => {
                  e.preventDefault();
                  if (draggedRodeo) ejecutarMovimiento(draggedRodeo, pot.id);
                }}
                onClick={() => {
                  if (rodeoSeleccionado && rodeoSeleccionado.origenPotreroId !== pot.id) {
                    ejecutarMovimiento(rodeoSeleccionado, pot.id);
                  }
                }}
                className={`min-h-[175px] rounded-3xl p-4 md:p-5 flex flex-col justify-between transition-all duration-300 relative border ${
                  isHovered
                    ? 'border-2 border-[#83A653] bg-[#83A653]/15 shadow-md scale-[1.01]'
                    : isTargetCandidate
                    ? 'border-2 border-dashed border-[#83A653]/70 bg-[#83A653]/5 hover:bg-[#83A653]/15 cursor-pointer shadow-sm'
                    : 'border-[#DDDCD1] bg-[#F7F7F2]/60 hover:bg-[#F7F7F2]'
                }`}
              >
                {/* CABECERA DEL POTRERO (NOMBRE Y HECTÁREAS) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#536747]" />
                      <h4 className="text-sm md:text-base font-black text-[#24382C]">
                        {pot.nombre}
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#74796D] bg-[#E9E5D9] px-2.5 py-0.5 rounded-full">
                      {pot.superficie_ha} ha
                    </span>
                  </div>

                  {/* SUBINFO AGRONÓMICA */}
                  <div className="flex items-center justify-between text-[11px] text-[#74796D] mb-3">
                    <span className="flex items-center gap-1">
                      <Trees className="w-3 h-3 text-[#83A653]" />
                      {pot.recurso_forrajero}
                    </span>
                    <span className="font-medium">
                      {pot.dias_descanso_actual > 0
                        ? `${pot.dias_descanso_actual} días descanso`
                        : 'En pastoreo'}
                    </span>
                  </div>
                </div>

                {/* CONTENIDO INTERIOR: RODEOS O ESTADO VACÍO */}
                <div className="space-y-2 my-2">
                  {rodeosEnEstePotrero.length === 0 ? (
                    <div
                      className={`py-6 px-3 rounded-2xl border text-center transition-all ${
                        isTargetCandidate
                          ? 'border-dashed border-[#83A653] bg-white/80'
                          : 'border-dashed border-[#DDDCD1] bg-white/40'
                      }`}
                    >
                      <p className="text-xs font-semibold text-[#74796D]">
                        {isTargetCandidate ? '👉 Tocá aquí para mudar el rodeo' : 'Potrero libre (en descanso)'}
                      </p>
                    </div>
                  ) : (
                    rodeosEnEstePotrero.map(rod => {
                      const isSelected = rodeoSeleccionado?.rodeoId === rod.rodeoId;
                      const isJustAnimated = animatingRodeoId === rod.rodeoId;

                      return (
                        <div
                          key={rod.rodeoId}
                          draggable={true}
                          onDragStart={e => {
                            e.stopPropagation();
                            setDraggedRodeo(rod);
                          }}
                          onDragEnd={() => setDraggedRodeo(null)}
                          onClick={e => {
                            e.stopPropagation();
                            setRodeoSeleccionado(isSelected ? null : rod);
                          }}
                          className={`p-3 md:p-3.5 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between border ${
                            isJustAnimated
                              ? 'bg-[#83A653] text-white scale-105 shadow-xl ring-4 ring-[#83A653]/40'
                              : isSelected
                              ? 'bg-[#24382C] text-white border-[#24382C] shadow-lg scale-[1.02] ring-2 ring-[#83A653]'
                              : 'bg-white text-[#24382C] border-[#DDDCD1] hover:border-[#83A653] hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <GripVertical
                              className={`w-4 h-4 cursor-grab ${
                                isSelected ? 'text-white/60' : 'text-[#74796D]'
                              }`}
                            />
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: rod.color }}
                            />
                            <div>
                              <p className={`text-xs md:text-sm font-black ${isSelected ? 'text-white' : 'text-[#24382C]'}`}>
                                {rod.nombre}
                              </p>
                              <p className={`text-[11px] font-medium ${isSelected ? 'text-white/80' : 'text-[#74796D]'}`}>
                                {rod.cabezas} cab. • {rod.pesoPromedio} kg prom.
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[#E9E5D9] text-[#536747]'
                            }`}
                          >
                            {rod.finalidad}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* PIE DEL POTRERO: CARGA EV Y PROYECCIÓN */}
                <div className="pt-2 border-t border-[#DDDCD1]/60 mt-1 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#74796D]">Carga:</span>
                    <span className="font-mono font-bold text-[#24382C]">
                      {isTargetCandidate ? (
                        <span className="text-[#83A653] font-bold">
                          {pot.carga_actual_ev_ha?.toFixed(2)} ➔ {evProyectado.toFixed(2)} EV/ha
                        </span>
                      ) : (
                        `${(pot.carga_actual_ev_ha || 0).toFixed(2)} EV/ha`
                      )}
                    </span>
                  </div>

                  <span className="text-[#74796D] text-[10px] font-mono">
                    Obj: {pot.receptividad_objetivo_ev_ha} EV/ha
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BARRA INFORMATIVA INTERACTIVA & SELECTOR DE MOTIVO (COMO EN EL VIDEO) */}
      <div className="p-4 rounded-2xl bg-[#F7F7F2] border border-[#DDDCD1] mt-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Info className="w-4 h-4 text-[#83A653] flex-shrink-0" />
          {rodeoSeleccionado ? (
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#24382C]">
                Moviendo "{rodeoSeleccionado.nombre}":
              </span>
              <span className="text-[#536747] font-medium">
                Ahora tocá el potrero destino a donde lo llevás.
              </span>
              <button
                onClick={() => setRodeoSeleccionado(null)}
                className="px-2 py-0.5 rounded-lg bg-[#E9E5D9] hover:bg-[#DDDCD1] text-[#24382C] text-[11px] font-bold flex items-center gap-1 ml-1"
              >
                <X className="w-3 h-3" />
                Cancelar
              </button>
            </div>
          ) : (
            <span className="text-[#74796D]">
              <strong className="text-[#24382C]">Probá vos:</strong> tocá un rodeo y después el potrero (o arrastralo directamente).
            </span>
          )}
        </div>

        {/* SELECTOR RÁPIDO DE MOTIVO */}
        <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto w-full md:w-auto">
          <span className="text-[#74796D] text-[10px] uppercase font-bold mr-1">Motivo:</span>
          {['Rotación de pasturas', 'Sanitario', 'Pesada', 'Encierre'].map(mot => (
            <button
              key={mot}
              onClick={() => setMotivoMovimiento(mot)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                motivoMovimiento === mot
                  ? 'bg-[#24382C] text-white shadow-sm'
                  : 'bg-white border border-[#DDDCD1] text-[#74796D] hover:bg-[#E9E5D9]'
              }`}
            >
              {mot}
            </button>
          ))}
        </div>
      </div>

      {/* TOAST FLOTANTE DE ÉXITO CON BOTÓN DESHACER (UNDO) */}
      {toastExito && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#24382C] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-[#83A653] animate-bounce-once">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#83A653]" />
            <span className="text-xs md:text-sm font-semibold">{toastExito.mensaje}</span>
          </div>
          <button
            onClick={handleDeshacer}
            className="flex items-center gap-1.5 bg-[#83A653] hover:bg-[#536747] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Deshacer
          </button>
          <button
            onClick={() => setToastExito(null)}
            className="text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
