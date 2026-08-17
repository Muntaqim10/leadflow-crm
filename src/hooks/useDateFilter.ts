'use client';

import { useState, useMemo } from 'react';
import {
  getPastWeekStartDate,
  getTodayDate,
  getCurrentMonthStartDate,
  getCurrentMonthEndDate
} from '@/lib/calculations';

export function useDateFilter() {
  const [dateFilterType, setDateFilterType] = useState<'created_at' | 'check_in'>('created_at');
  const [startDate, setStartDate] = useState<string>(getPastWeekStartDate());
  const [endDate, setEndDate] = useState<string>(getTodayDate());
  const todayStr = useMemo(() => getTodayDate(), []);

  const handleDateFilterTypeChange = (newType: 'created_at' | 'check_in') => {
    setDateFilterType(newType);
    if (newType === 'created_at') {
      setStartDate(getPastWeekStartDate());
      setEndDate(getTodayDate());
    } else {
      setStartDate(getCurrentMonthStartDate());
      setEndDate(getCurrentMonthEndDate());
    }
  };

  return {
    dateFilterType,
    setDateFilterType: handleDateFilterTypeChange,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    todayStr
  };
}
