import ResizeObserver from "resize-observer-polyfill";
import {
  h,
  defineComponent,
  PropType,
  VNode,
  onUnmounted,
  ref,
  reactive,
  provide,
  watch,
  onMounted,
  computed,
} from "vue";
import TableColumnItem, {
  TableColumnOptions,
} from "@/hooks/useTableColumnItemHooks";
import { getDataKey } from "@/utils/object";
import {
  RowItemType,
  RowKeyType,
  TableOptions,
  InfiniteTableDefaultOptions,
  tableOptionsInjectKey,
  tableStoreInjectKey,
} from "@/common/types";
import TableHeader from "./table-header";
import TableBody from "./table-body";
import TableStore from "./table-store";
import { TooltipRender } from "./tooltip-render";
import useTableColumn from "./hooks/useTbaleColumnHooks";
import useTableData from "./hooks/useTableDataHooks";
import useTableStore from "./table-store";
import { num2px, getClientSize, px2num } from "./utils/layout";
import "./styles/main.scss";
import emitter from "./event-emitter";

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
  setup(props, { attrs, emit, slots }) {
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

    const {
      updateLayoutSize,
      layoutSize,
      doLayout,
      table,
      findRowIndex,
      allTableColumns,
      getColumnOffset,
      leftFixedColumnWidth,
      rightFixedColumnWidth,
      findColumnIndex,
      updateData,
      updateFixedKeys,
      isRowSelected,
      selectedColumn,
      clearSelectedRows,
      focusedRow,
      removeSelectedRows,
      addSelectedRows,
      updateFocusedRow,
      normalData,
      tableData,
      fixedData,
    } = useTableStore(tableOptions, props.rowKey);

    let tableDefaultOptions: InfiniteTableDefaultOptions = {
      defaultEmptySlot: (h) => h("span", "暂无数据"),
    };

    let resizeObserver!: ResizeObserver;

    const composeKey = ref({
      shift: false,
      control: false,
    });

    const scrollElement = ref<Element>();

    const tableRef = ref();

    const tableHeight = computed(() => {
      // FIXME: 默认高度分配目前有问题，当有横向滚动条时，长度计算错误
      let height;
      if (props.height) {
        height = props.height;
      } else if (props.data.length > 0) {
        height =
          tableOptions.rowHeight * props.data.length +
          px2num(props.headerHeight);
      } else {
        height = 250;
      }
      return num2px(height);
    });

    const tableHeaderClass = () => {
      return {
        "infinite-table__table-header--sticky": tableHeight,
      };
    };

    watch(
      () => props.data,
      (newData: RowItemType[]) => {
        console.log(3355, newData);
        updateData(newData);
      },
      { immediate: true, deep: true }
    );

    watch(
      () => props.topFixedKeys,
      (nextFixedKeys: string[]) => {
        updateFixedKeys(nextFixedKeys);
      },
      { immediate: true }
    );

    watch(
      () => props.tableColumns,
      (nextTableColumns: TableColumnOptions[]) => {
        setColumns(nextTableColumns);
      },
      { deep: true }
    );

    const setColumns = (nextTableColumns: TableColumnOptions[]) => {
      const columns = nextTableColumns.map(
        (columnOption, index) =>
          new TableColumnItem({
            ...columnOption,
            key: index.toString(),
          })
      );
      console.log("table.tsx--watch--tableColumns-->", columns);
      doLayout(columns);
    };

    onMounted(() => {
      setColumns(props.tableColumns);
      console.log("onmounted", normalData.value);
      resizeObserver = new ResizeObserver((observerEntries) => {
        if (observerEntries && observerEntries.length > 0) {
          const entry = observerEntries[0];
          const { width, height } = entry.contentRect;
          _doLayout(width, height);
        }
      });

      const it = document.getElementById("infinite-table") as Element;
      console.log(2222, it);
      resizeObserver.observe(it as Element);
      const { height, width } = getClientSize(it as HTMLElement);
      _doLayout(width, height);

      emitter.on("row-click", (params: any) => {
        selectRow(params.data);
      });

      emitter.on("row-contextmenu", (params: any) => {
        selectRow(params.data);
        // 如果当前行已经被选中，那么不再触发current-change事件
        // 用于多选时可以在选中的行上使用右键菜单
        if (!isRowSelected(params.data)) {
          selectRow(params.data);
        }
      });

      emitter.on("cell-click", (params: any) => {
        selectedColumn.value = params.column;
      });

      emitter.on("column-resize", ({ columnIndex, column, size }) => {
        emit("column-resize", columnIndex, column, size);
      });

      emitter.on(
        "header-drop",
        ({ dragIndex, dragItem, dropIndex, dropItem }) => {
          emit("header-drop", dragIndex, dragItem, dropIndex, dropItem);
        }
      );

      // FIXME: 修复无法正常传递table对象的问题
      // table = this;
    });

    // @DebounceDecorator({
    //   leading: false, trailing: true, wait: 200, maxWait: 2000,
    // })
    const _doLayout = (width: number, height: number) => {
      console.log("updateLayoutSize", width, height);

      updateLayoutSize({
        ...layoutSize.value,
        tableHeaderHeight: tableOptions.headerHeight,
        tableWidth: width,
        tableHeight: height,
      });
    };

    onUnmounted(() => {
      // this.tableStore.$destroy();
      resizeObserver.disconnect();
    });

    const selectRow = (row: RowItemType) => {
      const multiple =
        composeKey.value.control && tableOptions.multipleSelection;
      const continuous =
        composeKey.value.shift && tableOptions.multipleSelection;
      if (!multiple) {
        clearSelectedRows();
      }
      // FIXME: 修复无法使用键盘多选的问题

      if (!continuous || (continuous && !focusedRow.value)) {
        if (isRowSelected(row)) {
          removeSelectedRows(row);
        } else {
          addSelectedRows(row);
        }
        updateFocusedRow(row);
      } else {
        const key = getDataKey(row, props.rowKey);
        const rowIndex = findRowIndex(key);
        const focusedKey = getDataKey(focusedRow, props.rowKey);
        const focusedIndex = findRowIndex(focusedKey);
        if (rowIndex !== -1 && focusedIndex !== -1) {
          let start = rowIndex;
          let end = focusedIndex;
          if (start > end) {
            [start, end] = [end, start];
          }
          addSelectedRows(...normalData.value.slice(start, end + 1));
        }
      }
    };
    /**
     * 选择全部
     */
    const selectAll = () => {
      addSelectedRows(...tableData.value.slice());
    };
    /**
     * 键盘事件
     * @param event
     * @param keyStatus
     */
    const handleChangeSelect = (
      event: KeyboardEvent,
      keyStatus = KeyStatus.UP
    ) => {
      if (keyStatus === KeyStatus.DOWN) {
        const match = /Arrow(Up|Down|Left|Right)/i.exec(event.key);
        if (match) {
          const direction = match[1].toLowerCase() as MoveDirection;
          move(direction);
        }
      }
    };

    // @DebounceDecorator({
    //   leading: false, trailing: true, wait: 600, maxWait: 100000,
    // })
    const cleanupComposeKey = () => {
      composeKey.value.shift = false;
      composeKey.value.control = false;
    };

    const handleComposeKeyEvent = (
      event: KeyboardEvent,
      keyStatus: KeyStatus
    ) => {
      if (keyStatus === KeyStatus.DOWN) {
        composeKey.value[event.key.toLowerCase()] =
          keyStatus === KeyStatus.DOWN;
        cleanupComposeKey();
      } else {
        composeKey.value[event.key.toLowerCase()] = false;
      }
    };
    /**
     * 分发键盘事件
     * @param event
     * @param keyStatus
     */
    const handleDispatchKeyEvent = (
      event: KeyboardEvent,
      keyStatus: KeyStatus
    ) => {
      emit(
        `key-${keyStatus.toLowerCase()}`,
        focusedRow.value,
        selectedColumn.value,
        event
      );
    };

    /**
     * 处理键盘事件
     * @param event
     * @param keyStatus
     */
    const handleKeyEvent = (event: KeyboardEvent, keyStatus: KeyStatus) => {
      console.log("handleKeyEvent");

      const { key } = event;
      const eventDispatcher: KeyboardEventDispatcher[] = [
        {
          rule: /^Arrow(Down|Up|Left|Right)/i,
          methods: [handleChangeSelect],
        },
        {
          rule: /(Control|Shift)/i,
          methods: [handleComposeKeyEvent, handleDispatchKeyEvent],
        },
        {
          rule: /^a$/i,
          methods: [
            (e) => {
              if (composeKey.value.control) {
                e.preventDefault();
                selectAll();
              }
            },
          ],
        },
        {
          rule: /(.*)/i,
          methods: [handleDispatchKeyEvent],
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
    };

    // FIXME: 研究这个方法上后面俩参数的作用
    const tryScrollInvisibleElem = (
      rowIndex: number,
      columnIndex: number,
      rowPosition: string,
      columnPosition: string
    ) => {
      const { rowHeight } = tableOptions;
      // @ts-ignore
      const { scrollTop, scrollLeft } = scrollElement;
      const { viewportWidth, viewportHeight } = layoutSize.value;

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
        scrollToRow(tableData[rowIndex], beneathTheTop ? "top" : "bottom");
      }

      const column = allTableColumns.value[columnIndex];
      // 固定列永远显示在视窗区域，无需处理
      if (column.fixed !== false) {
        return;
      }
      const offset = getColumnOffset(column);
      /**
       * 如果在左侧固定列下面或是在右侧固定列下面
       * 就尝试滚动到指定的column
       */
      const beneathTheLeft = scrollLeft + leftFixedColumnWidth.value > offset;
      if (
        beneathTheLeft ||
        scrollLeft + viewportWidth - rightFixedColumnWidth.value <
          offset + column.width
      ) {
        scrollToColumn(column, beneathTheLeft ? "left" : "right");
      }
    };

    const move = (direction: MoveDirection) => {
      // TODO: 元素不可见时，自动滚动列表
      if (!selectedColumn.value) {
        return;
      }
      let index = tableData.value.indexOf(focusedRow!);
      let columnIndex = findColumnIndex(selectedColumn.value);
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
          tryScrollInvisibleElem(index, columnIndex, "top", "left");
          row = tableData[index];
          selectRow(row);
          break;
        case "down":
          index =
            index === tableData.value.length - 1
              ? tableData.value.length - 1
              : index + 1;
          tryScrollInvisibleElem(index, columnIndex, "bottom", "left");
          row = tableData[index];
          selectRow(row);
          break;
        case "left":
          columnIndex = columnIndex === 0 ? 0 : columnIndex - 1;
          selectedColumn.value = allTableColumns[columnIndex];
          tryScrollInvisibleElem(index, columnIndex, "top", "left");
          break;
        case "right":
          if (columnIndex === allTableColumns.value.length - 1) {
            columnIndex = allTableColumns.value.length - 1;
          } else {
            columnIndex += 1;
          }
          selectedColumn.value = allTableColumns[columnIndex];
          tryScrollInvisibleElem(index, columnIndex, "top", "right");
          break;
        default:
          break;
      }
    };

    const focus = () => {
      tableRef.value.focus();
    };

    const scrollToColumn = (column: TableColumnItem, position = "left") => {
      const offset = getColumnOffset(column);
      if (offset >= 0) {
        let positionOffset = 0;
        if (position === "middle") {
          positionOffset =
            -1 * (layoutSize.value.viewportWidth / 2 - column.width);
        } else if (position === "right") {
          positionOffset = -1 * (layoutSize.value.viewportWidth - column.width);
        }
        let fixedOffset = 0;
        if (position === "left" && column.fixed !== "left") {
          fixedOffset = leftFixedColumnWidth.value;
        } else if (position === "right" && column.fixed !== "right") {
          fixedOffset = rightFixedColumnWidth.value * -1;
        }
        // @ts-ignore
        scrollElement.scrollLeft = offset + positionOffset - fixedOffset;
      }
    };

    const scrollToRow = (rowItem: RowItemType, position = "top") => {
      const { rowHeight } = tableOptions;
      const rowItemValue = getDataKey(rowItem, props.rowKey);
      const index = normalData.value.findIndex(
        (item) => getDataKey(item, props.rowKey) === rowItemValue
      );
      if (index !== -1) {
        let positionOffset = 0;
        if (position === "top") {
          positionOffset = -1 * fixedData.length * rowHeight;
        } else if (position === "middle") {
          positionOffset =
            -1 * (layoutSize.value.viewportHeight / 2 - rowHeight);
        } else if (position === "bottom") {
          positionOffset = -1 * (layoutSize.value.viewportHeight - rowHeight);
        }
        const y = rowHeight * index;
        // @ts-ignore
        scrollElement.scrollTo(scrollElement.scrollLeft, y + positionOffset);
      }
    };

    const renderEmptyContent = (): VNode => (
      <div
        class="infinite-table__empty-content"
        onDragover={(e: DragEvent) => emit("body-dragover", e)}
        onDrop={(e: DragEvent) => emit("body-drop", e)}
      >
        {slots.empty ? slots.empty : tableDefaultOptions.defaultEmptySlot(h)}
      </div>
    );

    return () => (
      <div
        ref="tableRef"
        id="infinite-table"
        class="infinite-table"
        style={{ height: tableHeight.value }}
        tabindex="0"
        onkeydown={(evt: KeyboardEvent) => handleKeyEvent(evt, KeyStatus.DOWN)}
        onkeyup={(evt: KeyboardEvent) => handleKeyEvent(evt, KeyStatus.UP)}
        // "!click": () => focus(),
      >
        <div ref="scrollElement" class="infinite-table--scrollable">
          <TableHeader
            tableColumns={allTableColumns.value}
            class={tableHeaderClass}
          />
          {props.data.length > 0 && (
            <TableBody
              normalData={normalData.value}
              onDragover={(e: DragEvent) => emit("body-dragover", e)}
              onDrop={(e: DragEvent) => emit("body-drop", e)}
            />
          )}
        </div>
        {props.data.length === 0 && renderEmptyContent()}
        <TooltipRender />
      </div>
    );
  },
});
