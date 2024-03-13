import Vue, { watch, ref, defineEmits } from "vue";
import { get, getDataKey, intersection, isEmpty } from "@/utils/object";
import TableColumnItem from "@/hooks/useTableColumnItemHooks";
import { RowItemType, RowKeyType, TableOptions } from "@/common/types";
import { isSameColumn } from "./utils";

const emit = defineEmits(["current-change"]);

export function defaultComparator(a: any, b: any): number {
  if (isEmpty(a) && isEmpty(b)) {
    return 0;
  }
  if (isEmpty(a) && !isEmpty(b)) {
    return 1;
  }
  if (!isEmpty(a) && isEmpty(b)) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  if (a === b) {
    return 0;
  }
  return -1;
}

export interface DataStoreOptions {
  dataKey: RowKeyType;
  freeze: boolean;
}

export interface SortedOption {
  column: TableColumnItem | null;
  order?: "asc" | "desc" | "nature";
}

declare const rowKey: RowKeyType;

declare const table: typeof Vue;

declare const tableOptions: TableOptions;

declare let fixedKeys: string[];

export let tableData = ref<RowItemType[]>([]);

let focusedRow: RowItemType | null = null;

declare const selectedColumn: TableColumnItem | null;

const selectedRows = ref<RowItemType[]>([]);

export const fixedData = (): RowItemType[] => {
  const set = new Set(fixedKeys);
  return tableData.value.filter((dataItem) =>
    set.has(get(dataItem, tableOptions.rowKey))
  );
};

export const normalData = () => {
  const set = new Set(fixedKeys);
  const data = tableData.value.filter(
    (dataItem) => !set.has(getDataKey(dataItem, rowKey))
  );
  return compareDataItem(data);
};

const sortedOption: SortedOption = { column: null, order: "nature" };

const compareDataItem = (data: RowItemType[]) => {
  const { column, order } = sortedOption;
  if (!order || !column || order === "nature") {
    return data;
  }
  const { comparator, sortBy } = column;
  if (!comparator && !sortBy) {
    return data;
  }
  return data.sort((row1: any, row2: any) => {
    const descFlag = order === "desc" ? -1 : 1;
    const value1 = get(row1, sortBy);
    const value2 = get(row2, sortBy);
    if (!comparator) {
      return defaultComparator(value1, value2) * descFlag;
    }
    return comparator.call(null, value1, value2, row1, row2) * descFlag;
  });
};

export const updateData = (nextData: RowItemType[]) => {
  if (tableOptions.freezeRow) {
    tableData.value = nextData.map((item: any) => Object.freeze(item));
  } else {
    tableData.value = nextData;
  }
};

export const updateFixedKeys = (keys: string[]) => {
  fixedKeys = keys;
};

export const updateSortedOption = (sortedOption: SortedOption) => {
  const { column: prevColumn, order: prevOrder } = sortedOption;
  const { column } = sortedOption;
  let { order } = sortedOption;
  if (!order && column && prevColumn && !isSameColumn(column, prevColumn)) {
    order = "asc";
  } else if (!order) {
    switch (prevOrder) {
      case "asc":
        order = "desc";
        break;
      case "desc":
        order = "nature";
        break;
      default:
        order = "asc";
    }
  }
  sortedOption = { order, column };
};

export const clearSelectedRows = () => {
  selectedRows.value = [];
};

export const addSelectedRows = (...rows: RowItemType[]) => {
  rows.forEach((item, _index) => {
    if (!isRowSelected(item)) {
      selectedRows.value.push(item);
    }
  });
};

export const removeSelectedRows = (...rows: RowItemType[]) => {
  rows.forEach((item, _rowIndex: number) => {
    const index = findSelectedRowIndex(item);
    if (index !== -1) {
      selectedRows.value.splice(index, 1);
    }
  });
};

export const updateFocusedRow = (row: RowItemType) => {
  focusedRow = row;
};

watch(selectedRows, () => {
  if (table) {
    emit("current-change", selectedRows.value);
  }
});

watch(tableData, () => {
  /**
   * 当数据产生变化时，需要更新selectedRows
   * 以确保current-change事件抛出数据的正确性
   * 同时将已经不存在的数据从selectedRows中清除
   */
  const selectedRowIdList = selectedRows.value.map((item) =>
    getDataKey(item, rowKey)
  );
  const set = new Set(selectedRowIdList);
  const nextSelectedRows: any[] = [];
  for (let i = 0; i < tableData.value.length; i += 1) {
    const item = tableData.value[i];
    if (set.has(getDataKey(item, rowKey))) {
      nextSelectedRows.push(item);
    }
  }
  const commonItem = intersection(selectedRows.value, nextSelectedRows);
  if (
    commonItem.size !== selectedRows.value.length ||
    commonItem.size !== nextSelectedRows.length
  ) {
    selectedRows.value = nextSelectedRows;
  }
  // FIXME: 添加focusRow的修改方法
});

const findSelectedRowIndex = (row: RowItemType): number => {
  const rowDateKey = getDataKey(row, rowKey);
  return selectedRows.value.findIndex(
    (item) => getDataKey(item, rowKey) === rowDateKey
  );
};

const isRowSelected = (row: RowItemType): boolean => {
  return findSelectedRowIndex(row) >= 0;
};
