// ==============================================================================
// LANDA360: SERVICIO INTEGRADO DE GANADERÍA & RFID
// Manejo de catálogos paramétricos, inventario, cálculos EV/ha, GDP, parser RFID
// ==============================================================================

import {
  CategoriaGanadera,
  Rodeo,
  PotreroGanadero,
  RazaGanadera,
  FarmacoVeterinario,
  Animal,
  MovimientoHacienda,
  PesadaAnimal,
  EventoSanitario,
  CostoGanadero,
  InconsistenciaGanadera
} from '../types/ganaderia';

const STORAGE_KEY_CATEGORIAS = 'landa360_ganaderia_categorias';
const STORAGE_KEY_RODEOS = 'landa360_ganaderia_rodeos';
const STORAGE_KEY_POTREROS = 'landa360_ganaderia_potreros';
const STORAGE_KEY_RAZAS = 'landa360_ganaderia_razas';
const STORAGE_KEY_FARMACOS = 'landa360_ganaderia_farmacos';
const STORAGE_KEY_ANIMALES = 'landa360_ganaderia_animales';
const STORAGE_KEY_MOVIMIENTOS = 'landa360_ganaderia_movimientos';
const STORAGE_KEY_PESADAS = 'landa360_ganaderia_pesadas';
const STORAGE_KEY_SANIDAD = 'landa360_ganaderia_sanidad';
const STORAGE_KEY_COSTOS = 'landa360_ganaderia_costos';

// Semillas por defecto para nuevos establecimientos
const DEFAULT_CATEGORIAS: CategoriaGanadera[] = [
  { id: 'cat-1', tenant_id: 'default', nombre: 'Vaca de Cría', sexo: 'Hembra', factor_ev: 1.00, peso_referencia_kg: 420, activo: true },
  { id: 'cat-2', tenant_id: 'default', nombre: 'Vaquillona 1 a 2 años', sexo: 'Hembra', factor_ev: 0.75, peso_referencia_kg: 320, activo: true },
  { id: 'cat-3', tenant_id: 'default', nombre: 'Ternero al pie', sexo: 'Indefinido', factor_ev: 0.35, peso_referencia_kg: 140, activo: true },
  { id: 'cat-4', tenant_id: 'default', nombre: 'Ternero destetado', sexo: 'Macho', factor_ev: 0.50, peso_referencia_kg: 190, activo: true },
  { id: 'cat-5', tenant_id: 'default', nombre: 'Novillito 1 a 2 años', sexo: 'Macho', factor_ev: 0.75, peso_referencia_kg: 340, activo: true },
  { id: 'cat-6', tenant_id: 'default', nombre: 'Novillo > 2 años', sexo: 'Macho', factor_ev: 1.00, peso_referencia_kg: 460, activo: true },
  { id: 'cat-7', tenant_id: 'default', nombre: 'Toro reproductor', sexo: 'Macho', factor_ev: 1.50, peso_referencia_kg: 750, activo: true },
];

const DEFAULT_RODEOS: Rodeo[] = [
  { id: 'rod-1', tenant_id: 'default', nombre: 'Rodeo Cría General', finalidad: 'Cría', color_identificador: '#83A653', activo: true },
  { id: 'rod-2', tenant_id: 'default', nombre: 'Invernada Lote 1', finalidad: 'Invernada / Engorde', color_identificador: '#536747', activo: true },
  { id: 'rod-3', tenant_id: 'default', nombre: 'Vaquillonas Reposición', finalidad: 'Recría', color_identificador: '#B6A77D', activo: true },
  { id: 'rod-4', tenant_id: 'default', nombre: 'Torada Cabaña', finalidad: 'Cabaña', color_identificador: '#24382C', activo: true },
];

