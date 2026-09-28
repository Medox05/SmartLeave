import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Inbox } from 'lucide-react';
import { Button } from './Button';
import { useTranslation } from '../../context/LanguageContext';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  pageCount = 1,
  pageIndex = 1,
  pageSize: _pageSize = 15,
  totalCount,
  onPageChange,
  onSearch,
  searchPlaceholder,
  actions,
}: DataTableProps<TData, TValue>) {
  const { t, isRtl } = useTranslation();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [searchValue, setSearchValue] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header controls (Search & Action Buttons) */}
      {(onSearch || actions) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200/80 rounded-xl shadow-2xs">
          {onSearch ? (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchValue}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          ) : <div />}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-slate-50/80 border-b border-slate-200/80">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider select-none"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-1.5 ${
                            header.column.getCanSort() ? 'cursor-pointer hover:text-slate-900' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Skeleton Rows Loading State
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((_, colIdx) => (
                      <td key={colIdx} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5 text-xs text-slate-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                // Empty State
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 bg-slate-50 rounded-full text-slate-400">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">{t('tbl_no_records', 'No records found')}</p>
                      <p className="text-[11px] text-slate-400">{t('tbl_adjust_filters', 'Try adjusting your filters or search terms')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        {onPageChange && pageCount > 1 && (
          <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              {t('tbl_page', 'Page')} <strong>{pageIndex}</strong> {t('tbl_of', 'of')} <strong>{pageCount}</strong>
              {totalCount !== undefined && ` (${totalCount} ${t('tbl_total', 'total')})`}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={pageIndex <= 1 || isLoading}
                onClick={() => onPageChange(pageIndex - 1)}
              >
                {isRtl ? (
                  <>
                    {t('tbl_previous', 'Previous')} <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 mr-1" /> {t('tbl_previous', 'Previous')}
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pageIndex >= pageCount || isLoading}
                onClick={() => onPageChange(pageIndex + 1)}
              >
                {isRtl ? (
                  <>
                    <ChevronLeft className="w-4 h-4 mr-1" /> {t('tbl_next', 'Next')}
                  </>
                ) : (
                  <>
                    {t('tbl_next', 'Next')} <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
