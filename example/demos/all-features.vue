<template>
  <div style="width: 100%">
    <button @click="addColumn">添加一列</button>
    <button @click="removeColumn">减少一列</button>
    <button @click="rowFixed">置顶</button>
    <button @click="rowFixedCancel">取消置顶</button>
    <button @click="toLastRow">滚动到最后一行</button>
    <button @click="toFirstRow">滚动到第一行</button>
    <InfiniteTableNext ref="myTable" row-key="id" header-height="48px" row-height="45px" header-resizeable
      header-order-draggable highlight-current-cell highlight-current-row :height="400" :data="tableData"
      :table-columns="columns" :row-extra-attrs="rowExtraClass" :striped="true" :multiple-selection="true"
      :top-fixed-keys="topFixedKeys" @column-resize="handleColumnResize" @header-drop="handleHeaderDrop"
      @row-dblclick="handlerRowDblclick" @current-change="handleCurrentChange" @row-contextmenu="handleContextmenu"
      @cell-click="handleCellClick" />
  </div>
</template>

<script setup lang="tsx">

// @ts-nocheck
import { ref } from "vue";

const handleCellClick = (data, columnOption, evt, index) => {
  console.log('cell-click', data, columnOption, evt, index);
};

const myTable = ref();

const toLastRow = () => {
  myTable.value.scrollToRow(tableData.value[10], "bottom");
};

const toFirstRow = () => {
  myTable.value.scrollToRow(tableData.value[0], "top");
};

const handleContextmenu = (row, column, event) => {
  // 阻止右键默认行为
  event.preventDefault();
  console.log("右键", row, column, event);
};

const topFixedKeys = ref([]);

const rowFixed = () => {
  topFixedKeys.value = ["1", "2"];
};

const rowFixedCancel = () => {
  topFixedKeys.value = [];
};

const addColumn = () => {
  const columnIndex = columns.value.length;
  columns.value.push({
    label: columnIndex,
    width: Math.random() * 500 + 20,
    sortable: true,
    prop: "key",
    sortBy: "key",
    columnRender: (_h, { row }) => {
      return `${row.id}-${columnIndex}000000000000000000000000000000000000000`;
    },
  });
};

const removeColumn = () => {
  columns.value = columns.value.slice(0, columns.value.length - 1);
};

const tableData = ref([
  {
    id: "1",
    date: "2016-05-03",
    age: 25,
    name: "Tom",
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Home",
  },
  {
    id: "2",
    date: "2016-05-02",
    age: 26,
    name: "Tom",
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Office",
  },
  {
    id: "3",
    date: "2016-05-04",
    age: 27,
    name: "Tom",
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Home",
  },
  {
    id: "4",
    date: "2016-05-01",
    name: "Tom",
    age: 18,
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Office",
  },
  {
    id: "5",
    date: "2016-05-02",
    name: "Tom",
    age: 18,
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Office",
  },
  {
    id: "6",
    date: "2016-05-02",
    name: "Tom",
    age: 18,
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Office",
  },
  {
    id: "7",
    date: "2016-05-02",
    name: "Tom",
    age: 18,
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Office",
  },
  {
    id: "8",
    date: "2016-05-02",
    name: "Tom",
    age: 18,
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Office",
  },
  {
    id: "9",
    date: "2016-05-02",
    name: "Tom",
    age: 18,
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Office",
  },
  {
    id: "10",
    date: "2016-05-02",
    name: "Tom",
    age: 18,
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Office",
  },
  {
    id: "11",
    date: "2016-05-02",
    name: "Tom",
    age: 18,
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Office",
  }
]);

const rowExtraClass = (rowItem, _rowIndex) => {
  const timestamp = new Date("2016-05-02").valueOf();
  if (new Date(rowItem.date).valueOf() < timestamp) {
    return {
      style: {
        background: "pink",
      },
    };
  }
  return {};
};

const handleCurrentChange = (row) => {
  console.log("当前行", row);
};

/**
 * 列宽拖动
 */
const handleColumnResize = (columnIndex, column, size) => {
  columns.value[columnIndex].width = column.width;
  columns.value[columnIndex].width += size;
};

/**
 * 列拖拽排序
 */
const handleHeaderDrop = (_dragIndex, dragColumn, _dropIndex, dropColumn) => {
  if (dragColumn.fixed || dropColumn.fixed || _dragIndex === _dropIndex) {
    return;
  }

  const dragIndex = columns.value.findIndex(
    (i) => i.label === dragColumn.label
  );
  const dropIndex = columns.value.findIndex(
    (i) => i.label === dropColumn.label
  );
  if (dragIndex === -1 || dropIndex === -1) {
    return;
  }
  columns.value.splice(dropIndex, 0, columns.value.splice(dragIndex, 1)[0]);
};

const handlerRowDblclick = (row, line) => {
  console.log("双击当前行", row, line);
};

const update = (row) => {
  console.log("update", row);
};

let columns = ref([
  { type: "selection", key: "selection", fixed: "left" },
  {
    label: "id",
    prop: "id",
    fixed: "left",
    width: 100,
  },
  {
    label: "日期日期日期日期日期日期",
    prop: "date",
    fixed: "left",
    width: 100,
    columnRender: (_h, { row }) => {
      return <div style="color: yellow">{row.date}</div>;
    },
  },
  {
    label: "姓名",
    prop: "name",
    width: 100,
  },
  {
    label: "年龄",
    prop: "age",
    width: 100,
    sortable: true,
  },
  {
    label: "州",
    prop: "state",
    width: 100,
  },
  {
    label: "城市",
    prop: "city",
    width: null,
  },
  {
    label: "地址",
    prop: "address",
  },
  {
    label: "zip",
    prop: "zip",
  },
  {
    label: "Tag",
    prop: "tag",
  },
  {
    label: "操作",
    fixed: "right",
    width: 200,
    columnRender: (h, { row }) => {
      return (
        <div>
          <button onclick={() => update(row)}>update</button>
          <button>delete</button>
        </div>
      );
    },
  },
]);
</script>

<style scoped></style>
