import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  subtext?: string;
  badge?: string;
}

export interface SelectProps {
  label?: string;
  value?: string | number;
  onChange?: (e: { target: { name?: string; value: string } }) => void;
  onBlur?: (e: any) => void;
  name?: string;
  id?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      value,
      onChange,
      onBlur,
      name,
      id,
      error,
      placeholder = 'Select option...',
      options,
      disabled = false,
      className = '',
      searchable = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [internalValue, setInternalValue] = useState<string | number>(value ?? '');

    const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
      top: 0,
      left: 0,
      width: 0,
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);

    const selectId = id || name || Math.random().toString(36).substring(7);

    // Sync internal state if prop value changes externally
    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    // Combine refs for hidden select
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(hiddenSelectRef.current);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLSelectElement | null>).current = hiddenSelectRef.current;
      }
    }, [ref]);

    // Recalculate popover screen position
    const updateCoords = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    useEffect(() => {
      if (isOpen) {
        updateCoords();
        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords, true);
      }
      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
      };
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          const portalEl = document.getElementById(`select-portal-${selectId}`);
          if (portalEl && portalEl.contains(e.target as Node)) {
            return;
          }
          setIsOpen(false);
          if (onBlur) {
            onBlur({ target: { name, value: String(currentValue) } });
          }
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [name, value, onBlur, selectId]);

    const currentValue = value !== undefined && value !== '' ? value : internalValue;
    const selectedOption = options.find((opt) => String(opt.value) === String(currentValue));

    const handleSelectOption = (optValue: string | number) => {
      if (disabled) return;

      const valStr = String(optValue);
      setInternalValue(valStr);

      if (hiddenSelectRef.current) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype,
          'value'
        )?.set;
        if (nativeSetter) {
          nativeSetter.call(hiddenSelectRef.current, valStr);
        } else {
          hiddenSelectRef.current.value = valStr;
        }
        hiddenSelectRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        hiddenSelectRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if (onChange) {
        onChange({ target: { name, value: valStr } });
      }

      setIsOpen(false);
      setSearchQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleSelectOption('');
    };

    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className={`w-full flex flex-col gap-1.5 relative ${className}`} ref={containerRef}>
        {/* Hidden native select for react-hook-form */}
        <select
          ref={hiddenSelectRef}
          name={name}
          id={selectId}
          value={currentValue ?? ''}
          onChange={(e) => {
            setInternalValue(e.target.value);
            if (onChange) onChange({ target: { name, value: e.target.value } });
          }}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-slate-700 select-none">
            {label}
          </label>
        )}

        {/* Custom Pro Dropdown Trigger */}
        <div
          onClick={() => {
            if (!disabled) {
              updateCoords();
              setIsOpen(!isOpen);
            }
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2 text-sm bg-white border rounded-xl shadow-2xs transition-all cursor-pointer select-none ${
            disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : ''
          } ${
            error
              ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-400/20'
              : isOpen
              ? 'border-brand-500 ring-2 ring-brand-500/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {selectedOption ? (
              <div className="flex items-center gap-2 truncate">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-md">
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-medium truncate">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-brand-600' : ''
              }`}
            />
          </div>
        </div>

        {/* Error message */}
        {error && <span className="text-[11px] text-red-500 font-medium">{error}</span>}

        {/* Floating Portal Popover */}
        {isOpen &&
          createPortal(
            <div
              id={`select-portal-${selectId}`}
              style={{
                position: 'absolute',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                zIndex: 99999,
              }}
              className="bg-white border border-slate-200/90 rounded-2xl shadow-xl p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Optional Search Filter */}
              {(searchable || options.length > 5) && (
                <div className="p-1.5 mb-1 sticky top-0 bg-white border-b border-slate-100 z-10">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search options..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}

              {/* Options List */}
              {filteredOptions.length > 0 ? (
                <div className="space-y-0.5">
                  {filteredOptions.map((opt) => {
                    const isSelected = String(opt.value) === String(currentValue);

                    return (
                      <div
                        key={opt.value}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectOption(opt.value);
                        }}
                        onClick={() => handleSelectOption(opt.value)}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-brand-50 text-brand-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span>{opt.label}</span>
                            {opt.badge && (
                              <span className="text-[9px] uppercase tracking-wider font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          {opt.subtext && (
                            <span className="text-[10px] text-slate-400 font-normal">{opt.subtext}</span>
                          )}
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-brand-600 flex-shrink-0 ml-2" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">No options found</div>
              )}
            </div>,
            document.body
          )}
      </div>
    );
  }
);

Select.displayName = 'Select';
