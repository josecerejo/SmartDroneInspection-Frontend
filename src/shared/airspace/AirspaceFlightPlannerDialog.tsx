import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import MapRounded from '@mui/icons-material/MapRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import GppBadRounded from '@mui/icons-material/GppBadRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import VerifiedUserRounded from '@mui/icons-material/VerifiedUserRounded';
import {
  AirspaceNoFlyMap,
  type InspectionCheckpointItem,
} from './AirspaceNoFlyMap';
import {
  CAMBAY_PORTAL_URL,
  evaluateAirspace,
  extractCoordinates,
  haversineDistanceMeters,
} from './airspaceZones';
import { useIsDarkMode } from '@/app/layouts/ColorModeContext';
import { useLocale } from '@/shared/i18n/LocaleProvider';

export interface AirspaceFlightPlannerDialogProps {
  open: boolean;
  onClose: () => void;
  assetName: string;
  locationText?: string | null | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  inspectionItems?: (string | InspectionCheckpointItem)[] | undefined;
  canEditCoordinates?: boolean | undefined;
  onApplyCoordinates?: (
    latitude: number,
    longitude: number,
    placeName?: string,
  ) => void;
  initialPilotLocation?: { lat: number; lon: number } | undefined;
  onApplyPilotLocation?: (latitude: number, longitude: number) => void;
}

