<script lang="ts">
import Vue, { defineComponent, reactive, ref, PropType } from "vue";
import { getDataKey } from "./utils/object";
import TableColumnItem from "./store/table-column-item";
import { RowKeyType, TableOptions, RowItemType } from "./common/types";
import TableDataStoreMixin from "./store/table-data-store.vue";
import { doColumnWidthLayout, getTableBodyHeight } from "./table-layout";
import { getScrollWidth } from "./utils/layout";
import { isSameColumn } from "./store/utils";
import { sumBy } from "./utils/collection";
import TableColumnStoreMixin from "./store/table-column-store.vue";
import { debounce } from "lodash-es";

export interface TableLayout {
  tableHeight: number;
  tableWidth: number;
  viewportWidth: number;
  viewportHeight: number;
  tableHeaderHeight: number;
}
export default defineComponent({
  mixins: [TableColumnStoreMixin, TableDataStoreMixin],
  props: {
    tableOptions: {
      type: Object as PropType<TableOptions>,
      required: true,
    },
    rowKey: {
      type: [Function, String] as PropType<RowKeyType>,
    },
  },
  data(this, vm) {
    const layoutSize = reactive<TableLayout>({
      tableHeight: 0,
      tableWidth: 0,
      tableHeaderHeight: 0,
      viewportHeight: 0,
      viewportWidth: 0,
    });
    const table = ref();
    return {
      layoutSize,
      table,
    };
  },

  methods: {
    reLayoutDebounce() {
      return debounce(this.reLayout.bind(this), 100)();
    },
    /**
     * table的tableHeight, tableWidth，或tableHeaderHeight发生变化时
     * 应当调用此方法
     * 此方法会更新表格的layout数据
     * @param layoutSize
     */
    // @DebounceDecorator({ wait: 500, leading: true, trailing: true })
    updateLayoutSize(layoutSize: {
      tableHeight: number;
      tableWidth: number;
      tableHeaderHeight: number;
    }): void {
      this.layoutSize = {
        tableHeaderHeight: layoutSize.tableHeaderHeight,
        tableHeight: layoutSize.tableHeight,
        tableWidth: layoutSize.tableWidth,
        viewportHeight: 0,
        viewportWidth: 0,
      };
      this.doLayout(this.allTableColumns);
    },

    isSameColumn(column1: TableColumnItem, column2: TableColumnItem): boolean {
      return isSameColumn(column1, column2);
    },

    isSameRow(rowItem1: RowItemType, rowItem2: RowItemType): boolean {
      const { rowKey } = this.tableOptions;
      return getDataKey(rowItem1, rowKey) === getDataKey(rowItem2, rowKey);
    },

    doLayout(columns: TableColumnItem[]) {
      const { tableHeight, tableWidth, tableHeaderHeight } = this.layoutSize;
      /**
       * 没有mounted的时候，tableHeight和tableWidth都是0
       * 此时只需要把columns信息暂存
       */
      if (columns.length === 0 || tableHeight === 0 || tableWidth === 0) {
        this.updateColumns(columns);
        return;
      }
      let viewportWidth = tableWidth;
      const tableBodyHeight = getTableBodyHeight(
        this.tableOptions.rowHeight,
        this.tableData.length
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
      this.layoutSize.viewportHeight = viewportHeight;
      this.layoutSize.viewportWidth = viewportWidth;

      this.updateColumns(calculatedColumns);
    },
  },

});
</script>
