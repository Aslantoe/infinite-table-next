import TableColumnItem from '@/store/table-column-item';
import { sumBy } from '@/utils/collection';

// TODO 修改column默认width的获取方式
const defaultColumnWidth = 80;

/**
 * 计算分配宽度为默认值的列宽度, 分配的规则是，将不能整除的部分加再在index较小的元素上
 * @param totalWidth 总共要分配的宽度
 * @param totalColumn 总共要分配的列数
 * @param index 当前列的index
 * @return {number} 该列的宽度
 */

export function calcDefaultColumnWidth(totalWidth: number, totalColumn: number, index: number) {
  const commonWidth = Math.floor(totalWidth / totalColumn);
  const modWidth = totalWidth % totalColumn;
  return commonWidth + (index < modWidth ? 1 : 0);
}

/**
 * 获取列表的高度
 *
 * @param {number} rowHeight 列表单行的高度
 * @param {number} dataLength 列表的行数
 * @return {number} 返回计算出的table高度
 */
export function getTableBodyHeight(rowHeight: number, dataLength: number) {
  return rowHeight * dataLength;
}

/**
 * 使用当前的总table宽度，设置columns的宽度，算法如下
 *
 * 1. 为所有没有宽度的列设置默认宽度
 * 2. 计算所有列的总宽度
 * 3. 如果宽度大于等于总宽度，那么计算完毕
 * 4. 如果宽度不足且存在未设置宽度的列，那么将剩余宽度平均分配到未设置宽度的列上
 * 5. 如果所有的列都是有宽度的列，那么将剩余宽度平均分配到所有的列上
 * */
export function doColumnWidthLayout(tableWidth: number, columns: TableColumnItem[]) {
  columns.forEach((column) => {
    if (!column.originalWidth) {
      // eslint-disable-next-line no-param-reassign
      column.width = defaultColumnWidth;
    } else {
      // eslint-disable-next-line no-param-reassign
      column.width = column.originalWidth;
    }
  });
  const totalColumnWidth = sumBy(columns, (item) => item.width);
  if (totalColumnWidth >= tableWidth) {
    return columns;
  }

  let reassignWidthColumns = columns;
  if (!columns.every((item) => item.originalWidth)) {
    reassignWidthColumns = columns.filter((item) => !item.originalWidth);
  }
  reassignWidthColumns.forEach((item, index) => {
    // eslint-disable-next-line no-param-reassign
    item.width += calcDefaultColumnWidth(tableWidth - totalColumnWidth, reassignWidthColumns.length, index);
  });

  return columns;
}
