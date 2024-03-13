<template>   
    <div
      ref="tableRef"
      class="infinite-table"
      :style="{ height: tableHeight }"
      tabindex="0"
      @keydown=handleKeyEvent($event,  KeyStatus.DOWN),
      @keyup=handleKeyEvent($event, KeyStatus.UP),
      @click="focus"  
    >
    <div ref="scrollElement" class="infinite-table--scrollable">
        <TableHeader :class="{ tableHeaderClass }" />
        <TableBody
            v-if="data.length > 0"
            @onDragover="$event => $emit('body-dragover', $event)"
            @onDrop="$event => $emit('body-drop', $event)"
        ></TableBody>
        
    </div>
    <tooltip-render v-if="data.length === 0 && renderEmptyContent()" />
    </div>
</template>

<script setup lang="ts">
import ResizeObserver from 'resize-observer-polyfill';
import { PropType, VNode, inject, h, ref, watch, provide, onMounted, onUnmounted, computed } from 'vue';
import TableColumnItem, { TableColumnOptions } from '@/store/useTableColumnItemHooks';
import { getDataKey } from '@/utils/object';
import {
  RowItemType, RowKeyType, TableOptions,
  InfiniteTableDefaultOptions,
  tableOptionsInjectKey,
  tableStoreInjectKey,
} from '@/common/types';
import TableHeader from './table-header';
import TableBody from './table-body';
import TableStore from './table-store';
import { TooltipRender } from './tooltip-render';
import { num2px, getClientSize, px2num } from './utils/layout';
import { updateData, updateFixedKeys } from './store/useTableDataHooks';
import { allTableColumns } from "./store/useTbaleColumnHooks";
import './styles/main.scss';


interface KeyboardEventDispatcher {
  rule: RegExp,
  methods: Array<(event: KeyboardEvent, status: KeyStatus) => void>,
}

enum KeyStatus {
  UP = 'UP',
  DOWN = 'DOWN',
}

type MoveDirection = 'left' | 'right' | 'up' | 'down';

