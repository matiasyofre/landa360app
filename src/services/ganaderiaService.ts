// ==============================================================================
// LANDA360: SERVICIO INTEGRADO DE GANADERÍA & RFID
// Manejo de catálogos paramétricos, inventario real, cálculos EV/ha, GDP y
// Parser de alta compatibilidad para bastones y balanzas Tru-Test oficiales
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
  InconsistenciaGanadera,
  LecturaRFID
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

// Catálogos Paramétricos Base (Sin datos mock de animales)
const DEFAULT_CATEGORIAS: CategoriaGanadera[] = [
  { id: 'cat-1', tenant_id: 'default', nombre: 'Vaca de Cría', sexo: 'Hembra', factor_ev: 1.00, peso_referencia_kg: 420, activo: true },
  { id: 'cat-2', tenant_id: 'default', nombre: 'Vaquillona', sexo: 'Hembra', factor_ev: 0.75, peso_referencia_kg: 320, activo: true },
  { id: 'cat-3', tenant_id: 'default', nombre: 'Ternero / Ternera', sexo: 'Indefinido', factor_ev: 0.40, peso_referencia_kg: 160, activo: true },
  { id: 'cat-4', tenant_id: 'default', nombre: 'Novillito', sexo: 'Macho', factor_ev: 0.75, peso_referencia_kg: 340, activo: true },
  { id: 'cat-5', tenant_id: 'default', nombre: 'Novillo', sexo: 'Macho', factor_ev: 1.00, peso_referencia_kg: 460, activo: true },
  { id: 'cat-6', tenant_id: 'default', nombre: 'Toro', sexo: 'Macho', factor_ev: 1.50, peso_referencia_kg: 750, activo: true },
];

const DEFAULT_RODEOS: Rodeo[] = [
  { id: 'rod-1', tenant_id: 'default', nombre: 'Rodeo General', finalidad: 'Cría', color_identificador: '#83A653', activo: true },
  { id: 'rod-2', tenant_id: 'default', nombre: 'Invernada', finalidad: 'Invernada / Engorde', color_identificador: '#536747', activo: true },
  { id: 'rod-3', tenant_id: 'default', nombre: 'Vaquillonas Reposición', finalidad: 'Recría', color_identificador: '#B6A77D', activo: true },
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
  { id: 'far-3', tenant_id: 'default', nombre_comercial: 'Ivermectina 3.15%', principio_activo: 'Ivermectina', tipo: 'Antiparasitario', dias_carencia_faena: 48, dosis_sugerida: '1 ml cada 50 kg', activo: true },
];

