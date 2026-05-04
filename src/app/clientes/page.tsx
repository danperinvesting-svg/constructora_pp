'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  Briefcase,
  ChevronRight,
  Lock
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAdminAction } from '@/lib/useAdminAction';

export default function ClientesPage() {
  const router = useRouter();
  const { canCreate, isObserver } = useAdminAction();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [newClient, setNewClient] = useState({
    name: '',
    company_name: '',
    tax_id: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching clients:', error.message);
      alert(`Error al cargar clientes: ${error.message}`);
    } else if (data) {
      console.log(`✅ Clientes cargados: ${data.length}`);
      setClients(data);
    }
    setLoading(false);
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();

    if (!canCreate) {
      alert('❌ Solo administradores pueden crear clientes');
      return;
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([{ id: uuidv4(), ...newClient }])
      .select();

    if (!error) {
      setClients([data[0], ...clients]);
      setShowModal(false);
      setNewClient({ name: '', company_name: '', tax_id: '', phone: '', email: '', address: '' });
    } else {
      console.error('Error saving client:', error);
      alert(`Error al guardar el cliente: ${error.message}`);
    }
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o empresa..."
            className="input-field"
            style={{ paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {canCreate ? (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <UserPlus size={20} /> Nuevo Cliente
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <Lock size={16} /> Solo administrador puede crear
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CLIENTE / EMPRESA</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CONTACTO</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ESTADO</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center' }}>Cargando clientes...</td></tr>
            ) : filteredClients.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron clientes.</td></tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="table-row">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontWeight: '600', color: 'white' }}>{client.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Briefcase size={12} /> {client.company_name || 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Phone size={14} className="text-muted" /> {client.phone || '---'}
                    </div>
                    <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={14} className="text-muted" /> {client.email || '---'}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span className={`badge ${client.status === 'active' ? 'badge-active' : ''}`}>
                      {client.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <button 
                      className="btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                      onClick={() => router.push(`/clientes/${client.id}`)}
                    >
                      <Briefcase size={14} /> Ver Estado de Cuenta <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Cliente */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card modal-content animate-fade">
            <h2 style={{ marginBottom: '1.5rem' }}>Registrar Nuevo Cliente</h2>
            <form onSubmit={handleAddClient} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label>Nombre Completo</label>
                <input 
                  required
                  type="text" 
                  className="input-field" 
                  value={newClient.name} 
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                />
              </div>
              <div>
                <label>Empresa</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newClient.company_name} 
                  onChange={(e) => setNewClient({...newClient, company_name: e.target.value})}
                />
              </div>
              <div>
                <label>RIF / CI</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newClient.tax_id} 
                  onChange={(e) => setNewClient({...newClient, tax_id: e.target.value})}
                />
              </div>
              <div>
                <label>Teléfono</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newClient.phone} 
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                />
              </div>
              <div>
                <label>Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={newClient.email} 
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label>Dirección</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={newClient.address} 
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                ></textarea>
              </div>
              
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar Cliente</button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
