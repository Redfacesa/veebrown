import { redirect } from 'next/navigation';

/** Fragrance-only storefront — clothing/fashion tools are not offered. */
export default function Page() {
  redirect('/shop');
}
