<template>
  <div style="width: 800px">
    <InfiniteTableNext
      row-key="id"
      :height="500"
      :data="tableData"
      :striped="true"
      :header-order-draggable="true"
      :headerResizeable="true"
      :table-columns="columns"
      @column-resize="handleColumnResize"
      @header-drop="handleHeaderDrop"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import InfiniteTableNext from "./table.tsx";

const tableData = ref([
  { id: "1", name: "jack", age: "25", address: "star city" },
  { id: "2", name: "alice", age: "26", address: "star city" },
]);

/**
 * 列宽拖动
 */
const handleColumnResize = (columnIndex, column, size) => {
  // console.log('handleColumnResize', columnIndex, column, size);
  columns[columnIndex].width += size;
};

/**
 * 列拖拽排序
 */
const handleHeaderDrop = (_dragIndex, dragColumn, _dropIndex, dropColumn) => {
  if (dragColumn.fixed || dropColumn.fixed || _dragIndex === _dropIndex) {
    return;
  }

  const dragIndex = columns.findIndex((i) => i.label === dragColumn.label);
  const dropIndex = columns.findIndex((i) => i.label === dropColumn.label);
  if (dragIndex === -1 || dropIndex === -1) {
    return;
  }
  columns.splice(dropIndex, 0, columns.splice(dragIndex, 1)[0]);
};

const columns = reactive([
  {
    label: "id",
    prop: "id",
    fixed: "left",
    width: 100,
  },
  {
    label: "姓名",
    prop: "name",
    width: 100,
  },
  {
    label: "年龄年龄年龄年龄年龄年龄",
    prop: "age",
    width: 100,
    sortable: true,
  },
  {
    label: "地址",
    prop: "address",
    // width: 50,
  },
]);
</script>

<style scoped></style>
