<script lang="ts">
import { defineComponent, ref, reactive, inject } from "vue";
import { get, getDataKey, intersection, isEmpty } from "../utils/object";
import TableColumnItem from "./table-column-item";
import { RowItemType, RowKeyType, TableOptions, tableOptionsInjectKey } from "../common/types";
import { isSameColumn } from "./utils";

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

export default defineComponent({
  data() {
    const rowKey = ref<RowKeyType>();
    const table = ref();
    const tableOptions = inject(tableOptionsInjectKey);
    const fixedKeys = ref<string[]>([]);
    const tableData = ref<RowItemType[]>([]);
    const focusedRow = ref<RowItemType | null>(null);
    const selectedColumn = ref<TableColumnItem | null>(null);
    const normalData = ref<RowItemType[]>([]);
    const selectedRows = ref<RowItemType[]>([]);
    const sortedOption = reactive<SortedOption>({
      column: null,
      order: "nature",
    });
    return {
      rowKey,
      table,
      tableOptions,
      fixedKeys,
      tableData,
      focusedRow,
      selectedColumn,
      selectedRows,
      sortedOption,
      normalData
    };
  },

  computed: {
    fixedData(): RowItemType[] {
      const set = new Set(this.fixedKeys);
      return this.tableData.filter((dataItem) =>
        set.has(get(dataItem, this.tableOptions.rowKey))
      );
    },

    // normalData() {
    //   const set = new Set(this.fixedKeys);
    //   const data = this.tableData.filter(
    //     (dataItem) => !set.has(getDataKey(dataItem, this.tableOptions.rowKey))
    //   );
    //   console.log('-----normalData-----', this.compareDataItem(data));
      
    //   return this.compareDataItem(data);
    // },
  },

  methods: {
    compareDataItem(data: RowItemType[]) {
      const { column, order } = this.sortedOption;
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
    },

    updateData(nextData: RowItemType[]) {
      if (this.tableOptions.freezeRow) {
        this.tableData = nextData.map((item: any) => Object.freeze(item));
      } else {
        this.tableData = nextData;
      }
      console.log('-----updateData---', this.tableData);

      const set = new Set(this.fixedKeys);
      const data = this.tableData.filter(
        (dataItem) => !set.has(getDataKey(dataItem, this.tableOptions.rowKey))
      );
      
      this.normalData = this.compareDataItem(data);
      
      console.log('-----normalData-----', this.compareDataItem(data));
    },

    updateFixedKeys(keys: string[]) {
      this.fixedKeys = keys;
    },

    updateSortedOption(sortedOption: SortedOption) {
      const { column: prevColumn, order: prevOrder } = this.sortedOption;
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
      this.sortedOption = { order, column };
    },

    clearSelectedRows() {
      this.selectedRows = [];
    },

    addSelectedRows(...rows: RowItemType[]) {
      rows.forEach((item, index) => {
        if (!this.isRowSelected(item)) {
          this.selectedRows.push(item);
        }
      });
    },

    removeSelectedRows(...rows: RowItemType[]) {
      rows.forEach((item, rowIndex: number) => {
        const index = this.findSelectedRowIndex(item);
        if (index !== -1) {
          this.selectedRows.splice(index, 1);
        }
      });
    },

    updateFocusedRow(row: RowItemType) {
      this.focusedRow = row;
    },

    isRowSelected(row: RowItemType): boolean {
      return this.findSelectedRowIndex(row) >= 0;
    },

    findSelectedRowIndex(row: RowItemType): number {
      const rowDateKey = getDataKey(row, this.rowKey);
      return this.selectedRows.findIndex(
        (item) => getDataKey(item, this.rowKey) === rowDateKey
      );
    },
  },

  watch: {
    selectedRows: {
      handler() {
        if (this.table) {
          this.table.$emit("current-change", this.selectedRows);
        }
      },
    },
    tableData: {
      handler() {
        /**
         * 当数据产生变化时，需要更新selectedRows
         * 以确保current-change事件抛出数据的正确性
         * 同时将已经不存在的数据从selectedRows中清除
         */
        const selectedRowIdList = this.selectedRows.map((item) =>
          getDataKey(item, this.rowKey)
        );
        const set = new Set(selectedRowIdList);
        const nextSelectedRows = [];
        for (let i = 0; i < this.tableData.length; i += 1) {
          const item = this.tableData[i];
          if (set.has(getDataKey(item, this.rowKey))) {
            nextSelectedRows.push(item);
          }
        }
        const commonItem = intersection(this.selectedRows, nextSelectedRows);
        if (
          commonItem.size !== this.selectedRows.length ||
          commonItem.size !== nextSelectedRows.length
        ) {
          this.selectedRows = nextSelectedRows;
        }
        // FIXME: 添加focusRow的修改方法
      },
    },
  },
});
</script>
