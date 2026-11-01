import { Box, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { useLocale } from '@/shared/i18n/LocaleProvider';

interface ContractLifecycleStepperProps {
  status: string;
}

const STEPS = [
  { key: 'OPEN', label: '1. Submit request', desc: 'Customer creates inspection request' },
  { key: 'QUOTED', label: '2. Quote & negotiation', desc: 'Agree fee, pilot & drone terms' },
  { key: 'ACCEPTED', label: '3. Accept terms', desc: 'Customer approves service quote' },
  { key: 'CONTRACT_SIGNED', label: '4. Signed contract', desc: 'Upload signed paper contract' },
  { key: 'ASSIGNED', label: '5. Flight dispatch', desc: 'Assigned & ready for field survey' },
];

export function ContractLifecycleStepper({ status }: ContractLifecycleStepperProps) {
  const { t } = useLocale();
  const getActiveStep = () => {
    switch (status) {
      case 'OPEN':
        return 0;
      case 'QUOTED':
        return 1;
      case 'ACCEPTED':
        return 2;
      case 'CONTRACT_SIGNED':
        return 3;
      case 'ASSIGNED':
        return 4;
      default:
        return 0;
    }
  };

  const activeStep = getActiveStep();

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        bgcolor: 'background.paper',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          '& .MuiStepLabel-label': {
            fontWeight: 600,
            fontSize: '0.875rem',
            mt: 0.5,
          },
          '& .MuiStepLabel-label.Mui-active': {
            color: 'primary.main',
            fontWeight: 700,
          },
          '& .MuiStepLabel-label.Mui-completed': {
            color: 'text.primary',
          },
        }}
      >
        {STEPS.map((step, idx) => (
          <Step key={step.key} completed={idx < activeStep || status === 'ASSIGNED'}>
            <StepLabel>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {t(step.label)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: { xs: 'none', md: 'block' }, fontSize: '0.75rem', mt: 0.25 }}
              >
                {t(step.desc)}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
