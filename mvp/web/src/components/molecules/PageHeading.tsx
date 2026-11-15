import { Box, Typography } from '@mui/material';

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
    <Box>
      <Typography variant="overline" color="secondary.main" sx={{ fontWeight: 800, letterSpacing: '.12em', lineHeight: 1.5 }}>{eyebrow}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 750, letterSpacing: '-.04em', mt: .25, mb: .5 }}>{title}</Typography>
      <Typography color="text.secondary" variant="body2">{description}</Typography>
    </Box>
    {action}
  </Box>;
}
