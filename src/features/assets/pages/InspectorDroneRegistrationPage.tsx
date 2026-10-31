import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardMedia,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import FlightTakeoffRounded from '@mui/icons-material/FlightTakeoffRounded';
import {
  mf1DroneApi,
  uploadDroneEvidence,
  type DroneEvidenceType,
  type DroneRegistrationInput,
} from '../api/mf1DroneApi';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useLocale } from '@/shared/i18n/LocaleProvider';

interface DroneFormState {
  droneName: string;
  manufacturer: string;
  serialNumber: string;
  registrationNumber: string;
  registrationExpiresAt: string;
  mtowKg: string;
  maxFlightTimeMinutes: string;
  cameraSensor: string;
  safetyFeatures: string;
}

const initialForm: DroneFormState = {
  droneName: '',
  manufacturer: '',
  serialNumber: '',
  registrationNumber: '',
  registrationExpiresAt: '',
  mtowKg: '',
  maxFlightTimeMinutes: '',
  cameraSensor: '',
  safetyFeatures: '',
};

const REQUIRED_DOCUMENTS: Array<{
  type: DroneEvidenceType;
  title: string;
  description: string;
}> = [
  {
    type: 'REGISTRATION',
    title: 'Ảnh Giấy chứng nhận đăng ký drone',
    description: 'Chụp rõ nét giấy chứng nhận đăng ký do cơ quan chức năng cấp, thể hiện rõ số hiệu.',
  },
  {
    type: 'OWNERSHIP',
    title: 'Ảnh Giấy tờ sở hữu / Hóa đơn tài chính',
    description: 'Hóa đơn VAT, tờ khai hải quan nhập khẩu hoặc văn bản chuyển nhượng quyền sở hữu hợp pháp.',
  },
  {
    type: 'INSPECTION',
    title: 'Ảnh Giấy kiểm định / Chứng nhận an toàn kỹ thuật',
    description: 'Biên bản kiểm định định kỳ hoặc Giấy chứng nhận chất lượng xuất xưởng (CoC/CoA) còn hạn.',
  },
];