const props = defineProps({
    data: {
        type: Array as PropType<RowItemType[]>,
        default() {
        return [];
        },
    },
    height: {
        type: [Number, String],
        default: '100%',
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
        type: [Object, Function] as PropType<Record<string, string> | ((row: RowItemType) => Record<string, string>)>,
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
})

const tableDefaultOptions: InfiniteTableDefaultOptions = {
    defaultEmptySlot: (h) => h('span', '暂无数据'),
};

let resizeObserver!: ResizeObserver;

const composeKey = ref({
    shift: false,
    control: false,
});

const scrollElement = ref<Element>()

const tableRef = ref()


const tableOptions = (): TableOptions => {
    return {
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
    };
}

const tableStore = new TableStore({
    data: {
        tableData: props.data,
    },
    propsData: {
        rowKey: props.rowKey,
        tableOptions: tableOptions(),
        propTableData: props.data,
    },
});

provide(tableStoreInjectKey, tableStore)
provide(tableOptionsInjectKey, tableOptions)


const tableHeight = computed(() => {
  let height;
    if (props.height) {
      height = props.height;
    } else if (props.data.length > 0) {
      height = (tableOptions().rowHeight * props.data.length) + px2num(props.headerHeight);
    } else {
      height = 250;
    }
    return num2px(height);
})

const tableHeaderClass = computed(() => {
    return {
      'infinite-table__table-header--sticky': tableHeight,
    };
})

watch(
    () => props.data,
    (newData: RowItemType[]) => {
        updateData(newData);
    }
)

watch(
    () => props.topFixedKeys,
    (nextFixedKeys: string[]) => {
        updateFixedKeys(nextFixedKeys)
    }, { immediate: true }
)

watch(
    () => props.tableColumns,
    (nextTableColumns: TableColumnOptions[]) => {
        const columns = nextTableColumns.map((columnOption, index) => new TableColumnItem({
          ...columnOption,
          key: index.toString(),
        }));
        tableStore.doLayout(columns);
    }, { immediate: true, deep: true }
)


  
this.$on('row-click', (row: RowItemType) => {
    selectRow(row);
});
this.$on('row-contextmenu', (row: RowItemType) => {
    // 如果当前行已经被选中，那么不再触发current-change事件
    // 用于多选时可以在选中的行上使用右键菜单
    if (!tableStore.isRowSelected(row)) {
        selectRow(row);
    }
});

this.$on('cell-click', (row: RowItemType, column: TableColumnItem) => {
    tableStore.selectedColumn = column;
});

// FIXME: 修复无法正常传递table对象的问题
tableStore.table = this;
  



  onMounted(() => {
      resizeObserver = new ResizeObserver((observerEntries) => {
        if (observerEntries && observerEntries.length > 0) {
          const entry = observerEntries[0];
          const { width, height } = entry.contentRect;
          doLayout(width, height);
        }
      });
      resizeObserver.observe(tableRef.value);
      const { height, width } = getClientSize(this.$el as HTMLElement);
      doLayout(width, height);
  })


//   @DebounceDecorator({
//     leading: false, trailing: true, wait: 200, maxWait: 2000,
//   })
  const doLayout =(width: number, height: number) => {
    tableStore.updateLayoutSize({
      tableStore.layoutSize,
      tableHeaderHeight: tableOptions.headerHeight,
      tableWidth: width,
      tableHeight: height,
    });
  }

  onUnmounted(() => {
      tableStore.$destroy();
      resizeObserver.disconnect();
  })



  const selectRow = (row: RowItemType) => {
    const multiple = composeKey.value.control && tableOptions.multipleSelection;
    const continuous = composeKey.value.shift && tableOptions.multipleSelection;
    if (!multiple) {
      tableStore.clearSelectedRows();
    }
    // FIXME: 修复无法使用键盘多选的问题

    const { focusedRow } = tableStore;
    if (!continuous || (continuous && !focusedRow)) {
      if (tableStore.isRowSelected(row)) {
        tableStore.removeSelectedRows(row);
      } else {
        tableStore.addSelectedRows(row);
      }
      tableStore.updateFocusedRow(row);
    } else {
      const key = getDataKey(row, rowKey);
      const rowIndex = tableStore.findRowIndex(key);
      const focusedKey = getDataKey(focusedRow, rowKey);
      const focusedIndex = tableStore.findRowIndex(focusedKey);
      if (rowIndex !== -1 && focusedIndex !== -1) {
        let start = rowIndex;
        let end = focusedIndex;
        if (start > end) {
          [start, end] = [end, start];
        }
        tableStore.addSelectedRows(...tableStore.normalData.slice(start, end + 1));
      }
    }
  }

  const selectAll = () => {
    tableStore.addSelectedRows(...tableStore.tableData.slice());
  }

  const handleChangeSelect = (event: KeyboardEvent, keyStatus = KeyStatus.UP) => {
    if (keyStatus === KeyStatus.DOWN) {
      const match = /Arrow(Up|Down|Left|Right)/i.exec(event.key);
      if (match) {
        const direction = match[1].toLowerCase() as MoveDirection;
        move(direction);
      }
    }
  }

//   @DebounceDecorator({
//     leading: false, trailing: true, wait: 600, maxWait: 100000,
//   })
  const cleanupComposeKey = () => {
    composeKey.value.shift = false;
    composeKey.value.control = false;
  }

  const handleComposeKeyEvent = (event: KeyboardEvent, keyStatus: KeyStatus) => {
    if (keyStatus === KeyStatus.DOWN) {
      composeKey.value[event.key.toLowerCase()] = keyStatus === KeyStatus.DOWN
      cleanupComposeKey();
    } else {
      composeKey.value[event.key.toLowerCase()] = false
    }
  }

const handleDispatchKeyEvent = (event: KeyboardEvent, keyStatus: KeyStatus) => {
    const { focusedRow, selectedColumn } = tableStore;
    this.$emit(`key-${keyStatus.toLowerCase()}`, focusedRow, selectedColumn, event);
  }

const handleKeyEvent = (event: KeyboardEvent, keyStatus: KeyStatus) => {
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
  }

  // FIXME: 研究这个方法上后面俩参数的作用
  const tryScrollInvisibleElem = (
    rowIndex: number, columnIndex: number, rowPosition: string, columnPosition: string,
  ) => {
    const { rowHeight } = tableOptions;
    const { scrollTop, scrollLeft } = scrollElement;
    const { viewportWidth, viewportHeight } = tableStore.layoutSize;
    const { tableData, fixedData } = tableStore;
    /**
     * 如果行是row是固定行那么不做任何操作
     * 如果当前的行高度小于scrollTop(当前行在视窗上面）
     * 或者当前行的底部大于scrollTop加上视窗高度(当前在视窗下面)
     * 就尝试使用scrollToRow方法将当前行滚动出来
     */
    const beneathTheTop = rowIndex * rowHeight < scrollTop + (fixedData.length * rowHeight);
    if (
      rowIndex >= fixedData.length
      && (beneathTheTop || (rowIndex + 1) * rowHeight > scrollTop + viewportHeight)
    ) {
      scrollToRow(tableData[rowIndex], beneathTheTop ? 'top' : 'bottom');
    }

    const column = allTableColumns[columnIndex];
    // 固定列永远显示在视窗区域，无需处理
    if (column.fixed !== false) {
      return;
    }
    const offset = tableStore.getColumnOffset(column);
    const { leftFixedColumnWidth, rightFixedColumnWidth } = tableStore;
    /**
     * 如果在左侧固定列下面或是在右侧固定列下面
     * 就尝试滚动到指定的column
     */
    const beneathTheLeft = scrollLeft + leftFixedColumnWidth > offset;
    if (
      beneathTheLeft
      || scrollLeft + viewportWidth - rightFixedColumnWidth < offset + column.width
    ) {
      scrollToColumn(column, beneathTheLeft ? 'left' : 'right');
    }
  }

 const move = (direction: MoveDirection) => {
    // TODO: 元素不可见时，自动滚动列表
    const { focusedRow, selectedColumn } = tableStore;
    if (!selectedColumn) {
      return;
    }
    const { tableData } = tableStore;
    let index = tableData.indexOf(focusedRow!);
    let columnIndex = tableStore.findColumnIndex(selectedColumn);
    if (index === -1) {
      index = 0;
    }
    if (columnIndex === -1) {
      columnIndex = 0;
    }
    let row;
    switch (direction) {
      case 'up':
        index = index === 0 ? 0 : index - 1;
        tryScrollInvisibleElem(index, columnIndex, 'top', 'left');
        row = tableData[index];
        selectRow(row);
        break;
      case 'down':
        index = index === tableData.length - 1 ? tableData.length - 1 : index + 1;
        tryScrollInvisibleElem(index, columnIndex, 'bottom', 'left');
        row = tableData[index];
        selectRow(row);
        break;
      case 'left':
        columnIndex = columnIndex === 0 ? 0 : columnIndex - 1;
        tableStore.selectedColumn = allTableColumns[columnIndex];
        tryScrollInvisibleElem(index, columnIndex, 'top', 'left');
        break;
      case 'right':
        if (columnIndex === allTableColumns.length - 1) {
          columnIndex = allTableColumns.length - 1;
        } else {
          columnIndex += 1;
        }
        tableStore.selectedColumn = allTableColumns[columnIndex];
        tryScrollInvisibleElem(index, columnIndex, 'top', 'right');
        break;
      default:
        break;
    }
  }

  const focus = () => {
    tableRef.value.focus();
  }

  const scrollToColumn = (column: TableColumnItem, position = 'left') => {
    const {
      layoutSize, leftFixedColumnWidth, rightFixedColumnWidth,
    } = tableStore;
    const offset = tableStore.getColumnOffset(column);
    if (offset >= 0) {
      let positionOffset = 0;
      if (position === 'middle') {
        positionOffset = -1 * ((layoutSize.viewportWidth / 2) - column.width);
      } else if (position === 'right') {
        positionOffset = -1 * (layoutSize.viewportWidth - column.width);
      }
      let fixedOffset = 0;
      if (position === 'left' && column.fixed !== 'left') {
        fixedOffset = leftFixedColumnWidth;
      } else if (position === 'right' && column.fixed !== 'right') {
        fixedOffset = rightFixedColumnWidth * -1;
      }
      scrollElement.scrollLeft = offset + positionOffset - fixedOffset;
    }
  }

  const  scrollToRow = (rowItem: RowItemType, position = 'top') => {
    const { rowHeight } = tableOptions;
    const { layoutSize, normalData, fixedData } = tableStore;
    const rowItemValue = getDataKey(rowItem, props.rowKey);
    const index = normalData.findIndex((item) => getDataKey(item, props.rowKey) === rowItemValue);
    if (index !== -1) {
      let positionOffset = 0;
      if (position === 'top') {
        positionOffset = -1 * fixedData.length * rowHeight;
      } else if (position === 'middle') {
        positionOffset = -1 * ((layoutSize.viewportHeight / 2) - rowHeight);
      } else if (position === 'bottom') {
        positionOffset = -1 * (layoutSize.viewportHeight - rowHeight);
      }
      const y = rowHeight * index;
      scrollElement.scrollTo(this.scrollElement.scrollLeft, y + positionOffset);
    }
  }

  const renderEmptyContent = (): VNode => {
    return h('div', {
        class:"infinite-table__empty-content",
        onDragover: (e: DragEvent) => $emit('body-dragover', e),
        onDrop: (e: DragEvent) => $emit('body-drop', e)
      },
      $slots.empty ? $slots.empty : Table.tableDefaultOptions.defaultEmptySlot(h)
    );
  }


</script>

@/hooks/useTableColumnItemHooks./hooks/useTableDataHooks./hooks/useTbaleColumnHooks