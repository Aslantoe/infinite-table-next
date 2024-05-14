<script lang="ts">
import { defineComponent, ref } from "vue";
import { getDataKey } from "../utils/object";
import { RowItemType, RowKeyType } from "../common/types";
import TableColumnItem from "./table-column-item.vue";

export default defineComponent({
  data(this, vm) {
    const table = ref();
    const rowKey = ref<RowKeyType>();
    const focusedRow = ref<RowItemType | null>(null);
    const selectedColumn = ref<TableColumnItem | null>(null);
    const selectedRows = ref<RowItemType[]>([]);

    return {
      table,
      rowKey,
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
