import { ref, toRaw } from "vue";
import { getDataKey } from "@/utils/object";
import TableColumnItem from "@/hooks/useTableColumnItemHooks";
import { RowKeyType, TableOptions, RowItemType } from "@/common/types";
import useTableData from "@/hooks/useTableDataHooks";
import { doColumnWidthLayout, getTableBodyHeight } from "@/table-layout";
import { getScrollWidth } from "@/utils/layout";
import { isSameColumn } from "@/hooks/utils";
import { sumBy } from "@/utils/collection";
import useTableColumn from "@/hooks/useTbaleColumnHooks";

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
  const { allTableColumns, updateColumns } = useTableColumn();
  const { tableData } = useTableData();
  
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

  return {
    layoutSize,
    table,
    doLayout,
    isSameRow,
    _isSameColumn,
    updateLayoutSize,
  };
}
