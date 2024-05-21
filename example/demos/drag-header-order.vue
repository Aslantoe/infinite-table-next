<template>
  <div>
    <infinite-table-next
      row-key="id"
      height="500px"
      header-order-draggable
      :data="tableData"
      :table-columns="columns"
      @header-drop="handleHeaderDrop"
    ></infinite-table-next>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

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
const tableData = [
  {
    id: 1,
    date: "2016-05-02",
    name: "王小虎",
    address: "上海市普陀区金沙江路 1518 弄",
  },
  {
    id: 2,
    date: "2016-05-04",
    name: "王小虎",
    address: "上海市普陀区金沙江路 1517 弄",
  },
  {
    id: 3,
    date: "2016-05-01",
    name: "王小虎",
    address: "上海市普陀区金沙江路 1519 弄",
  },
  {
    id: 4,
    date: "2016-05-03",
    name: "王小虎",
    address: "上海市普陀区金沙江路 1516 弄",
  },
];
</script>
