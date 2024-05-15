
<script lang="tsx">
import { ColumnRenderProps, HeaderRenderProps } from '../common/types';

export function defaultHeaderRender(
  { options }: HeaderRenderProps,
) {
  return <span>{options.label}</span>;
}

export function checkboxHeaderRender( { tableStore }: HeaderRenderProps) {
  return <input
    class="infinite-table__cell--checkbox"
    type="checkbox"
    onInput={(e: MouseEvent) => {
      const checkbox = (e.currentTarget) as HTMLInputElement;
      if (checkbox.checked) {
        tableStore.addSelectedRows(...tableStore.tableData.slice());
      } else {
        tableStore.clearSelectedRows();
      }
    }}
  />;
}

export const checkboxColumnRender = function checkboxColumnRender(
  { row, tableStore }: ColumnRenderProps,
) {
  return (
    <div class="infinite-table__cell__content--selection"
         onClick={(evt: MouseEvent) => {
           evt.stopPropagation();
           const checked = tableStore.isRowSelected(row);
           if (!checked) {
             tableStore.addSelectedRows(row);
           } else {
             tableStore.removeSelectedRows(row);
           }
         }}
    >
      <input
        class="infinite-table__cell--checkbox"
        type='checkbox'
        checked={tableStore.isRowSelected(row)}
      />
    </div>
  );
};
</script>
