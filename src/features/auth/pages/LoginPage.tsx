import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { AuthLoadingScreen } from '../components/AuthSessionBootstrapper';
import {
  completeInitialPasswordSetup,
  confirmPasswordReset,
  getAuthErrorMessage,
  login,
  loginWithGoogle,
  sendLoginOtp,
  sendPasswordResetOtp,
  verifyLoginOtp,
} from '../api/authApi';
import {
  PORTAL_ROLE_ACCESS,
  hasAnyRole,
  type PortalId,
} from '@/app/permissions/accessPolicy';
import { getPortalForHost } from '../utils/domainPortal';
import {
  loginSchema,
  passwordSetupSchema,
  type LoginFormValues,
  type PasswordSetupFormValues,
} from '../schemas/authSchemas';
import { getAuthRedirectTarget, getLoginReturnTo } from '../utils/authRedirect';
import { useAuthStore } from '../store/authStore';
import { useLocale } from '@/shared/i18n/LocaleProvider';

export default function LoginPage() {
  const { t } = useLocale();
  const status = useAuthStore((state) => state.status);
  const roles = useAuthStore((state) => state.roles);
  const setSession = useAuthStore((state) => state.setSession);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingSetupEmail, setPendingSetupEmail] = useState<string | null>(null);
  const [otpChallenge, setOtpChallenge] = useState<string | null>(null);
  const [otpChannels, setOtpChannels] = useState<Array<'EMAIL' | 'SMS'>>([]);
  const [otpChannel, setOtpChannel] = useState<'EMAIL' | 'SMS' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetChallenge, setResetChallenge] = useState<string | null>(null);
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetPending, setResetPending] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: (location.state as { email?: string } | null)?.email ?? '',
      password: '',
    },
  });
  const setupForm = useForm<PasswordSetupFormValues>({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  });

  const from = (location.state as { from?: unknown } | null)?.from;
  const returnTo = getLoginReturnTo(from, searchParams.get('returnTo'));
  const destination = getAuthRedirectTarget(returnTo, roles);

  const onLogin = async (values: LoginFormValues) => {
    setErrorMessage(null);
    try {
      const result = await login(values.email, values.password);
      if (result.step === 'PASSWORD_CHANGE_REQUIRED') {
        setPendingSetupEmail(values.email);
        setupForm.reset({
          currentPassword: '',
          password: '',
          confirmPassword: '',
        });
        return;
      }

      if (result.step === 'OTP_REQUIRED') {
        if (!result.challengeToken || !result.availableOtpChannels?.length) {
          throw new Error('The verification options are unavailable. Contact your administrator.');
        }
        setOtpChallenge(result.challengeToken);
        setOtpChannels(result.availableOtpChannels);
        setOtpChannel(result.availableOtpChannels[0] ?? null);
        setOtpCode('');
        setOtpSent(false);
        return;
      }
      if (!result.accessToken || !result.user) {
        throw new Error('The sign-in response did not include an access token.');
      }
      const portal: PortalId | null = getPortalForHost(
        window.location.hostname,
      );
      if (portal && !hasAnyRole(result.user.roles, PORTAL_ROLE_ACCESS[portal])) {
        setErrorMessage('This account does not belong to this workspace.');
        return;
      }
      setSession({ accessToken: result.accessToken, user: result.user });
      navigate(getAuthRedirectTarget(returnTo, result.user.roles), {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    }
  };

  const GOOGLE_CLIENT_ID =
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ??
    '690876253853-mqm43muduqudn1jbsu292sprrcec100a.apps.googleusercontent.com';

  const handleGoogleCredential = async (credential: string) => {
    setErrorMessage(null);
    try {
      const result = await loginWithGoogle(credential);
      if (result.step === 'OTP_REQUIRED') {
        if (!result.challengeToken || !result.availableOtpChannels?.length) {
          throw new Error('The verification options are unavailable. Contact your administrator.');
        }
        setOtpChallenge(result.challengeToken);
        setOtpChannels(result.availableOtpChannels);
        setOtpChannel(result.availableOtpChannels[0] ?? null);
        setOtpCode('');
        setOtpSent(false);
        return;
      }
      if (!result.accessToken || !result.user) {
        throw new Error('The sign-in response did not include an access token.');
      }
      const portal: PortalId | null = getPortalForHost(window.location.hostname);
      if (portal && !hasAnyRole(result.user.roles, PORTAL_ROLE_ACCESS[portal])) {
        setErrorMessage('This account does not belong to this workspace.');
        return;
      }
      setSession({ accessToken: result.accessToken, user: result.user });
      navigate(getAuthRedirectTarget(returnTo, result.user.roles), {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    }
  };

  useEffect(() => {
    const google = (window as unknown as { google?: { accounts?: { id?: any } } })?.google;
    if (google?.accounts?.id) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            void handleGoogleCredential(response.credential);
          }
        },
      });
      const container = document.getElementById('gsi-hidden-btn');
      if (container) {
        google.accounts.id.renderButton(container, {
          type: 'standard',
          size: 'large',
        });
      }
    }
  }, []);

  const onGoogleClick = () => {
    setErrorMessage(null);
    const google = (window as unknown as { google?: { accounts?: { id?: any } } })?.google;
    if (google?.accounts?.id) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            void handleGoogleCredential(response.credential);
          }
        },
      });
      google.accounts.id.prompt((notification: { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean }) => {
        if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
          const hiddenBtn = document.getElementById('gsi-hidden-btn')?.querySelector('div[role="button"]') as HTMLElement | null;
          if (hiddenBtn) {
            hiddenBtn.click();
          }
        }
      });
    } else {
      setErrorMessage('Google Sign-In is initializing. Please try again.');
    }
  };

  const onSendOtp = async () => {
    if (!otpChallenge || !otpChannel) return;
    setErrorMessage(null);
    try {
      await sendLoginOtp(otpChallenge, otpChannel);
      setOtpSent(true);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    }
  };

  const onVerifyOtp = async () => {
    if (!otpChallenge || !otpCode) return;
    setErrorMessage(null);
    try {
      const result = await verifyLoginOtp(otpChallenge, otpCode);
      if (result.step !== 'AUTHENTICATED' || !result.accessToken || !result.user) {
        throw new Error('The verification response did not complete sign-in.');
      }
      const portal: PortalId | null = getPortalForHost(window.location.hostname);
      if (portal && !hasAnyRole(result.user.roles, PORTAL_ROLE_ACCESS[portal])) {
        setErrorMessage('This account does not belong to this workspace.');
        return;
      }
      setSession({ accessToken: result.accessToken, user: result.user });
      navigate(getAuthRedirectTarget(returnTo, result.user.roles), { replace: true });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    }
  };

  const onPasswordSetup = async (values: PasswordSetupFormValues) => {
    if (!pendingSetupEmail) {
      return;
    }

    setErrorMessage(null);
    try {
      const result = await completeInitialPasswordSetup(
        pendingSetupEmail,
        values.currentPassword,
        values.password,
      );
      if (result.step === 'OTP_REQUIRED') {
        if (!result.challengeToken || !result.availableOtpChannels?.length) {
          throw new Error('The verification options are unavailable. Contact your administrator.');
        }
        setPendingSetupEmail(null);
        setOtpChallenge(result.challengeToken);
        setOtpChannels(result.availableOtpChannels);
        setOtpChannel(result.availableOtpChannels[0] ?? null);
        setOtpCode('');
        setOtpSent(false);
        return;
      }
      if (result.step !== 'AUTHENTICATED' || !result.accessToken || !result.user) {
        throw new Error('Password setup did not complete sign-in.');
      }

      const portal: PortalId | null = getPortalForHost(
        window.location.hostname,
      );
      if (portal && !hasAnyRole(result.user.roles, PORTAL_ROLE_ACCESS[portal])) {
        setErrorMessage('This account does not belong to this workspace.');
        return;
      }

      setSession({ accessToken: result.accessToken, user: result.user });
      navigate(getAuthRedirectTarget(returnTo, result.user.roles), {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    }
  };

  const registrationComplete =
    searchParams.get('registered') === '1' ||
    Boolean(
      (location.state as { registrationComplete?: boolean } | null)
        ?.registrationComplete,
    );
  const passwordChanged = searchParams.get('passwordChanged') === '1';

  const onSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!resetEmail.trim()) {
      setErrorMessage(t('Please enter your email address.'));
      return;
    }
    setResetPending(true);
    try {
      const response = await sendPasswordResetOtp(resetEmail.trim());
      setResetChallenge(response.challengeToken);
      setResetOtpCode('');
      setResetNewPassword('');
      setResetConfirmPassword('');
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setResetPending(false);
    }
  };

  const onConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!resetOtpCode || resetOtpCode.length !== 6) {
      setErrorMessage(t('Please enter a 6-digit OTP code.'));
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 15) {
      setErrorMessage(t('Password must contain between 15 and 128 characters.'));
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setErrorMessage(t('Confirm password does not match.'));
      return;
    }
    setResetPending(true);
    try {
      await confirmPasswordReset({
        email: resetEmail.trim(),
        challengeToken: resetChallenge!,
        code: resetOtpCode.trim(),
        newPassword: resetNewPassword,
      });
      setIsForgotPassword(false);
      setResetChallenge(null);
      setResetSuccessMessage(
        t('Your password has been reset successfully. Please sign in with your new password.'),
      );
      loginForm.setValue('email', resetEmail.trim());
      loginForm.setValue('password', '');
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setResetPending(false);
    }
  };

  if (status === 'checking') {
    return <AuthLoadingScreen />;
  }

  if (status === 'authenticated') {
    return <Navigate to={destination} replace />;
  }

  const authInputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: '#F8FBFA',
      borderRadius: '8px',
      color: '#173B36',
      fontSize: '14px',
      '& fieldset': {
        borderColor: '#D6E4E0',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      },
      '&:hover fieldset': {
        borderColor: '#96BDB5',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#087E8B',
        borderWidth: '1.5px',
        boxShadow: '0 0 0 3px rgba(8, 126, 139, 0.13)',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#5F7872',
      fontSize: '14px',
      '&.Mui-focused': {
        color: '#087E8B',
      },
    },
    '& .MuiInputBase-input': {
      py: '13.5px',
      fontSize: '14px',
      '&::placeholder': {
        color: '#607972',
        opacity: 1,
      },
    },
    '& .MuiFormHelperText-root': {
      color: '#B5473C',
      fontSize: '12px',
      mx: 0.5,
      mt: 0.5,
    },
  };

  if (isForgotPassword) {
    return (
      <AuthPageLayout
        eyebrow={t('Account recovery')}
        title={!resetChallenge ? t('Forgot password') : t('Reset password')}
        description={
          !resetChallenge
            ? t('Enter your account email to receive a 6-digit OTP verification code.')
            : t('A 6-digit OTP code was sent to your email. Enter the code and your new password below.')
        }
        backLabel={t('Back to sign in')}
        backTo="/login"
        showSocial={false}
        heroTagline={{
          line1: 'Precision View,',
          line2: 'Intelligent Insights',
        }}
      >
        <Stack
          component="form"
          spacing={2.2}
          noValidate
          onSubmit={!resetChallenge ? onSendResetOtp : onConfirmResetPassword}
        >
          {errorMessage && (
            <Alert severity="error" role="alert" sx={{ borderRadius: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {!resetChallenge ? (
            <>
              <TextField
                label={t('Email address')}
                placeholder="name@company.com"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                fullWidth
                required
                sx={authInputSx}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={resetPending || !resetEmail.trim()}
                sx={{
                  minHeight: 50,
                  borderRadius: '8px',
                  bgcolor: '#087E8B',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  boxShadow: '0 5px 16px rgba(8, 126, 139, 0.2)',
                  '&:hover': {
                    bgcolor: '#066B70',
                    boxShadow: '0 7px 20px rgba(8, 126, 139, 0.24)',
                  },
                }}
              >
                {resetPending ? t('Sending OTP…') : t('Send OTP code')}
              </Button>
            </>
          ) : (
            <>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                {t('A 6-digit OTP code was sent to:')} <strong>{resetEmail}</strong>
              </Alert>
              <TextField
                label={t('OTP code (6 digits)')}
                placeholder="123456"
                value={resetOtpCode}
                onChange={(e) => setResetOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
                fullWidth
                autoFocus
                required
                sx={authInputSx}
              />
              <TextField
                label={t('New password')}
                placeholder="••••••••••••"
                type={showNewPassword ? 'text' : 'password'}
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                autoComplete="new-password"
                fullWidth
                required
                helperText={t('Use 15–128 characters. Avoid common passwords.')}
                sx={authInputSx}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="button"
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowNewPassword((v) => !v)}
                          edge="end"
                          sx={{ color: '#758984' }}
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label={t('Confirm new password')}
                placeholder="••••••••••••"
                type={showNewPassword ? 'text' : 'password'}
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                autoComplete="new-password"
                fullWidth
                required
                sx={authInputSx}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={resetPending || resetOtpCode.length !== 6 || !resetNewPassword}
                sx={{
                  minHeight: 50,
                  borderRadius: '8px',
                  bgcolor: '#087E8B',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  boxShadow: '0 5px 16px rgba(8, 126, 139, 0.2)',
                  '&:hover': {
                    bgcolor: '#066B70',
                    boxShadow: '0 7px 20px rgba(8, 126, 139, 0.24)',
                  },
                }}
              >
                {resetPending ? t('Resetting…') : t('Reset password')}
              </Button>
            </>
          )}

          <Button
            type="button"
            color="inherit"
            onClick={() => {
              setIsForgotPassword(false);
              setResetChallenge(null);
              setErrorMessage(null);
            }}
            sx={{ textTransform: 'none', color: '#758984' }}
          >
            {t('← Back to sign in')}
          </Button>
        </Stack>
      </AuthPageLayout>
    );
  }

  if (otpChallenge) {
    return (
      <AuthPageLayout
        eyebrow={t('One-time security step')}
        title={t('Verify it’s you')}
        description={t('Choose where to receive your sign-in code. Your account contact information is used for delivery.')}
      >
        <Stack spacing={2.2}>
          <TextField
            select
            label={t('Delivery method')}
            value={otpChannel ?? ''}
            onChange={(event) => {
              setOtpChannel(event.target.value as 'EMAIL' | 'SMS');
              setOtpSent(false);
            }}
            fullWidth
          >
            {otpChannels.map((channel) => (
              <MenuItem key={channel} value={channel}>
                {channel === 'EMAIL' ? t('Email') : t('SMS')}
              </MenuItem>
            ))}
          </TextField>
          {!otpSent ? (
            <Button type="button" variant="contained" onClick={onSendOtp} disabled={!otpChannel}>
              {t('Send verification code')}
            </Button>
          ) : (
            <>
              <Alert severity="info">{t('A six-digit code was sent to your registered contact.')}</Alert>
              <TextField
                label={t('Verification code')}
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6 } }}
                fullWidth
              />
              <Button type="button" variant="contained" onClick={onVerifyOtp} disabled={otpCode.length !== 6}>
                {t('Verify and sign in')}
              </Button>
            </>
          )}
          {errorMessage && <Alert severity="error" role="alert">{errorMessage}</Alert>}
          <Button
            color="inherit"
            onClick={() => {
              setOtpChallenge(null);
              setOtpCode('');
              setOtpSent(false);
              setErrorMessage(null);
            }}
          >
            {t('Back to sign in')}
          </Button>
        </Stack>
      </AuthPageLayout>
    );
  }

  if (pendingSetupEmail) {
    return (
      <AuthPageLayout
        eyebrow={t('One-time security step')}
        title={t('Set your password')}
        description={t('Your administrator issued a temporary password. Replace it before entering your workspace.')}
      >
        <Stack
          component="form"
          spacing={2.2}
          noValidate
          onSubmit={setupForm.handleSubmit(onPasswordSetup)}
        >
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            This is a one-time setup. Your temporary password will stop working
            after the change.
          </Alert>
          <TextField
            label={t('Work email')}
            value={pendingSetupEmail}
            fullWidth
            disabled
          />
          <TextField
            {...setupForm.register('currentPassword')}
            label={t('Temporary password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            fullWidth
            error={Boolean(setupForm.formState.errors.currentPassword)}
            helperText={setupForm.formState.errors.currentPassword?.message}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((visible) => !visible)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            {...setupForm.register('password')}
            label={t('New password')}
            type={showNewPassword ? 'text' : 'password'}
            autoComplete="new-password"
            fullWidth
            error={Boolean(setupForm.formState.errors.password)}
            helperText={
              setupForm.formState.errors.password?.message ??
              'Use 15–128 characters. Avoid common passwords and account details.'
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      onClick={() => setShowNewPassword((visible) => !visible)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            {...setupForm.register('confirmPassword')}
            label={t('Confirm new password')}
            type={showNewPassword ? 'text' : 'password'}
            autoComplete="new-password"
            fullWidth
            error={Boolean(setupForm.formState.errors.confirmPassword)}
            helperText={setupForm.formState.errors.confirmPassword?.message}
          />
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={setupForm.formState.isSubmitting}
            sx={{
              minHeight: 50,
              borderRadius: '8px',
              bgcolor: '#087E8B',
              color: '#FFFFFF',
              boxShadow: '0 5px 16px rgba(8, 126, 139, 0.2)',
              '&:hover': {
                bgcolor: '#066B70',
                boxShadow: '0 7px 20px rgba(8, 126, 139, 0.24)',
              },
            }}
          >
            {setupForm.formState.isSubmitting
              ? 'Saving password…'
              : 'Save password and continue'}
          </Button>
          <Button
            color="inherit"
            onClick={() => {
              setPendingSetupEmail(null);
              setErrorMessage(null);
            }}
          >
            {t('Back to sign in')}
          </Button>
        </Stack>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title={t('Welcome back')}
      subtitleText={t('Don\'t have an account?')}
      subtitleLinkText={t('Sign up')}
      subtitleLinkTo="/register"
      backLabel={t('Back to website')}
      backTo="/"
      socialPrompt={t('Or sign in with')}
      onGoogleClick={onGoogleClick}
      heroTagline={{
        line1: 'Precision View,',
        line2: 'Intelligent Insights',
      }}
    >
      <div id="gsi-hidden-btn" style={{ position: 'absolute', opacity: 0.01, pointerEvents: 'none', zIndex: -1 }} />
      <Stack
        component="form"
        spacing={2.2}
        noValidate
        onSubmit={loginForm.handleSubmit(onLogin)}
      >
        {registrationComplete && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            {t('Your organization and Organization Manager account are ready. Sign in to open your workspace.')}
          </Alert>
        )}
        {passwordChanged && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            {t('Your password was changed. Sign in again with the new password.')}
          </Alert>
        )}
        {resetSuccessMessage && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            {resetSuccessMessage}
          </Alert>
        )}
        <TextField
          {...loginForm.register('email')}
          label={t('Email address')}
          placeholder="name@company.com"
          type="email"
          autoComplete="username"
          autoFocus
          fullWidth
          error={Boolean(loginForm.formState.errors.email)}
          helperText={loginForm.formState.errors.email?.message}
          sx={authInputSx}
        />
        <TextField
          {...loginForm.register('password')}
          label={t('Password')}
          placeholder="••••••••••••"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          fullWidth
          error={Boolean(loginForm.formState.errors.password)}
          helperText={loginForm.formState.errors.password?.message}
          sx={authInputSx}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((visible) => !visible)}
                    edge="end"
                    sx={{ color: '#758984' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
          <Button
            type="button"
            variant="text"
            size="small"
            onClick={() => {
              setErrorMessage(null);
              setResetEmail(loginForm.getValues('email') || '');
              setIsForgotPassword(true);
            }}
            sx={{
              color: '#087E8B',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              p: 0,
              minWidth: 0,
              '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
            }}
          >
            {t('Forgot password?')}
          </Button>
        </Box>
        {errorMessage && (
          <Alert severity="error" role="alert" sx={{ borderRadius: 2 }}>
            {errorMessage}
          </Alert>
        )}
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loginForm.formState.isSubmitting}
          sx={{
            minHeight: 46,
            borderRadius: '8px',
            bgcolor: '#087E8B',
            fontSize: '15px',
            fontWeight: 600,
            textTransform: 'none',
            color: '#FFFFFF',
            boxShadow: '0 5px 16px rgba(8, 126, 139, 0.2)',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: '#066B70',
              boxShadow: '0 7px 20px rgba(8, 126, 139, 0.24)',
            },
          }}
        >
          {loginForm.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </Stack>
    </AuthPageLayout>
  );
}
