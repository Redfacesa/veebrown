import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'VV Brown Fragrances — Luxury perfumes',
  description: 'Discover elegant eau de parfum from VV Brown Fragrances. Timeless scents for women and men.',
  icons: {
    icon: '/brand/logo.png',
    apple: '/brand/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased bg-vbrown-ivory text-vbrown-charcoal`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
