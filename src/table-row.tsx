import { defineComponent, PropType, inject, h, onMounted } from "vue";
import emitter from "@/event-emitter";
import TableColumnItem, { ColumnRender } from "@/hooks/useTableColumnItemHooks";
import {
  tableOptionsInjectKey,
  tableStoreInjectKey,
  ElementExtraAttrs,
  RowItemType,
  TableOptions,
} from "@/common/types";
import useTableStore from "@/table-store";
import useTableData from "@/hooks/useTableDataHooks";
import { overflowDetection } from "@/utils/layout";
import RangeRender from "@/render/range-render.vue";
import useTableColumn from "@/hooks/useTbaleColumnHooks";

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
/**
 * table-row 组件
 */

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
    // const tableStore: any = inject(tableStoreInjectKey);
    const tableOptions: any = inject(tableOptionsInjectKey);

    const {
      isSameRow,
      _isSameColumn,
      layoutSize,
      getFixedColumnStyle,
      leftFixedColumns,
      rightFixedColumns,
      mainColumns,
      leftFixedColumnWidth,
      rightFixedColumnWidth,
      allColumnsWidth,
      isRowSelected, selectedColumn, focusedRow
    } = useTableStore(tableOptions, 'id', 'table-row');
    // const { isRowSelected, selectedColumn, focusedRow } = useTableData();
    // const {
    //   getFixedColumnStyle,
    //   leftFixedColumns,
    //   rightFixedColumns,
    //   mainColumns,
    //   leftFixedColumnWidth,
    //   rightFixedColumnWidth,
    //   allColumnsWidth,
    // } = useTableColumn();


    onMounted(() => {
      console.log('row---', props.data, props.index, props.offsetX);
      console.log('mainColumns', mainColumns.value);
      
    })

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
      const rowSelected = isRowSelected(rowItem);
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
    /**
     * 鼠标离开单元格，隐藏tooltip
     */
    const handleMouseLeaveCell = () => {
      emitter.emit("hide-tooltip");
    };
    /**
     * 鼠标进入单元格事件
     * @param data
     * @param column
     * @param event
     */
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
                tableStore: useTableStore,
              })
            ) : (
              <span>{contentElement?.textContent}</span>
            );
            emitter.emit("show-tooltip", {
              currentTarget: currentTarget,
              vnode: vnode,
              data: column.tooltipWrapperClass(data),
            });
          }
        }
      }
    };

    const getFixedStyle = (column: TableColumnItem) => {
      return getFixedColumnStyle(column);
    };

    const dispatchRowEvent = (
      eventName: string,
      data: any,
      column: TableColumnItem,
      e: MouseEvent,
      rowIndex: number
    ) => {
      emitter.emit(eventName, {
        data: data,
        column: column,
        event: e,
        rowIndex: rowIndex,
      });
    };

    const renderColumnCell = (
      columnRender: ColumnRender,
      data: RowItemType,
      columnItem: TableColumnItem,
      index: number,
      tableStore: typeof useTableStore
    ) => {
      try {
        // @ts-ignore
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
      const { highlightCurrentCell, rowHeight } = tableOptions;
      const { data: columnOption } = prop;
      const { columnRender } = columnOption;
      const cellSelected =
        highlightCurrentCell &&
        selectedColumn.value &&
        focusedRow.value &&
        _isSameColumn(selectedColumn.value, columnOption) && // FIXME: 研究这俩接口是否有存在的必要
        isSameRow(props.data, focusedRow.value);
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
      return () => (
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
              useTableStore
            )}
          </div>
        </div>
      );
    };

    const extraAttrs = getExtraRowAttrs(props.data, props.index);
    return () => (
      <div
        class={extraAttrs.class}
        staticClass="infinite-table__row"
        draggable={tableOptions.rowDraggable}
        {...{
          style: {
            ...extraAttrs.style,
            width: `${allColumnsWidth}px`,
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
        {leftFixedColumns.value.map((column) =>
          renderTableCell({ data: column })
        )}
        <h1>{props.data?.name}</h1>
        <RangeRender
          style={{ width: `${allColumnsWidth.value}px` }}
          dataKey={(item: TableColumnItem) => item.key}
          data={mainColumns.value}
          direction="horizontal"
          sizeField="width"
          offset={props.offsetX}
          viewportSize={
            layoutSize.value.viewportWidth -
            leftFixedColumnWidth.value -
            rightFixedColumnWidth.value
          }
          v-slots={{ default: () => renderTableCell }}
        />
        {rightFixedColumns.value.map((column) =>
          renderTableCell({ data: column })
        )}
      </div>
    );
  },
});

export default TableRow;
