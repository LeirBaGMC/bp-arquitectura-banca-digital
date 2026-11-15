import { RefreshControl, Text } from 'react-native';
import { Card, colors, ListRow, LoadingState, Message, Page } from '@/components/ui';
import { useBankingData } from '@/hooks/useBankingData';

export default function MovementsScreen() {
  const { data, loading, error, refresh } = useBankingData();
  return <Page title="Movimientos" subtitle="Actividad de tus cuentas."
    refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={colors.blue} />}>
    {error ? <Message tone="error">{error}</Message> : null}{loading && !data ? <LoadingState /> : null}
    {data ? <Card title={`${data.movements.length} registros`}>
      {data.movements.map(item => <ListRow key={item.id} title={item.title} detail={`${item.account} · ${item.detail} · ${new Date(item.createdAt).toLocaleString('es-EC')}`} amount={`${item.direction === 'IN' ? '+' : '−'}${new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(item.amount)}`} status={item.status} />)}
      {data.movements.length === 0 ? <Text style={{ color: colors.muted }}>Aún no hay movimientos registrados.</Text> : null}
    </Card> : null}
  </Page>;
}
