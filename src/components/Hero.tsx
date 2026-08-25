import Link from 'next/link';
import Image from 'next/image';
import type { FashionProduct } from '@/lib/types';
import { fmtZar } from '@/lib/api';
import { BRAND_IMAGES } from '@/lib/brand-images';

type Props = {
  products: FashionProduct[];
};

export default function Hero(_props: Props) {
  return (
    <>
      <section className="relative min-h-[78vh] lg:min-h-[85vh] flex items-end bg-vbrown-charcoal">
        <Image
          src={BRAND_IMAGES.hero}
          alt="VV Brown Fragrances — MADAME eau de parfum"
          fill
          priority
          className="object-cover object-[center_20%] opacity-90"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-vbrown-charcoal via-vbrown-charcoal/40 to-transparent" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pb-14 lg:pb-20 pt-32">
          <p className="text-vbrown-cream/60 text-[10px] sm:text-xs tracking-[0.45em] uppercase mb-4">
            VV Brown Fragrances
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-vbrown-cream leading-[1.05] max-w-xl mb-5">
            Elegant scents for those who lead.
          </h1>
          <p className="text-vbrown-cream/70 text-sm sm:text-base max-w-md leading-relaxed mb-8">
            Sophisticated eau de parfum for women and men. Minimal. Classic. Unforgettable.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop" className="btn-classic bg-vbrown-cream text-vbrown-charcoal hover:bg-white">
              Shop fragrances
            </Link>
            <Link
              href="/#collections"
              className="btn-outline border-vbrown-cream/35 text-vbrown-cream hover:border-vbrown-cream hover:text-vbrown-cream"
            >
              The collection
            </Link>
          </div>
        </div>
      </section>

      <EditorialSection />
    </>
  );
}

function EditorialSection() {
  return (
    <section className="bg-vbrown-ivory border-b border-vbrown-charcoal/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div className="relative aspect-[4/5] overflow-hidden bg-vbrown-cream">
          <Image
            src={BRAND_IMAGES.editorialFemme}
            alt="Femme du Patron — VV Brown Fragrances for women"
            fill
            className="object-cover"
            sizes="(max-width:1024px) 100vw, 50vw"
          />
        </div>
        <div className="lg:py-8">
          <p className="text-vbrown-gold text-[10px] tracking-[0.4em] uppercase mb-4">For her</p>
          <h2 className="font-display text-3xl sm:text-4xl text-vbrown-charcoal mb-5">Femme du Patron</h2>
          <p className="text-vbrown-charcoal/65 leading-relaxed mb-6">
            Refined florals and warm skin notes. A signature for the woman who commands the room with quiet confidence.
          </p>
          <Link href="/shop" className="text-xs tracking-[0.25em] uppercase text-vbrown-charcoal/50 hover:text-vbrown-gold transition-colors">
            Explore women&apos;s fragrances
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pb-16 lg:pb-24 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div className="lg:order-2 relative aspect-[4/5] overflow-hidden bg-vbrown-charcoal">
          <Image
            src={BRAND_IMAGES.editorialBaron}
            alt="Le Baron — VV Brown Fragrances for men"
            fill
            className="object-cover"
            sizes="(max-width:1024px) 100vw, 50vw"
          />
        </div>
        <div className="lg:order-1 lg:py-8">
          <p className="text-vbrown-gold text-[10px] tracking-[0.4em] uppercase mb-4">For him</p>
          <h2 className="font-display text-3xl sm:text-4xl text-vbrown-charcoal mb-5">Le Baron</h2>
          <p className="text-vbrown-charcoal/65 leading-relaxed mb-6">
            Woody depth and clean masculinity. Built for the modern patron who values presence over noise.
          </p>
          <Link href="/shop" className="text-xs tracking-[0.25em] uppercase text-vbrown-charcoal/50 hover:text-vbrown-gold transition-colors">
            Explore men&apos;s fragrances
          </Link>
        </div>
      </div>
    </section>
  );
}

export function CollectionsSection({ products }: Props) {
  if (!products.length) return null;

  return (
    <section id="collections" className="section-padding py-16 lg:py-24 bg-vbrown-ivory">
      <div className="text-center mb-14">
        <p className="text-vbrown-gold text-[10px] tracking-[0.4em] uppercase mb-3">The collection</p>
        <h2 className="font-display text-3xl sm:text-4xl text-vbrown-charcoal">Signature fragrances</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {products.map((p) => {
          const img = p.images?.[0] ?? p.image_url;
          return (
            <article key={p.id} className="group text-center">
              <Link
                href={`/product/${p.id}`}
                className="block relative aspect-[3/4] bg-vbrown-cream overflow-hidden mb-5"
              >
                {img ? (
                  <Image
                    src={img}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
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
            </article>
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
          A fragrance house rooted in elegance and restraint. Each scent is composed for presence, poise, and the
          quiet power of a classic signature. Perfume only. Nothing else.
        </p>
      </div>
    </section>
  );
}
