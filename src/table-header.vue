<script lang="tsx">
import {
  defineComponent,
  PropType,
  renderSlot,
  ref,
  reactive,
  inject,
} from "vue";
import { getElementOffset, overflowDetection } from "./utils/layout";
import {
  tableStoreInjectKey,
  tableOptionsInjectKey,
  TableOptions,
} from "./common/types";
// import TableStore from "@/table-store";
import TableColumnItem from "./store/table-column-item";
import NotifyMixin from "./event-emitter";
import TableConfig from "./config";

const HEADER_DRAG_DATA_TYPE: string = "headerColumnIndex".toLowerCase();

interface ResizeIndicator {
  activeIndex: number;
  startX: number;
  hover: boolean;
  visible: boolean;
  left: number;
}

export default defineComponent({
  name: "TableHeader",
  mixins: [NotifyMixin],
  data(this) {
    const tableStore = this.$parent;
    const tableOptions = inject(tableOptionsInjectKey);
    const mouseEnterIndex = ref<Number>(-1);
    const resizeIndicator = reactive<ResizeIndicator>({
      activeIndex: -1,
      startX: 0,
      hover: false,
      visible: false,
      left: -9999,
    });
    // console.log('======-+++=', test);

    return {
      resizeIndicator,
      tableStore,
      tableOptions,
      mouseEnterIndex,
    };
  },

  computed: {
    scrollElement(): HTMLElement | undefined {
      return this.$parent.$refs.scrollElement as HTMLElement;
    },
  },

  methods: {
    getTableCellClass(column: TableColumnItem, columnIndex: number) {
      const { resizeIndicator, mouseEnterIndex } = this;
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
    },

    handleMouseEnter(
      evt: MouseEvent,
      column: TableColumnItem,
      columnIndex: number
    ) {
      this.mouseEnterIndex = columnIndex;
      const { currentTarget } = evt;
      if (currentTarget && currentTarget instanceof HTMLElement) {
        const contentElement = currentTarget.querySelector(
          ".cell-content > span"
        );
        if (contentElement) {
          const overflow = overflowDetection(contentElement);
          if (overflow) {
            this.tableStore.$emit(
              "show-tooltip",
              currentTarget,
              <span>{column.label}</span>
            );
          }
        }
      }
    },

    handleMouseLeave(evt: MouseEvent) {
      this.mouseEnterIndex = -1;
      this.tableStore.$emit("hide-tooltip");
    },

    /**
     * 鼠标在单元格上按下时触发这个方法
     * @param columnIndex
     * @param event
     */
    handleMouseDown(columnIndex: number, event: MouseEvent) {
      const { headerResizable } = this.tableOptions;
      // 如果鼠标按下时，鼠标在可以resize的区域内
      if (headerResizable && this.resizeIndicator.hover) {
        this.resizeIndicator.visible = true;
        this.setResizeIndicatorPosition(event);
        this.resizeIndicator.startX = event.pageX;
        document.body.addEventListener(
          "mousemove",
          this.handleResizeIndicatorMove
        );
        document.body.addEventListener(
          "mouseup",
          this.handleResizeIndicatorMouseUp
        );
        // 处于resize状态时，禁用单击事件
        document.body.addEventListener(
          "click",
          this.stopPropagationClickEvent,
          true
        );
      }
    },

    stopPropagationClickEvent(event: MouseEvent) {
      event.stopPropagation();
      event.stopImmediatePropagation();
    },
    handleResizeIndicatorMouseUp(event: MouseEvent) {
      if (this.tableOptions.headerResizable) {
        if (this.resizeIndicator.visible) {
          const { activeIndex, startX } = this.resizeIndicator;
          const { pageX } = event;
          const activeColumn = this.tableStore.allTableColumns[activeIndex];
          let delta = pageX - startX;
          if (activeColumn.width + delta < TableConfig.minColumnWidth) {
            delta = TableConfig.minColumnWidth - activeColumn.width;
          }
          this.notify(
            "InfiniteTable",
            "column-resize",
            activeIndex,
            activeColumn,
            delta
          );
        }
        this.resizeIndicator.visible = false;
        document.body.removeEventListener(
          "mousemove",
          this.handleResizeIndicatorMove
        );
        document.body.removeEventListener(
          "mousemove",
          this.handleResizeIndicatorMouseUp
        );
        setTimeout(() => {
          document.body.removeEventListener(
            "click",
            this.stopPropagationClickEvent,
            true
          );
        });
      }
    },

    getParentScrollLeft(): number {
      if (this.scrollElement) {
        return this.scrollElement.scrollLeft;
      }
      return 0;
    },

    handleMouseMove(columnIndex: number, event: MouseEvent) {
      if (this.tableOptions.headerResizable && !this.resizeIndicator.visible) {
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
          this.resizeIndicator.hover = true;
          const activeIndex =
            right - pageX < 8 ? this.mouseEnterIndex : this.mouseEnterIndex - 1;
          this.resizeIndicator.activeIndex = activeIndex;
        } else {
          currentTarget.draggable = true;
          this.resizeIndicator.hover = false;
        }
      }
    },

    setResizeIndicatorPosition(event: MouseEvent) {
      // FIXME: 调整this.$parent.$el的调用方式
      const { left } = getElementOffset(this.$parent.$el as HTMLElement);
      this.resizeIndicator.left =
        this.getParentScrollLeft() + event.pageX - left;
    },

    handleResizeIndicatorMove(event: MouseEvent) {
      this.setResizeIndicatorPosition(event);
    },

    handleHeaderDragStart(columnIndex: number, event: DragEvent) {
      if (event.dataTransfer) {
        event.dataTransfer.setData(
          HEADER_DRAG_DATA_TYPE,
          columnIndex.toString()
        );
      }
    },

    handleHeaderDragOver(columnIndex: number, event: DragEvent) {
      if (event.dataTransfer) {
        const index = Array.from(event.dataTransfer.types).indexOf(
          HEADER_DRAG_DATA_TYPE
        );
        if (index !== -1) {
          event.preventDefault();
        }
      }
    },

    handleHeaderDragEnd() {},

    handleHeaderDrop(dropIndex: number, event: DragEvent) {
      if (!event.dataTransfer) {
        return;
      }
      const { tableStore } = this;
      const dragIndex: number = parseInt(
        event.dataTransfer.getData(HEADER_DRAG_DATA_TYPE),
        10
      );
      if (!Number.isNaN(dragIndex)) {
        const dragItem = tableStore.allTableColumns[dragIndex];
        const dropItem = tableStore.allTableColumns[dropIndex];
        this.notify(
          "InfiniteTable",
          "header-drop",
          dragIndex,
          dragItem,
          dropIndex,
          dropItem
        );
      }
    },

    getFixedStyle(column: TableColumnItem) {
      return this.tableStore.getFixedColumnStyle(column);
    },

    getActiveClass(column: TableColumnItem, order: "asc" | "desc" | "nature") {
      // FIXME: 修改order的类型
      if (!this.tableStore.sortedOption.column) {
        return false;
      }
      return (
        this.tableStore.isSameColumn(
          column,
          this.tableStore.sortedOption.column
        ) && this.tableStore.sortedOption.order === order
      );
    },

    handleColumnSort(
      column: TableColumnItem,
      order?: "asc" | "desc" | "nature"
    ) {
      // 如果column可以排序，并且TableHeader不处于resize模式中，就设置sortOption
      if (column.sortable) {
        // 排序的逻辑在tableStore中
        this.tableStore.updateSortedOption({ column, order });
        this.$nextTick(() => {
          this.notify("InfiniteTable", "sort-change", {
            column,
            order,
          });
        });
      }
    },
  },
  render() {
    const { allTableColumns, allColumnsWidth } = this.tableStore;

    return (
      <div
        class="infinite-table__table-header"
        style={{
          height: `${this.tableOptions.headerHeight}px`,
          width: `${allColumnsWidth}px`,
        }}
      >
        {allTableColumns.map((column, columnIndex) => (
          <div
            key={columnIndex}
            class={[
              "infinite-table__cell",
              this.getTableCellClass(column, columnIndex),
            ]}
            style={{
              width: `${column.width}px`,
              ...this.getFixedStyle(column),
            }}
            draggable={this.tableOptions.headerOrderDraggable}
            {...{
              on: {
                mouseenter: (evt: MouseEvent) =>
                  this.handleMouseEnter(evt, column, columnIndex),
                mouseleave: (evt: MouseEvent) => this.handleMouseLeave(evt),
                mousemove: (evt: MouseEvent) =>
                  this.handleMouseMove(columnIndex, evt),
                "!mousedown": (evt: MouseEvent) =>
                  this.handleMouseDown(columnIndex, evt),
                dragstart: (evt: DragEvent) =>
                  this.handleHeaderDragStart(columnIndex, evt),
                dragover: (evt: DragEvent) =>
                  this.handleHeaderDragOver(columnIndex, evt),
                dragend: (evt: DragEvent) => this.handleHeaderDragEnd(),
                drop: (evt: DragEvent) =>
                  this.handleHeaderDrop(columnIndex, evt),
                click: (evt: MouseEvent) => {
                  if (column.sortable) {
                    this.handleColumnSort(column);
                  } else {
                    this.notify(
                      "InfiniteTable",
                      "header-column-click",
                      column,
                      evt
                    );
                  }
                },
              },
            }}
          >
            <div class="cell-content">
              {column.headerRender(this.$createElement, {
                options: column,
                tableStore: this.tableStore,
              })}
              {column.sortable && (
                <div class="infinite-table__table-header__sortable">
                  <div
                    class={[
                      "infinite-table__sortable ascending",
                      {
                        active: this.getActiveClass(column, "asc"),
                      },
                    ]}
                    onClick={(evt: MouseEvent) => {
                      evt.stopImmediatePropagation();
                      this.handleColumnSort(column, "asc");
                    }}
                  />
                  <div
                    class={[
                      "infinite-table__sortable descending",
                      {
                        active: this.getActiveClass(column, "desc"),
                      },
                    ]}
                    onClick={(evt: MouseEvent) => {
                      evt.stopImmediatePropagation();
                      this.handleColumnSort(column, "desc");
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        {this.resizeIndicator.visible && (
          <div
            ref="resizeIndicator"
            class="infinite-table__resize-indicator"
            style={{ left: `${this.resizeIndicator.left}px` }}
          />
        )}
      </div>
    );
  },
});
</script>
