'use client';

import { motion, type Variants } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { FashionProduct } from '@/lib/types';
import { fmtZar } from '@/lib/api';
import { BRAND_IMAGES } from '@/lib/brand-images';
import {
  FRAGRANCE_COPY,
  FRAGRANCE_PRODUCT_IDS,
  isSignatureFragrance,
  sortSignatureFragrancesFirst,
} from '@/lib/fragrance-catalog';

type Props = {
  products: FashionProduct[];
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Hero(_props: Props) {
  return (
    <>
      <section className="relative bg-black overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,42%)_1fr] min-h-[88vh]">
          <div className="relative z-20 flex flex-col justify-center px-4 sm:px-6 lg:px-10 py-14 lg:py-20 order-2 lg:order-1 bg-black lg:bg-transparent">
            <motion.p
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-vbrown-cream/50 text-[10px] sm:text-xs tracking-[0.45em] uppercase mb-4"
            >
              VV Brown Fragrances
            </motion.p>
            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] text-vbrown-cream leading-[1.08] mb-5"
            >
              Elegant scents for those who lead.
            </motion.h1>
            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-vbrown-cream/65 text-sm sm:text-base max-w-md leading-relaxed mb-8"
            >
              Sophisticated eau de parfum for women and men. Minimal. Classic. Unforgettable.
            </motion.p>
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap gap-3">
              <Link href="/shop" className="btn-classic bg-vbrown-cream text-vbrown-charcoal hover:bg-white">
                Shop fragrances
              </Link>
              <Link
                href="/#collections"
                className="btn-outline border-vbrown-cream/30 text-vbrown-cream hover:border-vbrown-cream"
              >
                The collection
              </Link>
            </motion.div>
          </div>

          <div className="relative order-1 lg:order-2 min-h-[48vh] lg:min-h-[88vh] bg-black flex items-center justify-center">
            <motion.div
              className="relative w-full h-full flex items-center justify-center p-3 sm:p-6 lg:p-10"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] as const }}
            >
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-full max-w-2xl mx-auto"
              >
                <Image
                  src={BRAND_IMAGES.heroMadame}
                  alt="VV Brown Fragrances — luxury eau de parfum"
                  width={900}
                  height={1125}
                  priority
                  className="w-full h-auto max-h-[75vh] object-contain mx-auto"
                  sizes="(max-width:1024px) 100vw, 55vw"
                />
              </motion.div>
            </motion.div>
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent lg:via-black/35"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent lg:hidden"
              aria-hidden
            />
          </div>
        </div>
      </section>

      <EditorialSection />
    </>
  );
}

function EditorialBlock({
  image,
  alt,
  eyebrow,
  title,
  body,
  href,
  linkLabel,
  reverse,
}: {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  linkLabel: string;
  reverse?: boolean;
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-14 lg:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8 }}
        className={`relative bg-black flex items-center justify-center p-4 sm:p-6 ${reverse ? 'lg:order-2' : ''}`}
      >
        <Image
          src={image}
          alt={alt}
          width={800}
          height={1000}
          className="w-full h-auto max-h-[min(85vh,720px)] object-contain"
          sizes="(max-width:1024px) 100vw, 45vw"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className={`lg:py-6 ${reverse ? 'lg:order-1' : ''}`}
      >
        <p className="text-vbrown-gold text-[10px] tracking-[0.4em] uppercase mb-4">{eyebrow}</p>
        <h2 className="font-display text-3xl sm:text-4xl text-vbrown-charcoal mb-5">{title}</h2>
        <p className="text-vbrown-charcoal/65 leading-relaxed mb-6">{body}</p>
        <Link
          href={href}
          className="text-[10px] tracking-[0.3em] uppercase text-vbrown-charcoal/45 hover:text-vbrown-gold transition-colors"
        >
          {linkLabel}
        </Link>
      </motion.div>
    </div>
  );
}

function EditorialSection() {
  const femme = FRAGRANCE_COPY.femmeDuPatron;
  const baron = FRAGRANCE_COPY.leBaron;

  return (
    <section className="bg-vbrown-ivory border-b border-vbrown-charcoal/8">
      <EditorialBlock
        image={BRAND_IMAGES.editorialFemme}
        alt={`${femme.title} — VV Brown Fragrances for women`}
        eyebrow={femme.eyebrow}
        title={femme.title}
        body={femme.body}
        href={`/product/${FRAGRANCE_PRODUCT_IDS.femmeDuPatron}`}
        linkLabel="Shop Femme du Patron"
      />
      <EditorialBlock
        image={BRAND_IMAGES.editorialBaron}
        alt={`${baron.title} — VV Brown Fragrances for men`}
        eyebrow={baron.eyebrow}
        title={baron.title}
        body={baron.body}
        href={`/product/${FRAGRANCE_PRODUCT_IDS.leBaron}`}
        linkLabel="Shop Le Baron"
        reverse
      />
    </section>
  );
}

export function CollectionsSection({ products }: Props) {
  const sorted = sortSignatureFragrancesFirst(products);
  if (!sorted.length) return null;

  return (
    <section id="collections" className="section-padding py-16 lg:py-24 bg-vbrown-ivory">
      <div className="text-center mb-14">
        <p className="text-vbrown-gold text-[10px] tracking-[0.4em] uppercase mb-3">The collection</p>
        <h2 className="font-display text-3xl sm:text-4xl text-vbrown-charcoal">Signature fragrances</h2>
        <p className="mt-3 text-sm text-vbrown-charcoal/50 max-w-md mx-auto">
          Patron and Femme du Patron lead the house. Explore every scent below.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {sorted.map((p, i) => {
          const img = p.images?.[0] ?? p.image_url;
          const signature = isSignatureFragrance(p.name);
          return (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.6 }}
              className="group text-center"
            >
              <Link
                href={`/product/${p.id}`}
                className="block relative aspect-[3/4] bg-vbrown-cream overflow-hidden mb-5"
              >
                {signature ? (
                  <span className="absolute top-3 left-3 z-10 bg-vbrown-charcoal text-vbrown-cream text-[9px] tracking-[0.25em] uppercase px-2.5 py-1">
                    Signature
                  </span>
                ) : null}
                {img ? (
                  <Image
                    src={img}
                    alt={p.name}
                    fill
                    className="object-contain p-4 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                    sizes="(max-width:768px) 50vw, 33vw"
                  />
                ) : null}
              </Link>
              <h3 className="font-display text-xl text-vbrown-charcoal tracking-wide">{p.name}</h3>
              <p className="text-vbrown-gold text-sm mt-1">{fmtZar(p.price)}</p>
              <Link
                href={`/product/${p.id}`}
                className="inline-block mt-4 text-[10px] tracking-[0.3em] uppercase text-vbrown-charcoal/45 hover:text-vbrown-gold transition-colors"
              >
                View details
              </Link>
            </motion.article>
          );
        })}
      </div>
      <div className="text-center mt-14">
        <Link href="/shop" className="btn-outline">
          View all
        </Link>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="bg-vbrown-cream py-16 lg:py-24">
      <div className="section-padding max-w-xl mx-auto text-center">
        <p className="text-vbrown-gold text-[10px] tracking-[0.4em] uppercase mb-4">The house</p>
        <h2 className="font-display text-3xl text-vbrown-charcoal mb-6">VV Brown Fragrances</h2>
        <p className="text-vbrown-charcoal/65 leading-relaxed">
          A fragrance house rooted in elegance and restraint. Patron and Femme du Patron are the signatures of the
          house. Each scent is composed for presence, poise, and the quiet power of a classic signature.
        </p>
      </div>
    </section>
  );
}
