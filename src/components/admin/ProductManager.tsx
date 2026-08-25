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
  importDemoCatalog,
  updateMerchantProduct,
  type VariantInput,
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
  sizes: string;
  colors: string;
  fabric: string;
  rating: string;
  reviewCount: string;
};

const emptyForm: FormState = {
  name: '',
  price: '',
  description: '',
  categoryId: '',
  stock: '',
  featured: false,
  sizes: '',
  colors: '',
  fabric: '',
  rating: '',
  reviewCount: '',
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
  const [variants, setVariants] = useState<VariantInput[]>([]);

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
      .channel(`pangolin-products-${merchantId}`)
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
    setVariants([]);
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
      sizes: defaults.sizes,
      colors: defaults.colors,
      fabric: defaults.fabric,
      rating: defaults.rating,
      reviewCount: defaults.reviewCount,
    });
    setExistingImages(defaults.existingImages);
    setVariants(defaults.variants.length ? defaults.variants : [{ label: '', stockQuantity: null }]);
  }

  function addVariantRow() {
    setVariants((rows) => [...rows, { label: '', stockQuantity: null }]);
  }

  function updateVariant(index: number, patch: Partial<VariantInput>) {
    setVariants((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeVariant(index: number) {
    setVariants((rows) => rows.filter((_, i) => i !== index));
  }

  function removeExistingImage(url: string) {
    setExistingImages((imgs) => imgs.filter((u) => u !== url));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!merchantId) return;
    if (!form.name.trim()) {
      setError('Product name is required');
      return;
    }
    const price = Number(form.price);
    if (!(price > 0)) {
      setError('Enter a valid price');
      return;
    }

    const cleanVariants = variants.filter((v) => v.label.trim());

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
        colors: form.colors,
        fabric: form.fabric,
        rating: form.rating !== '' ? Number(form.rating) : undefined,
        reviewCount: form.reviewCount !== '' ? Number(form.reviewCount) : undefined,
        imageFiles: newImages,
        existingImages,
        variants: cleanVariants.length ? cleanVariants : undefined,
        sizes: cleanVariants.length ? undefined : form.sizes,
      };

      if (mode === 'edit' && editing) {
        await updateMerchantProduct(editing.id, payload, editing.item_details);
      } else {
        await createMerchantProduct(payload);
      }

      setMode('list');
      setEditing(null);
      resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save product');
    } finally {
      setBusy(false);
    }
  }

  async function onImportDemo() {
    if (!merchantId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await importDemoCatalog(merchantId);
      await reload();
      if (res.added === 0) {
        setError(`Starter catalog already imported (${res.skipped} items skipped). Edit any product below.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import starter catalog');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(p: FashionProduct) {
    const isHardDelete = p.active === false;
    const ok = window.confirm(
      isHardDelete
        ? `Permanently delete "${p.name}"?\n\nOnly works if it has no order or stock history. Prefer keeping it archived (hidden).`
        : `Remove "${p.name}" from the storefront?\n\nIt will be hidden on the website and RedFace Pay. Past orders stay intact — turn on “Show archived” to restore later.`,
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
      // Optimistic remove so the row disappears immediately.
      if (result === 'archived') {
        setProducts((prev) => prev.map((row) => (row.id === p.id ? { ...row, active: false } : row)));
        setNotice(`“${p.name}” removed from the storefront.`);
      } else {
        setProducts((prev) => prev.filter((row) => row.id !== p.id));
        setNotice(`“${p.name}” permanently deleted.`);
      }
      await reload();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
            ? (err as { message: string }).message
            : 'Could not delete product';
      setError(message);
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
      setError(err instanceof Error ? err.message : 'Could not update product');
    } finally {
      setBusy(false);
    }
  }

  if (mode === 'add' || mode === 'edit') {
    return (
      <div>
        <button type="button" onClick={() => setMode('list')} className="text-sm text-white/50 hover:text-white mb-4">
          ← Back to products
        </button>
        <h2 className="text-xl font-semibold mb-2">{mode === 'add' ? 'Add fragrance' : 'Edit fragrance'}</h2>
        <p className="text-sm text-white/40 mb-6">
          Category, photos, sizes and colours sync with RedFace Pay merchant portal.
        </p>

        <form onSubmit={onSubmit} className="glass rounded-2xl p-6 space-y-6 max-w-3xl">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-white/40 uppercase tracking-wide">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wide">Price (ZAR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wide">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
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
              <label className="text-xs text-white/40 uppercase tracking-wide">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wide">Overall stock (optional)</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                placeholder="When not using per-size stock"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wide">Fabric</label>
              <input
                value={form.fabric}
                onChange={(e) => setForm((f) => ({ ...f, fabric: e.target.value }))}
                placeholder="Cotton, linen…"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wide">Rating (0–5)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                placeholder="4.8"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wide">Review count</label>
              <input
                type="number"
                min="0"
                value={form.reviewCount}
                onChange={(e) => setForm((f) => ({ ...f, reviewCount: e.target.value }))}
                placeholder="42"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase tracking-wide">Product photos</label>
            <p className="text-xs text-white/30 mt-1 mb-2">First image is the cover. Add front, back, detail shots.</p>
            <div className="flex flex-wrap gap-3 mb-3">
              {existingImages.map((url) => (
                <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/5 group">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100"
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
              className="w-full text-sm text-white/60"
            />
            {newImages.length > 0 && (
              <p className="text-xs text-vbrown-gold mt-1">{newImages.length} new photo(s) ready to upload</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/40 uppercase tracking-wide">Size variants</label>
              <button type="button" onClick={addVariantRow} className="text-xs text-vbrown-gold hover:text-white">
                + Add size
              </button>
            </div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={v.id ?? `new-${i}`} className="flex flex-wrap gap-2 items-center">
                  <input
                    value={v.label}
                    onChange={(e) => updateVariant(i, { label: e.target.value })}
                    placeholder="Size e.g. M"
                    className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    value={v.stockQuantity ?? ''}
                    onChange={(e) => updateVariant(i, {
                      stockQuantity: e.target.value === '' ? null : Number(e.target.value),
                    })}
                    placeholder="Stock"
                    className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={v.price ?? ''}
                    onChange={(e) => updateVariant(i, {
                      price: e.target.value === '' ? null : Number(e.target.value),
                    })}
                    placeholder="Price override"
                    className="w-32 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={() => removeVariant(i)} className="p-2 text-white/40 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {!variants.length && (
              <p className="text-xs text-white/30 mt-2">
                Or use quick entry:{' '}
                <input
                  value={form.sizes}
                  onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))}
                  placeholder="S, M, L, XL"
                  className="ml-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm inline-block w-48"
                />
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase tracking-wide">Colours</label>
            <input
              value={form.colors}
              onChange={(e) => setForm((f) => ({ ...f, colors: e.target.value }))}
              placeholder="Black:#111111, White:#FFFFFF, Gold"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
            />
            <p className="text-xs text-white/30 mt-1">Optional hex after colon for swatches</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="featured"
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="featured" className="text-sm text-white/70">Feature on homepage</label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={busy} className="btn-primary text-sm">
              {busy ? 'Saving…' : mode === 'add' ? 'Add product' : 'Save changes'}
            </button>
            <button type="button" onClick={() => setMode('list')} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-white/40 mt-1 max-w-xl">
            One shared fragrance catalog with RedFace Pay. Add products here or in the merchant portal — they appear on this website automatically.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <button type="button" onClick={() => void reload()} className="btn-secondary text-sm min-h-11 justify-center" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button type="button" onClick={openAdd} className="btn-primary text-sm min-h-11 justify-center col-span-2 sm:col-span-1">
            <Plus size={16} /> Add fragrance
          </button>
          <a href={buildMerchantPortalUrl('products')} target="_blank" rel="noreferrer" className="btn-secondary text-sm min-h-11 justify-center col-span-2 sm:col-span-1">
            <ExternalLink size={14} /> Portal
          </a>
        </div>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      {notice && <p className="text-sm text-emerald-400 mb-4">{notice}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <p className="text-xs text-white/40">
          {visibleProducts.length} shown
          {archivedCount > 0 ? ` · ${archivedCount} archived` : ''}
        </p>
        <label className="inline-flex items-center gap-2 text-xs text-white/55 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-white/20"
          />
          Show archived
        </label>
      </div>

      {loading && !products.length ? (
        <p className="text-white/40">Loading products…</p>
      ) : visibleProducts.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-white/40">
          <p>{products.length === 0 ? 'No products yet.' : 'No active products. Turn on “Show archived” to restore hidden items.'}</p>
          {products.length === 0 && (
            <button type="button" onClick={openAdd} className="btn-primary text-sm mt-4">
              Add your first item
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleProducts.map((p) => {
            const cover = p.images?.[0] ?? p.image_url;
            const imageCount = (p.images?.length ?? 0) || (p.image_url ? 1 : 0);
            return (
              <div key={p.id} className="glass rounded-xl p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-white/5 shrink-0">
                    {cover ? (
                      <Image src={cover} alt="" fill className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-widest text-white/30">No image</span>
                    )}
                    {imageCount > 1 && (
                      <span className="absolute bottom-0 right-0 text-[10px] bg-black/70 px-1 rounded-tl">
                        +{imageCount - 1}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-sm text-white/40 truncate">
                      {fmtZar(p.price)}
                      {' · '}
                      {p.category_name ?? 'Uncategorized'}
                      {p.variants?.length ? ` · ${p.variants.length} sizes` : ''}
                      {!p.active && ' · Hidden'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
                  <button type="button" onClick={() => void openEdit(p)} className="min-h-10 min-w-10 inline-flex items-center justify-center text-white/50 hover:text-white" aria-label="Edit">
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onToggleActive(p)}
                    className="text-xs px-3 py-2 min-h-10 rounded-lg border border-white/10 text-white/60 hover:text-white"
                    disabled={busy}
                  >
                    {p.active ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(p)}
                    className="min-h-10 min-w-10 inline-flex items-center justify-center text-red-400/70 hover:text-red-400"
                    aria-label={p.active ? 'Archive product' : 'Permanently delete product'}
                    title={p.active ? 'Archive (hide from store)' : 'Permanently delete'}
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
