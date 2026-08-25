import Hero, { AboutSection, CollectionsSection } from '@/components/Hero';
import { fetchProducts } from '@/lib/api';
import { getVeeBrownConfig, getMerchantIdFromConfig } from '@/lib/platform-config';

export default async function HomePage() {
  const config = await getVeeBrownConfig();
  const merchantId = getMerchantIdFromConfig(config);
  const products = await fetchProducts({ merchantId, limit: 12 }).catch(() => []);

  return (
    <>
      <Hero products={products} />
      <CollectionsSection products={products} />
      <AboutSection />
    </>
  );
}
