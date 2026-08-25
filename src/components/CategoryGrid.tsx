'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Category } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/types';

type Props = {
  categories?: Category[];
};

export default function CategoryGrid({ categories }: Props) {
  const items = categories?.length
    ? categories
    : DEFAULT_CATEGORIES.map((c, i) => ({
        ...c,
        id: `cat-${i}`,
        merchant_id: '',
      }));

  return (
    <section className="section-padding py-24">
      <div className="text-center mb-16">
        <h2 className="font-display text-4xl lg:text-5xl mb-4">Shop by Category</h2>
        <p className="text-white/50 max-w-xl mx-auto">
          From everyday essentials to statement pieces — find your perfect look.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 lg:gap-4">
        {items.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={`/shop?category=${cat.slug}`}
              className="group block aspect-[3/4] rounded-2xl overflow-hidden relative glass hover:border-vbrown-gold/50 transition-all duration-300"
            >
              {cat.image_url ? (
                <Image src={cat.image_url} alt={cat.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center">
                  <span className="text-4xl">{cat.emoji ?? '👕'}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4">
                <h3 className="font-medium text-sm lg:text-base group-hover:text-vbrown-gold transition-colors">
                  {cat.name}
                </h3>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
