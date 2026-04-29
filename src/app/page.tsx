'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  DollarSign,
  ArrowUpRight,
  Plus,
  Briefcase,
  ChevronRight
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [stats, setStats] = useState({
    clientsCount: 0,
    activeProjectsCount: 0,
    pendingQuotesCount: 0,
    totalBalance: 0
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      const { count: activeProjectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');

      const { count: pendingQuotesCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('status', ['proposal', 'quoted']);

      const { data: accounts } = await supabase
        .from('financial_accounts')
        .select('balance');
      
      const totalBalance = accounts?.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0) || 0;

      setStats({
        clientsCount: clientsCount || 0,
        activeProjectsCount: activeProjectsCount || 0,
        pendingQuotesCount: pendingQuotesCount || 0,
        totalBalance: totalBalance
      });

      const { data: projects } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentProjects(projects || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade">
      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <Link href="/clientes" prefetch={false} className="card" style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.75rem', borderRadius: '12px', color: 'var(--accent-blue)' }}>
              <Users size={24} />
            </div>
            <ArrowUpRight size={18} className="text-muted" />
          </div>
          <p className="text-muted" style={{ marginTop: '1rem' }}>Total Clientes</p>
          <h2 style={{ color: 'white', marginTop: '0.25rem', fontSize: '1.8rem' }}>
            {loading ? '...' : stats.clientsCount}
          </h2>
        </Link>

        <Link href="/proyectos" prefetch={false} className="card" style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '12px', color: 'var(--primary-color)' }}>
              <TrendingUp size={24} />
            </div>
            <ArrowUpRight size={18} className="text-muted" />
          </div>
          <p className="text-muted" style={{ marginTop: '1rem' }}>Proyectos Activos</p>
          <h2 style={{ color: 'white', marginTop: '0.25rem', fontSize: '1.8rem' }}>
            {loading ? '...' : stats.activeProjectsCount}
          </h2>
        </Link>

        <Link href="/proyectos" prefetch={false} className="card" style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '12px', color: 'var(--danger)' }}>
              <Clock size={24} />
            </div>
            <ArrowUpRight size={18} className="text-muted" />
          </div>
          <p className="text-muted" style={{ marginTop: '1rem' }}>Propuestas Pendientes</p>
          <h2 style={{ color: 'white', marginTop: '0.25rem', fontSize: '1.8rem' }}>
            {loading ? '...' : stats.pendingQuotesCount}
          </h2>
        </Link>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px', color: 'var(--success)' }}>
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-muted" style={{ marginTop: '1rem' }}>Saldo Total (USD)</p>
          <h2 style={{ color: 'white', marginTop: '0.25rem', fontSize: '1.8rem' }}>
            {loading ? '...' : `$${stats.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </h2>
        </div>
      </div>

      {/* Main Content Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="card" style={{ minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Proyectos Recientes</h3>
            <Link href="/proyectos" style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'none' }}>Ver todos</Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loading ? (
              <p className="text-muted">Cargando proyectos...</p>
            ) : recentProjects.length === 0 ? (
              <p className="text-muted">No hay proyectos recientes para mostrar.</p>
            ) : (
              recentProjects.map((project) => (
                <div key={project.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'white' }}>{project.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{project.clients?.name || 'Cliente desconocido'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="badge" style={{ fontSize: '0.7rem' }}>{project.status}</span>
                    <ChevronRight size={16} className="text-muted" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Accesos Rápidos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Link href="/clientes" style={{ textDecoration: 'none' }}>
              <button className="quick-action" style={{ width: '100%' }}>
                <Plus size={18} /> Registrar Cliente
              </button>
            </Link>
            <Link href="/administracion" style={{ textDecoration: 'none' }}>
              <button className="quick-action" style={{ width: '100%' }}>
                <DollarSign size={18} /> Registrar Gasto
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

