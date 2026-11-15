import { Box, Typography } from '@mui/material';

export function BrandMark() {
  return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'primary.dark' }}>
    <Box sx={{ width: 38, height: 38, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: 'primary.dark', color: 'common.white', fontWeight: 800, fontSize: 22 }}>B</Box>
    <Typography component="span" sx={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.04em' }}>BP<Typography component="span" color="text.secondary" sx={{ fontSize: 'inherit', fontWeight: 500 }}> digital</Typography></Typography>
  </Box>;
}
