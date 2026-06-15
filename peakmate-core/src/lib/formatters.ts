import type { ValueFormatterParams } from 'ag-grid-community';

export function decimalFormatter(digits = 1) {
  return (params: ValueFormatterParams) =>
    params.value != null && params.value !== ''
      ? Number(params.value).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
      : '';
}

export function integerFormatter(params: ValueFormatterParams) {
  return params.value != null && params.value !== '' ? Number(params.value).toLocaleString() : '';
}

export const numberFormatter = decimalFormatter;
