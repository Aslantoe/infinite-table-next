import { h, VNode } from "vue";
import { ColumnRenderProps, HeaderRenderProps } from "@/common/types";

export function defaultHeaderRender({ options }: HeaderRenderProps): VNode {
  return h("span", null, options.label);
}
/**
 * header checkbox
 */
export function checkboxHeaderRender({ tableStore }: HeaderRenderProps): VNode {
  return h("input", {
    class: "infinite-table__cell--checkbox",
    type: "checkbox",
    onInput: (e: MouseEvent) => {
      const checkbox = e.currentTarget as HTMLInputElement;
      if (checkbox.checked) {
        tableStore.addSelectedRows(...tableStore.tableData.slice());
      } else {
        tableStore.clearSelectedRows();
      }
    },
  });
}

/**
 * column checkbox
 */
export const checkboxColumnRender = function checkboxColumnRender({
  row,
  tableStore,
}: ColumnRenderProps) {
  return h(
    "div",
    {
      class: "infinite-table__cell__content--selection",
      onclick: (evt: MouseEvent) => {
        evt.stopPropagation();
        const checked = tableStore.isRowSelected(row);
        if (!checked) {
          tableStore.addSelectedRows(row);
        } else {
          tableStore.removeSelectedRows(row);
        }
      },
    },
    h("input", {
      class: "infinite-table__cell--checkbox",
      type: "checkbox",
      checked: tableStore.isRowSelected(row),
    })
  );
};
