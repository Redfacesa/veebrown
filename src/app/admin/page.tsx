import AdminClient from './AdminClient';
import AdminGate from '@/components/AdminGate';
import { getVeeBrownConfig } from '@/lib/platform-config';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const config = await getVeeBrownConfig();
  return (
    <AdminGate config={config}>
      <AdminClient config={config} />
    </AdminGate>
  );
}
