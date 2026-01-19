import React from 'react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  mobileCardRender?: (item: T) => React.ReactNode;
}

function ResponsiveTable<T extends { id?: number | string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'Aucune donnée disponible',
  mobileCardRender
}: ResponsiveTableProps<T>) {
  const getValue = (item: T, key: keyof T | string): any => {
    if (typeof key === 'string' && key.includes('.')) {
      return key.split('.').reduce((obj: any, k) => obj?.[k], item);
    }
    return item[key as keyof T];
  };

  return (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr
                  key={item.id || rowIndex}
                  onClick={() => onRowClick?.(item)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                    >
                      {column.render
                        ? column.render(item)
                        : getValue(item, column.key)?.toString() || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="md:hidden space-y-3">
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          data.map((item, index) => (
            <div
              key={item.id || index}
              onClick={() => onRowClick?.(item)}
              className={`mobile-card ${onRowClick ? 'cursor-pointer active:scale-98' : ''}`}
            >
              {mobileCardRender ? (
                mobileCardRender(item)
              ) : (
                <>
                  {columns
                    .filter((col) => !col.hideOnMobile)
                    .map((column, colIndex) => (
                      <div key={colIndex} className="mobile-card-row">
                        <span className="mobile-card-label">
                          {column.mobileLabel || column.label}
                        </span>
                        <span className="mobile-card-value">
                          {column.render
                            ? column.render(item)
                            : getValue(item, column.key)?.toString() || '-'}
                        </span>
                      </div>
                    ))}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default ResponsiveTable;
