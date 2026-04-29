'use server';

import { supabase } from '@/lib/supabase';

export interface Material {
  id: string;
  name: string;
  unit: string;
  price_usd: number;
  category: string;
  notes?: string;
  updated_at: string;
}

export async function getMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('category')
    .order('name');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function upsertMaterial(material: Partial<Material> & { name: string; unit: string }): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .upsert({ ...material, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
