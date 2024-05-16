<!-- 此实例被 mixin 到 table.vue, 可用用this获取 table.vue 属性方法 -->
<script lang="ts">
import { defineComponent, ref } from "vue";
import { getDataKey } from "../utils/object";
import { RowItemType, RowKeyType } from "../common/types";
import TableColumnItem from "./table-column-item.vue";

export default defineComponent({
  data() {
    const table = ref();
    const focusedRow = ref<RowItemType | null>(null);
    const selectedColumn = ref<TableColumnItem | null>(null);
    const selectedRows = ref<RowItemType[]>([]);
    return {
      table,
      focusedRow,
      selectedColumn,
      selectedRows,
    };
  },

  methods: {
    clearSelectedRows() {
      this.selectedRows = [];
    },

    addSelectedRows(...rows: RowItemType[]) {
      rows.forEach((item, index) => {
        if (!this.isRowSelected(item)) {
          this.selectedRows.push(item);
        }
        if (index === rows.length - 1) {
          this.focusedRow = item;
        }
      });
    },

    removeSelectedRows(...rows: RowItemType[]) {
      rows.forEach((item) => {
        const index = this.findSelectedRowIndex(item);
        if (index !== -1) {
          this.selectedRows.splice(index, 1);
        }
      });
    },
    findSelectedRowIndex(row: RowItemType): number {
      const rowDateKey = getDataKey(row, this.rowKey);
      return this.selectedRows.findIndex(
        (item) => getDataKey(item, this.rowKey) === rowDateKey
      );
    },
    isRowSelected(row: RowItemType): boolean {
      return this.findSelectedRowIndex(row) >= 0;
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
  },
});
</script>
