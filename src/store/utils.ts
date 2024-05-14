import TableColumnItem from '@/store/table-column-item';

export function isSameColumn(column1: TableColumnItem, column2: TableColumnItem) {
  return column1 === column2;
}
