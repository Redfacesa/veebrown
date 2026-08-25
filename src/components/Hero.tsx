import Link from 'next/link';
import type { FashionProduct } from '@/lib/types';
import { fmtZar } from '@/lib/api';
import Image from 'next/image';
import VeeBrownLogo from '@/components/VeeBrownLogo';

type Props = {
  products: FashionProduct[];
};

export default function Hero({ products }: Props) {
  const heroProduct = products[0];
  const heroImage = heroProduct?.images?.[0] ?? heroProduct?.image_url;

  return (
    <section className="bg-vbrown-ivory border-b border-vbrown-charcoal/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-vbrown-gold text-xs tracking-[0.35em] uppercase mb-4">VV Brown Fragrances</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-vbrown-charcoal leading-tight mb-6">
            Timeless scents.
            <br />
            <span className="text-vbrown-gold italic">Unforgettable presence.</span>
          </h1>
          <p className="text-vbrown-charcoal/65 text-base leading-relaxed max-w-md mb-8">
            Discover our collection of elegant eau de parfum. Rich florals, warm ambers, and refined woody notes for
            every occasion.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/shop" className="btn-classic">Shop fragrances</Link>
            <Link href="/#collections" className="btn-outline">View collection</Link>
          </div>
        </div>

        <div className="relative aspect-[4/5] max-w-md mx-auto lg:ml-auto w-full bg-vbrown-cream border border-vbrown-charcoal/10 overflow-hidden">
          {heroImage ? (
            <Image src={heroImage} alt={heroProduct?.name ?? 'VV Brown Fragrances'} fill className="object-cover" priority sizes="(max-width:768px) 80vw, 400px" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-8 bg-vbrown-charcoal">
              <VeeBrownLogo href="" size="hero" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function CollectionsSection({ products }: Props) {
  return (
    <section id="collections" className="section-padding py-16 lg:py-20">
      <div className="text-center mb-12">
        <p className="text-vbrown-gold text-xs tracking-[0.35em] uppercase mb-3">Our collection</p>
        <h2 className="font-display text-3xl sm:text-4xl text-vbrown-charcoal">Signature fragrances</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
        {products.map((p) => {
          const img = p.images?.[0] ?? p.image_url;
          return (
            <article key={p.id} className="group text-center">
              <Link href={`/product/${p.id}`} className="block relative aspect-[3/4] bg-vbrown-cream border border-vbrown-charcoal/10 overflow-hidden mb-4">
                {img ? (
                  <Image src={img} alt={p.name} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-500" sizes="(max-width:768px) 50vw, 33vw" />
                ) : null}
              </Link>
              <h3 className="font-display text-lg text-vbrown-charcoal">{p.name}</h3>
              <p className="text-vbrown-gold text-sm mt-1">{fmtZar(p.price)}</p>
              <Link href={`/product/${p.id}`} className="inline-block mt-3 text-xs tracking-[0.2em] uppercase text-vbrown-charcoal/50 hover:text-vbrown-gold transition-colors">
                View details
              </Link>
            </article>
          );
        })}
      </div>
      <div className="text-center mt-12">
        <Link href="/shop" className="btn-outline">View all products</Link>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="bg-vbrown-cream border-y border-vbrown-charcoal/10 py-16 lg:py-20">
      <div className="section-padding max-w-2xl mx-auto text-center">
        <p className="text-vbrown-gold text-xs tracking-[0.35em] uppercase mb-4">About us</p>
        <h2 className="font-display text-3xl text-vbrown-charcoal mb-6">Crafted with elegance</h2>
        <p className="text-vbrown-charcoal/70 leading-relaxed">
          VV Brown Fragrances offers distinctive perfumes for women and men. From bright modern florals to rich
          amber-woody compositions, each scent is designed for confidence, dignity, and lasting impression.
        </p>
      </div>
    </section>
  );
}
