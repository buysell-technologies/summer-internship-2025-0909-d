import { useState } from 'react';
import { convertCSVFromArray } from '../../utils/convertCSVFromArray';
import dayjs from 'dayjs';
import type { ModelStock } from '../../api/generated/model';
import { useGetStocks } from '../../api/generated/api';
import StockTable from '../../features/stock/components/StockTable';
import {
  CircularProgress,
  Alert,
  Box,
  Typography,
  Button,
} from '@mui/material';

const StocksPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data, isLoading, error, refetch } = useGetStocks({
    limit: rowsPerPage,
    offset: page * rowsPerPage,
  });

  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  // CSV用データ整形
  const formatStocksForCSV = (stocks: ModelStock[]) => {
    return stocks.map((s) => ({
      ID: s.id ?? '',
      商品名: s.name ?? '',
      価格: s.price != null ? `${s.price.toLocaleString()}円` : '',
      在庫数: s.quantity ?? '',
      作成日時: s.created_at
        ? dayjs(s.created_at).format('YYYY/MM/DD HH:mm')
        : '',
      更新日時: s.updated_at
        ? dayjs(s.updated_at).format('YYYY/MM/DD HH:mm')
        : '',
    }));
  };

  // CSVダウンロード処理
  const handleDownloadCSV = async () => {
    if (!data || data.length === 0) return;
    setCsvLoading(true);
    setCsvError(null);
    try {
      const csvData = formatStocksForCSV(data);
      const csv = convertCSVFromArray(csvData);
      const now = dayjs();
      const filename = `stocks_${now.format('YYYYMMDD_HHmmss')}.csv`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setCsvError('CSV出力中にエラーが発生しました');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
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
            flex: 1,
          }}
        >
          在庫管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleDownloadCSV}
          disabled={csvLoading || !data || data.length === 0}
          sx={{ minWidth: 140, fontWeight: 600 }}
        >
          {csvLoading ? '出力中...' : 'CSV出力'}
        </Button>
      </Box>
      <Box sx={{ p: 3 }}>
        {csvError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {csvError}
          </Alert>
        )}
        <StockTable
          stocks={data || []}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </Box>
  );
};

export default StocksPage;
