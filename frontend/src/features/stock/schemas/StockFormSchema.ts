import { z } from 'zod';

/**
 * 在庫登録・編集フォームのバリデーションスキーマ
 */
export const StockFormSchema = z.object({
  productName: z
    .string()
    .min(1, '商品名が必須です')
    .max(100, '商品名は100文字以内で入力してください')
    .trim(),

  price: z
    .number({
      message: '価格は数値で入力してください',
    })
    .min(0, '価格は0円以上で入力してください')
    .max(99999999, '価格は99,999,999円以内で入力してください'),

  quantity: z
    .number({
      message: '在庫数は数値で入力してください',
    })
    .min(0, '在庫数は0個以上で入力してください')
    .max(999999, '在庫数は999,999個以内で入力してください')
    .int('在庫数は整数で入力してください'),
});

/**
 * フォームデータの型定義
 */
export type StockFormData = z.infer<typeof StockFormSchema>;

/**
 * バリデーション実行用のヘルパー関数
 */
export const validateStockForm = (data: unknown) => {
  return StockFormSchema.safeParse(data);
};

/**
 * デフォルトフォーム値
 */
export const DEFAULT_STOCK_FORM_VALUES: StockFormData = {
  productName: '',
  price: 0,
  quantity: 0,
};
