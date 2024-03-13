import { Ref, watch } from "vue";
import { getDataKey } from "@/utils/object";
import { RowItemType, RowKeyType } from "@/common/types";
import emitter from "@/event-emitter";

export default function useTableSelection(
  rowKey: RowKeyType,
  focusedRow: Ref<RowItemType | null>,
  selectedRows: Ref<RowItemType[]>
) {

  const clearSelectedRows = () => {
    selectedRows.value = [];
  };
  
  const addSelectedRows = (...rows: RowItemType[]) => {
    rows.forEach((item, index) => {
      if (!isRowSelected(item)) {
        selectedRows.value.push(item);
      }
      if (index === rows.length - 1) {
        focusedRow.value = item;
      }
    });
  };
  
  const removeSelectedRows = (...rows: RowItemType[]) => {
    rows.forEach((item) => {
      const index = findSelectedRowIndex(item);
      if (index !== -1) {
        selectedRows.value.splice(index, 1);
      }
    });
  };
  
  watch(selectedRows, () => {
    emitter.emit('current-change', selectedRows.value);
  }, { deep: true });
  
  const findSelectedRowIndex = (row: RowItemType): number => {
    const rowDateKey = getDataKey(row, rowKey);
    return selectedRows.value.findIndex(
      (item) => getDataKey(item, rowKey) === rowDateKey
    );
  };
  
  const isRowSelected = (row: RowItemType): boolean => {
    return findSelectedRowIndex(row) >= 0;
  };

  return {
    clearSelectedRows,
    removeSelectedRows,
    addSelectedRows
  }
}

