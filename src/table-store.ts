import { ref, toRaw, computed } from "vue";
import { getDataKey } from "@/utils/object";
import TableColumnItem from "@/hooks/useTableColumnItemHooks";
import { RowKeyType, TableOptions, RowItemType, ColumnFixedType } from "@/common/types";
import useTableData from "@/hooks/useTableDataHooks";
import { doColumnWidthLayout, getTableBodyHeight } from "@/table-layout";
import { getScrollWidth } from "@/utils/layout";
import { isSameColumn } from "@/hooks/utils";
import { sumBy } from "@/utils/collection";
import _ from 'lodash';

// import useTableColumn from "@/hooks/useTbaleColumnHooks";

export interface TableLayout {
  tableHeight: number;
  tableWidth: number;
  viewportWidth: number;
  viewportHeight: number;
  tableHeaderHeight: number;
}

export default function useTableStore(
  tableOptions: TableOptions,
  rowKey?: RowKeyType
) {
  // const { allTableColumns, updateColumns } = useTableColumn();
  const { tableData, normalData } = useTableData();
  const columnStore = ref<TableColumnItem[]>([]);

  
  const layoutSize = ref<TableLayout>({
    tableHeight: 0,
    tableWidth: 0,
    tableHeaderHeight: 0,
    viewportHeight: 0,
    viewportWidth: 0,
  });
  let table;
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
    // debugger
    console.log('useTbaleColumnHooks-->allTableColumns-->', arr);
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
    findColumnIndex
  };
}
