import Hero, { AboutSection, CollectionsSection } from '@/components/Hero';
import { fetchProducts } from '@/lib/api';
import { sortSignatureFragrancesFirst } from '@/lib/fragrance-catalog';
import { getVeeBrownConfig, getMerchantIdFromConfig } from '@/lib/platform-config';

export default async function HomePage() {
  const config = await getVeeBrownConfig();
  const merchantId = getMerchantIdFromConfig(config);
  const raw = await fetchProducts({ merchantId, limit: 12 }).catch(() => []);
  const products = sortSignatureFragrancesFirst(raw);

  return (
    <>
      <Hero products={products} />
      <CollectionsSection products={products} />
      <AboutSection />
    </>
  );
}
