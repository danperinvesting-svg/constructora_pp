'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3, Users, HardHat, Wallet, LayoutDashboard,
  Settings, PlusCircle, Package, LogOut, ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NewProposalModal from '@/components/NewProposalModal';
import FloatingAssistant from '@/components/FloatingAssistant';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session && pathname !== '/login') {
        router.push('/login');
      } else if (session && pathname === '/login') {
        router.push('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && pathname !== '/login') {
        router.push('/login');
      } else if (session && pathname === '/login') {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  function handleNewProposal() {
    setModalOpen(true);
  }

  function handleOpenAI() {
    if (typeof window !== 'undefined' && (window as any).__openProposalAssistant) {
      (window as any).__openProposalAssistant();
    }
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>;
  }

  if (!session || pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <Image src="/logo_3d.png" alt="P&P CONSTRUYE" width={160} height={80} style={{ objectFit: 'contain', filter: 'brightness(1.1)' }} priority />
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <Link href="/" className="nav-link"><LayoutDashboard size={20} /> Dashboard</Link>
          <Link href="/clientes" className="nav-link"><Users size={20} /> Clientes</Link>
          <Link href="/proyectos" className="nav-link"><HardHat size={20} /> Proyectos</Link>
          <Link href="/materiales" className="nav-link"><Package size={20} /> Materiales</Link>
          <Link href="/administracion" className="nav-link"><Wallet size={20} /> Administración</Link>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/auditoria" className="nav-link"><ShieldCheck size={20} /> Auditoría</Link>
          <Link href="/ajustes" className="nav-link"><Settings size={20} /> Ajustes</Link>
          <button onClick={handleLogout} className="nav-link" style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#ef4444' }}>
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Topbar */}
        <header className="hide-on-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <span className="text-muted">Bienvenido de nuevo,</span>
            <h1 style={{ marginTop: '0.25rem' }}>{session?.user?.user_metadata?.name || 'Usuario'}</h1>
          </div>
          <button className="btn-primary" onClick={handleNewProposal}>
            <PlusCircle size={20} /> Nueva Propuesta
          </button>
        </header>

        {children}
      </main>

      {/* Floating Global AI Assistant */}
      <FloatingAssistant onProposalSaved={() => {}} />

      <NewProposalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => setModalOpen(false)}
        onOpenAI={handleOpenAI}
      />
    </div>
  );
}
