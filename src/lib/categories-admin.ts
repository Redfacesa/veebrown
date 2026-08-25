import type { Category } from './types';
import { getSupabase } from './supabase';

export type CategoryInput = {
  merchantId: string;
  name: string;
  emoji?: string;
  sortOrder?: number;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createCategory(input: CategoryInput): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const slug = slugify(input.name);
  const { data, error } = await supabase
    .from('product_categories')
    .insert({
      merchant_id: input.merchantId,
      name: input.name.trim(),
      emoji: input.emoji?.trim() || null,
      slug,
      sort_order: input.sortOrder ?? 999,
    })
    .select('id')
    .single();

  if (error) throw error;
  return String(data.id);
}

export async function updateCategory(
  categoryId: string,
  patch: Partial<CategoryInput>,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const row: Record<string, unknown> = {};
  if (patch.name != null) {
    row.name = patch.name.trim();
    row.slug = slugify(patch.name);
  }
  if (patch.emoji !== undefined) row.emoji = patch.emoji?.trim() || null;
  if (patch.sortOrder != null) row.sort_order = patch.sortOrder;

  const { error } = await supabase.from('product_categories').update(row).eq('id', categoryId);
  if (error) throw error;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('product_categories').delete().eq('id', categoryId);
  if (error) throw error;
}

export async function seedFashionCategories(merchantId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.rpc('seed_fashion_categories', { p_merchant_id: merchantId });
  if (error) throw error;
}

export function categoryLabel(c: Category) {
  return c.emoji ? `${c.emoji} ${c.name}` : c.name;
}
