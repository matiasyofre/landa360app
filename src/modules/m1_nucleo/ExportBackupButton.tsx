import { useState } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Download, 
  ShieldCheck, 
  Database, 
  Loader2,
  HardDrive
} from 'lucide-react';

export function ExportBackupButton() {
  const { tenant } = useAuth();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [lastExportDate, setLastExportDate] = useState<string | null>(null);

  const handleExport = async () => {
    if (!tenant) return;
    setIsExporting(true);

    try {
      const [tenantsRes, rolesRes, usuariosRes, auditRes] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', tenant.id),
        supabase.from('roles').select('*').eq('tenant_id', tenant.id),
        supabase.from('usuarios').select('*').eq('tenant_id', tenant.id),
        supabase.from('audit_log').select('*').eq('tenant_id', tenant.id)
      ]);

      const backupData = {
        metadata: {
          sistema: 'Campo360',
          version: 'Escenario A (MVP)',
          tenantId: tenant.id,
          cuit: tenant.cuit,
          nombreFantasia: tenant.nombreFantasia,
          fechaExportacion: new Date().toISOString(),
          generadoPor: 'Propietario / Administrador'
        },
        establecimiento: tenantsRes.data || [tenant],
        roles: rolesRes.data || [],
        usuarios: usuariosRes.data || [],
        bitacoraAuditoria: auditRes.data || []
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;

      const downloadAnchor = document.createElement('a');
      const filename = `backup_campo360_${tenant.cuit.replace(/[^0-9]/g, '')}_${new Date().toISOString().split('T')[0]}.json`;
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      await supabase.from('audit_log').insert({
        tenant_id: tenant.id,
        tabla_afectada: 'sistema',
        accion: 'EXPORTACION_BACKUP_COMPLETO',
        valores_nuevos: { archivo: filename, fecha: new Date().toISOString() }
      });

      setLastExportDate(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Error al exportar datos:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-campo-card border border-campo-borde rounded-2xl p-6 space-y-4 shadow-sm text-campo-texto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-campo-borde pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-campo-arena text-campo-bosque border border-campo-borde">
              FN-1.5 &bull; Soberanía Total de Datos
            </span>
            <span className="text-xs text-campo-muted">Resguardo Patrimonial</span>
          </div>
          <h3 className="text-lg font-bold text-campo-texto mt-1">
            Respaldo Integral y Exportación en 1 Clic
          </h3>
          <p className="text-xs text-campo-muted">
            Tus datos son 100% tuyos. Podés descargar una copia completa y estructurada de la información de tu campo en cualquier momento sin depender de nadie.
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-campo-verde hover:bg-campo-oliva text-white font-bold text-xs uppercase tracking-wider font-mono transition-all shadow-sm disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Compilando Backup...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Descargar Copia Completa</span>
            </>
          )}
        </button>
      </div>

      {/* Grid de Estado del Respaldo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-campo-blanco p-4 rounded-xl border border-campo-borde flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-campo-arena text-campo-bosque flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-campo-verde" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-campo-muted block uppercase font-semibold">Formato de Exportación</span>
            <span className="text-xs font-bold text-campo-texto font-mono">JSON Estándar Universal</span>
          </div>
        </div>

        <div className="bg-campo-blanco p-4 rounded-xl border border-campo-borde flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-campo-arena text-campo-bosque flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-campo-oliva" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-campo-muted block uppercase font-semibold">Cifrado de Base</span>
            <span className="text-xs font-bold text-campo-texto font-mono">PostgreSQL AES-256</span>
          </div>
        </div>

        <div className="bg-campo-blanco p-4 rounded-xl border border-campo-borde flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-campo-arena text-campo-bosque flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5 text-campo-tierra" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-campo-muted block uppercase font-semibold">Última Descarga</span>
            <span className="text-xs font-bold text-campo-oliva font-mono">
              {lastExportDate ? `Hoy a las ${lastExportDate}` : 'Sin descargas previas'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
