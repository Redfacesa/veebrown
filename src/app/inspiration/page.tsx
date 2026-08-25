'use client';

import { Instagram, Facebook } from 'lucide-react';
import { VEEBROWN_SOCIAL_LINKS } from '@/lib/social';

export default function InspirationPage() {
  const placeholders = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="pt-24 pb-16">
      <div className="section-padding mb-8">
        <h1 className="font-display text-4xl mb-2">Fashion Inspiration</h1>
        <p className="text-white/50 mb-6">Seasonal outfits, trending looks, and AI recommendations</p>
        <div className="flex flex-wrap gap-3">
          {VEEBROWN_SOCIAL_LINKS.map((link) => {
            const Icon = link.id === 'instagram' ? Instagram : Facebook;
            return (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm hover:border-vbrown-gold/40 transition-colors"
              >
                <Icon size={16} className="text-vbrown-gold" />
                Follow on {link.label}
              </a>
            );
          })}
        </div>
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 section-padding">
        {placeholders.map((i) => (
          <div
            key={i}
            className="break-inside-avoid mb-4 rounded-2xl overflow-hidden glass aspect-[3/4] flex items-center justify-center text-white/20"
          >
            <span className="text-4xl">✨</span>
          </div>
        ))}
      </div>
      <p className="text-center text-white/30 text-sm mt-8">
        More looks on{' '}
        <a
          href={VEEBROWN_SOCIAL_LINKS[0].href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-vbrown-gold hover:text-white transition-colors"
        >
          @pangolinclothing_sa
        </a>
      </p>
    </div>
  );
}
