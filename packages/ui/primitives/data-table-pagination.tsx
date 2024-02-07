import type { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { match } from 'ts-pattern';

import initTranslations from '../../../apps/web/src/app/i18n';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface DataTablePaginationProps<TData> {
  locale?: string;
  table: Table<TData>;

  /**
   * The type of information to show on the left hand side of the pagination.
   *
   * Defaults to 'VisibleCount'.
   */
  additionalInformation?: 'SelectedCount' | 'VisibleCount' | 'None';
}

export async function DataTablePagination<TData>({
  locale = 'en',
  table,
  additionalInformation = 'VisibleCount',
}: DataTablePaginationProps<TData>) {
  const { t } = await initTranslations(locale);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-4 px-2">
      <div className="text-muted-foreground flex-1 text-sm">
        {match(additionalInformation)
          .with('SelectedCount', () => (
            <span>
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} {t('rows_selected')}.
            </span>
          ))
          .with('VisibleCount', () => {
            const visibleRows = table.getFilteredRowModel().rows.length;

            return (
              <span>
                {t('showing_result', { visibleRows })}
                {visibleRows > 1 && 's'}.
              </span>
            );
          })
          .with('None', () => null)
          .exhaustive()}
      </div>

      <div className="flex items-center gap-x-2">
        <p className="whitespace-nowrap text-sm font-medium">{t('rows_per_page')}</p>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 lg:gap-x-8">
        <div className="flex items-center text-sm font-medium md:justify-center">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>

        <div className="flex items-center gap-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{t('go_to_first_page')}</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{t('go_to_previous_page')}</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{t('go_to_next_page')}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{t('go_to_last_page')}</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
