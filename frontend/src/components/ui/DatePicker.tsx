import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';

export interface DatePickerProps {
  label?: string;
  value?: string | null; // Expects 'YYYY-MM-DD'
  onChange?: (date: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  name?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date...',
  error,
  disabled = false,
  minDate: _minDate,
  maxDate: _maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const yearContainerRef = useRef<HTMLDivElement>(null);
  const datePickerId = useRef(Math.random().toString(36).substring(7)).current;

  // Parse initial selected date or current date
  const parsedDate = value ? new Date(value) : null;
  const validParsedDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;

  const [currentYear, setCurrentYear] = useState<number>(
    validParsedDate ? validParsedDate.getFullYear() : new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState<number>(
    validParsedDate ? validParsedDate.getMonth() : new Date().getMonth()
  );

  // Sync internal state when external value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    } else {
      setViewMode('days');
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  // Scroll active year into view when year picker opens
  useEffect(() => {
    if (viewMode === 'years' && yearContainerRef.current) {
      const activeYearBtn = yearContainerRef.current.querySelector('.bg-brand-600');
      if (activeYearBtn) {
        activeYearBtn.scrollIntoView({ block: 'center' });
      }
    }
  }, [viewMode]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const portalEl = document.getElementById(`datepicker-portal-${datePickerId}`);
        if (portalEl && portalEl.contains(e.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [datePickerId]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const selectDate = (day: number) => {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formatted = `${currentYear}-${monthStr}-${dayStr}`;

    if (onChange) {
      onChange(formatted);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) {
      onChange('');
    }
  };

  const handleSelectToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const dayStr = String(today.getDate()).padStart(2, '0');

    setCurrentYear(year);
    setCurrentMonth(today.getMonth());

    if (onChange) {
      onChange(`${year}-${monthStr}-${dayStr}`);
    }
    setIsOpen(false);
  };

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startingDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const yearOptions = Array.from({ length: 91 }, (_, i) => 1950 + i);

  const getDisplayText = () => {
    if (!validParsedDate) return '';
    return validParsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 select-none">
          {label}
        </label>
      )}

      {/* Input Field Trigger */}
      <div
        onClick={() => {
          if (!disabled) {
            updateCoords();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2 text-sm bg-white border rounded-xl shadow-2xs transition-all cursor-pointer ${
          disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : ''
        } ${
          error
            ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-400/20'
            : isOpen
            ? 'border-brand-500 ring-2 ring-brand-500/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <CalendarIcon className={`w-4 h-4 flex-shrink-0 ${value ? 'text-brand-600' : 'text-slate-400'}`} />
          <span className={`truncate text-xs font-medium ${value ? 'text-slate-800' : 'text-slate-400'}`}>
            {value ? getDisplayText() : placeholder}
          </span>
        </div>

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && <span className="text-[11px] text-red-500 font-medium">{error}</span>}

      {/* Pro Calendar Portal Popover */}
      {isOpen &&
        createPortal(
          <div
            id={`datepicker-portal-${datePickerId}`}
            style={{
              position: 'absolute',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 99999,
            }}
            className="w-72 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-3.5 animate-in fade-in zoom-in-95 duration-150 select-none"
          >
            {/* Custom Pro Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                  className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                    viewMode === 'months'
                      ? 'bg-brand-50 text-brand-600 font-extrabold'
                      : 'text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {MONTH_NAMES[currentMonth]}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${viewMode === 'months' ? 'rotate-180 text-brand-600' : 'text-slate-400'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                  className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                    viewMode === 'years'
                      ? 'bg-brand-50 text-brand-600 font-extrabold'
                      : 'text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {currentYear}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${viewMode === 'years' ? 'rotate-180 text-brand-600' : 'text-slate-400'}`} />
                </button>
              </div>

              {viewMode === 'days' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {viewMode !== 'days' && (
                <button
                  type="button"
                  onClick={() => setViewMode('days')}
                  className="text-[11px] font-bold text-brand-600 hover:bg-brand-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Back
                </button>
              )}
            </div>

            {/* MONTH SELECTOR GRID VIEW */}
            {viewMode === 'months' && (
              <div className="grid grid-cols-3 gap-2 py-2">
                {MONTH_NAMES.map((name, idx) => {
                  const isSelectedMonth = currentMonth === idx;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setCurrentMonth(idx);
                        setViewMode('days');
                      }}
                      className={`py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        isSelectedMonth
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {name.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* YEAR SELECTOR GRID VIEW */}
            {viewMode === 'years' && (
              <div
                ref={yearContainerRef}
                className="grid grid-cols-3 gap-2 py-2 max-h-52 overflow-y-auto pr-1"
              >
                {yearOptions.map((y) => {
                  const isSelectedYear = currentYear === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setCurrentYear(y);
                        setViewMode('days');
                      }}
                      className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        isSelectedYear
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}

            {/* DAYS GRID VIEW */}
            {viewMode === 'days' && (
              <>
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <span key={day} className="text-[10px] font-bold text-slate-400 uppercase py-1">
                      {day}
                    </span>
                  ))}
                </div>

                {/* Month Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: startingDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected =
                      validParsedDate &&
                      validParsedDate.getDate() === day &&
                      validParsedDate.getMonth() === currentMonth &&
                      validParsedDate.getFullYear() === currentYear;

                    const isToday =
                      new Date().getDate() === day &&
                      new Date().getMonth() === currentMonth &&
                      new Date().getFullYear() === currentYear;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => selectDate(day)}
                        className={`h-8 w-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-600 text-white font-bold shadow-2xs'
                            : isToday
                            ? 'bg-brand-50 text-brand-600 font-bold border border-brand-200'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSelectToday}
                className="text-[11px] font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