const DEFAULT_POTREROS: PotreroGanadero[] = [
  { id: 'pot-1', tenant_id: 'default', nombre: 'Potrero 1 - La Legua', superficie_ha: 120, recurso_forrajero: 'Pastura Alfalfa / Festuca', receptividad_objetivo_ev_ha: 1.20, dias_descanso_actual: 32, activo: true },
  { id: 'pot-2', tenant_id: 'default', nombre: 'Potrero 2 - El Bajo', superficie_ha: 85, recurso_forrajero: 'Agropiro / Festuca', receptividad_objetivo_ev_ha: 0.85, dias_descanso_actual: 14, activo: true },
  { id: 'pot-3', tenant_id: 'default', nombre: 'Potrero 3 - Loma Norte', superficie_ha: 140, recurso_forrajero: 'Campo Natural Mejorado', receptividad_objetivo_ev_ha: 0.65, dias_descanso_actual: 45, activo: true },
  { id: 'pot-4', tenant_id: 'default', nombre: 'Potrero 4 - Las Acacias', superficie_ha: 95, recurso_forrajero: 'Verdeo Invierno (Avena/Vicia)', receptividad_objetivo_ev_ha: 1.50, dias_descanso_actual: 5, activo: true },
];

const DEFAULT_RAZAS: RazaGanadera[] = [
  { id: 'raz-1', tenant_id: 'default', nombre: 'Angus Negro', activo: true },
  { id: 'raz-2', tenant_id: 'default', nombre: 'Angus Colorado', activo: true },
  { id: 'raz-3', tenant_id: 'default', nombre: 'Hereford', activo: true },
  { id: 'raz-4', tenant_id: 'default', nombre: 'Brangus', activo: true },
  { id: 'raz-5', tenant_id: 'default', nombre: 'Braford', activo: true },
];

const DEFAULT_FARMACOS: FarmacoVeterinario[] = [
  { id: 'far-1', tenant_id: 'default', nombre_comercial: 'Aftosa Bivalente Oficial', principio_activo: 'Virus inactivado Aftosa', tipo: 'Vacuna', dias_carencia_faena: 0, dosis_sugerida: '2 ml vía subcutánea', activo: true },
  { id: 'far-2', tenant_id: 'default', nombre_comercial: 'Carbunclo Cepa Pasteur', principio_activo: 'Bacillus anthracis vivo atenuado', tipo: 'Vacuna', dias_carencia_faena: 0, dosis_sugerida: '2 ml SC', activo: true },
  { id: 'far-3', tenant_id: 'default', nombre_comercial: 'Ivermectina 3.15% Larga Acción', principio_activo: 'Ivermectina', tipo: 'Antiparasitario', dias_carencia_faena: 48, dosis_sugerida: '1 ml cada 50 kg', activo: true },
  { id: 'far-4', tenant_id: 'default', nombre_comercial: 'Complejo Vitamínico ADE', principio_activo: 'Vit A, D3, E', tipo: 'Vitamínico / Mineral', dias_carencia_faena: 0, dosis_sugerida: '5 ml SC', activo: true },
];

const DEFAULT_ANIMALES: Animal[] = [
  { id: 'ani-1', tenant_id: 'default', caravana_rfid: '982000412891001', caravana_visual: 'A-101', categoria_id: 'cat-1', categoria_nombre: 'Vaca de Cría', factor_ev: 1.00, rodeo_id: 'rod-1', rodeo_nombre: 'Rodeo Cría General', potrero_id: 'pot-1', potrero_nombre: 'Potrero 1 - La Legua', raza: 'Angus Negro', sexo: 'Hembra', fecha_nacimiento: '2021-09-15', peso_actual_kg: 442, fecha_ultima_pesada: '2026-10-15', gdp_historica_kg_dia: 0.450, estado: 'Activo', origen: 'Propio (Nacido)' },
  { id: 'ani-2', tenant_id: 'default', caravana_rfid: '982000412891002', caravana_visual: 'A-102', categoria_id: 'cat-1', categoria_nombre: 'Vaca de Cría', factor_ev: 1.00, rodeo_id: 'rod-1', rodeo_nombre: 'Rodeo Cría General', potrero_id: 'pot-1', potrero_nombre: 'Potrero 1 - La Legua', raza: 'Angus Negro', sexo: 'Hembra', fecha_nacimiento: '2021-10-02', peso_actual_kg: 428, fecha_ultima_pesada: '2026-10-15', gdp_historica_kg_dia: 0.380, estado: 'Activo', origen: 'Propio (Nacido)' },
  { id: 'ani-3', tenant_id: 'default', caravana_rfid: '982000412891003', caravana_visual: 'N-201', categoria_id: 'cat-5', categoria_nombre: 'Novillito 1 a 2 años', factor_ev: 0.75, rodeo_id: 'rod-2', rodeo_nombre: 'Invernada Lote 1', potrero_id: 'pot-2', potrero_nombre: 'Potrero 2 - El Bajo', raza: 'Angus Colorado', sexo: 'Macho', fecha_nacimiento: '2025-04-10', peso_actual_kg: 358, fecha_ultima_pesada: '2026-11-01', gdp_historica_kg_dia: 0.780, estado: 'Activo', origen: 'Propio (Nacido)' },
  { id: 'ani-4', tenant_id: 'default', caravana_rfid: '982000412891004', caravana_visual: 'N-202', categoria_id: 'cat-5', categoria_nombre: 'Novillito 1 a 2 años', factor_ev: 0.75, rodeo_id: 'rod-2', rodeo_nombre: 'Invernada Lote 1', potrero_id: 'pot-2', potrero_nombre: 'Potrero 2 - El Bajo', raza: 'Angus Colorado', sexo: 'Macho', fecha_nacimiento: '2025-04-12', peso_actual_kg: 364, fecha_ultima_pesada: '2026-11-01', gdp_historica_kg_dia: 0.810, estado: 'Activo', origen: 'Propio (Nacido)' },
  { id: 'ani-5', tenant_id: 'default', caravana_rfid: '982000412891005', caravana_visual: 'T-01', categoria_id: 'cat-7', categoria_nombre: 'Toro reproductor', factor_ev: 1.50, rodeo_id: 'rod-4', rodeo_nombre: 'Torada Cabaña', potrero_id: 'pot-4', potrero_nombre: 'Potrero 4 - Las Acacias', raza: 'Brangus', sexo: 'Macho', fecha_nacimiento: '2022-08-20', peso_actual_kg: 785, fecha_ultima_pesada: '2026-09-20', gdp_historica_kg_dia: 0.200, estado: 'Activo', origen: 'Compra' },
];

