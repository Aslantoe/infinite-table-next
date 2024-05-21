<script lang="tsx">
import { defineComponent, ref, h, PropType } from "vue";
import RangeRender from "./render/range-render.vue";
import NotifyMixin from "./event-emitter.vue";
import TableColumnItem, { ColumnRender } from "./store/table-column-item";
import { ElementExtraAttrs, RowItemType } from "./common/types";
import { overflowDetection } from "./utils/layout";
import { eventBus } from "./eventBus";

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

export default defineComponent({
  name: "TableRow",
  mixins: [NotifyMixin],
  components: { RangeRender },
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
  data() {
    const tableStore = this.$parent?.$parent?.$parent;
    // @ts-ignore
    const tableOptions = this.$parent?.$parent?.$parent.tableOptions;
    const dragoverColumnItem = ref<TableColumnItem>();
    return {
      tableStore,
      tableOptions,
      dragoverColumnItem,
    };
  },

  methods: {
    getExtraRowAttrs(rowItem: RowItemType, index: number): ElementExtraAttrs {
      const { striped, rowExtraAttrs, highlightCurrentRow } = this.tableOptions;
      const tableStore = this.tableStore;
      const extraAttrs =
        typeof rowExtraAttrs === "function"
          ? rowExtraAttrs(rowItem, index)
          : rowExtraAttrs;
      // FIXME: 修改判断行是否选中的方法
      // @ts-ignore
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
    },
    /**
     * 鼠标离开单元格
     */
    handleMouseLeaveCell() {
      eventBus.emit("hide-tooltip");
    },

    /**
     * 鼠标进入表格单元
     * @param data
     * @param column
     * @param event
     */
    handleMouseEnterCell(
      data: any,
      column: TableColumnItem,
      event: MouseEvent
    ) {
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
                rowIndex: this.index,
                // @ts-ignore
                tableStore: this.tableStore,
              })
            ) : (
              <span>{contentElement?.textContent}</span>
            );
            eventBus.emit("show-tooltip", {
              element: currentTarget,
              textVNode: vnode,
              wrapperClass: column.tooltipWrapperClass(data),
            });
          }
        }
      }
    },

    getFixedStyle(column: TableColumnItem) {
      // @ts-ignore
      return this.tableStore.getFixedColumnStyle(column);
    },
    /**
     * 事件派发
     * @param eventName 
     * @param data 
     * @param column 
     * @param e 
     * @param rowIndex 
     */
    dispatchRowEvent(
      eventName: string,
      data: any,
      column: TableColumnItem,
      e: MouseEvent,
      rowIndex: number
    ) {
      eventBus.emit(eventName, {data, column, e, rowIndex});
      this.notify("InfiniteTable", eventName, data, column, e, rowIndex);
    },

    renderColumnCell(
      columnRender: ColumnRender,
      data: RowItemType,
      columnItem: TableColumnItem,
      index: number,
      tableStore: any
    ) {
      try {
        return columnRender.call(this, h, {
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
    },
    /**
     * 单元格视图
     */
    renderTableCell(props: { data: TableColumnItem }) {
      const { data, tableStore, index } = this;
      // @ts-ignore
      const { focusedRow, selectedColumn } = tableStore;
      const { highlightCurrentCell, rowHeight } = this.tableOptions;
      const { data: columnOption } = props;
      const { columnRender } = columnOption;
      const cellSelected =
        highlightCurrentCell &&
        selectedColumn &&
        focusedRow &&
        // @ts-ignore
        tableStore.isSameColumn(selectedColumn, columnOption) && // FIXME: 研究这俩接口是否有存在的必要
        // @ts-ignore
        tableStore.isSameRow(data, focusedRow);
      let extraAttrs: ElementExtraAttrs = {};
      if (columnOption.columnExtraAttrs) {
        extraAttrs = columnOption.columnExtraAttrs(data, columnOption, index);
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
          class={[
            "infinite-table__cell infinite-table__cell--ellipsis",
            cellClassNames,
          ]}
          style={{
            width: `${columnOption.width}px`,
            height: `${rowHeight}px`,
            ...this.getFixedStyle(columnOption),
            ...extraAttrs.style,
          }}
          attrs={{ ...extraAttrs.attrs }}
          onclick={(evt: MouseEvent) => {
            this.dispatchRowEvent(
              "cell-click",
              data,
              columnOption,
              evt,
              this.index
            );
            this.dispatchRowEvent(
              "row-click",
              data,
              columnOption,
              evt,
              this.index
            );
          }}
          oncontextmenu={(evt: MouseEvent) => {
            this.dispatchRowEvent(
              "row-contextmenu",
              data,
              columnOption,
              evt,
              this.index
            );
          }}
          ondblclick={(evt: MouseEvent) => {
            this.dispatchRowEvent(
              "row-dblclick",
              data,
              columnOption,
              evt,
              this.index
            );
          }}
          ondragover={(_e: DragEvent) => {
            this.dragoverColumnItem = columnOption;
          }}
          onmouseenter={(evt: MouseEvent) =>
            this.handleMouseEnterCell(data, columnOption, evt)
          }
          onmouseleave={(_evt: MouseEvent) => this.handleMouseLeaveCell()}
        >
          <div class="cell-content">
            {this.renderColumnCell(
              columnRender,
              data,
              columnOption,
              index,
              tableStore
            )}
          </div>
        </div>
      );
    },
  },

  render() {
    // @ts-ignore
    const { layoutSize, leftFixedColumns, rightFixedColumns, mainColumns, leftFixedColumnWidth, rightFixedColumnWidth} = this.tableStore;
    const { offsetX, tableOptions } = this;
    const extraAttrs = this.getExtraRowAttrs(this.data, this.index);
    return (
      <div
        class={["infinite-table__row", extraAttrs.class]}
        draggable={tableOptions.rowDraggable}
        style={{
          ...extraAttrs.style,
          // @ts-ignore
          width: `${this.tableStore.allColumnsWidth}px`,
          height: `${tableOptions.rowHeight}px`,
        }}
        ondragstart={(evt: DragEvent) => {
          // 避免table-body再次触发相同类型的事件（例如dnd相关的事件)
          evt.stopPropagation();
          this.dispatchRowEvent(
            "row-dragstart",
            this.data,
            this.dragoverColumnItem as any,
            evt,
            this.index
          );
        }}
        ondragend={(evt: DragEvent) => {
          evt.stopPropagation();
          this.dispatchRowEvent(
            "row-dragend",
            this.data,
            this.dragoverColumnItem as any,
            evt,
            this.index
          );
        }}
        ondragover={(evt: DragEvent) => {
          evt.stopPropagation();
          this.dispatchRowEvent(
            "row-dragover",
            this.data,
            this.dragoverColumnItem as any,
            evt,
            this.index
          );
        }}
        ondrop={(evt: DragEvent) => {
          evt.stopPropagation();
          this.dispatchRowEvent(
            "row-drop",
            this.data,
            this.dragoverColumnItem as any,
            evt,
            this.index
          );
        }}
        {...extraAttrs.attrs}
      >
        {leftFixedColumns.map((column) =>
          this.renderTableCell({ data: column })
        )}
        <RangeRender
          // @ts-ignore
          style={{ width: `${this.tableStore.allColumnsWidth}px` }}
          dataKey={(item: TableColumnItem) => item.key}
          data={mainColumns}
          direction="horizontal"
          sizeField="width"
          offset={offsetX}
          viewportSize={
            layoutSize.viewportWidth -
            leftFixedColumnWidth -
            rightFixedColumnWidth
          }
          v-slots={this.renderTableCell}
        />
        {rightFixedColumns.map((column) =>
          this.renderTableCell({ data: column })
        )}
      </div>
    );
  },
});
</script>
