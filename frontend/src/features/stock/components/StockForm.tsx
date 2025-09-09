import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  StockFormSchema,
  DEFAULT_STOCK_FORM_VALUES,
} from '../schemas/StockFormSchema';
import type { StockFormData } from '../schemas/StockFormSchema';

export type StockFormMode = 'create' | 'edit';

export interface StockFormProps {
  open: boolean;
  mode: StockFormMode;
  initialData?: Partial<StockFormData>;
  isLoading?: boolean;
  onSubmit: (data: StockFormData) => void | Promise<void>;
  onCancel: () => void;
}

export const StockForm: React.FC<StockFormProps> = ({
  open,
  mode,
  initialData,
  isLoading = false,
  onSubmit,
  onCancel,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<StockFormData>({
    resolver: zodResolver(StockFormSchema),
    defaultValues: {
      ...DEFAULT_STOCK_FORM_VALUES,
      ...initialData,
    },
    mode: 'onChange',
  });

  // ダイアログが開かれた時にフォームをリセット
  React.useEffect(() => {
    if (open) {
      reset({
        ...DEFAULT_STOCK_FORM_VALUES,
        ...initialData,
      });
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: StockFormData) => {
    try {
      await onSubmit(data);
      reset(DEFAULT_STOCK_FORM_VALUES);
    } catch (error) {
      // エラーハンドリングは親コンポーネントで行う
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = () => {
    reset(DEFAULT_STOCK_FORM_VALUES);
    onCancel();
  };

  const dialogTitle = mode === 'create' ? '新規在庫登録' : '在庫情報編集';

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isLoading}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* 商品名 */}
            <Controller
              name="productName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="商品名"
                  required
                  fullWidth
                  error={!!errors.productName}
                  helperText={errors.productName?.message}
                  disabled={isLoading}
                  inputProps={{ maxLength: 100 }}
                />
              )}
            />

            {/* 価格 */}
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="価格"
                  type="number"
                  required
                  fullWidth
                  error={!!errors.price}
                  helperText={errors.price?.message}
                  disabled={isLoading}
                  InputProps={{
                    endAdornment: (
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        円
                      </Typography>
                    ),
                  }}
                  inputProps={{
                    min: 0,
                    max: 99999999,
                    step: 1,
                  }}
                  onChange={(e) => {
                    const value =
                      e.target.value === '' ? 0 : Number(e.target.value);
                    field.onChange(value);
                  }}
                />
              )}
            />

            {/* 在庫数 */}
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="在庫数"
                  type="number"
                  required
                  fullWidth
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message}
                  disabled={isLoading}
                  InputProps={{
                    endAdornment: (
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        個
                      </Typography>
                    ),
                  }}
                  inputProps={{
                    min: 0,
                    max: 999999,
                    step: 1,
                  }}
                  onChange={(e) => {
                    const value =
                      e.target.value === '' ? 0 : Number(e.target.value);
                    field.onChange(value);
                  }}
                />
              )}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={handleCancel}
            disabled={isLoading}
            variant="outlined"
            size="large"
          >
            キャンセル
          </Button>

          <Button
            type="submit"
            disabled={!isValid || isLoading}
            variant="contained"
            size="large"
            startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
          >
            {mode === 'create' ? '登録' : '更新'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
