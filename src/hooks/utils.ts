import TableColumnItem from '@/hooks/useTableColumnItemHooks';

export function isSameColumn(column1: TableColumnItem, column2: TableColumnItem) {
  return column1 === column2;
}
