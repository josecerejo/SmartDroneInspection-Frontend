import { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useLocale } from '@/shared/i18n/LocaleProvider';
import { LoadingButton } from '@/shared/ui/LoadingButton';
import { type ServiceRequest } from '../api/contractApi';
import { usePostRequestMessage } from '../hooks/useContracts';

interface RequestChatPanelProps {
  request: ServiceRequest;
  onChanged: () => void;
  onError: (message: string) => void;
}

const QUICK_PROMPTS = [
  'Propose early morning flight window (07:00 - 09:00)',
  'Request thermal / optical zoom payload drone',
  'Request quote adjustment to match project budget',
  'Clarify restricted airspace flight permit requirements',
];

export function RequestChatPanel({ request, onChanged, onError }: RequestChatPanelProps) {
  const { t } = useLocale();
  const currentUser = useAuthStore((state) => state.user);
  const post = usePostRequestMessage(request.id);
  const [body, setBody] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [request.messages]);

  const send = async (textToSend?: string) => {
    const text = (textToSend ?? body).trim();
    if (!text) return;
    try {
      await post.mutateAsync(text);
      setBody('');
      onChanged();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể gửi tin nhắn.';
      onError(msg);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: '16px',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <CardContent sx={{ pb: 1.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 36, height: 36 }}>
              <ForumOutlinedIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t('Commercial Terms & Negotiation')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('Direct communication channel between Customer and Platform Manager for this request')}
              </Typography>
            </Box>
          </Stack>
          <Chip
            size="small"
            label={`${request.messages.length} ${t('messages')}`}
            color={request.messages.length > 0 ? 'primary' : 'default'}
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
        </Stack>
      </CardContent>

      <Divider />

      {/* Messages Scroll Area */}
      <Box
        ref={scrollRef}
        sx={{
          p: { xs: 2, sm: 2.5 },
          minHeight: 340,
          maxHeight: { xs: 420, md: 520 },
          overflowY: 'auto',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: '5px',
          },
        }}
      >
        {request.messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              my: 'auto',
              py: 6,
              color: 'text.secondary',
            }}
          >
            <ForumOutlinedIcon sx={{ fontSize: 48, opacity: 0.25, mb: 1.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t('No negotiation messages yet')}
            </Typography>
            <Typography variant="caption" sx={{ maxWidth: 380, textAlign: 'center', mt: 0.75, color: 'text.secondary' }}>
              {t('Send a message or select a quick prompt below to clarify flight windows, payload requirements, or pricing.')}
            </Typography>
          </Box>
        ) : (
          request.messages.map((message) => {
            const isMe = currentUser?.id === message.authorUserId;
            const authorRole = message.authorRole;
            const isManager = authorRole === 'MANAGER' || authorRole === 'ADMIN';

            return (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: { xs: '90%', sm: '78%' },
                }}
              >
                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{
                    alignItems: 'center',
                    mb: 0.5,
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!isMe && (
                    isManager ? (
                      <SupportAgentRoundedIcon sx={{ fontSize: 16, color: 'info.main' }} />
                    ) : (
                      <PersonOutlineRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    )
                  )}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {isMe ? t('You') : message.authorName || t('Partner')}
                  </Typography>
                  {authorRole && !isMe && (
                    <Chip
                      label={isManager ? t('Platform Manager') : t('Customer')}
                      size="small"
                      color={isManager ? 'info' : 'default'}
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.75rem', fontWeight: 600 }}
                    />
                  )}
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Stack>

                <Paper
                  elevation={0}
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderRadius: '10px',
                    bgcolor: isMe ? 'primary.main' : 'background.paper',
                    color: isMe ? 'primary.contrastText' : 'text.primary',
                    border: isMe ? 'none' : '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.55,
                      fontSize: '0.875rem',
                    }}
                  >
                    {message.body}
                  </Typography>
                </Paper>
              </Box>
            );
          })
        )}
      </Box>

      {/* Quick Prompts Bar */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: 'auto',
            py: 0.5,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
          }}
        >
          {QUICK_PROMPTS.map((prompt) => {
            const localizedPrompt = t(prompt);
            return (
              <Chip
                key={prompt}
                label={localizedPrompt}
                size="small"
                clickable
                onClick={() => {
                  setBody((prev) => (prev ? `${prev}\n${localizedPrompt}` : localizedPrompt));
                }}
                sx={{
                  fontSize: '0.75rem',
                  height: 28,
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                  flexShrink: 0,
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
              />
            );
          })}
        </Stack>
      </Box>

      <Divider />

      {/* Chat Input Section */}
      <Box sx={{ p: 1.5, bgcolor: 'background.paper' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={1}
            maxRows={4}
            placeholder={t('Enter message or commercial terms…')}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            slotProps={{
              input: {
                sx: { borderRadius: '8px', fontSize: '0.875rem' },
              },
            }}
          />
          <LoadingButton
            variant="contained"
            color="primary"
            aria-label={t('Send message')}
            loading={post.isPending}
            disabled={!body.trim()}
            onClick={() => void send()}
            sx={{
              minWidth: 44,
              width: 44,
              height: 40,
              borderRadius: '8px',
              p: 0,
            }}
          >
            <SendRoundedIcon fontSize="small" />
          </LoadingButton>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
          {t('Press Enter to send, Shift + Enter for a new line.')}
        </Typography>
      </Box>
    </Card>
  );
}
