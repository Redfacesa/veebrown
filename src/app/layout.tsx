import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PwaShell from '@/components/PwaShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'VV Brown Fragrances — Luxury perfumes',
  description: 'Discover elegant eau de parfum from VV Brown Fragrances. Patron and Femme du Patron lead the house.',
  applicationName: 'VV Brown Fragrances',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'VV Brown',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased bg-vbrown-ivory text-vbrown-charcoal`}>
        <Header />
        <main>{children}</main>
        <Footer />
        <PwaShell />
      </body>
    </html>
  );
}
