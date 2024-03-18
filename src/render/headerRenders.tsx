import { h, VNode, inject } from "vue";
import { ColumnRenderProps, HeaderRenderProps, tableOptionsInjectKey } from "@/common/types";
import useTableStore from "@/table-store";

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
  const tableOptions: any = inject(tableOptionsInjectKey);
  const { addSelectedRows, clearSelectedRows, tableData } = useTableStore(tableOptions, 'id', 'header-render')
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
  const tableOptions: any = inject(tableOptionsInjectKey);
  const { addSelectedRows, removeSelectedRows, isRowSelected } = useTableStore(tableOptions, 'id', 'header-render')
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
