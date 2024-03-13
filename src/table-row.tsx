import { defineComponent, PropType, inject, h } from "vue";
import emitter from "@/event-emitter";
import TableColumnItem, { ColumnRender } from "@/hooks/useTableColumnItemHooks";
import {
  tableOptionsInjectKey,
  tableStoreInjectKey,
  ElementExtraAttrs,
  RowItemType,
  TableOptions,
} from "@/common/types";
import TableStore from "@/table-store";
import { overflowDetection } from "@/utils/layout";
import RangeRender from "./render/range-render.vue";

function normalizeClass(
  classObj: string | { [key: string]: boolean } | string[]
): { [key: string]: boolean } {
  if (typeof classObj === "string") {
    // eslint-disable-next-line no-param-reassign
    classObj = classObj.split(/\s+/).filter((item) => !!item);
  }
  if (Array.isArray(classObj)) {
    return classObj.reduce((obj, key) => {
      // eslint-disable-next-line no-param-reassign
      obj[key] = true;
      return obj;
    }, {} as { [key: string]: boolean });
  }
  return classObj;
}

const TableRow = defineComponent({
  props: {
    index: {
      type: Number,
      required: true,
    },
    data: {
      type: Object as PropType<RowItemType>,
      required: true,
    },
    offsetX: {
      type: Number,
      default: 0,
    },
  },

  setup(props) {
    const tableStore: any = inject(tableStoreInjectKey);

    const tableOptions: any = inject(tableOptionsInjectKey);

    let dragoverColumnItem: TableColumnItem;

    const getExtraRowAttrs = (
      rowItem: RowItemType,
      index: number
    ): ElementExtraAttrs => {
      const { striped, rowExtraAttrs, highlightCurrentRow } = tableOptions;

      const extraAttrs =
        typeof rowExtraAttrs === "function"
          ? rowExtraAttrs(rowItem, index)
          : rowExtraAttrs;
      // FIXME: 修改判断行是否选中的方法
      const rowSelected = tableStore.isRowSelected(rowItem);
      return {
        style: {
          ...extraAttrs.style,
        },
        class: {
          ...normalizeClass(extraAttrs.class),
          "infinite-table__row--striped": striped && index % 2 === 1,
          "infinite-table__row--selected": highlightCurrentRow && rowSelected,
        },
        attrs: {
          ...extraAttrs.attrs,
        },
      };
    };

    const handleMouseLeaveCell = () => {
      tableStore.$emit("hide-tooltip");
    };

    const handleMouseEnterCell = (
      data: any,
      column: TableColumnItem,
      event: MouseEvent
    ) => {
      const { currentTarget } = event;
      if (
        column.tooltipTrigger !== false &&
        currentTarget &&
        currentTarget instanceof HTMLElement
      ) {
        const contentElement = currentTarget.querySelector(".cell-content");
        if (contentElement) {
          const overflow = overflowDetection(contentElement);
          if (column.tooltipTrigger === "always" || overflow) {
            const vnode = column.tooltipRender ? (
              column.tooltipRender(h, {
                row: data,
                options: column,
                rowIndex: props.index,
                tableStore: tableStore,
              })
            ) : (
              <span>{contentElement?.textContent}</span>
            );
            tableStore.$emit(
              "show-tooltip",
              currentTarget,
              vnode,
              column.tooltipWrapperClass(data)
            );
          }
        }
      }
    };

    const getFixedStyle = (column: TableColumnItem) => {
      return tableStore.getFixedColumnStyle(column);
    };

    const dispatchRowEvent = (
      eventName: string,
      data: any,
      column: TableColumnItem,
      e: MouseEvent,
      rowIndex: number
    ) => {

      NotifyMixin.notify("InfiniteTable", eventName, data, column, e, rowIndex);
    };

    const renderColumnCell = (
      columnRender: ColumnRender,
      data: RowItemType,
      columnItem: TableColumnItem,
      index: number,
      tableStore: typeof TableStore
    ) => {
      try {
        return columnRender.call(h, {
          row: data,
          options: columnItem,
          rowIndex: index,
          tableStore,
        });
      } catch (e: any) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("渲染单元格时发生错误");
        }
        console.error(e.stack);
        return null;
      }
    };

    const renderTableCell = (prop: { data: TableColumnItem }) => {
      const { focusedRow, selectedColumn } = tableStore;
      const { highlightCurrentCell, rowHeight } = tableOptions;
      const { data: columnOption } = prop;
      const { columnRender } = columnOption;
      const cellSelected =
        highlightCurrentCell &&
        selectedColumn &&
        focusedRow &&
        tableStore.isSameColumn(selectedColumn, columnOption) && // FIXME: 研究这俩接口是否有存在的必要
        tableStore.isSameRow(props.data, focusedRow);
      let extraAttrs: ElementExtraAttrs = {};
      if (columnOption.columnExtraAttrs) {
        extraAttrs = columnOption.columnExtraAttrs(
          props.data,
          columnOption,
          props.index
        );
      }
      const cellClassNames = {
        "infinite-table__cell--selected": cellSelected,
        "infinite-table__cell--fixed": !!columnOption.fixed,
        "fixed-left": columnOption.fixed === "left",
        "fixed-right": columnOption.fixed === "right",
        ...normalizeClass(extraAttrs.class),
      };
      return (
        <div
          class={cellClassNames}
          staticClass="infinite-table__cell infinite-table__cell--ellipsis"
          {...{
            attrs: extraAttrs.attrs,
            style: {
              width: `${columnOption.width}px`,
              height: `${rowHeight}px`,
              ...getFixedStyle(columnOption),
              ...extraAttrs.style,
            },
            on: {
              click: (evt: MouseEvent) => {
                dispatchRowEvent(
                  "cell-click",
                  props.data,
                  columnOption,
                  evt,
                  props.index
                );
                dispatchRowEvent(
                  "row-click",
                  props.data,
                  columnOption,
                  evt,
                  props.index
                );
              },
              contextmenu: (evt: MouseEvent) => {
                dispatchRowEvent(
                  "row-contextmenu",
                  props.data,
                  columnOption,
                  evt,
                  props.index
                );
              },
              dblclick: (evt: MouseEvent) => {
                dispatchRowEvent(
                  "row-dblclick",
                  props.data,
                  columnOption,
                  evt,
                  props.index
                );
              },
              dragover: (e: DragEvent) => {
                dragoverColumnItem = columnOption;
              },
              mouseenter: (evt: MouseEvent) =>
                handleMouseEnterCell(props.data, columnOption, evt),
              mouseleave: (evt: MouseEvent) => handleMouseLeaveCell(),
            },
          }}
        >
          <div class="cell-content">
            {renderColumnCell(
              columnRender,
              props.data,
              columnOption,
              props.index,
              tableStore
            )}
          </div>
        </div>
      );
    };

    const { layoutSize } = tableStore;
    const {
      leftFixedColumns,
      rightFixedColumns,
      mainColumns,
      leftFixedColumnWidth,
      rightFixedColumnWidth,
    } = tableStore;

    const extraAttrs = getExtraRowAttrs(props.data, props.index);
    return (
      <div
        class={extraAttrs.class}
        staticClass="infinite-table__row"
        draggable={tableOptions.rowDraggable}
        {...{
          style: {
            ...extraAttrs.style,
            width: `${tableStore.allColumnsWidth}px`,
            height: `${tableOptions.rowHeight}px`,
          },
          attrs: extraAttrs.attrs,
          on: {
            dragstart: (evt: DragEvent) => {
              // 避免table-body再次触发相同类型的事件（例如dnd相关的事件)
              evt.stopPropagation();
              dispatchRowEvent(
                "row-dragstart",
                props.data,
                dragoverColumnItem as any,
                evt,
                props.index
              );
            },
            dragend: (evt: DragEvent) => {
              evt.stopPropagation();
              dispatchRowEvent(
                "row-dragend",
                props.data,
                dragoverColumnItem as any,
                evt,
                props.index
              );
            },
            dragover: (evt: DragEvent) => {
              evt.stopPropagation();
              dispatchRowEvent(
                "row-dragover",
                props.data,
                dragoverColumnItem as any,
                evt,
                props.index
              );
            },
            drop: (evt: DragEvent) => {
              evt.stopPropagation();
              dispatchRowEvent(
                "row-drop",
                props.data,
                dragoverColumnItem as any,
                evt,
                props.index
              );
            },
          },
        }}
      >
        {leftFixedColumns.map((column) => renderTableCell({ data: column }))}
        <RangeRender
            style={{ width: `${tableStore.allColumnsWidth}px` }}
            dataKey={(item: TableColumnItem) => item.key}
            data={mainColumns}
            direction="horizontal"
            sizeField="width"
            offset={props.offsetX}
            viewportSize={layoutSize.viewportWidth - leftFixedColumnWidth - rightFixedColumnWidth}
            {
              ...{
                scopedSlots: {
                  default: renderTableCell,
                },
              }
            }
          />
        {rightFixedColumns.map((column) => renderTableCell({ data: column }))}
      </div>
    );
  },
});

export default TableRow;
