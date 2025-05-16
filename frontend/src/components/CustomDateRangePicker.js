import React, { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, isAfter, isBefore, subYears } from 'date-fns';

const CustomDateRangePicker = ({ onChange, initialStartDate, initialEndDate }) => {
  const today = new Date();
  const twoYearsAgo = subYears(today, 2);
  
  const [startDate, setStartDate] = useState(initialStartDate || twoYearsAgo);
  const [endDate, setEndDate] = useState(initialEndDate || today);
  const [error, setError] = useState('');
  
  const handleStartDateChange = (newDate) => {
    if (newDate && isAfter(newDate, endDate)) {
      setError('Start date cannot be after end date');
      return;
    }
    
    setStartDate(newDate);
    setError('');
    
    if (onChange && newDate) {
      onChange({
        startDate: newDate,
        endDate
      });
    }
  };
  
  const handleEndDateChange = (newDate) => {
    if (newDate && isBefore(newDate, startDate)) {
      setError('End date cannot be before start date');
      return;
    }
    
    if (newDate && isAfter(newDate, today)) {
      setError('End date cannot be in the future');
      return;
    }
    
    setEndDate(newDate);
    setError('');
    
    if (onChange && newDate) {
      onChange({
        startDate,
        endDate: newDate
      });
    }
  };
  
  // Predefined date range options
  const dateRangeOptions = [
    { label: '3 Months', value: '3months' },
    { label: '6 Months', value: '6months' },
    { label: '1 Year', value: '1year' },
    { label: '2 Years', value: '2years' },
    { label: '5 Years', value: '5years' },
  ];
  
  const handlePresetRange = (rangeName) => {
    let newStartDate;
    const newEndDate = new Date();
    
    switch(rangeName) {
      case '3months':
        newStartDate = new Date(newEndDate);
        newStartDate.setMonth(newStartDate.getMonth() - 3);
        break;
      case '6months':
        newStartDate = new Date(newEndDate);
        newStartDate.setMonth(newStartDate.getMonth() - 6);
        break;
      case '1year':
        newStartDate = new Date(newEndDate);
        newStartDate.setFullYear(newStartDate.getFullYear() - 1);
        break;
      case '2years':
        newStartDate = new Date(newEndDate);
        newStartDate.setFullYear(newStartDate.getFullYear() - 2);
        break;
      case '5years':
        newStartDate = new Date(newEndDate);
        newStartDate.setFullYear(newStartDate.getFullYear() - 5);
        break;
      default:
        return;
    }
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setError('');
    
    if (onChange) {
      onChange({
        startDate: newStartDate,
        endDate: newEndDate
      });
    }
  };
  
  return (
    <div className="date-range-picker">
      <div className="flex flex-wrap gap-2 mb-4">
        {dateRangeOptions.map(option => (
          <button
            key={option.value}
            onClick={() => handlePresetRange(option.value)}
            className="px-3 py-1 rounded-full text-sm bg-gray-200 hover:bg-indigo-100 text-gray-700"
          >
            {option.label}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            maxDate={today}
            sx={{ width: '100%' }}
          />
        </LocalizationProvider>
        
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={handleEndDateChange}
            maxDate={today}
            sx={{ width: '100%' }}
          />
        </LocalizationProvider>
      </div>
      
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-2">
        Selected range: {format(startDate, 'MMM d, yyyy')} to {format(endDate, 'MMM d, yyyy')}
      </div>
    </div>
  );
};

export default CustomDateRangePicker;