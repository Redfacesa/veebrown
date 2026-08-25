'use client';

import Image from 'next/image';
import Link from 'next/link';

const LOGO_SRC = '/brand/logo.png';

type Props = {
  variant?: 'full' | 'mark';
  className?: string;
  href?: string | null;
  size?: 'header' | 'footer' | 'hero';
};

const HEIGHT = {
  header: 36,
  footer: 44,
  hero: 80,
} as const;

export default function VeeBrownLogo({
  variant = 'full',
  className = '',
  href = '/',
  size = 'header',
}: Props) {
  const height = variant === 'mark' ? Math.round(HEIGHT[size] * 0.7) : HEIGHT[size];

  const content = (
    <Image
      src={LOGO_SRC}
      alt="VV Brown Fragrances"
      width={Math.round(height * 3.4)}
      height={height}
      className={`object-contain object-left ${className}`}
      style={{ height, width: 'auto' }}
      priority={size === 'header'}
    />
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex items-center shrink-0" aria-label="VV Brown Fragrances home">
      {content}
    </Link>
  );
}
