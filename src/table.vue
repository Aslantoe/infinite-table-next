<script lang="tsx">
import ResizeObserver from "resize-observer-polyfill";
import {
  PropType,
  defineComponent,
  ref,
  reactive,
  provide,
  nextTick,
} from "vue";
import TableColumnItem, { TableColumnOptions } from "./store/table-column-item";
import { getDataKey } from "./utils/object";
import {
  RowItemType,
  RowKeyType,
  TableOptions,
  InfiniteTableDefaultOptions,
  tableOptionsInjectKey,
  tableStoreInjectKey,
} from "./common/types";
import TableHeader from "./table-header.vue";
import TableBody from "./table-body.vue";
import TableStore from "./table-store.vue";
import TooltipRender from "./tooltip-render.vue";
import { num2px, getClientSize, px2num } from "./utils/layout";
import "./styles/main.scss";

interface KeyboardEventDispatcher {
  rule: RegExp;
  methods: Array<(event: KeyboardEvent, status: KeyStatus) => void>;
}

enum KeyStatus {
  UP = "UP",
  DOWN = "DOWN",
}

type MoveDirection = "left" | "right" | "up" | "down";

export default defineComponent({
  name: "InfiniteTable",
  components: { TableHeader, TableBody, TooltipRender },
  mixins: [TableStore],
  props: {
    data: {
      type: Array as PropType<RowItemType[]>,
      default() {
        return [];
      },
    },
    height: {
      type: [Number, String],
      default: "100%",
    },
    headerHeight: {
      type: [Number, String],
      default: 48,
    },
    rowHeight: {
      type: [Number, String],
      default: 48,
    },
    rowKey: {
      type: [Function, String] as PropType<RowKeyType>,
      required: true,
    },
    striped: {
      type: Boolean,
      default: true,
    },
    highlightCurrentRow: {
      type: Boolean,
      default: true,
    },
    multipleSelection: {
      type: Boolean,
      default: false,
    },
    highlightCurrentCell: {
      type: Boolean,
      default: false,
    },
    rowExtraAttrs: {
      type: [Object, Function] as PropType<
        Record<string, string> | ((row: RowItemType) => Record<string, string>)
      >,
      default(): Record<string, string> {
        return {};
      },
    },
    headerResizeable: {
      type: Boolean,
      default: false,
    },
    headerOrderDraggable: {
      type: Boolean,
      default: false,
    },
    rowDraggable: {
      type: Boolean,
      default: false,
    },
    tableColumns: {
      type: Array as PropType<TableColumnOptions[]>,
      default() {
        return [];
      },
    },
    topFixedKeys: {
      type: Array as PropType<string[]>,
      default() {
        return [];
      },
    },
  },

  setup(props) {
    const resizeObserver = ref<ResizeObserver>();
    const composeKey = reactive({
      shift: false,
      control: false,
    });
    const scrollElement = ref<HTMLElement>();
    const tableRef = ref(null);
    // const tableStore = ref(null)
    const tableStoreRef = ref(null);

    const tableOptions = reactive<TableOptions>({
      rowExtraAttrs: props.rowExtraAttrs,
      headerHeight: px2num(props.headerHeight),
      striped: props.striped,
      rowKey: props.rowKey,
      rowHeight: px2num(props.rowHeight),
      headerResizable: props.headerResizeable,
      rowDraggable: props.rowDraggable,
      headerOrderDraggable: props.headerOrderDraggable,
      highlightCurrentRow: props.highlightCurrentRow,
      highlightCurrentCell: props.highlightCurrentCell,
      multipleSelection: props.multipleSelection,
      freezeRow: false,
      topFixedKeys: props.topFixedKeys,
    });
    provide(tableOptionsInjectKey, tableOptions);

    // const tableStore = TableStore;
    // const tableStore = reactive(new TableStore({
    //   data: {
    //     tableData: props.data,
    //   },
    //   propsData: {
    //     rowKey: props.rowKey,
    //     tableOptions: tableOptions,
    //     propTableData: props.data,
    //   },
    // }))

    // provide(tableStoreInjectKey, tableStoreRef);
    // nextTick(() => {
    //   console.log("====", tableStoreRef);
    // });

    const tableDefaultOptions: InfiniteTableDefaultOptions = {
      defaultEmptySlot: (h) => h("span", "暂无数据"),
    };

    return {
      resizeObserver,
      composeKey,
      scrollElement,
      tableRef,
      tableOptions,
      tableStoreRef,
      // tableStore,
      tableDefaultOptions,
    };
  },

  computed: {
    tableHeight() {
      // FIXME: 默认高度分配目前有问题，当有横向滚动条时，长度计算错误
      let height;
      if (this.height) {
        height = this.height;
      } else if (this.data.length > 0) {
        height =
          this.tableOptions.rowHeight * this.data.length +
          px2num(this.headerHeight);
      } else {
        height = 250;
      }
      return num2px(height);
    },
    tableHeaderClass() {
      return {
        "infinite-table__table-header--sticky": this.tableHeight,
      };
    },
  },

  watch: {
    data: {
      handler(newData: RowItemType[]) {
        this.updateData(newData);
        console.log('============', this.normalData);
      },
      immediate: true,
    },
    topFixedKeys: {
      handler(nextFixedKeys: string[]) {
        this.updateFixedKeys(nextFixedKeys);
      },
      immediate: true,
    },
    tableColumns: {
      handler(nextTableColumns: TableColumnOptions[]) {
        const columns = nextTableColumns.map(
          (columnOption, index) =>
            new TableColumnItem({
              ...columnOption,
              key: index.toString(),
            })
        );
        this.doLayout(columns);
      },
      immediate: true,
      deep: true,
    },
  },

  created() {
    // nextTick(() => {
    //   console.log("====", this.tableStoreRef);
    //   provide(tableStoreInjectKey, this.tableStoreRef);
    //   // provide('test', 15);
    // });
    // this.$on("row-click", (row: RowItemType) => {
    //   this.selectRow(row);
    // });
    // this.$on("row-contextmenu", (row: RowItemType) => {
    //   // 如果当前行已经被选中，那么不再触发current-change事件
    //   // 用于多选时可以在选中的行上使用右键菜单
    //   if (!this.isRowSelected(row)) {
    //     this.selectRow(row);
    //   }
    // });
    // this.$on("cell-click", (row: RowItemType, column: TableColumnItem) => {
    //   this.selectedColumn = column;
    // });
    // // FIXME: 修复无法正常传递table对象的问题
    // this.table = this;
  },

  mounted() {
    this.resizeObserver = new ResizeObserver((observerEntries) => {
      if (observerEntries && observerEntries.length > 0) {
        const entry = observerEntries[0];
        const { width, height } = entry.contentRect;
        this._doLayout(width, height);
      }
    });
    this.resizeObserver.observe(this.tableRef);
    const { height, width } = getClientSize(this.$el as HTMLElement);
    this._doLayout(width, height);
  },

  methods: {
    // @DebounceDecorator({
    //   leading: false, trailing: true, wait: 200, maxWait: 2000,
    // })
    _doLayout(width: number, height: number) {
      this.updateLayoutSize({
        ...this.layoutSize,
        tableHeaderHeight: this.tableOptions.headerHeight,
        tableWidth: width,
        tableHeight: height,
      });
    },

    selectRow(row: RowItemType) {
      const multiple =
        this.composeKey.control && this.tableOptions.multipleSelection;
      const continuous =
        this.composeKey.shift && this.tableOptions.multipleSelection;
      if (!multiple) {
        this.clearSelectedRows();
      }
      // FIXME: 修复无法使用键盘多选的问题

      const { focusedRow } = this;
      if (!continuous || (continuous && !focusedRow)) {
        if (this.isRowSelected(row)) {
          this.removeSelectedRows(row);
        } else {
          this.addSelectedRows(row);
        }
        this.updateFocusedRow(row);
      } else {
        const key = getDataKey(row, this.rowKey);
        const rowIndex = this.findRowIndex(key);
        const focusedKey = getDataKey(focusedRow, this.rowKey);
        const focusedIndex = this.findRowIndex(focusedKey);
        if (rowIndex !== -1 && focusedIndex !== -1) {
          let start = rowIndex;
          let end = focusedIndex;
          if (start > end) {
            [start, end] = [end, start];
          }
          this.addSelectedRows(...this.normalData.slice(start, end + 1));
        }
      }
    },

    selectAll() {
      this.addSelectedRows(...this.tableData.slice());
    },

    handleChangeSelect(event: KeyboardEvent, keyStatus = KeyStatus.UP) {
      if (keyStatus === KeyStatus.DOWN) {
        const match = /Arrow(Up|Down|Left|Right)/i.exec(event.key);
        if (match) {
          const direction = match[1].toLowerCase() as MoveDirection;
          this.move(direction);
        }
      }
    },

    // @DebounceDecorator({
    //   leading: false, trailing: true, wait: 600, maxWait: 100000,
    // })
    cleanupComposeKey() {
      this.$set(this.composeKey, "shift", false);
      this.$set(this.composeKey, "control", false);
    },

    handleComposeKeyEvent(event: KeyboardEvent, keyStatus: KeyStatus) {
      if (keyStatus === KeyStatus.DOWN) {
        this.$set(
          this.composeKey,
          event.key.toLowerCase(),
          keyStatus === KeyStatus.DOWN
        );
        this.cleanupComposeKey();
      } else {
        this.$set(this.composeKey, event.key.toLowerCase(), false);
      }
    },

    handleDispatchKeyEvent(event: KeyboardEvent, keyStatus: KeyStatus) {
      const { focusedRow, selectedColumn } = this;
      this.$emit(
        `key-${keyStatus.toLowerCase()}`,
        focusedRow,
        selectedColumn,
        event
      );
    },

    handleKeyEvent(event: KeyboardEvent, keyStatus: KeyStatus) {
      const { key } = event;
      const eventDispatcher: KeyboardEventDispatcher[] = [
        {
          rule: /^Arrow(Down|Up|Left|Right)/i,
          methods: [this.handleChangeSelect],
        },
        {
          rule: /(Control|Shift)/i,
          methods: [this.handleComposeKeyEvent, this.handleDispatchKeyEvent],
        },
        {
          rule: /^a$/i,
          methods: [
            (e) => {
              if (this.composeKey.control) {
                e.preventDefault();
                this.selectAll();
              }
            },
          ],
        },
        {
          rule: /(.*)/i,
          methods: [this.handleDispatchKeyEvent],
        },
      ];
      for (let i = 0; i < eventDispatcher.length; i += 1) {
        const dispatchItem = eventDispatcher[i];
        if (dispatchItem.rule.test(key)) {
          for (let n = 0; n < dispatchItem.methods.length; n += 1) {
            dispatchItem.methods[n].call(this, event, keyStatus);
          }
          break;
        }
      }
    },

    // FIXME: 研究这个方法上后面俩参数的作用
    tryScrollInvisibleElem(
      rowIndex: number,
      columnIndex: number,
      rowPosition: string,
      columnPosition: string
    ) {
      const { rowHeight } = this.tableOptions;
      const { scrollTop, scrollLeft } = this.scrollElement;
      const { viewportWidth, viewportHeight } = this.layoutSize;
      const { tableData, fixedData } = this;
      /**
       * 如果行是row是固定行那么不做任何操作
       * 如果当前的行高度小于scrollTop(当前行在视窗上面）
       * 或者当前行的底部大于scrollTop加上视窗高度(当前在视窗下面)
       * 就尝试使用scrollToRow方法将当前行滚动出来
       */
      const beneathTheTop =
        rowIndex * rowHeight < scrollTop + fixedData.length * rowHeight;
      if (
        rowIndex >= fixedData.length &&
        (beneathTheTop ||
          (rowIndex + 1) * rowHeight > scrollTop + viewportHeight)
      ) {
        this.scrollToRow(tableData[rowIndex], beneathTheTop ? "top" : "bottom");
      }

      const column = this.allTableColumns[columnIndex];
      // 固定列永远显示在视窗区域，无需处理
      if (column.fixed !== false) {
        return;
      }
      const offset = this.getColumnOffset(column);
      const { leftFixedColumnWidth, rightFixedColumnWidth } = this;
      /**
       * 如果在左侧固定列下面或是在右侧固定列下面
       * 就尝试滚动到指定的column
       */
      const beneathTheLeft = scrollLeft + leftFixedColumnWidth > offset;
      if (
        beneathTheLeft ||
        scrollLeft + viewportWidth - rightFixedColumnWidth <
          offset + column.width
      ) {
        this.scrollToColumn(column, beneathTheLeft ? "left" : "right");
      }
    },

    move(direction: MoveDirection) {
      // TODO: 元素不可见时，自动滚动列表
      const { allTableColumns } = this;
      const { focusedRow, selectedColumn } = this;
      if (!selectedColumn) {
        return;
      }
      const { tableData } = this;
      let index = tableData.indexOf(focusedRow!);
      let columnIndex = this.findColumnIndex(selectedColumn);
      if (index === -1) {
        index = 0;
      }
      if (columnIndex === -1) {
        columnIndex = 0;
      }
      let row;
      switch (direction) {
        case "up":
          index = index === 0 ? 0 : index - 1;
          this.tryScrollInvisibleElem(index, columnIndex, "top", "left");
          row = tableData[index];
          this.selectRow(row);
          break;
        case "down":
          index =
            index === tableData.length - 1 ? tableData.length - 1 : index + 1;
          this.tryScrollInvisibleElem(index, columnIndex, "bottom", "left");
          row = tableData[index];
          this.selectRow(row);
          break;
        case "left":
          columnIndex = columnIndex === 0 ? 0 : columnIndex - 1;
          this.selectedColumn = allTableColumns[columnIndex];
          this.tryScrollInvisibleElem(index, columnIndex, "top", "left");
          break;
        case "right":
          if (columnIndex === allTableColumns.length - 1) {
            columnIndex = allTableColumns.length - 1;
          } else {
            columnIndex += 1;
          }
          this.selectedColumn = allTableColumns[columnIndex];
          this.tryScrollInvisibleElem(index, columnIndex, "top", "right");
          break;
        default:
          break;
      }
    },

    focus() {
      this.tableRef.focus();
    },

    scrollToColumn(column: TableColumnItem, position = "left") {
      const { layoutSize, leftFixedColumnWidth, rightFixedColumnWidth } = this;
      const offset = this.getColumnOffset(column);
      if (offset >= 0) {
        let positionOffset = 0;
        if (position === "middle") {
          positionOffset = -1 * (layoutSize.viewportWidth / 2 - column.width);
        } else if (position === "right") {
          positionOffset = -1 * (layoutSize.viewportWidth - column.width);
        }
        let fixedOffset = 0;
        if (position === "left" && column.fixed !== "left") {
          fixedOffset = leftFixedColumnWidth;
        } else if (position === "right" && column.fixed !== "right") {
          fixedOffset = rightFixedColumnWidth * -1;
        }
        this.scrollElement.scrollLeft = offset + positionOffset - fixedOffset;
      }
    },

    scrollToRow(rowItem: RowItemType, position = "top") {
      const { rowHeight } = this.tableOptions;
      const { layoutSize, normalData, fixedData } = this;
      const rowItemValue = getDataKey(rowItem, this.rowKey);
      const index = normalData.findIndex(
        (item) => getDataKey(item, this.rowKey) === rowItemValue
      );
      if (index !== -1) {
        let positionOffset = 0;
        if (position === "top") {
          positionOffset = -1 * fixedData.length * rowHeight;
        } else if (position === "middle") {
          positionOffset = -1 * (layoutSize.viewportHeight / 2 - rowHeight);
        } else if (position === "bottom") {
          positionOffset = -1 * (layoutSize.viewportHeight - rowHeight);
        }
        const y = rowHeight * index;
        this.scrollElement.scrollTo(
          this.scrollElement.scrollLeft,
          y + positionOffset
        );
      }
    },

    renderEmptyContent() {
      return (
        <div
          class="infinite-table__empty-content"
          onDragover={(e: DragEvent) => this.$emit("body-dragover", e)}
          onDrop={(e: DragEvent) => this.$emit("body-drop", e)}
        >
          {this.$slots.empty
            ? this.$slots.empty
            : this.tableDefaultOptions.defaultEmptySlot(this.$createElement)}
        </div>
      );
    },
  },

  beforeDestroy() {
    this.$destroy();
    this.resizeObserver.disconnect();
  },

  render() {
    console.log('table', this.normalData);
    
    return (
      <div
        ref="tableRef"
        class="infinite-table"
        style={{ height: this.tableHeight }}
        tabindex="0"
        {...{
          on: {
            keydown: (evt: KeyboardEvent) =>
              this.handleKeyEvent(evt, KeyStatus.DOWN),
            keyup: (evt: KeyboardEvent) =>
              this.handleKeyEvent(evt, KeyStatus.UP),
            "!click": () => this.focus(),
          },
        }}
      >
        <div ref="scrollElement" class="infinite-table--scrollable">
          <table-header class={this.tableHeaderClass} />
          {this.data.length > 0 && (
            <table-body
              onDragover={(e: DragEvent) => this.$emit("body-dragover", e)}
              onDrop={(e: DragEvent) => this.$emit("body-drop", e)}
            />
          )}
        </div>
        {this.data.length === 0 && this.renderEmptyContent()}
        <tooltip-render />
      </div>
    );
  },
});
</script>
