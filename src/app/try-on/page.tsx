'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Upload, Sparkles, Download, Share2, ShoppingBag, X, AlertCircle } from 'lucide-react';
import type { FashionProduct } from '@/lib/types';
import { fetchProducts, fmtZar } from '@/lib/api';
import type { OpenRouterImageModel } from '@/lib/openrouter';

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read photo'));
    reader.readAsDataURL(file);
  });
}

export default function TryOnPage() {
  const [products, setProducts] = useState<FashionProduct[]>([]);
  const [selected, setSelected] = useState<FashionProduct | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<OpenRouterImageModel[]>([]);
  const [model, setModel] = useState('');
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    void fetchProducts({ limit: 24 }).then(setProducts);
    void fetch('/api/openrouter/models')
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setModels(data.models ?? []);
        if (data.defaultModel) setModel(data.defaultModel);
      })
      .catch(() => setConfigured(false));

    void fetch('/api/try-on/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.configured != null) setConfigured(Boolean(data.configured && data.ok));
      })
      .catch(() => undefined);
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const url = await fileToDataUrl(file);
      setPhoto(url);
    } catch {
      setError('Could not load that photo');
    }
  }

  async function handleGenerate() {
    if (!photo || !selected) return;
    const garmentUrl = selected.images?.[0] ?? selected.image_url;
    if (!garmentUrl) {
      setError('Selected item has no product photo');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImageDataUrl: photo,
          garmentImageUrl: garmentUrl,
          productName: selected.name,
          model: model || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setResult(data.imageDataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Try-on failed');
    } finally {
      setGenerating(false);
    }
  }

  function downloadResult() {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `pangolin-tryon-${Date.now()}.png`;
    a.click();
  }

  return (
    <div className="pt-24 pb-16">
      <div className="section-padding max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-vbrown-gold text-sm uppercase tracking-wider">AI Virtual Try-On</span>
          <h1 className="font-display text-4xl lg:text-5xl mt-2 mb-4">Try Before You Buy</h1>
          <p className="text-white/50 max-w-xl mx-auto">
            Upload your photo, pick an item from our catalog, and OpenRouter image models generate a realistic try-on preview.
          </p>
        </div>

        {!configured && (
          <div className="mb-8 glass rounded-xl p-4 flex gap-3 text-sm text-amber-200/90 border border-amber-500/20">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>
              Add <code className="text-vbrown-gold">OPENROUTER_API_KEY</code> in Vercel to enable live try-on.
              You can still browse items below.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass rounded-2xl p-8">
            <h2 className="font-semibold mb-4">1. Upload your photo</h2>
            <label className="block border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-vbrown-gold/50 transition-colors">
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Your photo" className="max-h-72 mx-auto rounded-lg object-contain" />
              ) : (
                <>
                  <Upload size={40} className="mx-auto mb-4 text-white/30" />
                  <p className="text-white/50">Selfie or full-body photo</p>
                </>
              )}
            </label>
          </div>

          <div className="glass rounded-2xl p-8">
            <h2 className="font-semibold mb-4">2. Select from catalog</h2>
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {products.map((p) => {
                const cover = p.images?.[0] ?? p.image_url;
                const active = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setSelected(p); setResult(null); setError(null); }}
                    className={`rounded-xl border p-2 text-left transition-colors ${
                      active ? 'border-vbrown-gold bg-vbrown-gold/10' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5 mb-2">
                      {cover ? (
                        <Image src={cover} alt={p.name} fill className="object-cover" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-2xl">👕</span>
                      )}
                    </div>
                    <p className="text-xs font-medium line-clamp-2">{p.name}</p>
                    <p className="text-xs text-vbrown-gold mt-0.5">{fmtZar(p.price)}</p>
                  </button>
                );
              })}
              {!products.length && (
                <p className="col-span-2 text-sm text-white/40 text-center py-8">No products in catalog yet.</p>
              )}
            </div>
          </div>
        </div>

        {models.length > 0 && (
          <div className="mt-6 glass rounded-xl p-4 max-w-xl mx-auto">
            <label className="text-xs text-white/40 uppercase tracking-wide">Image model (OpenRouter)</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.modality}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={!photo || !selected || generating || !configured}
            className="btn-primary text-lg disabled:opacity-50"
          >
            <Sparkles size={20} />
            {generating ? 'Generating…' : 'Generate Try-On'}
          </button>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </div>

        {generating && (
          <div className="mt-12 glass rounded-2xl p-16 text-center">
            <div className="w-12 h-12 border-2 border-vbrown-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50">OpenRouter is creating your virtual try-on…</p>
            <p className="text-xs text-white/30 mt-2">Image-to-image · usually 15–60 seconds</p>
          </div>
        )}

        {result && !generating && (
          <div className="mt-12 glass rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Your try-on result</h2>
              <button type="button" onClick={() => setResult(null)} className="p-2 text-white/50 hover:text-white" aria-label="Close result">
                <X size={18} />
              </button>
            </div>
            <div className="relative max-w-md mx-auto aspect-[3/4] rounded-xl overflow-hidden bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result} alt="Try-on result" className="w-full h-full object-contain" />
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={downloadResult} className="btn-secondary text-sm">
                <Download size={16} /> Download
              </button>
              {selected && (
                <Link href={`/product/${selected.id}`} className="btn-primary text-sm">
                  <ShoppingBag size={16} /> View {selected.name}
                </Link>
              )}
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() => {
                  if (navigator.share && result) {
                    void navigator.share({ title: 'Pangolin try-on', text: selected?.name ?? 'My outfit' });
                  }
                }}
              >
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
