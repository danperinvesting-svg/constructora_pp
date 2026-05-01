'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/formatters';
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  PieChart,
  Wallet,
  Activity,
  FileText,
  Save,
  CheckCircle2
} from 'lucide-react';

interface ProjectAdmin {
  id: string;
  title: string;
  status: string;
  budget_usd: number;
  proposal_number?: number;
  clients: { name: string };
  project_payments: { amount_usd: number }[];
  project_costs: { quantity: number; unit_price_usd: number }[];
  project_extras: { amount_usd: number }[];
}

export default function AdministracionDashboard() {
  const [projects, setProjects] = useState<ProjectAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Notas Globales
  const [globalNotes, setGlobalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    fetchAdminData();
    fetchGlobalNotes();
  }, []);

  async function fetchAdminData() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, title, status, budget_usd, proposal_number,
          clients(name),
          project_payments(amount_usd),
          project_costs(quantity, unit_price_usd),
          project_extras(amount_usd)
        `)
        .in('status', ['in_progress', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data as any);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGlobalNotes() {
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_notes')
        .single();
      
      if (data && data.setting_value) {
        setGlobalNotes(data.setting_value.text || '');
      }
    } catch (error: any) {
      // Ignorar error si no existe la fila aún
      if (error.code !== 'PGRST116') {
        console.error('Error fetching global notes:', error);
      }
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      const { error } = await supabase
        .from('global_settings')
        .upsert({ 
          setting_key: 'admin_notes', 
          setting_value: { text: globalNotes } 
        }, { onConflict: 'setting_key' });

      if (error) throw error;
      
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Error al guardar las notas');
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem auto' }}>⏳</div>
        Cargando módulo de administración financiera...
      </div>
    );
  }

  // --- FINANCIAL CALCULATIONS ---
  // Total Contratado (Presupuesto Base + Extras)
  const totalContracted = projects.reduce((sum, p) => {
    const extras = p.project_extras?.reduce((acc, e) => acc + Number(e.amount_usd), 0) || 0;
    return sum + Number(p.budget_usd) + extras;
  }, 0);

  // Total Abonado (Ingresos)
  const totalIncome = projects.reduce((sum, p) => 
    sum + (p.project_payments?.reduce((acc, pay) => acc + Number(pay.amount_usd), 0) || 0)
  , 0);

  // Saldo Pendiente
  const receivables = totalContracted - totalIncome;

  // Egresos Ejecutados
  const totalExpenses = projects.reduce((sum, p) => 
    sum + (p.project_costs?.reduce((acc, cost) => acc + (Number(cost.quantity) * Number(cost.unit_price_usd)), 0) || 0)
  , 0);

  // Análisis de Presupuesto y Ganancias
  const estimatedProfit = totalContracted - totalExpenses;
  const estimatedMargin = totalContracted > 0 ? (estimatedProfit / totalContracted) * 100 : 0;

  // Rentabilidad Actual (Caja real)
  const grossProfit = totalIncome - totalExpenses;

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <PieChart size={32} color="var(--primary-color)" />
            Dashboard Administrativo
          </h1>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>
            Estado de Cuentas Global y Análisis de Rentabilidad
          </p>
        </div>
      </div>

      {/* FLUJO DE CONTRATOS Y COBRANZAS */}
      <h3 style={{ fontSize: '1.2rem', margin: '0 0 -1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
        <Wallet size={20} /> Resumen de Contratación y Cobranzas
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(145deg, rgba(56,189,248,0.05) 0%, rgba(0,0,0,0) 100%)', borderColor: 'rgba(56,189,248,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
            <Briefcase size={18} /> <span style={{ fontWeight: 600 }}>Total Contratado</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white' }}>
            ${formatCurrency(totalContracted)}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Presupuestos base + extras aprobados
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(145deg, rgba(16,185,129,0.05) 0%, rgba(0,0,0,0) 100%)', borderColor: 'rgba(16,185,129,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
            <TrendingUp size={18} /> <span style={{ fontWeight: 600 }}>Total Abonado</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white' }}>
            ${formatCurrency(totalIncome)}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Dinero real ingresado en caja
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(145deg, rgba(245,158,11,0.05) 0%, rgba(0,0,0,0) 100%)', borderColor: 'rgba(245,158,11,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
            <Activity size={18} /> <span style={{ fontWeight: 600 }}>Saldo Pendiente</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white' }}>
            ${formatCurrency(receivables)}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Cuentas por cobrar a clientes
          </div>
        </div>
      </div>

      {/* ANÁLISIS DE PRESUPUESTO Y GANANCIAS */}
      <h3 style={{ fontSize: '1.2rem', margin: '1rem 0 -1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
        <TrendingUp size={20} /> Análisis de Presupuesto y Ganancias
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(145deg, rgba(239,68,68,0.05) 0%, rgba(0,0,0,0) 100%)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
            <TrendingDown size={18} /> <span style={{ fontWeight: 600 }}>Egresos Ejecutados</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white' }}>
            ${formatCurrency(totalExpenses)}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Materiales, nómina, equipos
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(145deg, rgba(16,185,129,0.05) 0%, rgba(0,0,0,0) 100%)', borderColor: 'rgba(16,185,129,0.5)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}>
            <PieChart size={100} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.5rem', position: 'relative', zIndex: 1 }}>
            <TrendingUp size={18} /> <span style={{ fontWeight: 600 }}>Ganancia Estimada</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white', position: 'relative', zIndex: 1 }}>
            ${formatCurrency(estimatedProfit)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', position: 'relative', zIndex: 1 }}>
             <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Proyección (Contratado - Gastos)</div>
             <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>
               {estimatedMargin.toFixed(1)}% Margen Estimado
             </span>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <Wallet size={18} /> <span style={{ fontWeight: 600 }}>Rentabilidad Actual (Caja)</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white' }}>
            ${formatCurrency(grossProfit)}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Efectivo real: Abonado - Ejecutado
          </div>
        </div>

      </div>

      {/* NOTAS GLOBALES & TABLA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* BLOC DE NOTAS GLOBALES */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <FileText size={18} className="text-muted" /> Notas Globales
            </h3>
            {notesSaved && <span style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={14} /> Guardado</span>}
          </div>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            Escribe aquí recordatorios generales, pendientes de cobro, pagos a recibir o tareas administrativas.
          </p>
          <textarea 
            className="input-field"
            style={{ flex: 1, resize: 'none', minHeight: '300px', fontFamily: 'inherit', lineHeight: '1.5' }}
            placeholder="Ej:&#10;- Falta cobrar $500 del proyecto X.&#10;- Recibir material el jueves.&#10;- Revisar cotización Y."
            value={globalNotes}
            onChange={(e) => setGlobalNotes(e.target.value)}
          />
          <button 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
            onClick={handleSaveNotes}
            disabled={savingNotes}
          >
            {savingNotes ? 'Guardando...' : <><Save size={18} /> Guardar Notas</>}
          </button>
        </div>

        {/* TABLA DE EJECUCIÓN DE PROYECTOS */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', height: '100%' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={18} className="text-muted" /> Desglose por Proyecto
            </h2>
          </div>

          {projects.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No hay proyectos en ejecución registrados.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>PROYECTO</th>
                    <th style={{ textAlign: 'right', padding: '1rem 1.5rem' }}>PPT. CONTRATADO</th>
                    <th style={{ textAlign: 'right', padding: '1rem 1.5rem' }}>EGRESOS EJECUTADOS</th>
                    <th style={{ textAlign: 'right', padding: '1rem 1.5rem' }}>GANANCIA ESTIMADA</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => {
                    const extras = p.project_extras?.reduce((acc, e) => acc + Number(e.amount_usd), 0) || 0;
                    const pptFinal = Number(p.budget_usd) + extras;
                    const egresos = p.project_costs?.reduce((acc, cost) => acc + (Number(cost.quantity) * Number(cost.unit_price_usd)), 0) || 0;
                    const rentabilidadEst = pptFinal - egresos;
                    const isLossEst = rentabilidadEst < 0;

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="hover-row">
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          <div style={{ fontWeight: '600', color: 'white', marginBottom: '0.2rem' }}>
                            {p.proposal_number ? <span style={{ color: 'var(--primary-color)', marginRight: '0.5rem' }}>#{p.proposal_number}</span> : null}
                            {p.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Cliente: {p.clients?.name}
                          </div>
                        </td>
                        
                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontWeight: '500' }}>
                          ${formatCurrency(pptFinal)}
                        </td>
                        
                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', color: 'var(--danger)' }}>
                          ${formatCurrency(egresos)}
                        </td>
                        
                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold', color: isLossEst ? 'var(--danger)' : 'var(--success)', fontSize: '1.1rem' }}>
                            {isLossEst ? '-' : ''}${formatCurrency(Math.abs(rentabilidadEst))}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Margen: {pptFinal > 0 ? ((rentabilidadEst / pptFinal) * 100).toFixed(1) : '0'}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
