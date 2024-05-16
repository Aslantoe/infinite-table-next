<script lang="tsx">
import { defineComponent, ref, reactive, inject, h } from "vue";
import { getElementOffset, overflowDetection } from "./utils/layout";
import TableColumnItem from "./store/table-column-item";
import NotifyMixin from "./event-emitter.vue";
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
  data() {
    const tableStore = this.$parent;
    const tableOptions = this.$parent.tableOptions;
    const mouseEnterIndex = ref<Number>(-1);
    // 列宽拖动指示器
    const resizeIndicator = reactive<ResizeIndicator>({
      activeIndex: -1,
      startX: 0,
      hover: false,
      visible: false,
      left: -9999,
    });
    return {
      resizeIndicator,
      tableStore,
      tableOptions,
      mouseEnterIndex,
    };
  },

  computed: {
    // table.vue 中 ref="scrollElement
    scrollElement(): HTMLElement | undefined {
      return this.$parent.$refs.scrollElement as HTMLElement;
    },
  },

  methods: {
    /**
     * 设置表头样式
     */
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
    /**
     * 鼠标进入表头
     * @param evt
     * @param column
     * @param columnIndex
     */
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
    /**
     * 列宽设置
     * @param event
     */
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

    /**
     * 鼠标在表头内移动触发
     * @param columnIndex
     * @param event
     */
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
    /**
     * 列排序
     * @param column 
     * @param order 
     */
    handleColumnSort(
      column: TableColumnItem,
      order?: "asc" | "desc" | "nature"
    ) {
      // 如果column可以排序，并且TableHeader不处于resize模式中，就设置sortOption
      if (column.sortable) {
        // 排序的逻辑在table-data-store中
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
            onmouseenter={(evt: MouseEvent) =>
              this.handleMouseEnter(evt, column, columnIndex)
            }
            onmouseleave={(evt: MouseEvent) => this.handleMouseLeave(evt)}
            onmousemove={(evt: MouseEvent) =>
              this.handleMouseMove(columnIndex, evt)
            }
            onmousedown={(evt: MouseEvent) =>
              this.handleMouseDown(columnIndex, evt)
            }
            ondragstart={(evt: DragEvent) =>
              this.handleHeaderDragStart(columnIndex, evt)
            }
            ondragover={(evt: DragEvent) =>
              this.handleHeaderDragOver(columnIndex, evt)
            }
            ondragend={(evt: DragEvent) => this.handleHeaderDragEnd()}
            ondrop={(evt: DragEvent) => this.handleHeaderDrop(columnIndex, evt)}
            onClick={(evt: MouseEvent) => {
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
            }}
          >
            <div class="cell-content">
              {column.headerRender(h, {
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