export const ganaderiaService = {
  // --- LIMPIEZA TOTAL DE DATOS MOCK O DE PRUEBA ---
  limpiarDatosDePrueba() {
    localStorage.removeItem(STORAGE_KEY_ANIMALES);
    localStorage.removeItem(STORAGE_KEY_PESADAS);
    localStorage.removeItem(STORAGE_KEY_MOVIMIENTOS);
    localStorage.removeItem(STORAGE_KEY_COSTOS);
    localStorage.removeItem(STORAGE_KEY_SANIDAD);
  },

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
    // Purgar potreros de prueba iniciales (La Legua, El Bajo, Loma Norte, Las Acacias)
    if (data && (data.includes('La Legua') || data.includes('Loma Norte') || data.includes('Las Acacias'))) {
      localStorage.removeItem(STORAGE_KEY_POTREROS);
      return [];
    }
    const potreros: PotreroGanadero[] = data ? JSON.parse(data) : [];

    // Calcular carga EV, cabezas y EV/ha
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
    const data = localStorage.getItem(STORAGE_KEY_POTREROS);
    const list: PotreroGanadero[] = data ? JSON.parse(data) : [];
    const idx = list.findIndex(p => p.id === potrero.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...potrero };
    } else {
      list.push(potrero);
    }
    localStorage.setItem(STORAGE_KEY_POTREROS, JSON.stringify(list));
    return this.getPotreros();
  },

  deletePotrero(id: string): PotreroGanadero[] {
    const data = localStorage.getItem(STORAGE_KEY_POTREROS);
    let list: PotreroGanadero[] = data ? JSON.parse(data) : [];
    list = list.filter(p => p.id !== id);
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

  // --- ANIMALES & TRAZABILIDAD (100% LIMPIO, CERO MOCK) ---
  getAnimales(): Animal[] {
    const data = localStorage.getItem(STORAGE_KEY_ANIMALES);
    if (!data) {
      return [];
    }
    // Si contiene semillas mock antiguas (ani-1), limpiar completamente
    if (data.includes('ani-1') || data.includes('A-101') || data.includes('982000412891001')) {
      this.limpiarDatosDePrueba();
      return [];
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

    const idx = list.findIndex(a =>
      a.id === animal.id ||
      (animal.caravana_rfid && a.caravana_rfid && a.caravana_rfid.replace(/\s+/g, '') === animal.caravana_rfid.replace(/\s+/g, '')) ||
      (animal.caravana_visual && a.caravana_visual === animal.caravana_visual)
    );

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

    // Actualizar potrero de los animales del rodeo
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
    if (!data) return [];
    if (data.includes('ani-1')) {
      localStorage.removeItem(STORAGE_KEY_PESADAS);
      return [];
    }
    return JSON.parse(data);
  },

  registrarPesada(item: {
    animal_id: string;
    fecha: string;
    hora?: string;
    peso_kg: number;
    condicion_corporal?: number;
    tacto?: string;
    origen_pesada: string;
    observaciones?: string;
  }): PesadaAnimal {
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

    if (fechaAnterior && pesoAnterior > 0) {
      const d1 = new Date(fechaAnterior).getTime();
      const d2 = new Date(item.fecha).getTime();
      diasTranscurridos = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
      gdp = Number(((item.peso_kg - pesoAnterior) / diasTranscurridos).toFixed(3));
    }

    const nuevaPesada: PesadaAnimal = {
      id: `pes-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tenant_id: 'default',
      animal_id: animal.id,
      caravana_visual: animal.caravana_visual,
      caravana_rfid: animal.caravana_rfid,
      fecha: item.fecha,
      hora: item.hora,
      peso_kg: item.peso_kg,
      peso_anterior_kg: pesoAnterior > 0 ? pesoAnterior : undefined,
      dias_transcurridos: diasTranscurridos > 0 ? diasTranscurridos : undefined,
      gdp_kg_dia: gdp !== 0 ? gdp : undefined,
      condicion_corporal: item.condicion_corporal,
      tacto: item.tacto,
      origen_pesada: item.origen_pesada,
      observaciones: item.observaciones
    };

    pesadas.unshift(nuevaPesada);
    localStorage.setItem(STORAGE_KEY_PESADAS, JSON.stringify(pesadas));

    // Actualizar animal
    animal.peso_actual_kg = item.peso_kg;
    animal.fecha_ultima_pesada = item.fecha;
    if (item.hora) animal.hora_ultima_pesada = item.hora;
    if (item.condicion_corporal) animal.condicion_corporal = item.condicion_corporal;
    if (item.tacto) animal.tacto = item.tacto;
    if (gdp !== 0) animal.gdp_historica_kg_dia = gdp;
    this.saveAnimal(animal);

    return nuevaPesada;
  },

  // --- PARSER OFICIAL Y HEURÍSTICO TRU-TEST (FN-3.4 & FN-3.5) ---
  // Diseñado para coincidir exactamente con Sesion4.csv y COLOC_VQ.csv
  parsearLecturaBastones(csvContent: string): {
    lecturas: LecturaRFID[];
    inconsistencias: InconsistenciaGanadera[];
  } {
    // 1. Limpieza de BOM y líneas
    const cleanContent = csvContent.replace(/^\uFEFF/, '').trim();
    const lineas = cleanContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lineas.length === 0) return { lecturas: [], inconsistencias: [] };

    // 2. Determinar separador
    const primera = lineas[0];
    let sep = ',';
    if (primera.includes(';') && (primera.match(/;/g)?.length || 0) >= (primera.match(/,/g)?.length || 0)) sep = ';';
    else if (primera.includes('\t')) sep = '\t';

    // 3. Normalizar encabezados (quitar comillas, tildes y espacios)
    const normalizeHeader = (str: string) =>
      str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/["']/g, '')
        .trim();

    const encabezados = primera.split(sep).map(normalizeHeader);

    // Mapeo exacto de columnas Tru-Test
    // EID, VID, Date, Time, ADVERTENCIA, CONDICIÓN, TACTO, NOTA
    const idxEid = encabezados.findIndex(h => /^(eid|rfid|chip|tag|transponder)$/.test(h) || h.includes('eid') || h.includes('rfid'));
    const idxVid = encabezados.findIndex(h => /^(vid|visual|caravana|arete)$/.test(h) || h.includes('vid') || h.includes('visual'));
    const idxDate = encabezados.findIndex(h => /^(date|fecha)$/.test(h));
    const idxTime = encabezados.findIndex(h => /^(time|hora)$/.test(h));
    const idxPeso = encabezados.findIndex(h => /^(peso|weight|kg|kilos)$/.test(h));
    const idxCondicion = encabezados.findIndex(h => h.includes('condicion') || h === 'cc');
    const idxTacto = encabezados.findIndex(h => h.includes('tacto') || h.includes('reprod') || h.includes('prenez'));
    const idxAdvertencia = encabezados.findIndex(h => h.includes('advertencia') || h.includes('alerta') || h.includes('warning'));
    const idxNota = encabezados.findIndex(h => /^(nota|note|observaciones|notas)$/.test(h));

    const animalesExistentes = this.getAnimales();
    const lecturas: LecturaRFID[] = [];
    const inconsistencias: InconsistenciaGanadera[] = [];
    const eidVistos = new Set<string>();

    const startIdx = idxEid >= 0 || idxVid >= 0 ? 1 : 0;

    for (let i = startIdx; i < lineas.length; i++) {
      const rawCols = lineas[i].split(sep);
      const cols = rawCols.map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 2) continue;

      const eidRaw = idxEid >= 0 ? cols[idxEid] : cols[0];
      const vidRaw = idxVid >= 0 ? cols[idxVid] : cols[1];
      const dateRaw = idxDate >= 0 && cols[idxDate] ? cols[idxDate] : new Date().toISOString().split('T')[0];
      const timeRaw = idxTime >= 0 ? cols[idxTime] : undefined;
      const advRaw = idxAdvertencia >= 0 ? cols[idxAdvertencia] : undefined;
      const tactoRaw = idxTacto >= 0 && cols[idxTacto] ? cols[idxTacto].toUpperCase() : undefined;
      const condRaw = idxCondicion >= 0 && cols[idxCondicion] ? parseInt(cols[idxCondicion]) : undefined;
      const notaRaw = idxNota >= 0 ? cols[idxNota] : undefined;

      // Sanitizar EID y VID
      const eid = eidRaw ? eidRaw.trim() : '';
      const vid = vidRaw ? vidRaw.trim() : (eid ? `CAR-${eid.slice(-4)}` : `V-${i}`);

      // LÓGICA DE DETECCIÓN DE PESO:
      // En Tru-Test (como en Sesion4.csv), el peso a menudo se almacena en la columna NOTA
      // Ejemplo: "290", "260", "2 10" (con espacio tipográfico), etc.
      let pesoDetectado: number | undefined = undefined;
      let notaTexto: string | undefined = notaRaw;

      if (idxPeso >= 0 && cols[idxPeso]) {
        const val = parseFloat(cols[idxPeso].replace(/\s+/g, '').replace(',', '.'));
        if (!isNaN(val) && val > 0) pesoDetectado = val;
      } else if (notaRaw) {
        // Limpiar espacios en números como "2 10" -> "210"
        const cleanNota = notaRaw.replace(/\s+/g, '').replace(',', '.');
        const numVal = parseFloat(cleanNota);
        // Si es un número válido entre 30 y 1500, corresponde al peso de la manga
        if (!isNaN(numVal) && numVal >= 30 && numVal <= 1500) {
          pesoDetectado = numVal;
          notaTexto = undefined; // El valor era el peso
        }
      }

      // Validar Duplicados en la misma planilla (FN-3.5)
      const eidKey = eid.replace(/\s+/g, '');
      if (eidKey && eidVistos.has(eidKey)) {
        inconsistencias.push({
          tipo: 'DUPLICADO',
          gravedad: 'ALTA',
          caravana: eid || vid,
          descripcion: `La caravana RFID / EID ${eid} se leyó más de una vez en esta sesión de manga.`,
          fila: i + 1
        });
      }
      if (eidKey) eidVistos.add(eidKey);

      // Validar saltos de peso anómalos
      if (pesoDetectado) {
        const animalPrevio = animalesExistentes.find(a =>
          (eidKey && a.caravana_rfid?.replace(/\s+/g, '') === eidKey) ||
          (vid && a.caravana_visual === vid)
        );
        if (animalPrevio && animalPrevio.peso_actual_kg > 0) {
          const delta = pesoDetectado - animalPrevio.peso_actual_kg;
          if (delta < -45) {
            inconsistencias.push({
              tipo: 'SALTO_PESO',
              gravedad: 'ALTA',
              caravana: vid,
              descripcion: `Pérdida drástica de peso (${delta.toFixed(1)} kg) respecto a la pesada histórica (${animalPrevio.peso_actual_kg} kg).`,
              fila: i + 1
            });
          }
        }
      }

      lecturas.push({
        eid,
        vid,
        fecha: dateRaw,
        hora: timeRaw,
        peso: pesoDetectado,
        condicion: !isNaN(Number(condRaw)) ? condRaw : undefined,
        tacto: tactoRaw,
        advertencia: advRaw,
        nota: notaTexto
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

  // --- COSTOS GANADEROS (FN-3.9) - CERO MOCK ---
  getCostos(): CostoGanadero[] {
    const data = localStorage.getItem(STORAGE_KEY_COSTOS);
    if (!data) return [];
    if (data.includes('cst-1')) {
      localStorage.removeItem(STORAGE_KEY_COSTOS);
      return [];
    }
    return JSON.parse(data);
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
