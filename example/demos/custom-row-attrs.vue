<template>
  <div>
    <infinite-table-next
      row-key="id"
      :data="tableData"
      :table-columns="tableColumns"
      :row-extra-attrs="rowExtraClass"
      height="500px"
    >
    </infinite-table-next>
  </div>
</template>

<script setup lang="tsx">
const tableColumns = [
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
];
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
const rowExtraClass = (rowItem, rowIndex) => {
  const timestamp = new Date("2016-05-02").valueOf();
  if (new Date(rowItem.date).valueOf() < timestamp) {
    console.log(1);
    return {
      style: {
        background: "pink",
      },
    };
  }
  return {};
};
</script>

<style scoped></style>
