import { h, VNode } from "vue";
import { ColumnRenderProps, HeaderRenderProps } from "@/common/types";
import useTableData  from "@/hooks/useTableDataHooks"

const { addSelectedRows, clearSelectedRows, removeSelectedRows, isRowSelected, tableData } = useTableData()

export function defaultHeaderRender(
  _h: typeof h,
  { options }: HeaderRenderProps,
): VNode {
  return <span>{options.label}</span>;
}
/**
 * header checkbox
 */
export function checkboxHeaderRender(_h: typeof h, { tableStore }: HeaderRenderProps): VNode {
  return <input
    class="infinite-table__cell--checkbox"
    type="checkbox"
    onInput={(e: MouseEvent) => {
      const checkbox = (e.currentTarget) as HTMLInputElement;
      if (checkbox.checked) {
        addSelectedRows(tableData.value.slice());
      } else {
        clearSelectedRows();
      }
    }}
  />;
}

/**
 * column checkbox
 */
export const checkboxColumnRender = function checkboxColumnRender(
  _h: typeof h,
  { row, tableStore }: ColumnRenderProps,
) {
  return (
    <div class="infinite-table__cell__content--selection"
         onClick={(evt: MouseEvent) => {
           evt.stopPropagation();
           const checked = isRowSelected(row);
           if (!checked) {
             addSelectedRows(row);
           } else {
             removeSelectedRows(row);
           }
         }}
    >
      <input
        class="infinite-table__cell--checkbox"
        type='checkbox'
        checked={isRowSelected(row)}
      />
    </div>
  );
};
