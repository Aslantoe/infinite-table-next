import { sumBy } from "@/utils/collection";
import TableColumnItem from "@/hooks/useTableColumnItemHooks";
import useTableData from "./useTableDataHooks";
import { RowItemType, TableOptions, ColumnFixedType } from "@/common/types";
// import { TableLayout } from "@/table-store";
import { getDataKey } from "@/utils/object";
import { ref, computed, watch, toRaw, reactive } from "vue";
import _ from 'lodash';

export default function useTableColumn() {

  // const { normalData } = useTableData()

  let tableOptions: TableOptions;
  // let layoutSize: TableLayout;
  // let normalData: RowItemType[];
  
  const columnStore = ref<TableColumnItem[]>([]);
  const column = ref({ arr: <TableColumnItem[]>[] })
  let columnR = reactive<TableColumnItem[]>([])

  // 所有列
  const allTableColumns = computed(() => {
    const arr = _.concat(leftFixedColumns.value, mainColumns.value, rightFixedColumns.value);
    // debugger
    console.log('useTbaleColumnHooks-->allTableColumns-->', column.value.arr);
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
    columnR = columns;
    column.value.arr = columns;
    columnStore.value = columns;
    // debugger
    console.log('useTbaleColumnHooks-->updateColumns-->columnStore.value-->', columnStore.value);
  };
  
  const clearColumns = () => {
    columnStore.value = [];
  };

  return {
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
  }
}



