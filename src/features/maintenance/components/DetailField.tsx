import { Box, Typography } from '@mui/material';

export function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.72rem' }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.25, wordBreak: 'break-word', fontWeight: 500 }}>
        {value ?? '—'}
      </Typography>
    </Box>
  );
}
