<!-- 此实例被 mixin 到 table.vue, 可用用this获取 table.vue 属性方法 -->
<script lang="ts">
import { defineComponent, reactive, ref, nextTick } from "vue";
import { sumBy } from "../utils/collection";
import TableColumnItem from "./table-column-item";
import { RowItemType, TableOptions, ColumnFixedType } from "../common/types";
// import { TableLayout } from "@/table-store";
import { getDataKey } from "../utils/object";

export default defineComponent({
  data() {
    let normalData = reactive<RowItemType[]>([]);
    nextTick(() => {
      normalData = this.normalData;
    });
    const columnStore = reactive<TableColumnItem[]>([]);
    return {
      normalData,
      columnStore,
    };
  },

  computed: {
    allTableColumns(): TableColumnItem[] {
      return [
        ...this.leftFixedColumns,
        ...this.mainColumns,
        ...this.rightFixedColumns,
      ];
    },
    mainColumns(): TableColumnItem[] {
      return this.columnStore.filter((item) => !item.fixed);
    },

    leftFixedColumns(): TableColumnItem[] {
      return this.columnStore.filter((item) => item.fixed === "left");
    },

    rightFixedColumns(): TableColumnItem[] {
      return this.columnStore.filter((item) => item.fixed === "right");
    },

    leftFixedColumnWidth() {
      return sumBy(this.leftFixedColumns, (item) => item.width);
    },

    rightFixedColumnWidth() {
      return sumBy(this.rightFixedColumns, (item) => item.width);
    },

    allColumnsWidth(): number {
      return sumBy(this.allTableColumns, (item) => item.width);
    },

    columnOffset(): number[] {
      let sum = 0;
      return this.allTableColumns.map((item, index) => {
        if (index === 0) {
          return 0;
        }
        sum += this.allTableColumns[index - 1].width || 0;
        return sum;
      });
    },
    fixedPositionMap(): {
      left: Map<number, number>;
      right: Map<number, number>;
    } {
      const map = {
        left: new Map(),
        right: new Map(),
      };
      for (let i = 0; i < this.leftFixedColumns.length; i += 1) {
        if (i === 0) {
          map.left.set(i, 0);
        } else {
          const prevValue = map.left.get(i - 1);
          const prevColumn = this.leftFixedColumns[i - 1];
          map.left.set(i, prevValue + prevColumn.width);
        }
      }

      for (let i = this.rightFixedColumns.length - 1; i >= 0; i -= 1) {
        if (i === this.rightFixedColumns.length - 1) {
          map.right.set(i, 0);
        } else {
          const previousValue = map.right.get(i + 1);
          const previousColumn = this.rightFixedColumns[i + 1];
          map.right.set(i, previousValue + previousColumn.width);
        }
      }
      return map;
    },
  },

  methods: {
    /**
     * 获取column的fixed style
     * @param column
     * @return {Object} style对象, 包含left或right属性
     */
    getFixedColumnStyle(column: TableColumnItem) {
      if (column.fixed) {
        const fixedColumns = this.getColumnsByFixed(column.fixed);
        const index = fixedColumns.indexOf(column);
        const positionMap = this.fixedPositionMap;
        return {
          [column.fixed]: `${positionMap[column.fixed].get(index)}px`,
        };
      }
      return {};
    },
    findColumnIndex(column: TableColumnItem) {
      return this.allTableColumns.indexOf(column);
    },

    getColumnOffset(column: TableColumnItem): number {
      const columnIndex = this.findColumnIndex(column);
      return this.columnOffset[columnIndex];
    },

    getColumnsByFixed(fixed: ColumnFixedType) {
      switch (fixed) {
        case "left":
          return this.leftFixedColumns;
        case "right":
          return this.rightFixedColumns;
        default:
          return this.mainColumns;
      }
    },

    findRowIndex(key: string): number {
      const { rowKey } = this.tableOptions;
      return this.normalData.findIndex(
        (item) => getDataKey(item, rowKey) === key
      );
    },

    updateColumns(columns: TableColumnItem[]) {
      this.columnStore = columns;
    },

    clearColumns() {
      this.columnStore = [];
    },
  },
});
</script>
