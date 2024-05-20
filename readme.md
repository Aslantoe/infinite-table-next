# InfiniteTable

## 属性

| 属性                 | 描述                                                         | 类型                                  | 必须 | 默认值       |
| -------------------- | ------------------------------------------------------------ | ------------------------------------- | ---- | ------------ |
| data                 | 要显示的数据                                                 | Array                           |      | []     |
| height               | 表格的高度，可以使用css或者数字                              | [Number,String]                |      | '100%' |
| headerHeight         | 表头的高度                                                   | Number                          |      | 48           |
| rowHeight            | 每行的高度                                                   | Number                          |      | 48           |
| rowKey               | 唯一标识行的key                                              | String                          | 是   |              |
| striped              | 是否采用明亮间隔的行                                         | Boolean                         |      | true   |
| highlightCurrentRow  | 是否高亮选中的行                                             | Boolean                         |      | true   |
| multipleSelection    | 是否开启多选                                                 | Boolean                         |      | false  |
| rowExtraAttrs        | 渲染行时，额外添加的属性，可以添加style、class或是attribute。<br />如果传入的是函数，那么函数会包含rowData和index两个参数 | [Object,Funtion] |      |              |
| headerResizeable      | 是否可以通过拖拽调整列的大小                                 | Boolean                         |      | `false`  |
| headerOrderDraggable | 是否可以通过拖拽调整列的顺序                                 | Boolean                         |      | `false`  |
| rowDraggable         | 行是否可以触发html drag事件                                  | Boolean                         |      | `false`  |
| tableColumns         | 定义列参数的数组，列参数详见下方                             | Array         |是|`[]`|
| topFixedKeys | 需要置顶显示的行的key | Array ||`[]`|

## 事件

| 事件名          | 说明                              | 参数                                         |
| :-------------- | :-------------------------------- | :------------------------------------------- |
| current-change  | 当前选中的行发生变化时触发        | selectedRows                                 |
| column-resize   | 列的大小发生变化时触发            | activeIndex, activeColumn , delta            |
| header-drop     | 列顺序发生改变时触发              | dragIndex, dragColumn, dropIndex, dropColumn |
| cell-click      | 单元格点击时触发                  | rowData, column, event                       |
| row-click       | 行点击时触发                      | rowData, column, event                       |
| row-contextmenu | 在行上点击右键菜单时触发          | rowData, column, event                       |
| row-dblclick    | 在行上双击触发                    | rowData, column, event                       |
| row-dragstart   | 在行上开始拖动时触发              | rowData, column, event                       |
| row-dragend     | 在行上结束拖动时触发              | rowData, column, event                       |
| row-dragover    | draggable的物体在行上悬浮时触发   | rowData, column, event                       |
| row-drop        | 当draggable的物体拖拽到行上时触发 | rowData, column, event                       |

## 方法

| 方法名         | 说明                                 | 参数                                              |
| :------------- | :----------------------------------- | :------------------------------------------------ |
| scrollToColumn | 将列表移动到列，可以通过参数选择位置 | column, position = 'left' \| ‘middle' \| 'right'  |
| scrollToRow    | 将列表移动到行，可以通过参数选择位置 | rowItem, position = 'top' \| 'middle' \| 'bottom' |
| focus          | 获取焦点                             |                                                   |

## 列参数

| 属性       |                   | 说明                                                         | 必填                 | 可选值                 | 默认值     |
| ---------- | ----------------- | ------------------------------------------------------------ | -------------------- | ---------------------- | ---------- |
| type       | String            | 指定该列的类型，最多只能有一列的类型为selection              |                      | 'normal','selection'   | 'normal'   |
| width      | Number            | 行的宽度，如果不指定，则该列自动分配宽度                     |                      |                        |            |
| label      | String            | 行的表头显示字符                                             |                      |                        |            |
| comparator | Function          | 排序时比较两行数据大小的方法                                 |                      |                        |            |
| sortable   | Boolean           | 该列是否可以排序                                             |                      |                        | false      |
| sortBy     | String            | 不指定comparator的情况下，使用哪个字段作为排序字段，默认取prop的值 | 使用render函数时必填 |                        | 与prop相同 |
| fixed      | [String, Boolean] | 固定列                                                       |                      | false, 'left', 'right' | false      |
| ~~render~~ | Function          | <font color="#ff0000">此字段已废弃，请使用columnRender字段</font>                         |                      |                        |            |
| columnRender | Function         | 单元格的渲染函数，参数为一个包含 h, {row, options, rowIndex, tableStore}的对象 |                      |                        |            |
| tooltipTrigger | 'auto' \| 'always' \| false | tooltip触发的规则，auto宽度不足显示, always一直显示                  |                      |                        |            |
| ~~tooltipFormatter~~ | Function    | <font color="red">此字段已废弃，将在v1.8.0中删除，请使用tooltipRender字段</font> |                    |                        |            |
| tooltipRender | Function | 函数参数与columnRender相同 | | | |
| columnExtraAttrs | Function    | 接收一个方法用户返回单元格上额外的属性，与rowExtraAttrs类似，但只支持function |                    |||
