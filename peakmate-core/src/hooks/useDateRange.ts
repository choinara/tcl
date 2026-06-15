import { useState, useCallback, useRef } from 'react';
import { coreNotify } from '../stores/useNotifyStore';

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getDefaultFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return toDateString(d);
}

function getToday(): string {
  return toDateString(new Date());
}

/** 이번 주 월요일 (ISO 기준: 월=1) */
function getMonday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return toDateString(d);
}

/** 이번 주 일요일 */
function getSunday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  return toDateString(d);
}

const DATE_ERROR_MSG = '시작일자는 종료일자보다 이전일자를 입력해야 합니다';

export function useDateRange() {
  const [dateFrom, setDateFromState] = useState(getDefaultFrom);
  const [dateTo, setDateToState] = useState(getToday);
  const [isWeekly, setIsWeekly] = useState(false);

  const fromRef = useRef(dateFrom);
  const toRef = useRef(dateTo);

  const setDateFrom = useCallback((value: string) => {
    if (value && toRef.current && value > toRef.current) {
      coreNotify(DATE_ERROR_MSG, { type: 'warning' });
      return;
    }
    fromRef.current = value;
    setDateFromState(value);
  }, []);

  const setDateTo = useCallback((value: string) => {
    if (fromRef.current && value && fromRef.current > value) {
      coreNotify(DATE_ERROR_MSG, { type: 'warning' });
      return;
    }
    toRef.current = value;
    setDateToState(value);
  }, []);

  const handleWeeklyToggle = useCallback((checked: boolean) => {
    setIsWeekly(checked);
    if (checked) {
      const from = getMonday();
      const to = getSunday();
      fromRef.current = from;
      toRef.current = to;
      setDateFromState(from);
      setDateToState(to);
    } else {
      const from = getDefaultFrom();
      const to = getToday();
      fromRef.current = from;
      toRef.current = to;
      setDateFromState(from);
      setDateToState(to);
    }
  }, []);

  return { dateFrom, dateTo, isWeekly, setDateFrom, setDateTo, handleWeeklyToggle };
}
