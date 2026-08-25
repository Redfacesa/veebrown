'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Scissors, Clock, ArrowRight } from 'lucide-react';
import type { TailoringService } from '@/lib/types';
import { fmtZar } from '@/lib/api';

type Props = {
  services?: TailoringService[];
};

export default function TailoringSection({ services = [] }: Props) {
  const display = services.slice(0, 6);

  return (
    <section className="section-padding py-24 border-t border-white/10">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-vbrown-gold text-sm font-medium tracking-wider uppercase mb-4 block">
            Expert Craftsmanship
          </span>
          <h2 className="font-display text-4xl lg:text-5xl mb-6">
            Tailoring &<br />Alterations
          </h2>
          <p className="text-white/50 leading-relaxed mb-8">
            Pick alterations like a point of sale — hem pants, jacket fittings, zip repairs. Total adds up
            automatically. Pay with card, cash, QR, payment link, or tap our RedFace Pay NFC tag.
          </p>
          <Link href="/tailoring" className="btn-primary">
            <Scissors size={18} />
            Open tailoring till
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {display.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-5 hover:border-vbrown-gold/30 transition-colors"
            >
              <h3 className="font-medium mb-2">{service.name}</h3>
              <p className="text-white/40 text-sm mb-4 line-clamp-2">{service.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-vbrown-gold font-semibold">{fmtZar(service.price)}</span>
                <span className="flex items-center gap-1 text-xs text-white/40">
                  <Clock size={12} />
                  {service.estimated_days}d
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
