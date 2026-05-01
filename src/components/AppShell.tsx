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

        {/* Discreet User Info */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Usuario Activo</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {session?.user?.user_metadata?.name || 'Henry Daniel Peraza'}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Topbar: Solo se muestra si no estamos en una vista de detalle de cliente/proyecto para evitar redundancia */}
        {!pathname.includes('/clientes/') && !pathname.includes('/proyectos/') && (
          <header className="hide-on-print" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '2rem' }}>
            <button className="btn-primary" onClick={handleNewProposal}>
              <PlusCircle size={20} /> Nueva Propuesta
            </button>
          </header>
        )}

        {children}
      </main>

      {/* Floating Global AI Assistant */}
      <FloatingAssistant onProposalSaved={() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('proposalSaved'));
        }
      }} />

      <NewProposalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => setModalOpen(false)}
        onOpenAI={handleOpenAI}
      />
    </div>
  );
}
