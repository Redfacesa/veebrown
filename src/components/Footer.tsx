import Link from 'next/link';
import VeeBrownLogo from '@/components/VeeBrownLogo';

export default function Footer() {
  return (
    <footer className="bg-black text-vbrown-cream mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-14 grid md:grid-cols-3 gap-10">
        <div>
          <VeeBrownLogo href="/" size="footer" />
          <p className="text-vbrown-cream/55 text-sm mt-4 leading-relaxed max-w-xs">
            Luxury fragrances crafted with elegance. Timeless scents for women and men.
          </p>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-vbrown-cream/35 mb-4">Shop</p>
          <ul className="space-y-2 text-sm text-vbrown-cream/65">
            <li><Link href="/shop" className="hover:text-vbrown-gold transition-colors">All fragrances</Link></li>
            <li><Link href="/cart" className="hover:text-vbrown-gold transition-colors">Shopping bag</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-vbrown-cream/35 mb-4">Contact</p>
          <ul className="space-y-2 text-sm text-vbrown-cream/65">
            <li><a href="mailto:valenciakabasele@gmail.com" className="hover:text-vbrown-gold transition-colors">valenciakabasele@gmail.com</a></li>
            <li><span className="text-vbrown-cream/40">Payments via RedFace Pay</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 text-center py-5 text-xs text-vbrown-cream/30 tracking-widest uppercase">
        © {new Date().getFullYear()} VV Brown Fragrances
      </div>
    </footer>
  );
}
