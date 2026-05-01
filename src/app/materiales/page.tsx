'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Pencil, Trash2, Check, X, Search, Tag, DollarSign } from 'lucide-react';
import { getMaterials, upsertMaterial, deleteMaterial, Material } from '@/app/actions/material-actions';

const CATEGORIES = ['Agregados', 'Metales', 'Acabados', 'Techos', 'Fijaciones', 'Mampostería', 'General'];

const EMPTY: Omit<Material, 'id' | 'updated_at'> = { name: '', unit: '', price_usd: 0, category: 'General', provider: '', notes: '' };

export default function MaterialesPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Material>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newMat, setNewMat] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setMaterials(await getMaterials()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await upsertMaterial({ ...editData, id } as any);
      setEditId(null);
      await load();
    } finally { setSaving(false); }
  }

  async function saveNew() {
    if (!newMat.name || !newMat.unit) return;
    setSaving(true);
    try {
      await upsertMaterial(newMat);
      setShowAdd(false);
      setNewMat({ ...EMPTY });
      await load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este material?')) return;
    await deleteMaterial(id);
    await load();
  }

  const filtered = materials.filter(m => {
    const q = search.toLowerCase();
    return !q || 
      m.name.toLowerCase().includes(q) || 
      m.category.toLowerCase().includes(q) || 
      (m.provider && m.provider.toLowerCase().includes(q));
  });

  // Group by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(m => m.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {} as Record<string, Material[]>);
  const otherItems = filtered.filter(m => !CATEGORIES.includes(m.category));
  if (otherItems.length) grouped['Otros'] = otherItems;

  const totalValue = materials.reduce((s, m) => s + Number(m.price_usd), 0);

  return (
    <div style={{ padding: '2rem 3rem', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.3rem' }}>
            <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,.2),rgba(56,189,248,.15))', padding: '.6rem', borderRadius: '12px' }}>
              <Package size={22} style={{ color: 'var(--primary-color)' }} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Inventario de Materiales</h1>
          </div>
          <p className="text-muted" style={{ margin: 0 }}>
            Precios actualizados que la IA usa automáticamente en cada cotización
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <Plus size={16} /> Nuevo Material
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Materiales', value: materials.length, icon: <Package size={18} />, color: 'var(--primary-color)' },
          { label: 'Categorías', value: [...new Set(materials.map(m => m.category))].length, icon: <Tag size={18} />, color: 'var(--accent-blue)' },
          { label: 'Suma de Precios', value: `$${totalValue.toFixed(2)}`, icon: <DollarSign size={18} />, color: 'var(--success)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.4rem' }}>
            <div style={{ background: `${s.color}18`, padding: '.6rem', borderRadius: '10px', color: s.color }}>{s.icon}</div>
            <div>
              <p className="text-muted" style={{ margin: 0, fontSize: '.78rem' }}>{s.label}</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" style={{ paddingLeft: '2.5rem' }} placeholder="Buscar por nombre o categoría (ej: cemento, metales...)" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Add new row */}
      {showAdd && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(245,158,11,.05)', borderColor: 'rgba(245,158,11,.3)' }}>
          <p style={{ margin: '0 0 1rem', fontWeight: 600, color: 'var(--primary-color)' }}>+ Agregar Nuevo Material</p>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 2fr auto', gap: '.75rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Nombre</label>
              <input className="input-field" placeholder="Ej: Cemento Gris" value={newMat.name} onChange={e => setNewMat({ ...newMat, name: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Unidad</label>
              <input className="input-field" placeholder="Saco, m², ml..." value={newMat.unit} onChange={e => setNewMat({ ...newMat, unit: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Precio USD</label>
              <input className="input-field" type="number" step="0.01" placeholder="0.00" value={newMat.price_usd} onChange={e => setNewMat({ ...newMat, price_usd: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Categoría</label>
              <select className="input-field" value={newMat.category} onChange={e => setNewMat({ ...newMat, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Proveedor</label>
              <input className="input-field" placeholder="Ej: Concretera X" value={newMat.provider} onChange={e => setNewMat({ ...newMat, provider: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Notas (opcional)</label>
              <input className="input-field" placeholder="Referencia, marca..." value={newMat.notes || ''} onChange={e => setNewMat({ ...newMat, notes: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button className="btn-primary" style={{ padding: '.7rem .9rem', minWidth: 'auto' }} onClick={saveNew} disabled={saving}>
                <Check size={16} />
              </button>
              <button style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', padding: '.7rem .9rem', cursor: 'pointer', color: 'var(--danger)' }} onClick={() => setShowAdd(false)}>
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tables by category */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando materiales...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '.85rem 1.4rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,.02)', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <Tag size={14} style={{ color: 'var(--primary-color)' }} />
                <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{cat}</span>
                <span className="text-muted" style={{ fontSize: '.78rem' }}>({items.length})</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['Material', 'Unidad', 'Precio USD', 'Proveedor', 'Notas', 'Actualizado', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '.7rem 1.2rem', textAlign: 'left', fontSize: '.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((m, idx) => (
                    <tr key={m.id} style={{ borderBottom: idx < items.length - 1 ? '1px solid var(--border-color)' : 'none', transition: 'background .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      {editId === m.id ? (
                        <>
                          <td style={{ padding: '.55rem 1rem' }}><input className="input-field" style={{ padding: '.4rem .7rem', fontSize: '.85rem' }} value={editData.name ?? m.name} onChange={e => setEditData({ ...editData, name: e.target.value })} /></td>
                          <td style={{ padding: '.55rem 1rem' }}><input className="input-field" style={{ padding: '.4rem .7rem', fontSize: '.85rem', width: 90 }} value={editData.unit ?? m.unit} onChange={e => setEditData({ ...editData, unit: e.target.value })} /></td>
                          <td style={{ padding: '.55rem 1rem' }}><input className="input-field" type="number" step="0.01" style={{ padding: '.4rem .7rem', fontSize: '.85rem', width: 90 }} value={editData.price_usd ?? m.price_usd} onChange={e => setEditData({ ...editData, price_usd: parseFloat(e.target.value) || 0 })} /></td>
                          <td style={{ padding: '.55rem 1rem' }}><input className="input-field" style={{ padding: '.4rem .7rem', fontSize: '.85rem' }} value={editData.provider ?? m.provider ?? ''} onChange={e => setEditData({ ...editData, provider: e.target.value })} /></td>
                          <td style={{ padding: '.55rem 1rem' }}><input className="input-field" style={{ padding: '.4rem .7rem', fontSize: '.85rem' }} value={editData.notes ?? m.notes ?? ''} onChange={e => setEditData({ ...editData, notes: e.target.value })} /></td>
                          <td style={{ padding: '.55rem 1rem' }} />
                          <td style={{ padding: '.55rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '.4rem' }}>
                              <button className="btn-primary" style={{ padding: '.4rem .65rem', minWidth: 'auto', fontSize: '.8rem' }} onClick={() => saveEdit(m.id)} disabled={saving}><Check size={14} /></button>
                              <button style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '7px', padding: '.4rem .65rem', cursor: 'pointer', color: 'var(--danger)' }} onClick={() => setEditId(null)}><X size={14} /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '.75rem 1.2rem', fontSize: '.9rem', fontWeight: 500 }}>{m.name}</td>
                          <td style={{ padding: '.75rem 1.2rem', fontSize: '.85rem', color: 'var(--text-muted)' }}>{m.unit}</td>
                          <td style={{ padding: '.75rem 1.2rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '.95rem' }}>${Number(m.price_usd).toFixed(2)}</span>
                          </td>
                          <td style={{ padding: '.75rem 1.2rem', fontSize: '.85rem', color: 'var(--accent-blue)', fontWeight: 500 }}>{m.provider || '—'}</td>
                          <td style={{ padding: '.75rem 1.2rem', fontSize: '.82rem', color: 'var(--text-muted)' }}>{m.notes || '—'}</td>
                          <td style={{ padding: '.75rem 1.2rem', fontSize: '.78rem', color: 'var(--text-muted)' }}>{new Date(m.updated_at).toLocaleDateString('es-VE')}</td>
                          <td style={{ padding: '.75rem 1.2rem' }}>
                            <div style={{ display: 'flex', gap: '.4rem' }}>
                              <button style={{ background: 'rgba(56,189,248,.08)', border: '1px solid rgba(56,189,248,.2)', borderRadius: '7px', padding: '.4rem .65rem', cursor: 'pointer', color: 'var(--accent-blue)' }} onClick={() => { setEditId(m.id); setEditData(m); }}><Pencil size={14} /></button>
                              <button style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '7px', padding: '.4rem .65rem', cursor: 'pointer', color: 'var(--danger)' }} onClick={() => handleDelete(m.id)}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No hay materiales que coincidan con la búsqueda.</div>
          )}
        </div>
      )}
    </div>
  );
}
