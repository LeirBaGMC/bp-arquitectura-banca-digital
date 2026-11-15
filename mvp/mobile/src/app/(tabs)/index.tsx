import { RefreshControl, Text } from 'react-native';
import { Card, colors, ListRow, LoadingState, Message, Page } from '@/components/ui';
import { useBankingData } from '@/hooks/useBankingData';

const money = (amount: number, currency = 'USD') => new Intl.NumberFormat('es-EC', { style: 'currency', currency }).format(amount);

export default function DashboardScreen() {
  const { data, loading, error, refresh } = useBankingData();
  const total = data?.accounts.reduce((sum, account) => sum + account.balance, 0) ?? 0;
  return <Page title={data ? `Hola, ${data.customer.name.split(' ')[0]}` : 'Resumen'} subtitle="Tus cuentas y actividad reciente."
    refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={colors.blue} />}>
    {error ? <Message tone="error">{error}</Message> : null}
    {loading && !data ? <LoadingState /> : null}
    {data ? <>
      <Card><Text style={{ color: colors.muted, fontSize: 14 }}>Saldo total disponible</Text><Text style={{ color: colors.navy, fontSize: 34, fontWeight: '800' }}>{money(total)}</Text><Text style={{ color: colors.muted, fontSize: 13 }}>{data.accounts.length} cuentas activas</Text></Card>
      <Card title="Mis cuentas">{data.accounts.map(account => <ListRow key={account.id} title={account.alias} detail={`${account.kind} · •••• ${account.number.slice(-4)}`} amount={money(account.balance, account.currency)} />)}{data.accounts.length === 0 ? <Text style={{ color: colors.muted }}>No hay cuentas disponibles.</Text> : null}</Card>
      <Card title="Actividad reciente">{data.movements.slice(0, 4).map(movement => <ListRow key={movement.id} title={movement.title} detail={`${movement.detail} · ${new Date(movement.createdAt).toLocaleDateString('es-EC')}`} amount={`${movement.direction === 'IN' ? '+' : '−'}${money(movement.amount)}`} />)}{data.movements.length === 0 ? <Text style={{ color: colors.muted }}>Aún no hay movimientos.</Text> : null}</Card>
    </> : null}
  </Page>;
}
