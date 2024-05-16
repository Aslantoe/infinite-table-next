import { VNode } from 'vue';
import TableStore from '../table-store.vue';
import TableColumnItem from '@/store/table-column-item';

export type ColumnFixedType = 'left' | 'right' | false | true;

export interface TableConfig {
  minColumnWidth: number;
}

export interface ColumnRenderProps {
  options: TableColumnItem;
  rowIndex: number;
  row: RowItemType;
  tableStore: typeof TableStore;
}

export interface HeaderRenderProps {
  options: TableColumnItem;
  tableStore: typeof TableStore;
}

export type ElementExtraAttrs = { style?: any, class?: any, attrs?: any }

export interface InfiniteTableDefaultOptions {
  defaultEmptySlot: (h) => VNode;
}

export type RowItemType = string | number | boolean | symbol | object;

export type RowKeyType = string | ((item: any) => string)

export interface TableOptions {
  rowExtraAttrs: ElementExtraAttrs | ((rowItem: RowItemType, index: number) => ElementExtraAttrs);
  headerHeight: number;
  striped: boolean;
  // FIXME: 替换rowKey的类型
  rowKey: RowKeyType;
  rowHeight: number;
  headerResizable: boolean;
  rowDraggable: boolean;
  headerOrderDraggable: boolean;
  highlightCurrentRow: boolean;
  highlightCurrentCell: boolean;
  multipleSelection: boolean;
  freezeRow: boolean;
  topFixedKeys: string[];
}

export const tableStoreInjectKey = Symbol('table store inject key');

export const tableOptionsInjectKey = Symbol('table options inject key');
