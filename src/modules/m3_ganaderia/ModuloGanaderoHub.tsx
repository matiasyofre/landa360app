// ==============================================================================
// LANDA360: MÓDULO 3 - HUB GANADERÍA & RFID (FN-3.1 A FN-3.9)
// Navegación centralizada por bloques operativos y configuración paramétrica
// ==============================================================================

import React, { useState } from 'react';
import { GanaderiaParamManager } from './GanaderiaParamManager';
import { InventarioRodeosView } from './InventarioRodeosView';
import { PotrerosCargaView } from './PotrerosCargaView';
import { IngestaRfidView } from './IngestaRfidView';
import { FichaAnimalView } from './FichaAnimalView';
import { PesadasGdpView } from './PesadasGdpView';
import { PlanSanitarioView } from './PlanSanitarioView';
import { CostosGanaderosView } from './CostosGanaderosView';
import { Animal } from '../../types/ganaderia';
import {
  Users,
  Compass,
  Cpu,
  Award,
  Scale,
  HeartPulse,
  DollarSign,
  Settings
} from 'lucide-react';

interface Props {
  canViewFinancials?: boolean;
}

export const ModuloGanaderoHub: React.FC<Props> = ({ canViewFinancials = true }) => {
  const [activeTab, setActiveTab] = useState<
    'inventario' | 'potreros' | 'rfid' | 'ficha' | 'pesadas' | 'sanidad' | 'costos' | 'parametros'
  >('inventario');

  const [animalSeleccionadoFicha, setAnimalSeleccionadoFicha] = useState<Animal | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const irAFicha = (animal: Animal) => {
    setAnimalSeleccionadoFicha(animal);
    setActiveTab('ficha');
  };

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* HEADER PRINCIPAL M3 */}
      <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#DDDCD1] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#DDDCD1]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#83A653]/15 text-[#38845A]">
                MÓDULO 3
              </span>
              <span className="text-xs text-[#74796D]">•</span>
              <span className="text-xs font-semibold text-[#536747]">9 Funcionalidades Activas</span>
            </div>
            <h1 className="text-2xl font-black text-[#24382C] tracking-tight">
              Ganadería de Precisión & Trazabilidad RFID
            </h1>
            <p className="text-xs text-[#74796D] mt-1 max-w-2xl">
              Control de existencias por rodeo, cálculo de carga en Equivalentes Vaca (EV/ha), ingesta de bastones electrónicos, pesadas con Ganancia Diaria de Peso (GDP) y costeo $/kg.
            </p>
          </div>

          {/* Botón rápido a configuración de maestros */}
          <button
            onClick={() => setActiveTab('parametros')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'parametros'
                ? 'bg-[#24382C] text-white border-[#24382C] shadow-sm'
                : 'bg-[#F7F7F2] text-[#24382C] border-[#DDDCD1] hover:bg-[#E9E5D9]'
            }`}
          >
            <Settings className="w-4 h-4 text-[#83A653]" />
            Maestros Paramétricos
          </button>
        </div>

        {/* BARRA DE NAVEGACIÓN AGRUPADA POR BLOQUES */}
        <div className="flex flex-wrap items-center gap-1.5 pt-4 text-xs font-bold">
          {/* BLOQUE A */}
          <span className="text-[10px] uppercase text-[#74796D] font-mono px-2 py-1 bg-[#E9E5D9] rounded-md mr-1">
            Bloque A: Pastoreo
          </span>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'inventario'
                ? 'bg-[#83A653] text-white shadow-sm'
                : 'text-[#343B2D] hover:bg-[#F7F7F2]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            FN-3.1 Inventario
          </button>
          <button
            onClick={() => setActiveTab('potreros')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'potreros'
                ? 'bg-[#83A653] text-white shadow-sm'
                : 'text-[#343B2D] hover:bg-[#F7F7F2]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            FN-3.2 & 3.3 Potreros / EV
          </button>

          {/* BLOQUE B */}
          <span className="text-[10px] uppercase text-[#74796D] font-mono px-2 py-1 bg-[#E9E5D9] rounded-md mx-1">
            Bloque B: Manga RFID
          </span>
          <button
            onClick={() => setActiveTab('rfid')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'rfid'
                ? 'bg-[#83A653] text-white shadow-sm'
                : 'text-[#343B2D] hover:bg-[#F7F7F2]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            FN-3.4 & 3.5 Bastón RFID
          </button>
          <button
            onClick={() => setActiveTab('ficha')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'ficha'
                ? 'bg-[#83A653] text-white shadow-sm'
                : 'text-[#343B2D] hover:bg-[#F7F7F2]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            FN-3.7 Ficha Trazabilidad
          </button>

          {/* BLOQUE C */}
          <span className="text-[10px] uppercase text-[#74796D] font-mono px-2 py-1 bg-[#E9E5D9] rounded-md mx-1">
            Bloque C: Producción
          </span>
          <button
            onClick={() => setActiveTab('pesadas')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'pesadas'
                ? 'bg-[#83A653] text-white shadow-sm'
                : 'text-[#343B2D] hover:bg-[#F7F7F2]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            FN-3.6 Pesadas GDP
          </button>
          <button
            onClick={() => setActiveTab('sanidad')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'sanidad'
                ? 'bg-[#83A653] text-white shadow-sm'
                : 'text-[#343B2D] hover:bg-[#F7F7F2]'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            FN-3.8 Sanidad
          </button>
          <button
            onClick={() => setActiveTab('costos')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'costos'
                ? 'bg-[#83A653] text-white shadow-sm'
                : 'text-[#343B2D] hover:bg-[#F7F7F2]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            FN-3.9 Costos $/kg
          </button>
        </div>
      </div>

      {/* RENDERIZADO CONDICIONAL DE LA VISTA SELECCIONADA */}
      <div className="transition-all duration-200">
        {activeTab === 'parametros' && (
          <GanaderiaParamManager onDataChanged={triggerRefresh} />
        )}

        {activeTab === 'inventario' && (
          <InventarioRodeosView onSelectAnimal={irAFicha} onRefresh={triggerRefresh} />
        )}

        {activeTab === 'potreros' && (
          <PotrerosCargaView onDataChanged={triggerRefresh} />
        )}

        {activeTab === 'rfid' && (
          <IngestaRfidView onLecturaConsolidada={triggerRefresh} />
        )}

        {activeTab === 'ficha' && (
          <FichaAnimalView
            animalInicial={animalSeleccionadoFicha}
            onVolver={() => setActiveTab('inventario')}
          />
        )}

        {activeTab === 'pesadas' && (
          <PesadasGdpView />
        )}

        {activeTab === 'sanidad' && (
          <PlanSanitarioView />
        )}

        {activeTab === 'costos' && (
          <CostosGanaderosView canViewFinancials={canViewFinancials} />
        )}
      </div>
    </div>
  );
};
