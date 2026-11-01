import { useState, type FormEvent } from 'react';
import { Add, EditOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { getErrorMessage } from '@/shared/api/errorMessage';
import { PageHeader } from '@/shared/ui/PageHeader';
import { QueryState } from '@/shared/ui/QueryState';
import { useLocale } from '@/shared/i18n/LocaleProvider';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
} from '../hooks/useCatalog';

export default function AssetCatalogPage() {
  const { t } = useLocale();
  const categories = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // New category form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Edit category form
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const selectedCategory = categories.data?.find((c) => c.id === selectedCategoryId);

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const cat = categories.data?.find((c) => c.id === categoryId);
    if (cat) {
      setEditName(cat.name);
      setEditDescription(cat.description || '');
    }
  };

  const submitCategory = (event: FormEvent) => {
    event.preventDefault();
    createCategory.mutate(
      { code, name, description: description || null },
      {
        onSuccess: (category) => {
          setCode('');
          setName('');
          setDescription('');
          handleSelectCategory(category.id);
        },
      },
    );
  };

  const submitEditCategory = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCategory) return;
    updateCategory.mutate({
      id: selectedCategory.id,
      input: {
        code: selectedCategory.code,
        name: editName,
        description: editDescription || null,
      },
    });
  };

  return (
    <Box className="workspace-page workspace-page--catalog">
      <PageHeader
        title={t('Asset catalog')}
        subtitle={t('Maintain standardized infrastructure inspection classifications and technical categories')}
      />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
        <Card variant="outlined" sx={{ flex: 1, width: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('Categories')}
            </Typography>
            <QueryState
              isLoading={categories.isLoading}
              error={categories.error}
              onRetry={() => void categories.refetch()}
              isEmpty={Boolean(categories.data && categories.data.length === 0)}
              empty={<Alert severity="info">{t('No categories yet. Create the first one below.')}</Alert>}
            >
              <Stack spacing={1}>
                {categories.data?.map((category) => (
                  <Button
                    key={category.id}
                    variant={category.id === selectedCategoryId ? 'contained' : 'outlined'}
                    onClick={() => handleSelectCategory(category.id)}
                    sx={{ justifyContent: 'space-between' }}
                  >
                    <span>{category.name}</span>
                    <Chip
                      size="small"
                      label={category.code}
                      sx={{ ml: 1, bgcolor: category.id === selectedCategoryId ? 'rgba(255,255,255,0.2)' : undefined }}
                    />
                  </Button>
                ))}
              </Stack>
            </QueryState>

            <Box component="form" onSubmit={submitCategory} sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('New category')}
              </Typography>
              <Stack spacing={2}>
                {createCategory.isError && (
                  <Alert severity="error">
                    {getErrorMessage(createCategory.error, 'Could not save the category.')}
                  </Alert>
                )}
                <TextField
                  required
                  size="small"
                  label={t('Code')}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
                <TextField
                  required
                  size="small"
                  label={t('Name')}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <TextField
                  size="small"
                  label={t('Description')}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Add />}
                  disabled={createCategory.isPending}
                >
                  {t('Save category')}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ flex: 1, width: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('Category details')}
            </Typography>
            {!selectedCategory ? (
              <Alert severity="info">{t('Select a category to view or edit details.')}</Alert>
            ) : (
              <Box component="form" onSubmit={submitEditCategory} sx={{ mt: 1 }}>
                <Stack spacing={2}>
                  {updateCategory.isError && (
                    <Alert severity="error">
                      {getErrorMessage(updateCategory.error, 'Could not update the category.')}
                    </Alert>
                  )}
                  {updateCategory.isSuccess && (
                    <Alert severity="success">
                      {t('Category updated successfully.')}
                    </Alert>
                  )}
                  <TextField
                    disabled
                    size="small"
                    label={t('Category Code')}
                    value={selectedCategory.code}
                    helperText={t('Standardized code is immutable once provisioned.')}
                  />
                  <TextField
                    required
                    size="small"
                    label={t('Name')}
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                  />
                  <TextField
                    size="small"
                    multiline
                    rows={3}
                    label={t('Description')}
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<EditOutlined />}
                    disabled={updateCategory.isPending}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {updateCategory.isPending ? t('Saving…') : t('Update category')}
                  </Button>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
