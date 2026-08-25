import { getSupabase } from './supabase';

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80) || 'photo.jpg';
}

function guessContentType(file: File): string {
  if (file.type) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

/** Upload to RedFace Pay shared `media` bucket (same as merchant portal). */
export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Sign in required to upload images');

  const path = `${userId}/products/${productId}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from('media').upload(path, file, {
    upsert: true,
    contentType: guessContentType(file),
  });
  if (error) throw error;
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}

/** Upload multiple product photos. */
export async function uploadProductImages(productId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await uploadProductImage(productId, file));
  }
  return urls;
}
