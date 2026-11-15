import { PageHeading } from '../components/molecules/PageHeading';
import { DashboardOverview } from '../components/organisms/DashboardOverview';
import type { BankingData } from '../types/banking';
import type { PageKey } from '../types/navigation';

export function DashboardPage({ data, onNavigate }: { data: BankingData; onNavigate: (page: PageKey) => void }) {
  return <><PageHeading eyebrow="Tu banca, en un vistazo" title={`Hola, ${data.customer.name.split(' ')[0]}`} description="Aquí tienes el resumen de tus cuentas y actividad reciente." action={<span>{new Date().toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>} /><DashboardOverview data={data} onNavigate={onNavigate} /></>;
}