export function AirspaceFlightPlannerDialog({
  open,
  onClose,
  assetName,
  locationText,
  latitude,
  longitude,
  inspectionItems,
  canEditCoordinates = false,
  onApplyCoordinates,
  initialPilotLocation,
  onApplyPilotLocation,
}: AirspaceFlightPlannerDialogProps) {
  const isDark = useIsDarkMode();
  const { t } = useLocale();

  const resolved = extractCoordinates(locationText, latitude, longitude);
  const [draftLat, setDraftLat] = useState<number | null>(resolved.latitude);
  const [draftLon, setDraftLon] = useState<number | null>(resolved.longitude);
  const [draftPlaceName, setDraftPlaceName] = useState<string | undefined>(
    resolved.label || undefined,
  );
  const [pilotLocation, setPilotLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(initialPilotLocation ?? null);

  const activeLat = draftLat ?? resolved.latitude ?? 10.7805;
  const activeLon = draftLon ?? resolved.longitude ?? 106.7108;

  const evaluation = evaluateAirspace(activeLat, activeLon);
  const pilotEvaluation = pilotLocation
    ? evaluateAirspace(pilotLocation.lat, pilotLocation.lon)
    : null;
  const distanceToPilotMeters = pilotLocation
    ? Math.round(
        haversineDistanceMeters(
          pilotLocation.lat,
          pilotLocation.lon,
          activeLat,
          activeLon,
        ),
      )
    : null;

  const handleSelectCoordinates = (
    lat: number,
    lon: number,
    placeName?: string,
  ) => {
    setDraftLat(lat);
    setDraftLon(lon);
    if (placeName) {
      setDraftPlaceName(placeName);
    }
  };

  const handleSelectPilotLocation = (lat: number, lon: number) => {
    setPilotLocation({ lat, lon });
    if (onApplyPilotLocation) {
      onApplyPilotLocation(lat, lon);
    }
  };

  const handleApply = () => {
    if (draftLat != null && draftLon != null && onApplyCoordinates) {
      onApplyCoordinates(draftLat, draftLon, draftPlaceName);
    }
    onClose();
  };

  const statusMeta =
    evaluation.classification === 'NO_FLY_ZONE'
      ? {
          badgeBg: isDark ? 'rgba(239, 68, 68, 0.16)' : '#fef2f2',
          badgeBorder: isDark ? 'rgba(239, 68, 68, 0.4)' : '#fecaca',
          badgeColor: isDark ? '#fca5a5' : '#b91c1c',
          label: 'VÙNG CẤM BAY (NO-FLY)',
          icon: (
            <GppBadRounded
              sx={{ fontSize: 16, color: isDark ? '#f87171' : '#dc2626' }}
            />
          ),
        }
      : evaluation.classification === 'RESTRICTED_ZONE'
        ? {
            badgeBg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#fffbeb',
            badgeBorder: isDark ? 'rgba(245, 158, 11, 0.4)' : '#fde68a',
            badgeColor: isDark ? '#fcd34d' : '#b45309',
            label: 'VÙNG HẠN CHẾ BAY (RESTRICTED)',
            icon: (
              <WarningAmberRounded
                sx={{ fontSize: 16, color: isDark ? '#fbbf24' : '#d97706' }}
              />
            ),
          }
        : {
            badgeBg: isDark ? 'rgba(16, 185, 129, 0.16)' : '#f0fdf4',
            badgeBorder: isDark ? 'rgba(16, 185, 129, 0.4)' : '#bbf7d0',
            badgeColor: isDark ? '#6ee7b7' : '#15803d',
            label: 'VÙNG ĐƯỢC PHÉP BAY (CLEAR)',
            icon: (
              <VerifiedUserRounded
                sx={{ fontSize: 16, color: isDark ? '#34d399' : '#16a34a' }}
              />
            ),
          };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="airspace-flight-planner-title"
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          },
        },
      }}
    >
      <DialogTitle
        id="airspace-flight-planner-title"
        sx={{
          p: 2,
          px: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: 'rgba(55, 88, 249, 0.1)',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MapRounded />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.25 }}
            >
              Bản đồ Khảo sát Không phận & Kế hoạch Bay Drone
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block' }}
            >
              Công trình: <strong>{assetName || 'Khảo sát công trình'}</strong> ·
              QĐ 18/2020/QĐ-TTg & NĐ 288/2025/NĐ-CP
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            size="small"
            icon={statusMeta.icon}
            label={statusMeta.label}
            sx={{
              height: 26,
              bgcolor: statusMeta.badgeBg,
              border: `1px solid ${statusMeta.badgeBorder}`,
              color: statusMeta.badgeColor,
              fontWeight: 700,
              fontSize: '0.72rem',
            }}
          />
          <IconButton onClick={onClose} size="small" aria-label={t('Close')}>
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#f8fafc' }}>
        <Stack spacing={2}>
          {/* Quick Metrics & Flight Summary Bar */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
              border: '1px solid',
              borderColor: 'divider',
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 1.5,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'text.secondary',
                  display: 'block',
                }}
              >
                Tọa độ mục tiêu công trình
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}
              >
                {activeLat.toFixed(5)}°N, {activeLon.toFixed(5)}°E
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'text.secondary',
                  display: 'block',
                }}
              >
                Vùng không phận tại công trình
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color:
                    evaluation.classification === 'NO_FLY_ZONE'
                      ? 'error.main'
                      : evaluation.classification === 'RESTRICTED_ZONE'
                        ? 'warning.main'
                        : 'success.main',
                  mt: 0.25,
                }}
              >
                {evaluation.classification === 'NO_FLY_ZONE'
                  ? 'Vùng cấm bay tuyệt đối'
                  : evaluation.classification === 'RESTRICTED_ZONE'
                    ? `Hạn chế bay (${evaluation.matchingZones.length} vùng)`
                    : 'Ngoài vùng cấm (An toàn)'}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'text.secondary',
                  display: 'block',
                }}
              >
                Điểm cất cánh của phi công (Pilot)
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color:
                    pilotEvaluation?.classification === 'NO_FLY_ZONE'
                      ? 'error.main'
                      : 'text.primary',
                  mt: 0.25,
                }}
              >
                {pilotLocation
                  ? `${pilotLocation.lat.toFixed(5)}°N, ${pilotLocation.lon.toFixed(5)}°E`
                  : 'Chưa đặt (Nhấn Gợi ý / Tự chọn)'}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'text.secondary',
                  display: 'block',
                }}
              >
                Khoảng cách cất cánh tới mục tiêu
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color:
                    distanceToPilotMeters != null &&
                    distanceToPilotMeters > 2000
                      ? 'warning.main'
                      : 'primary.main',
                  mt: 0.25,
                }}
              >
                {distanceToPilotMeters != null
                  ? distanceToPilotMeters >= 1000
                    ? `${(distanceToPilotMeters / 1000).toFixed(2)} km`
                    : `${distanceToPilotMeters} mét`
                  : '—'}
              </Typography>
            </Box>
          </Paper>

          {/* Interactive Survey Map with No-Fly overlays, Takeoff points, and Checkpoints */}
          <AirspaceNoFlyMap
            assetName={assetName}
            locationText={locationText}
            latitude={activeLat}
            longitude={activeLon}
            inspectionItems={inspectionItems}
            initialPilotLocation={pilotLocation ?? undefined}
            onSelectCoordinates={
              canEditCoordinates ? handleSelectCoordinates : undefined
            }
            onSelectPilotLocation={handleSelectPilotLocation}
            dialogMode
            height={420}
          />
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          px: 2.5,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button
            size="small"
            variant="text"
            component="a"
            href={CAMBAY_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<OpenInNewRounded sx={{ fontSize: 15 }} />}
            sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
          >
            Tra cứu cổng cambay.mod.gov.vn
          </Button>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Button
            onClick={onClose}
            color="inherit"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('Close')}
          </Button>
          {canEditCoordinates && (
            <Button
              variant="contained"
              startIcon={<CheckRounded />}
              onClick={handleApply}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px',
                px: 2,
              }}
            >
              Áp dụng tọa độ vào công trình
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
