'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageCircle, Search, Camera, X } from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Virtual Try-On',
    description: 'Upload your photo and see yourself wearing any outfit. Try colors and sizes instantly.',
    href: '/try-on',
    phase: 'Live',
    cta: 'Try it now',
  },
  {
    icon: MessageCircle,
    title: 'AI Fashion Assistant',
    description: '"I need something for a wedding" — get personalized recommendations from our AI stylist.',
    href: '/assistant',
    phase: 'Phase 2',
    cta: 'Open assistant',
  },
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Search by occasion, not just keywords. "Office clothes for Johannesburg winter."',
    href: '/search',
    phase: 'Phase 2',
    cta: 'Search shop',
  },
  {
    icon: Camera,
    title: 'AI Measurements',
    description: 'Upload front, side, and back photos. AI estimates your measurements and recommends sizes.',
    href: '/measurements',
    phase: 'Phase 3',
    cta: 'Get measured',
  },
] as const;

type Feature = (typeof FEATURES)[number];

export default function AIFeatures() {
  const [active, setActive] = useState<Feature | null>(null);

  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [active, close]);

  return (
    <>
      <section className="section-padding py-24 bg-gradient-to-b from-transparent via-pangolin-gold/5 to-transparent">
        <div className="text-center mb-16">
          <span className="text-vbrown-gold text-sm font-medium tracking-wider uppercase mb-4 block">
            Powered by AI
          </span>
          <h2 className="font-display text-4xl lg:text-5xl mb-4">The Future of Fashion</h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Shopping reimagined with OpenRouter image models and RedFace Pay.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <button
                type="button"
                onClick={() => setActive(feature)}
                className="w-full text-left glass rounded-2xl p-6 h-full hover:border-vbrown-gold/40 border border-transparent transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-vbrown-gold/10 flex items-center justify-center mb-4 group-hover:bg-vbrown-gold/20 transition-colors">
                  <feature.icon size={24} className="text-vbrown-gold" />
                </div>
                <span className="text-xs text-white/30 uppercase tracking-wider">{feature.phase}</span>
                <h3 className="font-semibold text-lg mt-1 mb-2 group-hover:text-vbrown-gold transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {active && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close feature preview"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-dialog-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full max-w-lg glass rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl"
          >
            <button
              type="button"
              onClick={close}
              className="absolute top-4 right-4 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 rounded-xl bg-vbrown-gold/10 flex items-center justify-center mb-4">
              <active.icon size={24} className="text-vbrown-gold" />
            </div>
            <span className="text-xs text-white/30 uppercase tracking-wider">{active.phase}</span>
            <h3 id="feature-dialog-title" className="font-display text-2xl mt-1 mb-3">{active.title}</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-6">{active.description}</p>

            <div className="flex flex-wrap gap-3">
              <Link href={active.href} className="btn-primary text-sm" onClick={close}>
                {active.cta}
              </Link>
              <button type="button" onClick={close} className="btn-secondary text-sm">
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
