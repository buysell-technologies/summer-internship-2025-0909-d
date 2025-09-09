import { useState } from 'react';
import { useGetStocks } from '../../api/generated/api';
import type { ModelStock } from '../../api/generated/model';
import { apiClient } from '../../api/apiClient';
import StockTable from '../../features/stock/components/StockTable';
import { StockForm } from '../../features/stock/components/StockForm';
import type { StockFormData } from '../../features/stock/schemas/StockFormSchema';
import {
  CircularProgress,
  Alert,
  Box,
  Typography,
  Button,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// 手動でPOST APIを呼び出すヘルパー関数
const createStock = async (stockData: {
  name: string;
  price: number;
  quantity: number;
  store_id: string;
  user_id: string;
}) => {
  return apiClient<{ id: number }>({
    url: '/stocks',
    method: 'POST',
    data: stockData,
  });
};

// 手動でPUT APIを呼び出すヘルパー関数
const updateStock = async (
  stockId: number,
  stockData: {
    name: string;
    price: number;
    quantity: number;
    store_id: string;
    user_id: string;
  },
) => {
  return apiClient<ModelStock>({
    url: `/stocks/${stockId}`,
    method: 'PUT',
    data: stockData,
  });
};

// 手動でDELETE APIを呼び出すヘルパー関数
const deleteStock = async (stockId: number) => {
  return apiClient<void>({
    url: `/stocks/${stockId}`,
    method: 'DELETE',
  });
};

const StocksPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<ModelStock | null>(null);
  const [stockToDelete, setStockToDelete] = useState<ModelStock | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { data, isLoading, error, refetch } = useGetStocks({
    limit: rowsPerPage,
    offset: page * rowsPerPage,
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 新規登録処理
  const handleCreateStock = async (formData: StockFormData) => {
    setIsCreating(true);

    // 既存のstock データから有効なuser_idを取得
    const existingUserID = data && data.length > 0 ? data[0].user_id : null;
    const validUserID =
      existingUserID || '00000000-0000-0000-0000-000000000000'; // フォールバック

    try {
      // 実際のAPI呼び出し
      const newStock = await createStock({
        name: formData.productName,
        price: formData.price,
        quantity: formData.quantity,
        store_id: '4d6194fd-c3d2-4048-9c81-b503b640edb8', // 実際のstore_idを使用
        user_id: validUserID, // 既存データから取得したuser_id
      });

      console.log('Stock created successfully:', newStock);
      console.log('新規登録前のデータ数:', data?.length);

      // 成功時の処理
      setMessage({ type: 'success', text: '在庫を登録しました' });
      setShowCreateForm(false);

      // 1ページ目に移動して新規商品を表示
      setPage(0);

      console.log('新規登録後のデータ数:', data?.length);
    } catch (error) {
      console.error('Create stock error:', error);
      setMessage({ type: 'error', text: '在庫登録に失敗しました' });
    } finally {
      setIsCreating(false);
    }
  };

  // メッセージクローズ処理
  const handleCloseMessage = () => {
    setMessage(null);
  };

  const handleEdit = (stock: ModelStock) => {
    console.log('編集対象の商品:', stock);
    console.log('編集対象のID:', stock.id, 'type:', typeof stock.id);
    setSelectedStock(stock);
    setShowEditForm(true);
  };

  const handleDelete = (stock: ModelStock) => {
    console.log('削除対象の商品:', stock);
    console.log('削除対象のID:', stock.id, 'type:', typeof stock.id);
    setStockToDelete(stock);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!stockToDelete?.id) return;

    setIsDeleting(true);

    try {
      console.log('削除実行前のstockToDelete:', stockToDelete);
      console.log(
        '削除実行前のstockToDelete.id:',
        stockToDelete.id,
        'type:',
        typeof stockToDelete.id,
      );

      // 削除 API 呼び出し
      await deleteStock(stockToDelete.id!);

      console.log('在庫削除成功: ID=' + stockToDelete.id);

      // 削除成功時：データを再取得
      console.log('削除前のデータ数:', data?.length);
      await refetch();
      console.log('削除後のデータ数:', data?.length);

      setMessage({
        type: 'success',
        text: '在庫を削除しました',
      });

      // ダイアログを閉じる
      setShowDeleteDialog(false);
      setStockToDelete(null);
    } catch (error) {
      console.error('在庫削除エラー:', error);

      setMessage({
        type: 'error',
        text: '在庫の削除に失敗しました',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setStockToDelete(null);
  };

  const handleUpdateStock = async (formData: StockFormData) => {
    if (!selectedStock?.id) return;

    setIsEditing(true);

    try {
      console.log('更新実行前のselectedStock:', selectedStock);
      console.log(
        '更新実行前のselectedStock.id:',
        selectedStock.id,
        'type:',
        typeof selectedStock.id,
      );

      // 実際のAPI呼び出し
      await updateStock(selectedStock.id!, {
        name: formData.productName,
        price: formData.price,
        quantity: formData.quantity,
        store_id: selectedStock.store_id || '',
        user_id: selectedStock.user_id || '',
      });

      console.log('在庫更新成功: ID=' + selectedStock.id);

      // 成功時：現在のクエリのみを再取得（データ重複を防ぐ）
      console.log('更新前のデータ数:', data?.length);
      await refetch();
      console.log('更新後のデータ数:', data?.length);
      console.log('更新後のデータ:', data);

      setMessage({
        type: 'success',
        text: '在庫情報を更新しました',
      });

      // フォームを閉じる
      setShowEditForm(false);
      setSelectedStock(null);
    } catch (error) {
      console.error('在庫更新エラー:', error);

      setMessage({
        type: 'error',
        text: '在庫情報の更新に失敗しました',
      });
    } finally {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          在庫データの取得中にエラーが発生しました。
        </Alert>
        <Button variant="contained" onClick={() => refetch()}>
          再試行
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 'min-content',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            fontWeight: 600,
            color: '#1a1a1a',
            margin: 0,
          }}
        >
          在庫管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateForm(true)}
          sx={{
            px: 3,
            py: 1.5,
          }}
        >
          新規登録
        </Button>
      </Box>
      <Box
        sx={{
          p: 3,
        }}
      >
        <StockTable
          stocks={data || []}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Box>

      {/* 新規登録フォーム */}
      <StockForm
        open={showCreateForm}
        mode="create"
        isLoading={isCreating}
        onSubmit={handleCreateStock}
        onCancel={() => setShowCreateForm(false)}
      />

      {/* 編集フォーム */}
      <StockForm
        open={showEditForm}
        mode="edit"
        initialData={
          selectedStock
            ? {
                productName: selectedStock.name,
                price: selectedStock.price,
                quantity: selectedStock.quantity,
              }
            : undefined
        }
        isLoading={isEditing}
        onSubmit={handleUpdateStock}
        onCancel={() => {
          setShowEditForm(false);
          setSelectedStock(null);
        }}
      />

      {/* 削除確認ダイアログ */}
      <Dialog
        open={showDeleteDialog}
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>在庫の削除確認</DialogTitle>
        <DialogContent>
          <Typography>以下の在庫を削除しますか？</Typography>
          <Box
            sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}
          >
            <Typography variant="body2" color="text.secondary">
              ID: {stockToDelete?.id}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {stockToDelete?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              価格: ¥{stockToDelete?.price?.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              在庫数: {stockToDelete?.quantity}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={isDeleting}>
            キャンセル
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                削除中...
              </>
            ) : (
              '削除'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 成功・エラーメッセージ */}
      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseMessage}
          severity={message?.type}
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StocksPage;
