import React, { forwardRef, useState, useRef } from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('ko', ko);

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string;
  dateFormatCalendar?: string;
  width?: number | string;
  height?: number | string;
  fontSize?: number | string;
  showMonthYearPicker?: boolean;
}

export interface DateRangePickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onChange?: (dates: [Date | null, Date | null]) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  width?: number | string;
  height?: number;
}

interface CustomInputProps {
  value?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  placeholder?: string;
  disabled?: boolean;
  inputWidth?: number | string;
  inputHeight?: number | string;
}

const CustomInput = forwardRef<HTMLDivElement, CustomInputProps>(
  ({ value, onClick, placeholder, disabled, inputWidth, inputHeight }, ref) => (
    <div
      ref={ref}
      onClick={onClick}
      className={`inline-flex items-center border border-[var(--color-border)] rounded bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] px-3 text-[length:var(--font-size-base)] cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
      style={{
        width: inputWidth ?? 310,
        height: inputHeight ?? 40,
      }}
    >
      <span className={`flex-1 ${!value ? 'text-[var(--color-text-disabled)]' : ''}`}>
        {value || placeholder}
      </span>
      <Calendar size={18} className="shrink-0 text-[var(--color-text-secondary)]" />
    </div>
  ),
);
CustomInput.displayName = 'CustomInput';

export const DatePicker = ({
  value,
  onChange,
  placeholder = '날짜 선택',
  disabled,
  minDate,
  maxDate,
  dateFormat = 'yyyy.MM.dd',
  dateFormatCalendar,
  width,
  height,
  showMonthYearPicker,
}: DatePickerProps) => (
  <div className="[&_.react-datepicker-wrapper]:w-full">
    <ReactDatePicker
      selected={value}
      onChange={onChange}
      customInput={<CustomInput placeholder={placeholder} disabled={disabled} inputWidth={width} inputHeight={height} />}
      dateFormat={dateFormat}
      dateFormatCalendar={dateFormatCalendar}
      showMonthYearPicker={showMonthYearPicker}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      placeholderText={placeholder}
      locale="ko"
      popperPlacement="bottom-start"
      showPopperArrow={false}
      enableTabLoop={false}
      portalId="datepicker-portal"
    />
  </div>
);

export const DateRangePicker = ({
  startDate,
  endDate,
  onChange,
  placeholder = '날짜 선택',
  disabled,
  minDate,
  maxDate,
  width = 310,
  height = 40,
}: DateRangePickerProps) => {
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate ?? null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate ?? null);
  const datePickerRef = useRef<any>(null);

  const handleCalendarOpen = () => {
    setTempStartDate(startDate ?? null);
    setTempEndDate(endDate ?? null);
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setTempStartDate(start);
    setTempEndDate(end);
  };

  const handleCancel = () => {
    setTempStartDate(startDate ?? null);
    setTempEndDate(endDate ?? null);
    datePickerRef.current?.setOpen(false);
  };

  const handleConfirm = () => {
    onChange?.([tempStartDate, tempEndDate]);
    datePickerRef.current?.setOpen(false);
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      const fmt = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      return `${fmt(startDate)} ~ ${fmt(endDate)}`;
    }
    if (startDate) {
      const fmt = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      return fmt(startDate);
    }
    return '';
  };

  return (
    <div className="[&_.react-datepicker-wrapper]:w-full">
      <ReactDatePicker
        ref={datePickerRef}
        selected={tempStartDate}
        onChange={handleDateChange}
        startDate={tempStartDate}
        endDate={tempEndDate}
        selectsRange
        customInput={<CustomInput placeholder={placeholder} disabled={disabled} value={formatDateRange()} inputWidth={width} inputHeight={height} />}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholder}
        locale="ko"
        monthsShown={2}
        onCalendarOpen={handleCalendarOpen}
        shouldCloseOnSelect={false}
        popperPlacement="bottom-start"
        showPopperArrow={false}
        enableTabLoop={false}
        portalId="datepicker-portal"
      >
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 h-8 text-sm border border-[var(--color-border)] rounded text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 h-8 text-sm bg-[var(--color-primary)] text-white rounded hover:opacity-90"
          >
            확인
          </button>
        </div>
      </ReactDatePicker>
    </div>
  );
};

export default DatePicker;
