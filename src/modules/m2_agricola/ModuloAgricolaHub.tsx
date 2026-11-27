import React, { useState } from 'react';
import { LotesCatastroView } from './LotesCatastroView';
import { OrdenesTrabajoManager } from './OrdenesTrabajoManager';
import { MonitoreoPlagasView } from './MonitoreoPlagasView';
import { MargenBrutoTablero } from './MargenBrutoTablero';
import { CultivosParamManager } from './CultivosParamManager';
import { 
  Map, 
  Tractor, 
  Bug, 
  TrendingUp, 
  Sprout 
} from 'lucide-react';

export const ModuloAgricolaHub: React.FC = () => {
  const [subTab, setSubTab] = useState<'catastro' | 'ots' | 'plagas' | 'margen' | 'cultivos'>('catastro');

  return (
    <div className="space-y-6">
      
      {/* Sub-navegación por Bloques de M2 */}
      <div className="bg-campo-card p-2 rounded-2xl border border-campo-borde shadow-sm flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setSubTab('catastro')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'catastro'
              ? 'bg-campo-verde text-white shadow-sm'
              : 'text-campo-muted hover:text-campo-texto hover:bg-campo-blanco'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Bloque A: Catastro & KML (FN-2.1 / 2.2)</span>
        </button>

        <button
          onClick={() => setSubTab('ots')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'ots'
              ? 'bg-campo-verde text-white shadow-sm'
              : 'text-campo-muted hover:text-campo-texto hover:bg-campo-blanco'
          }`}
        >
          <Tractor className="w-4 h-4" />
          <span>Bloque B: Labores & OTs (FN-2.3 a 2.6)</span>
        </button>

        <button
          onClick={() => setSubTab('plagas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'plagas'
              ? 'bg-campo-verde text-white shadow-sm'
              : 'text-campo-muted hover:text-campo-texto hover:bg-campo-blanco'
          }`}
        >
          <Bug className="w-4 h-4" />
          <span>Sanidad & Plagas (FN-2.7)</span>
        </button>

        <button
          onClick={() => setSubTab('margen')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'margen'
              ? 'bg-campo-verde text-white shadow-sm'
              : 'text-campo-muted hover:text-campo-texto hover:bg-campo-blanco'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Margen Bruto (FN-2.8)</span>
        </button>

        <button
          onClick={() => setSubTab('cultivos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ml-auto ${
            subTab === 'cultivos'
              ? 'bg-campo-bosque text-white shadow-sm'
              : 'text-campo-muted hover:text-campo-texto hover:bg-campo-blanco border border-campo-borde'
          }`}
        >
          <Sprout className="w-4 h-4 text-campo-verde" />
          <span>Catálogo de Cultivos</span>
        </button>
      </div>

      {/* Renderizado del Bloque Activo */}
      {subTab === 'catastro' && <LotesCatastroView />}
      {subTab === 'ots' && <OrdenesTrabajoManager />}
      {subTab === 'plagas' && <MonitoreoPlagasView />}
      {subTab === 'margen' && <MargenBrutoTablero />}
      {subTab === 'cultivos' && <CultivosParamManager />}

    </div>
  );
};