export default function InspectorDroneRegistrationPage() {
  const { t } = useLocale();
  const [form, setForm] = useState<DroneFormState>(initialForm);
  const [files, setFiles] = useState<Record<DroneEvidenceType, File | null>>({
    REGISTRATION: null,
    OWNERSHIP: null,
    INSPECTION: null,
  });
  const [previews, setPreviews] = useState<Record<DroneEvidenceType, string | null>>({
    REGISTRATION: null,
    OWNERSHIP: null,
    INSPECTION: null,
  });
  const [message, setMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const applications = useQuery({
    queryKey: ['inspector-drone-applications'],
    queryFn: mf1DroneApi.mine,
  });
  const drones = useQuery({
    queryKey: ['inspector-drones'],
    queryFn: mf1DroneApi.drones,
  });

  const submit = useMutation({
    mutationFn: async (formData: DroneFormState) => {
      const upload = async (type: DroneEvidenceType) => {
        const file = files[type];
        if (!file) throw new Error(`Vui lòng tải lên ${type.toLowerCase()}.`);
        return uploadDroneEvidence(file, type);
      };

      const [registrationFileKey, ownershipFileKey, inspectionFileKey] = await Promise.all([
        upload('REGISTRATION'),
        upload('OWNERSHIP'),
        upload('INSPECTION'),
      ]);

      // Ghép thông số kỹ thuật vào trường model để lưu trữ đầy đủ
      const specsParts: string[] = [];
      if (formData.mtowKg) specsParts.push(`MTOW: ${formData.mtowKg} kg`);
      if (formData.maxFlightTimeMinutes) specsParts.push(`Thời gian bay: ${formData.maxFlightTimeMinutes}p`);
      if (formData.cameraSensor) specsParts.push(`Camera/Sensor: ${formData.cameraSensor}`);
      if (formData.safetyFeatures) specsParts.push(`An toàn: ${formData.safetyFeatures}`);

      const formattedModel = specsParts.length > 0
        ? `${formData.droneName.trim()} [${specsParts.join(' | ')}]`
        : formData.droneName.trim();

      const input: DroneRegistrationInput = {
        serialNumber: formData.serialNumber.trim(),
        model: formattedModel,
        manufacturer: formData.manufacturer.trim(),
        registrationNumber: formData.registrationNumber.trim(),
        registrationExpiresAt: new Date(formData.registrationExpiresAt).toISOString(),
        registrationFileKey,
        ownershipFileKey,
        inspectionFileKey,
      };

      return mf1DroneApi.submit(input);
    },
    onSuccess: async () => {
      setForm(initialForm);
      Object.values(previews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      setFiles({ REGISTRATION: null, OWNERSHIP: null, INSPECTION: null });
      setPreviews({ REGISTRATION: null, OWNERSHIP: null, INSPECTION: null });
      setMessage(
        'Đã gửi hồ sơ đăng ký thiết bị drone thành công! Platform Manager sẽ xác minh giấy tờ trước khi kích hoạt.',
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inspector-drone-applications'] }),
        queryClient.invalidateQueries({ queryKey: ['inspector-drones'] }),
      ]);
    },
  });

  const updateField = (field: keyof DroneFormState) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleFileChange = (type: DroneEvidenceType) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    if (previews[type]) {
      URL.revokeObjectURL(previews[type]!);
    }
    setFiles((current) => ({ ...current, [type]: file }));
    if (file && file.type.startsWith('image/')) {
      setPreviews((current) => ({ ...current, [type]: URL.createObjectURL(file) }));
    } else {
      setPreviews((current) => ({ ...current, [type]: null }));
    }
  };

  const handleRemoveFile = (type: DroneEvidenceType) => {
    if (previews[type]) {
      URL.revokeObjectURL(previews[type]!);
    }
    setFiles((current) => ({ ...current, [type]: null }));
    setPreviews((current) => ({ ...current, [type]: null }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    submit.mutate(form);
  };

  const allDocumentsUploaded = Boolean(files.REGISTRATION && files.OWNERSHIP && files.INSPECTION);

  return (
    <Box className="workspace-page">
      <PageHeader
        title={t('Bổ sung Drone kiểm tra')}
        subtitle={t(
          'Khai báo tên, thông số kỹ thuật và tải lên đầy đủ hình ảnh giấy tờ sở hữu, đăng ký và kiểm định. Manager sẽ xác minh và phê duyệt trước khi đưa vào phân công bay.',
        )}
      />

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mt: 2,
          borderRadius: '16px',
          border: '1px solid #eaecf0',
          boxShadow: '0 1px 3px rgba(16, 24, 40, 0.05)',
        }}
      >
        <Stack component="form" spacing={3} onSubmit={handleSubmit}>
          {/* PHẦN 1: THÔNG TIN & THÔNG SỐ KỸ THUẬT */}
          <Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <FlightTakeoffRounded color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                1. Thông tin và Thông số kỹ thuật của Drone
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Nhập chính xác tên, số Serial và các thông số hoạt động của thiết bị bay.
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                required
                label="Tên Drone / Model"
                placeholder="VD: DJI Matrice 350 RTK, Autel EVO Max 4T"
                value={form.droneName}
                onChange={updateField('droneName')}
                helperText="Tên thương mại đầy đủ của thiết bị"
              />
              <TextField
                required
                label="Hãng sản xuất"
                placeholder="VD: DJI, Autel Robotics, Skydio"
                value={form.manufacturer}
                onChange={updateField('manufacturer')}
              />
              <TextField
                required
                label="Số Serial thân máy (Serial number)"
                placeholder="VD: 1581F4B0C2301001"
                value={form.serialNumber}
                onChange={updateField('serialNumber')}
                helperText="Mã số duy nhất in trên tem thân máy (phải khớp giấy tờ)"
              />
              <TextField
                required
                label="Số đăng ký phương tiện bay"
                placeholder="VD: VN-UAV-2026-0889"
                value={form.registrationNumber}
                onChange={updateField('registrationNumber')}
                helperText="Số đăng ký do cơ quan có thẩm quyền cấp"
              />
              <TextField
                required
                type="date"
                label="Ngày hết hạn đăng ký / kiểm định"
                value={form.registrationExpiresAt}
                onChange={updateField('registrationExpiresAt')}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="Thiết bị phải còn hạn đăng ký để được duyệt"
              />
              <TextField
                label="Trọng lượng cất cánh tối đa (MTOW)"
                placeholder="VD: 6.47 kg"
                value={form.mtowKg}
                onChange={updateField('mtowKg')}
              />
              <TextField
                label="Thời gian bay tối đa"
                placeholder="VD: 55 phút"
                value={form.maxFlightTimeMinutes}
                onChange={updateField('maxFlightTimeMinutes')}
              />
              <TextField
                label="Tải trọng Cảm biến / Camera (Payload)"
                placeholder="VD: Zenmuse H20T (Camera nhiệt + Zoom quang 23x)"
                value={form.cameraSensor}
                onChange={updateField('cameraSensor')}
              />
              <Box sx={{ gridColumn: { xs: '1 / -1' } }}>
                <TextField
                  fullWidth
                  label="Tính năng an toàn & Hệ thống hỗ trợ"
                  placeholder="VD: Geofencing tự né vùng cấm bay, Failsafe Return-to-Home, Cảm biến tránh va chạm 6 hướng"
                  value={form.safetyFeatures}
                  onChange={updateField('safetyFeatures')}
                />
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* PHẦN 2: TOÀN BỘ HÌNH ẢNH GIẤY TỜ BẮT BUỘC */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              2. Hình ảnh giấy tờ bắt buộc (Chụp ảnh / Scan rõ nét)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Yêu cầu hình ảnh sắc nét, đọc rõ số Serial, số đăng ký và con dấu kiểm định. Chấp nhận
              định dạng: PNG, JPG, JPEG, WEBP hoặc PDF (tối đa 10 MB/file).
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                gap: 2.5,
              }}
            >
              {REQUIRED_DOCUMENTS.map((doc) => {
                const file = files[doc.type];
                const preview = previews[doc.type];

                return (
                  <Paper
                    key={doc.type}
                    variant="outlined"
                    sx={{
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: '12px',
                      border: file ? '1.5px solid #12B76A' : '1px solid #eaecf0',
                      bgcolor: file ? '#F6FEF9' : '#FCFCFD',
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 1 }}>
                        {file ? (
                          <CheckCircleRounded sx={{ color: '#12B76A', fontSize: 20 }} />
                        ) : (
                          <CloudUploadOutlined sx={{ color: '#667085', fontSize: 20 }} />
                        )}
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {doc.title}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                        {doc.description}
                      </Typography>

                      {preview ? (
                        <Card variant="outlined" sx={{ mb: 1.5, position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="140"
                            image={preview}
                            alt={doc.title}
                            sx={{ objectFit: 'contain', bgcolor: '#0000000a' }}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveFile(doc.type)}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                              '&:hover': { bgcolor: '#ffffff' },
                            }}
                          >
                            <DeleteOutlineRounded fontSize="small" />
                          </IconButton>
                        </Card>
                      ) : file ? (
                        <Box sx={{ mb: 1.5, p: 1, bgcolor: '#ffffff', borderRadius: 1, border: '1px solid #d0d5dd' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            📄 {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </Typography>
                        </Box>
                      ) : null}
                    </Box>

                    <Button
                      component="label"
                      variant={file ? 'outlined' : 'contained'}
                      color={file ? 'success' : 'primary'}
                      size="small"
                      startIcon={<CloudUploadOutlined />}
                      sx={{ mt: 1, textTransform: 'none', borderRadius: '8px' }}
                    >
                      {file ? 'Đổi ảnh khác' : 'Chọn ảnh giấy tờ'}
                      <input
                        hidden
                        type="file"
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        onChange={handleFileChange(doc.type)}
                      />
                    </Button>
                  </Paper>
                );
              })}
            </Box>
          </Box>

          {submit.isError && (
            <Alert severity="error">
              Không thể gửi hồ sơ đăng ký drone. Vui lòng kiểm tra lại hình ảnh và thử lại.
            </Alert>
          )}

          {message && (
            <Alert severity="success" role="status">
              {message}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={
                submit.isPending ||
                !form.droneName.trim() ||
                !form.serialNumber.trim() ||
                !form.registrationNumber.trim() ||
                !form.registrationExpiresAt ||
                !allDocumentsUploaded
              }
              sx={{
                borderRadius: '10px',
                px: 4,
                py: 1.25,
                bgcolor: '#3758F9',
                fontSize: '15px',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#2b45cb' },
              }}
            >
              {submit.isPending ? 'Đang gửi hồ sơ…' : 'Gửi hồ sơ Drone để Manager duyệt'}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* DANH SÁCH HỒ SƠ ĐÃ GỬI & ĐÃ ĐƯỢC DUYỆT */}
      <Paper variant="outlined" sx={{ p: 3, mt: 3, borderRadius: '16px' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          Hồ sơ đăng ký Drone đã gửi
        </Typography>
        {applications.error && <Alert severity="error">Không thể tải danh sách hồ sơ.</Alert>}
        {applications.isLoading ? (
          <Typography>Đang tải danh sách hồ sơ…</Typography>
        ) : (applications.data ?? []).length === 0 ? (
          <Typography color="text.secondary">Chưa có hồ sơ đăng ký nào được gửi.</Typography>
        ) : (
          (applications.data ?? []).map((application) => (
            <Box
              key={application.id}
              sx={{
                py: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600 }}>
                  {application.model ?? 'Drone'} · Serial: {application.serialNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Số đăng ký: {application.registrationNumber}
                  {application.reviewNote ? ` · Ghi chú: ${application.reviewNote}` : ''}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={
                  application.status === 'APPROVED'
                    ? 'Đã duyệt'
                    : application.status === 'REJECTED'
                      ? 'Từ chối'
                      : 'Chờ Manager duyệt'
                }
                color={
                  application.status === 'APPROVED'
                    ? 'success'
                    : application.status === 'REJECTED'
                      ? 'error'
                      : 'warning'
                }
              />
            </Box>
          ))
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mt: 3, borderRadius: '16px' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          Drone đã được duyệt sẵn sàng hoạt động
        </Typography>
        {drones.error && <Alert severity="error">Không thể tải danh sách drone đã duyệt.</Alert>}
        {(drones.data ?? []).length === 0 ? (
          <Typography color="text.secondary">Chưa có drone nào được duyệt.</Typography>
        ) : (
          (drones.data ?? []).map((drone) => (
            <Box
              key={drone.id}
              sx={{
                py: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600 }}>
                  {drone.model ?? 'Drone'} · Serial: {drone.serialNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hãng: {drone.manufacturer ?? '—'}
                </Typography>
              </Box>
              <Chip size="small" label="Sẵn sàng bay" color="success" />
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
}
