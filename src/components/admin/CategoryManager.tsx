'use client';

import { FormEvent, useCallback, useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { Category } from '@/lib/types';
import {
  categoryLabel,
  createCategory,
  deleteCategory,
  seedFashionCategories,
  updateCategory,
} from '@/lib/categories-admin';

type Props = {
  merchantId: string;
  categories: Category[];
  onChange: () => void;
};

export default function CategoryManager({ merchantId, categories, onChange }: Props) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    onChange();
  }, [onChange]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!merchantId || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createCategory({
        merchantId,
        name,
        emoji,
        sortOrder: categories.length,
      });
      setName('');
      setEmoji('');
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add category');
    } finally {
      setBusy(false);
    }
  }

  async function onSeedDefaults() {
    if (!merchantId) return;
    setBusy(true);
    setError(null);
    try {
      await seedFashionCategories(merchantId);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not seed categories');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(c: Category) {
    if (!window.confirm(`Delete "${c.name}"? Products in this category become uncategorized.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCategory(c.id);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete category');
    } finally {
      setBusy(false);
    }
  }

  async function onRename(c: Category) {
    const next = window.prompt('Category name', c.name);
    if (!next?.trim() || next.trim() === c.name) return;
    setBusy(true);
    setError(null);
    try {
      await updateCategory(c.id, { name: next.trim() });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update category');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold">Fragrance categories</h2>
          <p className="text-sm text-white/40 mt-1 max-w-xl">
            Organise your catalog — Men&apos;s, Women&apos;s, Jackets, Shoes, and more. Shared with RedFace Pay POS.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onSeedDefaults()}
          disabled={busy}
          className="btn-secondary text-sm"
        >
          <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
          Load fragrance defaults
        </button>
      </div>

      <form onSubmit={onAdd} className="glass rounded-2xl p-5 mb-6 flex flex-wrap gap-3 items-end max-w-2xl">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-white/40 uppercase tracking-wide">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jackets"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm"
            required
          />
        </div>
        <div className="w-20">
          <label className="text-xs text-white/40 uppercase tracking-wide">Emoji</label>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="🧥"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-center"
          />
        </div>
        <button type="submit" disabled={busy} className="btn-primary text-sm">
          <Plus size={14} /> Add
        </button>
      </form>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {categories.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-white/40">
          <p>No categories yet.</p>
          <button type="button" onClick={() => void onSeedDefaults()} className="btn-primary text-sm mt-4">
            Load default fragrance categories
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => void onRename(c)}
                className="flex items-center gap-3 min-w-0 text-left hover:text-vbrown-gold transition-colors"
              >
                <span className="text-2xl shrink-0">{c.emoji ?? '🏷️'}</span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-white/40">/{c.slug}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => void onDelete(c)}
                disabled={busy}
                className="p-2 text-red-400/70 hover:text-red-400 shrink-0"
                aria-label={`Delete ${categoryLabel(c)}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