export const ganaderiaService = {
  // --- MAESTROS PARAMÉTRICOS ---
  getCategorias(): CategoriaGanadera[] {
    const data = localStorage.getItem(STORAGE_KEY_CATEGORIAS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(DEFAULT_CATEGORIAS));
      return DEFAULT_CATEGORIAS;
    }
    return JSON.parse(data);
  },

  saveCategoria(categoria: CategoriaGanadera): CategoriaGanadera[] {
    const list = this.getCategorias();
    const idx = list.findIndex(c => c.id === categoria.id);
    if (idx >= 0) {
      list[idx] = categoria;
    } else {
      list.push(categoria);
    }
    localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(list));
    return list;
  },

  deleteCategoria(id: string): CategoriaGanadera[] {
    const list = this.getCategorias().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(list));
    return list;
  },

  getRodeos(): Rodeo[] {
    const data = localStorage.getItem(STORAGE_KEY_RODEOS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_RODEOS, JSON.stringify(DEFAULT_RODEOS));
      return DEFAULT_RODEOS;
    }
    return JSON.parse(data);
  },

  saveRodeo(rodeo: Rodeo): Rodeo[] {
    const list = this.getRodeos();
    const idx = list.findIndex(r => r.id === rodeo.id);
    if (idx >= 0) {
      list[idx] = rodeo;
    } else {
      list.push(rodeo);
    }
    localStorage.setItem(STORAGE_KEY_RODEOS, JSON.stringify(list));
    return list;
  },

  deleteRodeo(id: string): Rodeo[] {
    const list = this.getRodeos().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY_RODEOS, JSON.stringify(list));
    return list;
  },

  getPotreros(): PotreroGanadero[] {
    const data = localStorage.getItem(STORAGE_KEY_POTREROS);
    const potreros: PotreroGanadero[] = data ? JSON.parse(data) : DEFAULT_POTREROS;
    if (!data) localStorage.setItem(STORAGE_KEY_POTREROS, JSON.stringify(DEFAULT_POTREROS));

    // Calcular en caliente carga EV, cabezas y EV/ha (FN-3.2)
    const animales = this.getAnimales().filter(a => a.estado === 'Activo');
    return potreros.map(pot => {
      const animalesEnPotrero = animales.filter(a => a.potrero_id === pot.id);
      const cabezas = animalesEnPotrero.length;
      const cargaEV = animalesEnPotrero.reduce((acc, a) => acc + (a.factor_ev || 1.0), 0);
      const cargaPorHa = pot.superficie_ha > 0 ? cargaEV / pot.superficie_ha : 0;

      let estado: 'Optimo' | 'Alerta' | 'Sobrepastoreo' | 'Vacio' = 'Optimo';
      if (cabezas === 0) estado = 'Vacio';
      else if (cargaPorHa > pot.receptividad_objetivo_ev_ha * 1.15) estado = 'Sobrepastoreo';
      else if (cargaPorHa > pot.receptividad_objetivo_ev_ha * 0.95) estado = 'Alerta';

      return {
        ...pot,
        cabezas_actuales: cabezas,
        carga_total_ev: Number(cargaEV.toFixed(2)),
        carga_actual_ev_ha: Number(cargaPorHa.toFixed(2)),
        estado_pastoreo: estado
      };
    });
  },

  savePotrero(potrero: PotreroGanadero): PotreroGanadero[] {
    const list = this.getPotreros();
    const idx = list.findIndex(p => p.id === potrero.id);
    if (idx >= 0) {
      list[idx] = potrero;
    } else {
      list.push(potrero);
    }
    localStorage.setItem(STORAGE_KEY_POTREROS, JSON.stringify(list));
    return this.getPotreros();
  },

  deletePotrero(id: string): PotreroGanadero[] {
    const list = this.getPotreros().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY_POTREROS, JSON.stringify(list));
    return this.getPotreros();
  },

  getRazas(): RazaGanadera[] {
    const data = localStorage.getItem(STORAGE_KEY_RAZAS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_RAZAS, JSON.stringify(DEFAULT_RAZAS));
      return DEFAULT_RAZAS;
    }
    return JSON.parse(data);
  },

  saveRaza(raza: RazaGanadera): RazaGanadera[] {
    const list = this.getRazas();
    const idx = list.findIndex(r => r.id === raza.id);
    if (idx >= 0) list[idx] = raza;
    else list.push(raza);
    localStorage.setItem(STORAGE_KEY_RAZAS, JSON.stringify(list));
    return list;
  },

  getFarmacos(): FarmacoVeterinario[] {
    const data = localStorage.getItem(STORAGE_KEY_FARMACOS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_FARMACOS, JSON.stringify(DEFAULT_FARMACOS));
      return DEFAULT_FARMACOS;
    }
    return JSON.parse(data);
  },

  saveFarmaco(farmaco: FarmacoVeterinario): FarmacoVeterinario[] {
    const list = this.getFarmacos();
    const idx = list.findIndex(f => f.id === farmaco.id);
    if (idx >= 0) list[idx] = farmaco;
    else list.push(farmaco);
    localStorage.setItem(STORAGE_KEY_FARMACOS, JSON.stringify(list));
    return list;
  },

  deleteFarmaco(id: string): FarmacoVeterinario[] {
    const list = this.getFarmacos().filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEY_FARMACOS, JSON.stringify(list));
    return list;
  },

  // --- ANIMALES & TRAZABILIDAD (FN-3.1, FN-3.7) ---
  getAnimales(): Animal[] {
    const data = localStorage.getItem(STORAGE_KEY_ANIMALES);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_ANIMALES, JSON.stringify(DEFAULT_ANIMALES));
      return DEFAULT_ANIMALES;
    }
    return JSON.parse(data);
  },

  saveAnimal(animal: Animal): Animal[] {
    const list = this.getAnimales();
    const categorias = this.getCategorias();
    const rodeos = this.getRodeos();
    const potreros = this.getPotreros();

    const cat = categorias.find(c => c.id === animal.categoria_id);
    const rod = rodeos.find(r => r.id === animal.rodeo_id);
    const pot = potreros.find(p => p.id === animal.potrero_id);

    const enriched: Animal = {
      ...animal,
      categoria_nombre: cat ? cat.nombre : animal.categoria_nombre,
      factor_ev: cat ? cat.factor_ev : (animal.factor_ev || 1.0),
      rodeo_nombre: rod ? rod.nombre : animal.rodeo_nombre,
      potrero_nombre: pot ? pot.nombre : animal.potrero_nombre,
    };

    const idx = list.findIndex(a => a.id === animal.id || (animal.caravana_rfid && a.caravana_rfid === animal.caravana_rfid));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...enriched };
    } else {
      list.push(enriched);
    }
    localStorage.setItem(STORAGE_KEY_ANIMALES, JSON.stringify(list));
    return list;
  },

  deleteAnimal(id: string): Animal[] {
    const list = this.getAnimales().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY_ANIMALES, JSON.stringify(list));
    return list;
  },

  // --- MOVIMIENTOS ÁGILES (FN-3.3) ---
  getMovimientos(): MovimientoHacienda[] {
    const data = localStorage.getItem(STORAGE_KEY_MOVIMIENTOS);
    return data ? JSON.parse(data) : [];
  },

  registrarMovimiento(mov: Omit<MovimientoHacienda, 'id' | 'fecha'>): MovimientoHacienda {
    const list = this.getMovimientos();
    const potreros = this.getPotreros();
    const rodeos = this.getRodeos();

    const orig = potreros.find(p => p.id === mov.potrero_origen_id);
    const dest = potreros.find(p => p.id === mov.potrero_destino_id);
    const rod = rodeos.find(r => r.id === mov.rodeo_id);

    const nuevo: MovimientoHacienda = {
      ...mov,
      id: `mov-${Date.now()}`,
      fecha: new Date().toISOString(),
      potrero_origen_nombre: orig ? orig.nombre : 'Sin especificar',
      potrero_destino_nombre: dest ? dest.nombre : 'Destino',
      rodeo_nombre: rod ? rod.nombre : 'Rodeo',
    };

    list.unshift(nuevo);
    localStorage.setItem(STORAGE_KEY_MOVIMIENTOS, JSON.stringify(list));

    // Actualizar potrero de todos los animales pertenecientes al rodeo
    const animales = this.getAnimales();
    const actualizados = animales.map(a => {
      if (a.rodeo_id === mov.rodeo_id) {
        return {
          ...a,
          potrero_id: mov.potrero_destino_id,
          potrero_nombre: dest ? dest.nombre : a.potrero_nombre
        };
      }
      return a;
    });
    localStorage.setItem(STORAGE_KEY_ANIMALES, JSON.stringify(actualizados));

    return nuevo;
  },

  // --- PESADAS & GANANCIA DIARIA DE PESO (GDP) (FN-3.6) ---
  getPesadas(): PesadaAnimal[] {
    const data = localStorage.getItem(STORAGE_KEY_PESADAS);
    return data ? JSON.parse(data) : [];
  },

  registrarPesada(item: { animal_id: string; fecha: string; peso_kg: number; origen_pesada: string; observaciones?: string }): PesadaAnimal {
    const pesadas = this.getPesadas();
    const animales = this.getAnimales();
    const animal = animales.find(a => a.id === item.animal_id);

    if (!animal) throw new Error('Animal no encontrado');

    // Buscar pesada previa más reciente
    const pesadasPrevias = pesadas
      .filter(p => p.animal_id === item.animal_id && new Date(p.fecha) < new Date(item.fecha))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    let pesoAnterior = animal.peso_actual_kg;
    let fechaAnterior = animal.fecha_ultima_pesada;

    if (pesadasPrevias.length > 0) {
      pesoAnterior = pesadasPrevias[0].peso_kg;
      fechaAnterior = pesadasPrevias[0].fecha;
    }

    let diasTranscurridos = 0;
    let gdp = 0;

    if (fechaAnterior) {
      const d1 = new Date(fechaAnterior).getTime();
      const d2 = new Date(item.fecha).getTime();
      diasTranscurridos = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
      gdp = Number(((item.peso_kg - pesoAnterior) / diasTranscurridos).toFixed(3));
    }

    const nuevaPesada: PesadaAnimal = {
      id: `pes-${Date.now()}`,
      tenant_id: 'default',
      animal_id: animal.id,
      caravana_visual: animal.caravana_visual,
      caravana_rfid: animal.caravana_rfid,
      fecha: item.fecha,
      peso_kg: item.peso_kg,
      peso_anterior_kg: pesoAnterior,
      dias_transcurridos: diasTranscurridos,
      gdp_kg_dia: gdp,
      origen_pesada: item.origen_pesada,
      observaciones: item.observaciones
    };

    pesadas.unshift(nuevaPesada);
    localStorage.setItem(STORAGE_KEY_PESADAS, JSON.stringify(pesadas));

    // Actualizar animal con su última pesada y GDP
    animal.peso_actual_kg = item.peso_kg;
    animal.fecha_ultima_pesada = item.fecha;
    if (gdp !== 0) animal.gdp_historica_kg_dia = gdp;
    this.saveAnimal(animal);

    return nuevaPesada;
  },

  // --- PARSER HEURÍSTICO DE BASTÓN RFID (FN-3.4) & INCONSISTENCIAS (FN-3.5) ---
  parsearLecturaBastones(csvContent: string): {
    lecturas: { rfid?: string; visual?: string; peso?: number; fecha?: string }[];
    inconsistencias: InconsistenciaGanadera[];
  } {
    const lineas = csvContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lineas.length === 0) return { lecturas: [], inconsistencias: [] };

    // Determinar separador (, ; \t)
    const primera = lineas[0];
    let sep = ',';
    if (primera.includes(';') && (primera.match(/;/g)?.length || 0) >= (primera.match(/,/g)?.length || 0)) sep = ';';
    else if (primera.includes('\t')) sep = '\t';

    const encabezados = primera.split(sep).map(h => h.trim().toLowerCase().replace(/["']/g, ''));

    // Heurística de columnas
    const idxRfid = encabezados.findIndex(h => /rfid|eid|chip|tag|transponder|electronic/i.test(h));
    const idxVisual = encabezados.findIndex(h => /visual|caravana|arete|chapa|id/i.test(h) && h !== 'rfid');
    const idxPeso = encabezados.findIndex(h => /peso|weight|kg|kilos/i.test(h));
    const idxFecha = encabezados.findIndex(h => /fecha|date|time|hora/i.test(h));

    const animalesExistentes = this.getAnimales();
    const lecturas: { rfid?: string; visual?: string; peso?: number; fecha?: string }[] = [];
    const inconsistencias: InconsistenciaGanadera[] = [];
    const rfidVistos = new Set<string>();

    const startIdx = idxRfid >= 0 || idxVisual >= 0 || idxPeso >= 0 ? 1 : 0;

    for (let i = startIdx; i < lineas.length; i++) {
      const cols = lineas[i].split(sep).map(c => c.trim().replace(/["']/g, ''));
      if (cols.length < 2) continue;

      let rfid = idxRfid >= 0 && cols[idxRfid] ? cols[idxRfid] : undefined;
      let visual = idxVisual >= 0 && cols[idxVisual] ? cols[idxVisual] : undefined;
      let pesoRaw = idxPeso >= 0 && cols[idxPeso] ? cols[idxPeso].replace(',', '.') : undefined;
      let fechaRaw = idxFecha >= 0 && cols[idxFecha] ? cols[idxFecha] : new Date().toISOString().split('T')[0];

      // Si no detectó encabezados, asignación posicional heurística
      if (idxRfid === -1 && idxVisual === -1 && idxPeso === -1) {
        // Tru-Test típicamente: Col 0: RFID (15 dígitos), Col 1: Visual, Col 2: Peso
        if (/^\d{12,16}$/.test(cols[0])) {
          rfid = cols[0];
          visual = cols[1];
          pesoRaw = cols[2];
        } else {
          visual = cols[0];
          pesoRaw = cols[1];
        }
      }

      const peso = pesoRaw ? parseFloat(pesoRaw) : undefined;
      const keyId = rfid || visual || `Fila-${i + 1}`;

      // Auditoría FN-3.5: Duplicados en la misma planilla
      if (rfid && rfidVistos.has(rfid)) {
        inconsistencias.push({
          tipo: 'DUPLICADO',
          gravedad: 'ALTA',
          caravana: keyId,
          descripcion: `La caravana RFID ${rfid} se leyó más de una vez en esta pasada de manga.`,
          fila: i + 1
        });
      }
      if (rfid) rfidVistos.add(rfid);

      // Auditoría FN-3.5: Salto biológicamente incoherente de peso
      if (peso) {
        const animalPrevio = animalesExistentes.find(a => (rfid && a.caravana_rfid === rfid) || (visual && a.caravana_visual === visual));
        if (animalPrevio && animalPrevio.peso_actual_kg > 0) {
          const deltaPeso = peso - animalPrevio.peso_actual_kg;
          if (deltaPeso < -40) {
            inconsistencias.push({
              tipo: 'SALTO_PESO',
              gravedad: 'ALTA',
              caravana: keyId,
              descripcion: `Pérdida drástica de peso detectada (${deltaPeso.toFixed(1)} kg) respecto a la pesada anterior (${animalPrevio.peso_actual_kg} kg). Posible error de balanza o enfermedad severa.`,
              fila: i + 1
            });
          } else if (deltaPeso > 80) {
            inconsistencias.push({
              tipo: 'SALTO_PESO',
              gravedad: 'MEDIA',
              caravana: keyId,
              descripcion: `Ganancia extraordinaria de peso (+${deltaPeso.toFixed(1)} kg) respecto al registro histórico (${animalPrevio.peso_actual_kg} kg).`,
              fila: i + 1
            });
          }
        }
      }

      lecturas.push({
        rfid,
        visual: visual || (rfid ? `CAR-${rfid.slice(-4)}` : undefined),
        peso,
        fecha: fechaRaw
      });
    }

    return { lecturas, inconsistencias };
  },

  // --- PLAN SANITARIO & REFUERZOS (FN-3.8) ---
  getEventosSanitarios(): EventoSanitario[] {
    const data = localStorage.getItem(STORAGE_KEY_SANIDAD);
    return data ? JSON.parse(data) : [];
  },

  registrarEventoSanitario(evento: Omit<EventoSanitario, 'id'>): EventoSanitario {
    const list = this.getEventosSanitarios();
    const farmacos = this.getFarmacos();
    const farm = farmacos.find(f => f.id === evento.farmaco_id);

    let fechaFinCarencia = evento.fecha_fin_carencia;
    if (!fechaFinCarencia && farm && farm.dias_carencia_faena > 0) {
      const d = new Date(evento.fecha);
      d.setDate(d.getDate() + farm.dias_carencia_faena);
      fechaFinCarencia = d.toISOString().split('T')[0];
    }

    const nuevo: EventoSanitario = {
      ...evento,
      id: `san-${Date.now()}`,
      farmaco_nombre: farm ? farm.nombre_comercial : 'Fármaco',
      fecha_fin_carencia: fechaFinCarencia
    };

    list.unshift(nuevo);
    localStorage.setItem(STORAGE_KEY_SANIDAD, JSON.stringify(list));
    return nuevo;
  },

  // --- COSTOS GANADEROS & $/KG (FN-3.9) ---
  getCostos(): CostoGanadero[] {
    const data = localStorage.getItem(STORAGE_KEY_COSTOS);
    return data ? JSON.parse(data) : [
      { id: 'cst-1', tenant_id: 'default', fecha: '2026-10-10', rodeo_id: 'rod-2', rodeo_nombre: 'Invernada Lote 1', rubro: 'Alimentación y Pasturas', monto_usd: 1250, monto_ars: 1562500, descripcion: 'Rollos de alfalfa y suplemento mineral proteico' },
      { id: 'cst-2', tenant_id: 'default', fecha: '2026-10-25', rodeo_id: 'rod-1', rodeo_nombre: 'Rodeo Cría General', rubro: 'Sanidad y Veterinaria', monto_usd: 480, monto_ars: 600000, descripcion: 'Campaña Oficial de Vacunación Aftosa y Carbunclo' },
      { id: 'cst-3', tenant_id: 'default', fecha: '2026-11-05', rodeo_id: 'rod-2', rodeo_nombre: 'Invernada Lote 1', rubro: 'Manga y Personal', monto_usd: 350, monto_ars: 437500, descripcion: 'Jornal de pesada periódica y lectura RFID' }
    ];
  },

  saveCosto(costo: CostoGanadero): CostoGanadero[] {
    const list = this.getCostos();
    const rodeos = this.getRodeos();
    const rod = rodeos.find(r => r.id === costo.rodeo_id);

    const enriched: CostoGanadero = {
      ...costo,
      rodeo_nombre: rod ? rod.nombre : costo.rodeo_nombre
    };

    const idx = list.findIndex(c => c.id === costo.id);
    if (idx >= 0) list[idx] = enriched;
    else list.unshift(enriched);

    localStorage.setItem(STORAGE_KEY_COSTOS, JSON.stringify(list));
    return list;
  },

  deleteCosto(id: string): CostoGanadero[] {
    const list = this.getCostos().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY_COSTOS, JSON.stringify(list));
    return list;
  }
};
