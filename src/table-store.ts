import { ref, toRaw, computed, watch, inject } from "vue";
import TableColumnItem from "@/hooks/useTableColumnItemHooks";
import { RowKeyType, TableOptions, RowItemType, ColumnFixedType, tableOptionsInjectKey } from "@/common/types";
import useTableData from "@/hooks/useTableDataHooks";
import { get, getDataKey, intersection, isEmpty } from "@/utils/object";
import { doColumnWidthLayout, getTableBodyHeight } from "@/table-layout";
import { getScrollWidth } from "@/utils/layout";
import { isSameColumn } from "@/hooks/utils";
import { sumBy } from "@/utils/collection";
import _ from 'lodash';
import emitter from "./event-emitter";


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


export interface TableLayout {
  tableHeight: number;
  tableWidth: number;
  viewportWidth: number;
  viewportHeight: number;
  tableHeaderHeight: number;
}

export default function useTableStore(
  _tableOption?: TableOptions,
  rowKey?: RowKeyType | any,
  from?: any
) {
  let tableOptions: TableOptions;
  const tableOption: TableOptions | any = inject(tableOptionsInjectKey);
  
  tableOptions = _tableOption ? _tableOption : tableOption
  
  console.log(32321, from, tableOptions);
  
  // const { allTableColumns, updateColumns } = useTableColumn();
  // const { tableData, normalData } = useTableData();
  const columnStore = ref<TableColumnItem[]>([]);

  
  const layoutSize = ref<TableLayout>({
    tableHeight: 0,
    tableWidth: 0,
    tableHeaderHeight: 0,
    viewportHeight: 0,
    viewportWidth: 0,
  });
  let table;

  
  let fixedKeys: string[];
  
  const tableData = ref<RowItemType[]>([]);

  const normalData = ref<RowItemType[]>([]);
  
  const focusedRow = ref<RowItemType | null>(null);
  
  const selectedColumn = ref<TableColumnItem | null>();
  
  const selectedRows = ref<RowItemType[]>([]);
  /**
   * 
   * table的tableHeight, tableWidth，或tableHeaderHeight发生变化时
   * 应当调用此方法
   * 此方法会更新表格的layout数据
   * @param layoutSize
   */
  // @DebounceDecorator({ wait: 500, leading: true, trailing: true })
  const updateLayoutSize = (_layoutSize: {
    tableHeight: number;
    tableWidth: number;
    tableHeaderHeight: number;
    viewportHeight: number;
    viewportWidth: number;
  }): void => {
    layoutSize.value = {
      tableHeaderHeight: _layoutSize.tableHeaderHeight,
      tableHeight: _layoutSize.tableHeight,
      tableWidth: _layoutSize.tableWidth,
      viewportHeight: 0,
      viewportWidth: 0,
    };
    console.log('updateLayoutSize--->doLayout--->allTableColumns--->', allTableColumns.value);
    
    doLayout(allTableColumns.value);
  };

  const _isSameColumn = (
    column1: TableColumnItem,
    column2: TableColumnItem
  ): boolean => {
    return isSameColumn(column1, column2);
  };

  const isSameRow = (rowItem1: RowItemType, rowItem2: RowItemType): boolean => {
    const { rowKey } = tableOptions;
    return getDataKey(rowItem1, rowKey) === getDataKey(rowItem2, rowKey);
  };

  const doLayout = (columns: TableColumnItem[]) => {
    // debugger
    
    const { tableHeight, tableWidth, tableHeaderHeight } = layoutSize.value;
    /**
     * 没有mounted的时候，tableHeight和tableWidth都是0
     * 此时只需要把columns信息暂存
     */
    if (columns.length === 0 || tableHeight === 0 || tableWidth === 0) {
      console.log('此时只需要把columns信息暂存');
      console.log('table-store-->doLayout-->', toRaw(columns));
      // debugger
      updateColumns(columns);
      return;
    }
    let viewportWidth = tableWidth;
    const tableBodyHeight = getTableBodyHeight(
      tableOptions.rowHeight,
      tableData.value.length
    );
    // 如果table的高度减去tableHeader的高度不足以容纳所有数据，证明纵向滚动条
    const hasVerticalScroller =
      tableHeight - tableHeaderHeight < tableBodyHeight;
    // 如果有纵向滚动条，那么内部table的宽度应该减去纵向滚动条的宽度
    if (hasVerticalScroller) {
      viewportWidth -= getScrollWidth();
    }
    /**
     * 使用viewportWidth，计算columns的宽度
     */
    const calculatedColumns = doColumnWidthLayout(viewportWidth, columns);
    /**
     * 得出layout后的列表总宽度
     * 如果总宽度大于viewportHeight
     * 证明有纵向滚动条，说明需要从viewportHeight中减去滚动条的宽度
     */
    const allColumnsWidth = sumBy(calculatedColumns, (item) => item.width);
    const hasHorizontalScroller = allColumnsWidth > viewportWidth;
    let viewportHeight = tableHeight - tableHeaderHeight;
    if (hasHorizontalScroller) {
      viewportHeight -= getScrollWidth();
    }
    // FIXME: 使用事件处理viewportHeight可能随着column改变而变化
    layoutSize.value.viewportHeight = viewportHeight;
    layoutSize.value.viewportWidth = viewportWidth;
    console.log('calculatedColumns', calculatedColumns);
    // debugger
    updateColumns(calculatedColumns);
  };

  // 所有列
  const allTableColumns = computed(() => {
    const arr = _.concat(leftFixedColumns.value, mainColumns.value, rightFixedColumns.value);
    return arr;
  });
  
  // 其他列
  const mainColumns = computed(() => {
    return columnStore.value.filter((item) => !item.fixed);
  });
  
  // 左侧冻结列
  const leftFixedColumns = computed(() => {
    // debugger
    return columnStore.value.filter((item) => item.fixed === "left");
  });
  
  // 右侧冻结列
  const rightFixedColumns = computed(() => {
    return columnStore.value.filter((item) => item.fixed === "right");
  });
  
  // 左侧冻结列宽
  const leftFixedColumnWidth = computed(() => {
    return sumBy(leftFixedColumns.value, (item) => item.width);
  });
  
  // 右侧冻结列宽
  const rightFixedColumnWidth = computed(() => {
    return sumBy(rightFixedColumns.value, (item) => item.width);
  });
  
  // 所有列宽
  const allColumnsWidth = computed(() => {
    return sumBy(allTableColumns.value, (item: any) => item.width);
  });
  
  // 列偏移
  const columnOffset = computed(() => {
    let sum = 0;
    return allTableColumns.value.map((_item: any, index: number) => {
      if (index === 0) {
        return 0;
      }
      sum += allTableColumns.value[index - 1].width || 0;
      return sum;
    });
  });
  
  /**
   * 获取column的fixed style
   * @param column
   * @return {Object} style对象, 包含left或right属性
   */
  const getFixedColumnStyle = (column: TableColumnItem) => {
    if (column.fixed) {
      const fixedColumns = getColumnsByFixed(column.fixed);
      const index = fixedColumns.indexOf(column);
      const positionMap = fixedPositionMap.value;
      return {
        [column.fixed]: `${positionMap[column.fixed].get(index)}px`,
      };
    }
    return {};
  };
  
  const fixedPositionMap = computed(() => {
    const map = {
      left: new Map(),
      right: new Map(),
    };
    for (let i = 0; i < leftFixedColumns.value.length; i += 1) {
      if (i === 0) {
        map.left.set(i, 0);
      } else {
        const prevValue = map.left.get(i - 1);
        const prevColumn = leftFixedColumns.value[i - 1];
        map.left.set(i, prevValue + prevColumn.width);
      }
    }
  
    for (let i = rightFixedColumns.value.length - 1; i >= 0; i -= 1) {
      if (i === rightFixedColumns.value.length - 1) {
        map.right.set(i, 0);
      } else {
        const previousValue = map.right.get(i + 1);
        const previousColumn = rightFixedColumns.value[i + 1];
        map.right.set(i, previousValue + previousColumn.width);
      }
    }
    return map;
  });
  
  // 列下标
  const findColumnIndex = (column: TableColumnItem) => {
    return allTableColumns.value.indexOf(column);
  };
  
  // 列偏移
  const getColumnOffset = (column: TableColumnItem): number => {
    const columnIndex = findColumnIndex(column);
    return columnOffset.value[columnIndex];
  };
  
  const getColumnsByFixed = (fixed: ColumnFixedType) => {
    switch (fixed) {
      case "left":
        return leftFixedColumns.value;
      case "right":
        return rightFixedColumns.value;
      default:
        return mainColumns.value;
    }
  };
  
  const findRowIndex = (key: string): number => {
    const { rowKey } = tableOptions;
    return normalData.value.findIndex((item) => getDataKey(item, rowKey) === key);
  };

  
  const updateColumns = (columns: TableColumnItem[]) => {
    columnStore.value = columns;
    // debugger
    console.log('useTbaleColumnHooks-->updateColumns-->columnStore.value-->', columnStore.value);
  };
  
  const clearColumns = () => {
    columnStore.value = [];
  };

  const fixedData = (): RowItemType[] => {
    const set = new Set(fixedKeys);
    return tableData.value.filter((dataItem) =>
      set.has(get(dataItem, tableOptions.rowKey))
    );
  };
  
  
  const sortedOption = ref<SortedOption>({ column: null, order: "nature" });
  
  const compareDataItem = (data: RowItemType[]) => {
    const { column, order } = sortedOption.value;
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
  
  const updateData = (nextData: RowItemType[]) => {
    console.log(9988, nextData);
    
    if (tableOptions.freezeRow) {
      tableData.value = nextData.map((item: any) => Object.freeze(item));
    } else {
      tableData.value = nextData;
    }

   const set = new Set(fixedKeys);
    const data = tableData.value.filter(
      (dataItem) => !set.has(getDataKey(dataItem, rowKey))
    );

    normalData.value = compareDataItem(toRaw(data));
    console.log('normal-data',  normalData.value);

  };
  
  const updateFixedKeys = (keys: string[]) => {
    console.log('updateFixedKeys--', keys);
    fixedKeys = keys;
  };
  
  const updateSortedOption = (sortedOption: SortedOption) => {
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
  
  const clearSelectedRows = () => {
    selectedRows.value = [];
  };
  
  const addSelectedRows = (...rows: RowItemType[]) => {
    rows.forEach((item, _index) => {
      if (!isRowSelected(item)) {
        selectedRows.value.push(item);
      }
    });
  };
  
  const removeSelectedRows = (...rows: RowItemType[]) => {
    rows.forEach((item, _rowIndex: number) => {
      const index = findSelectedRowIndex(item);
      if (index !== -1) {
        selectedRows.value.splice(index, 1);
      }
    });
  };
  
  const updateFocusedRow = (row: RowItemType) => {
    focusedRow.value = row;
  };
  
  watch(selectedRows, () => {
    if (table) {
      emitter.emit("current-change", selectedRows.value);
    }
  }, { deep: true });
  
  watch(tableData, () => {
    /**
     * 当数据产生变化时，需要更新selectedRows
     * 以确保current-change事件抛出数据的正确性
     * 同时将已经不存在的数据从selectedRows中清除
     */
    const selectedRowIdList = selectedRows.value.map((item) =>
      getDataKey(item, rowKey.value)
    );
    const set = new Set(selectedRowIdList);
    const nextSelectedRows: any[] = [];
    for (let i = 0; i < tableData.value.length; i += 1) {
      const item = tableData.value[i];
      if (set.has(getDataKey(item, rowKey.value))) {
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
  }, { deep: true });
  
  const findSelectedRowIndex = (row: RowItemType): number => {
    const rowDateKey = getDataKey(row, rowKey.value);
    return selectedRows.value.findIndex(
      (item) => getDataKey(item, rowKey.value) === rowDateKey
    );
  };
  
  const isRowSelected = (row: RowItemType): boolean => {
    return findSelectedRowIndex(row) >= 0;
  };


  return {
    layoutSize,
    table,
    doLayout,
    isSameRow,
    _isSameColumn,
    updateLayoutSize,
    allTableColumns,
    columnStore,
    allColumnsWidth,
    leftFixedColumns,
    rightFixedColumns,
    mainColumns,
    leftFixedColumnWidth,
    rightFixedColumnWidth,
    updateColumns,
    clearColumns,
    getFixedColumnStyle,
    getColumnOffset,
    findRowIndex,
    findColumnIndex,
    // -------
    rowKey,
    tableData,
    selectedRows,
    focusedRow,
    selectedColumn,
    sortedOption,
    isRowSelected,
    normalData,
    updateFocusedRow,
    removeSelectedRows,
    addSelectedRows,
    clearSelectedRows,
    updateSortedOption,
    updateFixedKeys,
    updateData,
    fixedData
  };
}
