import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { LoadingState } from '@/components/ui';

export default function IndexRoute() {
  const { ready, authenticated } = useAuth();
  if (!ready) return <LoadingState />;
  return <Redirect href={authenticated ? '/(tabs)' : '/login'} />;
}
