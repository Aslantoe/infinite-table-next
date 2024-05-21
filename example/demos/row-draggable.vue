<template>
  <div>
    <infinite-table-next
      row-key="id"
      height="500px"
      row-draggable
      :data="tableData"
      :table-columns="columns"
      @row-dragstart="handleRowDragStart"
      @row-dragover="handleRowDragOver"
      @row-drop="handleRowDrop"
    ></infinite-table-next>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";

const dragStartItem = ref();

const handleRowDragStart = (rowItem, column, event) => {
  dragStartItem.value = rowItem;
  event.dataTransfer.setData("row-item", rowItem.id);
};

const handleRowDragOver = (rowItem, column, event) => {
  if ([].indexOf.call(event.dataTransfer.types, "row-item") !== -1) {
    event.preventDefault();
  }
};

const handleRowDrop = (rowItem, column, event) => {
  const dropIndex = tableData.indexOf(rowItem);
  const dragIndex = tableData.indexOf(dragStartItem.value);
  tableData.splice(dragIndex, 1);
  tableData.splice(dropIndex, 0, dragStartItem.value);
};

const columns = ref([
  {
    label: "日期",
    prop: "date",
  },
  {
    label: "姓名",
    prop: "name",
  },
  {
    label: "地址",
    prop: "address",
  },
]);
const tableData = reactive([
  {
    id: 1,
    date: "2016-05-02",
    name: "1王小虎",
    address: "上海市普陀区金沙江路 1518 弄",
  },
  {
    id: 2,
    date: "2016-05-04",
    name: "2王小虎",
    address: "上海市普陀区金沙江路 1517 弄",
  },
  {
    id: 3,
    date: "2016-05-01",
    name: "3王小虎",
    address: "上海市普陀区金沙江路 1519 弄",
  },
  {
    id: 4,
    date: "2016-05-03",
    name: "4王小虎",
    address: "上海市普陀区金沙江路 1516 弄",
  },
]);
</script>
