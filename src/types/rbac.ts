/**
 * Catálogo Maestro de Funciones de Landa360 (Escenario A)
 * Cada función representa un permiso granular accionable asignable a roles dinámicos.
 */

export type ModuloId = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M7';

export interface FuncionPermiso {
  id: string; // Slug único en base de datos
  modulo: ModuloId;
  codigo: string; // FN-x.y
  nombre: string;
  descripcion: string;
  categoria: 'operativo' | 'financiero' | 'configuracion';
  esSensiblePrecio: boolean; // Si es true, el personal operativo no debe ver este valor
}

export interface Rol {
  id: string;
  tenantId: string;
  nombre: string;
  descripcion?: string;
  esSistema: boolean; // Roles base: Dueño, Agrónomo, Capataz, Contador
  funcionesIds: string[]; // Lista de IDs de funciones asignadas
}

export interface UsuarioPerfil {
  id: string;
  tenantId: string;
  email: string;
  nombreCompleto: string;
  rolId: string;
  esAdmin: boolean;
  activo: boolean;
}

// Catálogo inmutable de funciones oficiales de Landa360
export const CATALOGO_FUNCIONES: FuncionPermiso[] = [
  // M1: Núcleo y Seguridad
  {
    id: 'fn_1_1_multitenant',
    modulo: 'M1',
    codigo: 'FN-1.1',
    nombre: 'Aislamiento de Campo (Multi-Tenant)',
    descripcion: 'Garantizar el blindaje de datos por CUIT',
    categoria: 'configuracion',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_1_2_usuarios',
    modulo: 'M1',
    codigo: 'FN-1.2',
    nombre: 'Gestión de Usuarios y Roles Dinámicos',
    descripcion: 'Crear roles personalizados y asignar permisos granulares',
    categoria: 'configuracion',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_1_3_privacidad_precios',
    modulo: 'M1',
    codigo: 'FN-1.3',
    nombre: 'Ver Precios, Costos y Balances',
    descripcion: 'Acceso a tarifas de contratistas, costos de insumos y balances',
    categoria: 'financiero',
    esSensiblePrecio: true,
  },
  {
    id: 'fn_1_4_auditoria',
    modulo: 'M1',
    codigo: 'FN-1.4',
    nombre: 'Bitácora de Auditoría Inmutable',
    descripcion: 'Consultar el registro de modificaciones en el establecimiento',
    categoria: 'configuracion',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_1_5_exportacion',
    modulo: 'M1',
    codigo: 'FN-1.5',
    nombre: 'Respaldo y Descarga de Datos en 1 Clic',
    descripcion: 'Exportar la base de datos completa del campo',
    categoria: 'configuracion',
    esSensiblePrecio: false,
  },

  // M2: Agrícola y Lotes KML
  {
    id: 'fn_2_1_catastro_lotes',
    modulo: 'M2',
    codigo: 'FN-2.1',
    nombre: 'Catastro de Lotes y Campañas',
    descripcion: 'Administrar los lotes agrícolas y cultivos',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_2_2_importador_kml',
    modulo: 'M2',
    codigo: 'FN-2.2',
    nombre: 'Importador Satelital KML/KMZ',
    descripcion: 'Importar mapas de Google Earth con cálculo WGS84 de hectáreas',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_2_3_receta_labor',
    modulo: 'M2',
    codigo: 'FN-2.3',
    nombre: 'Prescripción de Labores e Insumos',
    descripcion: 'Definir recetas agronómicas con dosis por hectárea',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_2_4_emision_ot',
    modulo: 'M2',
    codigo: 'FN-2.4',
    nombre: 'Emisión de Orden de Trabajo (OT) sin Precios',
    descripcion: 'Generar la OT formal para maquinistas y contratistas',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_2_5_cierre_labor',
    modulo: 'M2',
    codigo: 'FN-2.5',
    nombre: 'Cierre de Labor a Campo',
    descripcion: 'Asentar la labor terminada y descontar insumos de galpón',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_2_8_margen_bruto',
    modulo: 'M2',
    codigo: 'FN-2.8',
    nombre: 'Tablero de Margen Bruto Agrícola ($/ha)',
    descripcion: 'Visualizar rentabilidad neta por lote y cultivo',
    categoria: 'financiero',
    esSensiblePrecio: true,
  },

  // M3: Ganadería y RFID
  {
    id: 'fn_3_1_inventario_hacienda',
    modulo: 'M3',
    codigo: 'FN-3.1',
    nombre: 'Inventario de Hacienda por Rodeo',
    descripcion: 'Control físico de categorías y cabezas',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_3_2_potreros_ev',
    modulo: 'M3',
    codigo: 'FN-3.2',
    nombre: 'Carga Ganadera en Equivalente Vaca (EV/ha)',
    descripcion: 'Semáforo de receptividad y pastoreo por potrero',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_3_3_pesadas_rfid',
    modulo: 'M3',
    codigo: 'FN-3.3',
    nombre: 'Importador de Bastón y Balanza RFID',
    descripcion: 'Subir pesadas por caravana electrónica y calcular GDP',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_3_5_alertas_sanitarias',
    modulo: 'M3',
    codigo: 'FN-3.5',
    nombre: 'Alertas Sanitarias y Pérdida de Peso',
    descripcion: 'Detectar animales con ganancia negativa de peso',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },

  // M4: Stock de Insumos y Granos
  {
    id: 'fn_4_1_stock_galpon',
    modulo: 'M4',
    codigo: 'FN-4.1',
    nombre: 'Stock Físico en Galpón',
    descripcion: 'Consultar existencias de insumos y agroquímicos',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_4_1_stock_ppp',
    modulo: 'M4',
    codigo: 'FN-4.1b',
    nombre: 'Valorización de Stock por PPP',
    descripcion: 'Ver costo de inventario a Precio Promedio Ponderado',
    categoria: 'financiero',
    esSensiblePrecio: true,
  },
  {
    id: 'fn_4_2_silobolsas',
    modulo: 'M4',
    codigo: 'FN-4.2',
    nombre: 'Trazabilidad de Silobolsas y Calidad',
    descripcion: 'Registro de humedad, temperatura y mermas en silos',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },

  // M5: Finanzas, Tesorería y OCR
  {
    id: 'fn_5_1_caja_bimonetaria',
    modulo: 'M5',
    codigo: 'FN-5.1',
    nombre: 'Caja Bimonetaria y Bancos (ARS / USD)',
    descripcion: 'Saldos de cuentas, cotizaciones BNA y MEP',
    categoria: 'financiero',
    esSensiblePrecio: true,
  },
  {
    id: 'fn_5_2_ocr_facturas',
    modulo: 'M5',
    codigo: 'FN-5.2',
    nombre: 'Carga Inteligente de Facturas por Foto (OCR)',
    descripcion: 'Lectura de QR oficial de ARCA y extracción con IA',
    categoria: 'financiero',
    esSensiblePrecio: true,
  },
  {
    id: 'fn_5_3_cheques_cartera',
    modulo: 'M5',
    codigo: 'FN-5.3',
    nombre: 'Cartera de Cheques y Echeqs',
    descripcion: 'Seguimiento de cheques físicos y digitales',
    categoria: 'financiero',
    esSensiblePrecio: true,
  },

  // M6: Clima y Maquinaria
  {
    id: 'fn_6_1_pluviometro',
    modulo: 'M6',
    codigo: 'FN-6.1',
    nombre: 'Pluviómetro Digital por Potrero',
    descripcion: 'Registro milimétrico de precipitaciones e histórico',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_6_2_maquinaria_service',
    modulo: 'M6',
    codigo: 'FN-6.2',
    nombre: 'Parque de Maquinaria y Horómetros',
    descripcion: 'Alertas preventivas de servicios y mantenimiento',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },

  // M7: Dashboard Ejecutivo
  {
    id: 'fn_7_1_dashboard_ejecutivo',
    modulo: 'M7',
    codigo: 'FN-7.1',
    nombre: 'Tablero de Control del Dueño',
    descripcion: 'Panel consolidado de siembra, hacienda y alertas',
    categoria: 'operativo',
    esSensiblePrecio: false,
  },
  {
    id: 'fn_7_2_resultado_operativo',
    modulo: 'M7',
    codigo: 'FN-7.2',
    nombre: 'Resultado Económico Operativo',
    descripcion: 'Cálculo en tiempo real del margen financiero global',
    categoria: 'financiero',
    esSensiblePrecio: true,
  },
];
