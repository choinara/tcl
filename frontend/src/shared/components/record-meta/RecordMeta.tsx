import React from 'react';

interface RecordMetaField {
  label: string;
  value?: string | null;
}

interface RecordMetaProps {
  fields: RecordMetaField[];
  width?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const RecordMeta = ({ fields, width = '925px', className, style }: RecordMetaProps) => (
  <div
    className={`flex flex-row gap-[50px] bg-[var(--color-bg-secondary)] rounded-[10px] mx-auto mt-5 mb-5 p-5 px-4 border border-[var(--color-border)] ${className ?? ''}`}
    style={{ width, ...style }}
  >
    {fields.map((field) => (
      <span key={field.label} className="text-sm text-[var(--color-text-primary)]">
        <span className="font-medium mr-2.5">{field.label}</span>
        <span>{field.value || '-'}</span>
      </span>
    ))}
  </div>
);

export default RecordMeta;
