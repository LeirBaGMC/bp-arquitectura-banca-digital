import { Avatar, Card, CardContent, Stack, Typography } from '@mui/material';

export function SummaryMetricCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <Card sx={{ height: '100%' }}><CardContent sx={{ p: 2.5 }}>
    <Stack direction="row"   spacing={2} sx={{ justifyContent: "space-between", alignItems: "center" }}>
      <Typography variant="body2" color="text.secondary"  sx={{ fontWeight: 600 }}>{label}</Typography>
      <Avatar variant="rounded" sx={{ width: 38, height: 38, bgcolor: 'primary.light', color: 'primary.main' }}>{icon}</Avatar>
    </Stack>
    <Typography variant="h4" sx={{ mt: 2, fontWeight: 750 }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary">{note}</Typography>
  </CardContent></Card>;
}
