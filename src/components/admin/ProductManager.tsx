'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import type { Category, FashionProduct } from '@/lib/types';
import { fetchProducts, fmtZar } from '@/lib/api';
import {
  createMerchantProduct,
  deleteMerchantProduct,
  productToFormDefaults,
  toggleMerchantProductActive,
  updateMerchantProduct,
} from '@/lib/products-admin';
import { buildMerchantPortalUrl } from '@/lib/redface-pay';
import { getSupabase } from '@/lib/supabase';

type Props = {
  merchantId: string;
  categories: Category[];
};

type FormState = {
  name: string;
  price: string;
  description: string;
  categoryId: string;
  stock: string;
  featured: boolean;
};

const emptyForm: FormState = {
  name: '',
  price: '',
  description: '',
  categoryId: '',
  stock: '',
  featured: false,
};

export default function ProductManager({ merchantId, categories }: Props) {
  const [products, setProducts] = useState<FashionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editing, setEditing] = useState<FashionProduct | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  const reload = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      const rows = await fetchProducts({ merchantId, limit: 200, includeInactive: true });
      setProducts(rows);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  const visibleProducts = showArchived ? products : products.filter((p) => p.active !== false);
  const archivedCount = products.filter((p) => p.active === false).length;

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !merchantId) return;

    const channel = supabase
      .channel(`veebrown-products-${merchantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products', filter: `merchant_id=eq.${merchantId}` },
        () => {
          void reload();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [merchantId, reload]);

  function resetForm() {
    setForm(emptyForm);
    setExistingImages([]);
    setNewImages([]);
  }

  function openAdd() {
    setEditing(null);
    resetForm();
    setError(null);
    setMode('add');
  }

  async function openEdit(p: FashionProduct) {
    setEditing(p);
    setError(null);
    setMode('edit');
    setNewImages([]);
    const defaults = await productToFormDefaults(p);
    setForm({
      name: defaults.name,
      price: defaults.price,
      description: defaults.description,
      categoryId: defaults.categoryId,
      stock: defaults.stock,
      featured: defaults.featured,
    });
    setExistingImages(defaults.existingImages);
  }

  function removeExistingImage(url: string) {
    setExistingImages((imgs) => imgs.filter((u) => u !== url));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!merchantId) return;
    if (!form.name.trim()) {
      setError('Fragrance name is required');
      return;
    }
    const price = Number(form.price);
    if (!(price > 0)) {
      setError('Enter a valid price');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const payload = {
        merchantId,
        name: form.name,
        price,
        description: form.description,
        categoryId: form.categoryId || undefined,
        stockQuantity: form.stock !== '' ? Number(form.stock) : null,
        featured: form.featured,
        imageFiles: newImages,
        existingImages,
      };

      if (mode === 'edit' && editing) {
        await updateMerchantProduct(editing.id, payload, editing.item_details);
      } else {
        await createMerchantProduct(payload);
      }

      setMode('list');
      setEditing(null);
      resetForm();
      setNotice(mode === 'add' ? 'Fragrance added to your catalog.' : 'Changes saved.');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save fragrance');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(p: FashionProduct) {
    const isHardDelete = p.active === false;
    const ok = window.confirm(
      isHardDelete
        ? `Permanently delete "${p.name}"?\n\nOnly works if it has no order history.`
        : `Remove "${p.name}" from the storefront?\n\nIt will be hidden on the website and RedFace Pay. Turn on “Show archived” to restore later.`,
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await deleteMerchantProduct(p.id, {
        currentlyActive: p.active !== false,
        merchantId,
      });
      if (result === 'archived') {
        setProducts((prev) => prev.map((row) => (row.id === p.id ? { ...row, active: false } : row)));
        setNotice(`“${p.name}” removed from the storefront.`);
      } else {
        setProducts((prev) => prev.filter((row) => row.id !== p.id));
        setNotice(`“${p.name}” permanently deleted.`);
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete fragrance');
    } finally {
      setBusy(false);
    }
  }

  async function onToggleActive(p: FashionProduct) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await toggleMerchantProductActive(p.id, !p.active, merchantId);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update fragrance');
    } finally {
      setBusy(false);
    }
  }

  if (mode === 'add' || mode === 'edit') {
    return (
      <div>
        <button type="button" onClick={() => setMode('list')} className="btn-admin-ghost mb-6">
          ← Back to fragrances
        </button>
        <h2 className="font-display text-2xl text-vbrown-charcoal mb-2">
          {mode === 'add' ? 'Add fragrance' : 'Edit fragrance'}
        </h2>
        <p className="text-sm admin-muted mb-6 max-w-xl">
          Photos, price, and stock sync with RedFace Pay automatically.
        </p>

        <form onSubmit={onSubmit} className="admin-card p-6 sm:p-8 space-y-6 max-w-3xl">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="admin-label">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="admin-input"
                placeholder="e.g. MADAME"
                required
              />
            </div>
            <div>
              <label className="admin-label">Price (ZAR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="admin-input"
                required
              />
            </div>
            <div>
              <label className="admin-label">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="admin-input"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji ? `${c.emoji} ` : ''}{c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="admin-label">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                className="admin-input resize-y min-h-[100px]"
                placeholder="Notes, size (50ml), and scent profile…"
              />
            </div>
            <div>
              <label className="admin-label">Stock (units)</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                placeholder="Optional"
                className="admin-input"
              />
            </div>
          </div>

          <div>
            <label className="admin-label">Product photos</label>
            <p className="text-xs admin-muted mb-3">First image is the cover on the shop and homepage.</p>
            <div className="flex flex-wrap gap-3 mb-3">
              {existingImages.map((url) => (
                <div key={url} className="relative w-20 h-20 border border-vbrown-charcoal/10 bg-black group">
                  <Image src={url} alt="" fill className="object-contain p-1" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="absolute top-1 right-1 p-0.5 bg-black/80 text-white opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setNewImages(Array.from(e.target.files ?? []))}
              className="w-full text-sm admin-muted file:mr-3 file:py-2 file:px-3 file:border-0 file:text-xs file:uppercase file:tracking-wider file:bg-vbrown-charcoal file:text-vbrown-cream"
            />
            {newImages.length > 0 && (
              <p className="text-xs text-vbrown-gold mt-2">{newImages.length} new photo(s) ready to upload</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              id="featured"
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              className="rounded border-vbrown-charcoal/30"
            />
            <label htmlFor="featured" className="text-sm text-vbrown-charcoal/80">Feature on homepage</label>
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-vbrown-charcoal/10">
            <button type="submit" disabled={busy} className="btn-admin-solid">
              {busy ? 'Saving…' : mode === 'add' ? 'Add fragrance' : 'Save changes'}
            </button>
            <button type="button" onClick={() => setMode('list')} className="btn-admin-outline">
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-card p-5 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.35em] uppercase text-vbrown-gold mb-2">Catalog</p>
            <h2 className="font-display text-2xl text-vbrown-charcoal">Fragrances</h2>
            <p className="text-sm admin-muted mt-2 max-w-xl leading-relaxed">
              One shared catalog with RedFace Pay. Add here or in the merchant portal — changes appear on this website
              automatically.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void reload()}
              className="btn-admin-outline"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button type="button" onClick={openAdd} className="btn-admin-solid">
              <Plus size={16} />
              Add fragrance
            </button>
            <a
              href={buildMerchantPortalUrl('products')}
              target="_blank"
              rel="noreferrer"
              className="btn-admin-outline"
            >
              <ExternalLink size={14} />
              Portal
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {notice && (
        <div className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-xs admin-muted">
          {visibleProducts.length} shown
          {archivedCount > 0 ? ` · ${archivedCount} archived` : ''}
        </p>
        <label className="inline-flex items-center gap-2 text-xs admin-muted cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-vbrown-charcoal/30"
          />
          Show archived
        </label>
      </div>

      {loading && !products.length ? (
        <p className="admin-muted py-8 text-center">Loading fragrances…</p>
      ) : visibleProducts.length === 0 ? (
        <div className="admin-card p-10 text-center">
          <p className="admin-muted mb-4">
            {products.length === 0
              ? 'No fragrances yet. Add your first scent to go live on the shop.'
              : 'No active fragrances. Turn on “Show archived” to restore hidden items.'}
          </p>
          {products.length === 0 && (
            <button type="button" onClick={openAdd} className="btn-admin-solid">
              Add your first fragrance
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleProducts.map((p) => {
            const cover = p.images?.[0] ?? p.image_url;
            const imageCount = (p.images?.length ?? 0) || (p.image_url ? 1 : 0);
            return (
              <div
                key={p.id}
                className="admin-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:border-vbrown-gold/30 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 border border-vbrown-charcoal/10 bg-black shrink-0">
                    {cover ? (
                      <Image src={cover} alt="" fill className="object-contain p-1" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-widest admin-muted">
                        No image
                      </span>
                    )}
                    {imageCount > 1 && (
                      <span className="absolute bottom-0 right-0 text-[10px] bg-vbrown-charcoal text-vbrown-cream px-1">
                        +{imageCount - 1}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg text-vbrown-charcoal truncate">{p.name}</p>
                    <p className="text-sm admin-muted truncate">
                      {fmtZar(p.price)}
                      {' · '}
                      {p.category_name ?? 'Uncategorized'}
                      {!p.active && ' · Hidden'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => void openEdit(p)}
                    className="btn-admin-ghost min-w-10"
                    aria-label="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onToggleActive(p)}
                    className="btn-admin-outline !min-h-10 !py-2 !px-3"
                    disabled={busy}
                  >
                    {p.active ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(p)}
                    className="btn-admin-ghost min-w-10 text-red-700/70 hover:text-red-800 hover:border-red-200"
                    aria-label={p.active ? 'Archive fragrance' : 'Permanently delete'}
                    disabled={busy}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
