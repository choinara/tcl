import { useState, useCallback } from 'react';
import { authFetch } from '../lib/api';

export interface OcrSupplier {
  name: string;
  business_number: string | null;
  representative: string | null;
  phone: string | null;
  fax: string | null;
  address: string | null;
}

export interface OcrLineItem {
  seq: number | null;
  part_number: string;
  part_name: string | null;
  model: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
  remarks: string | null;
}

export interface OcrSummary {
  supply_amount: number | null;
  vat: number | null;
  total: number;
  outstanding_balance: number | null;
}

export interface OcrValidation {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface OcrResult {
  supplier: OcrSupplier;
  transaction_date: string;
  document_code: string | null;
  receiver_name: string | null;
  receiver_contact: string | null;
  items: OcrLineItem[];
  summary: OcrSummary;
  handwritten_notes: string | null;
  validation: OcrValidation;
}

interface UseOcrReturn {
  loading: boolean;
  result: OcrResult | null;
  error: string | null;
  extract: (file: File) => Promise<OcrResult | null>;
  reset: () => void;
}

export function useOcr(endpoint = '/api/procurement/ocr/extract'): UseOcrReturn {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extract = useCallback(async (file: File): Promise<OcrResult | null> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await authFetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'OCR 처리에 실패했습니다.' }));
        throw new Error(body.message || 'OCR 처리에 실패했습니다.');
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || 'OCR 추출 실패');
      }

      const data = json.data as OcrResult;
      setResult(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const reset = useCallback(() => {
    setLoading(false);
    setResult(null);
    setError(null);
  }, []);

  return { loading, result, error, extract, reset };
}
