'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Search, Activity, Trash2, Edit, Plus } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  created_at: string;
  old_data: any;
  new_data: any;
  profiles?: { name: string };
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    
    // We need to fetch logs and join with profiles.
    // If profiles isn't working due to FK not explicitly defined in some contexts, we can do it manually or rely on standard join.
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        profiles (name)
      `)
      .order('created_at', { ascending: false })
      .limit(100); // Last 100 logs for performance

    if (error) {
      console.error("Error fetching audit logs:", error);
    } else {
      setLogs(data as any);
    }
    setLoading(false);
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT': return <Plus size={16} className="text-success" style={{ color: 'var(--success)' }} />;
      case 'UPDATE': return <Edit size={16} className="text-warning" style={{ color: 'var(--primary-color)' }} />;
      case 'DELETE': return <Trash2 size={16} className="text-danger" style={{ color: 'var(--danger)' }} />;
      default: return <Activity size={16} />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'INSERT': return 'Creó';
      case 'UPDATE': return 'Editó';
      case 'DELETE': return 'Eliminó';
      default: return action;
    }
  };

  const getEntityName = (entity: string) => {
    const names: Record<string, string> = {
      'projects': 'Proyecto',
      'project_payments': 'Pago de Proyecto',
      'project_costs': 'Gasto de Proyecto',
      'transacciones': 'Transacción'
    };
    return names[entity] || entity;
  };

  const filteredLogs = logs.filter(log => 
    log.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getEntityName(log.entity).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getActionText(log.action).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <ShieldCheck size={32} color="var(--primary-color)" />
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Registro de Auditoría</h1>
          <p className="text-muted" style={{ marginTop: '0.25rem' }}>Historial de movimientos y acciones en el sistema</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por usuario, acción o módulo..." 
            className="input-field"
            style={{ paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>FECHA / HORA</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>USUARIO</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ACCIÓN</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>MÓDULO AFECTADO</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>DETALLES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center' }}>Cargando registros...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron movimientos.</td></tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                    {log.profiles?.name || 'Usuario Eliminado'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getActionIcon(log.action)}
                      <span>{getActionText(log.action)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      {getEntityName(log.entity)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {/* Simplified detail view */}
                    {log.action === 'DELETE' && 'Registro eliminado de forma permanente.'}
                    {log.action === 'INSERT' && 'Nuevo registro creado.'}
                    {log.action === 'UPDATE' && 'Modificación de valores.'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
