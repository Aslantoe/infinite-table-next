<template>
  <div style="width: 800px">
    <InfiniteTableNext
      row-key="id"
      :height="500"
      :data="tableData"
      :table-columns="columns"
      :row-extra-attrs="rowExtraClass"
      :striped="true"
      header-height="48px"
      row-height="45px"
      header-resizeable
      header-order-draggable
      highlight-current-cell
      highlight-current-row
      multiple-selection
      @column-resize="handleColumnResize"
      @header-drop="handleHeaderDrop"
      @row-dblclick="handlerRowDblclick"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="tsx">
import { reactive, ref } from "vue";
import InfiniteTableNext from "./table.vue";

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
]);

const rowExtraClass = (rowItem, rowIndex) => {
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
  console.log('当前行', row);
  
};

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

const handlerRowDblclick = (row, line) => {
  console.log("双击当前行", row, line);
};

const columns = reactive([
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
    columnRender: (h, { row }) => {
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
    label: "地址",
    prop: "address",
  },
  {
    label: "Tag",
    prop: "tag",
    fixed: "right",
  },
]);
</script>

<style scoped></style>
