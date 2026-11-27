// ==============================================================================
// LANDA360: TIPOS TYPESCRIPT - MÓDULO 3: GANADERÍA & RFID
// ==============================================================================

export type SexoAnimal = 'Macho' | 'Hembra' | 'Indefinido';

export type FinalidadRodeo = 'Cría' | 'Recría' | 'Invernada / Engorde' | 'Feedlot' | 'Cabaña' | 'Tambo';

export type EstadoAnimal = 'Activo' | 'Vendido' | 'Muerto' | 'Faena Consumo' | 'Trasladado';

export type OrigenAnimal = 'Propio (Nacido)' | 'Compra' | 'Capitalización';

export type TipoFarmaco = 'Vacuna' | 'Antiparasitario' | 'Antibiótico' | 'Vitamínico / Mineral' | 'Otro';

export type RubroCostoGanadero = 'Alimentación y Pasturas' | 'Sanidad y Veterinaria' | 'Manga y Personal' | 'Fletes y Guías' | 'Otros';

export interface CategoriaGanadera {
  id: string;
  tenant_id: string;
  nombre: string;
  sexo: SexoAnimal;
  factor_ev: number; // Equivalente Vaca (ej. 1.00, 0.50, 1.50)
  peso_referencia_kg: number;
  activo: boolean;
}

export interface Rodeo {
  id: string;
  tenant_id: string;
  nombre: string;
  finalidad: FinalidadRodeo;
  color_identificador: string;
  observaciones?: string;
  activo: boolean;
}

export interface PotreroGanadero {
  id: string;
  tenant_id: string;
  nombre: string;
  superficie_ha: number;
  recurso_forrajero: string;
  receptividad_objetivo_ev_ha: number;
  dias_descanso_actual: number;
  activo: boolean;
  // Campos calculados en frontend
  cabezas_actuales?: number;
  carga_total_ev?: number;
  carga_actual_ev_ha?: number;
  estado_pastoreo?: 'Optimo' | 'Alerta' | 'Sobrepastoreo' | 'Vacio';
}

export interface RazaGanadera {
  id: string;
  tenant_id: string;
  nombre: string;
  activo: boolean;
}

export interface FarmacoVeterinario {
  id: string;
  tenant_id: string;
  nombre_comercial: string;
  principio_activo?: string;
  tipo: TipoFarmaco;
  dias_carencia_faena: number;
  dosis_sugerida?: string;
  activo: boolean;
}

export interface Animal {
  id: string;
  tenant_id: string;
  caravana_rfid?: string;
  caravana_visual: string;
  categoria_id: string;
  categoria_nombre?: string;
  factor_ev?: number;
  rodeo_id?: string;
  rodeo_nombre?: string;
  potrero_id?: string;
  potrero_nombre?: string;
  raza: string;
  sexo: SexoAnimal;
  fecha_nacimiento?: string;
  peso_actual_kg: number;
  condicion_corporal?: number; // Escala 1-9 (ej. de Tru-Test)
  tacto?: string; // Diagnóstico reproductivo (PRENADA, CICLICA, NO APTA, etc.)
  advertencia?: string;
  fecha_ultima_pesada?: string;
  hora_ultima_pesada?: string;
  gdp_historica_kg_dia: number;
  estado: EstadoAnimal;
  origen: OrigenAnimal;
  madre_caravana?: string;
  padre_caravana?: string;
  notas?: string;
  created_at?: string;
}

export interface MovimientoHacienda {
  id: string;
  tenant_id: string;
  fecha: string;
  rodeo_id: string;
  rodeo_nombre?: string;
  potrero_origen_id?: string;
  potrero_origen_nombre?: string;
  potrero_destino_id: string;
  potrero_destino_nombre?: string;
  cantidad_cabezas: number;
  motivo: string;
  responsable?: string;
  observaciones?: string;
}

export interface PesadaAnimal {
  id: string;
  tenant_id: string;
  animal_id: string;
  caravana_visual?: string;
  caravana_rfid?: string;
  fecha: string;
  hora?: string;
  peso_kg: number;
  peso_anterior_kg?: number;
  dias_transcurridos?: number;
  gdp_kg_dia?: number;
  condicion_corporal?: number;
  tacto?: string;
  origen_pesada: string;
  observaciones?: string;
}

export interface LecturaRFID {
  eid: string;
  vid: string;
  fecha: string;
  hora?: string;
  peso?: number;
  condicion?: number;
  tacto?: string;
  advertencia?: string;
  nota?: string;
}

export interface EventoSanitario {
  id: string;
  tenant_id: string;
  fecha: string;
  farmaco_id: string;
  farmaco_nombre?: string;
  rodeo_id?: string;
  rodeo_nombre?: string;
  potrero_id?: string;
  potrero_nombre?: string;
  animal_id?: string;
  animal_caravana?: string;
  cantidad_animales: number;
  dosis_aplicada?: string;
  fecha_fin_carencia?: string;
  requiere_refuerzo: boolean;
  fecha_refuerzo?: string;
  veterinario?: string;
  notas?: string;
}

export interface CostoGanadero {
  id: string;
  tenant_id: string;
  fecha: string;
  rodeo_id?: string;
  rodeo_nombre?: string;
  rubro: RubroCostoGanadero;
  monto_usd: number;
  monto_ars: number;
  descripcion: string;
  comprobante_nro?: string;
}

// Estructura de inconsistencias para FN-3.5
export interface InconsistenciaGanadera {
  tipo: 'DUPLICADO' | 'SALTO_PESO' | 'SEXO_CATEGORIA' | 'SIN_CATEGORIA' | 'ANIMAL_AUSENTE';
  gravedad: 'ALTA' | 'MEDIA' | 'BAJA';
  caravana: string;
  descripcion: string;
  fila?: number;
}
