import { defineComponent, h, inject, nextTick, onMounted, PropType } from "vue";
import { getElementOffset, overflowDetection } from "@/utils/layout";
import {
  tableStoreInjectKey,
  tableOptionsInjectKey,
  TableOptions,
} from "@/common/types";
import TableColumnItem from "@/hooks/useTableColumnItemHooks";
import useTableStore from "@/table-store";
import useTableColumn from "./hooks/useTbaleColumnHooks";
import useTableData from "./hooks/useTableDataHooks";
import TableConfig from "@/config";
import emitter from "@/event-emitter";

const HEADER_DRAG_DATA_TYPE: string = "headerColumnIndex".toLowerCase();

interface ResizeIndicator {
  activeIndex: number;
  startX: number;
  hover: boolean;
  visible: boolean;
  left: number;
}

const TableHeader = defineComponent({
  props: {
    tableColumns: {
      type: Array as PropType<TableColumnItem[]>,
      required: true,
      default: () => [],
    },
  },
  setup(props) {
    // const tableStore: any = inject(tableStoreInjectKey);
    // @ts-ignore
    const tableOptions: TableOptions = inject(tableOptionsInjectKey);
    // const { sortedOption, updateSortedOption } = useTableData();
    // const { allTableColumns, getFixedColumnStyle, allColumnsWidth } = useTableColumn();
    const {
      _isSameColumn,
      allTableColumns,
      getFixedColumnStyle,
      allColumnsWidth,
      sortedOption,
      updateSortedOption
    } = useTableStore(tableOptions, 'id', 'table-header');
    let mouseEnterIndex: number = -1;
    console.log("tableHeader", props.tableColumns);

    onMounted(() => {
      console.log(45454545, props.tableColumns);
    });

    const resizeIndicator: ResizeIndicator = {
      activeIndex: -1,
      startX: 0,
      hover: false,
      visible: false,
      left: -9999,
    };

    const scrollElement = ($parent): HTMLElement | undefined => {
      return $parent.$refs.scrollElement as HTMLElement;
    };

    const getTableCellClass = (
      column: TableColumnItem,
      columnIndex: number
    ) => {
      const isCurrentIndex =
        mouseEnterIndex === columnIndex || mouseEnterIndex - 1 === columnIndex;
      return {
        "infinite-table__cell--fixed": column.fixed,
        "infinite-table__cell--pointer":
          column.sortable && !resizeIndicator.hover,
        "infinite-table__cell--resizeable":
          resizeIndicator.hover && isCurrentIndex,
        hover: !resizeIndicator.visible && isCurrentIndex,
      };
    };

    /**
     * 处理鼠标进入事件
     * @param evt
     * @param column
     * @param columnIndex
     */
    const handleMouseEnter = (
      evt: MouseEvent,
      column: TableColumnItem,
      columnIndex: number
    ) => {
      console.log("handleMouseEnter");

      mouseEnterIndex = columnIndex;
      const { currentTarget } = evt;
      if (currentTarget && currentTarget instanceof HTMLElement) {
        const contentElement = currentTarget.querySelector(
          ".cell-content > span"
        );
        if (contentElement) {
          const overflow = overflowDetection(contentElement);
          if (overflow) {
            emitter.emit("show-tooltip", {
              curTarget: currentTarget,
              content: <span>{column.label}</span>,
            });
          }
        }
      }
    };

    const handleMouseLeave = (evt: MouseEvent) => {
      mouseEnterIndex = -1;
      emitter.emit("hide-tooltip");
    };

    /**
     * 鼠标在单元格上按下时触发这个方法
     * @param columnIndex
     * @param event
     */
    const handleMouseDown = (columnIndex: number, event: MouseEvent) => {
      const { headerResizable } = tableOptions;
      // 如果鼠标按下时，鼠标在可以resize的区域内
      if (headerResizable && resizeIndicator.hover) {
        resizeIndicator.visible = true;
        setResizeIndicatorPosition(event);
        resizeIndicator.startX = event.pageX;
        document.body.addEventListener("mousemove", handleResizeIndicatorMove);
        document.body.addEventListener("mouseup", handleResizeIndicatorMouseUp);
        // 处于resize状态时，禁用单击事件
        document.body.addEventListener(
          "click",
          stopPropagationClickEvent,
          true
        );
      }
    };

    const stopPropagationClickEvent = (event: MouseEvent) => {
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    const handleResizeIndicatorMouseUp = (event: MouseEvent) => {
      if (tableOptions.headerResizable) {
        if (resizeIndicator.visible) {
          const { activeIndex, startX } = resizeIndicator;
          const { pageX } = event;
          const activeColumn = props.tableColumns[activeIndex];
          let delta = pageX - startX;
          if (activeColumn.width + delta < TableConfig.minColumnWidth) {
            delta = TableConfig.minColumnWidth - activeColumn.width;
          }
          emitter.emit("InfiniteTable", {
            e: "column-resize",
            activeIndex,
            activeColumn,
            delta,
          });
        }
        resizeIndicator.visible = false;
        document.body.removeEventListener(
          "mousemove",
          handleResizeIndicatorMove
        );
        document.body.removeEventListener(
          "mousemove",
          handleResizeIndicatorMouseUp
        );
        setTimeout(() => {
          document.body.removeEventListener(
            "click",
            stopPropagationClickEvent,
            true
          );
        });
      }
    };

    const getParentScrollLeft = (): number => {
      if (scrollElement) {
        return scrollElement.scrollLeft;
      }
      return 0;
    };

    const handleMouseMove = (columnIndex: number, event: MouseEvent) => {
      if (tableOptions.headerResizable && !resizeIndicator.visible) {
        const { currentTarget, pageX } = event;
        // FIXME: 研究currentTarget为空时的逻辑
        if (!(currentTarget instanceof HTMLElement)) {
          return;
        }
        const { left } = getElementOffset(currentTarget);
        const right = left + currentTarget.offsetWidth;
        // 判断是否靠近右侧边缘或者 靠近左侧边缘且不是第一个
        if (right - pageX < 8 || (pageX - left < 8 && columnIndex > 0)) {
          currentTarget.draggable = false;
          resizeIndicator.hover = true;
          const activeIndex =
            right - pageX < 8 ? mouseEnterIndex : mouseEnterIndex - 1;
          resizeIndicator.activeIndex = activeIndex;
        } else {
          currentTarget.draggable = true;
          resizeIndicator.hover = false;
        }
      }
    };

    const setResizeIndicatorPosition = (event: MouseEvent) => {
      // FIXME: 调整$parent.$el的调用方式
      const { left } = getElementOffset($parent.$el as HTMLElement);
      resizeIndicator.left = getParentScrollLeft() + event.pageX - left;
    };

    const handleResizeIndicatorMove = (event: MouseEvent) => {
      setResizeIndicatorPosition(event);
    };

    const handleHeaderDragStart = (columnIndex: number, event: DragEvent) => {
      if (event.dataTransfer) {
        event.dataTransfer.setData(
          HEADER_DRAG_DATA_TYPE,
          columnIndex.toString()
        );
      }
    };

    const handleHeaderDragOver = (columnIndex: number, event: DragEvent) => {
      if (event.dataTransfer) {
        const index = Array.from(event.dataTransfer.types).indexOf(
          HEADER_DRAG_DATA_TYPE
        );
        if (index !== -1) {
          event.preventDefault();
        }
      }
    };

    const handleHeaderDragEnd = () => {};

    const handleHeaderDrop = (dropIndex: number, event: DragEvent) => {
      if (!event.dataTransfer) {
        return;
      }
      const dragIndex: number = parseInt(
        event.dataTransfer.getData(HEADER_DRAG_DATA_TYPE),
        10
      );
      if (!Number.isNaN(dragIndex)) {
        const dragItem = props.tableColumns[dragIndex];
        const dropItem = props.tableColumns[dropIndex];
        emitter.emit("InfiniteTable", {
          e: "header-drop",
          dragIndex,
          dragItem,
          dropIndex,
          dropItem,
        });
      }
    };

    const getFixedStyle = (column: TableColumnItem) => {
      return getFixedColumnStyle(column);
    };

    const getActiveClass = (
      column: TableColumnItem,
      order: "asc" | "desc" | "nature"
    ) => {
      // FIXME: 修改order的类型
      if (!sortedOption.value.column) {
        return false;
      }
      return (
        _isSameColumn(column, sortedOption.value.column) &&
        sortedOption.value.order === order
      );
    };

    const handleColumnSort = (
      column: TableColumnItem,
      order?: "asc" | "desc" | "nature"
    ) => {
      // 如果column可以排序，并且TableHeader不处于resize模式中，就设置sortOption
      if (column.sortable) {
        // 排序的逻辑在tableStore中
        updateSortedOption({ column, order });
        nextTick(() => {
          emitter.emit("InfiniteTable", {
            e: "sort-change",
            column,
            order,
          });
        });
      }
    };

    return () => (
      <div
        class="infinite-table__table-header"
        style={{
          height: `${tableOptions.headerHeight}px`,
          width: `${allColumnsWidth.value}px`,
        }}
      >
        {props.tableColumns.map((column, columnIndex) => {
          return (
            <div
              id="head-id"
              key={columnIndex}
              class={getTableCellClass(column, columnIndex)}
              style={{ width: `${column.width}px`, ...getFixedStyle(column) }}
              draggable={tableOptions.headerOrderDraggable}
              staticClass="infinite-table__cell"
              onmouseenter={(evt: MouseEvent) =>
                handleMouseEnter(evt, column, columnIndex)
              }
              onmouseleave={(evt: MouseEvent) => handleMouseLeave(evt)}
              onmousemove={(evt: MouseEvent) =>
                handleMouseMove(columnIndex, evt)
              }
              // "!mousedown": (evt: MouseEvent) => handleMouseDown(columnIndex, evt),
              ondragstart={(evt: DragEvent) =>
                handleHeaderDragStart(columnIndex, evt)
              }
              ondragover={(evt: DragEvent) =>
                handleHeaderDragOver(columnIndex, evt)
              }
              ondragend={(evt: DragEvent) => handleHeaderDragEnd()}
              ondrop={(evt: DragEvent) => handleHeaderDrop(columnIndex, evt)}
              onClick={(evt: MouseEvent) => {
                if (column.sortable) {
                  handleColumnSort(column);
                } else {
                  emitter.emit("InfiniteTable", {
                    e: "header-column-click",
                    column,
                    evt,
                  });
                }
              }}
            >
              <div class="cell-content">
                {column.headerRender(h, {
                  options: column,
                  tableStore: typeof useTableStore,
                })}
                {column.sortable && (
                  <div class="infinite-table__table-header__sortable">
                    <div
                      class={{
                        active: getActiveClass(column, "asc"),
                      }}
                      staticClass="infinite-table__sortable ascending"
                      onClick={(evt: MouseEvent) => {
                        evt.stopImmediatePropagation();
                        handleColumnSort(column, "asc");
                      }}
                    />
                    <div
                      class={{
                        active: getActiveClass(column, "desc"),
                      }}
                      staticClass="infinite-table__sortable descending"
                      onClick={(evt: MouseEvent) => {
                        evt.stopImmediatePropagation();
                        handleColumnSort(column, "desc");
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {resizeIndicator.visible && (
          <div
            ref="resizeIndicator"
            class="infinite-table__resize-indicator"
            style={{ left: `${resizeIndicator.left}px` }}
          />
        )}
      </div>
    );
  },
});

export default TableHeader;
