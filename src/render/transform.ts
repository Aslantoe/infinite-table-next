export interface AnchorItem {
    index: number;
    offset: number;
  }
export interface RangeIndex {
    startIndex: number;
    endIndex: number;
  }
  /**
   * 使用当前块的index和offset，移动的距离，行高和总共的元素个数
   * 计算移动后的index和offset
   *
   * @param {{index: number, offset: number}} anchorItem 当前的节点信息，包含index和offset
   * @param {number} delta 移动的距离，如果向上或者向左移动，那么该数字为负数
   * @param {number} rowHeight 每个元素的大小
   * @param {number} totalLength 总共的元素个数
   * @return {{offset: number, index: (*|number)}|*}
   */
export function calculateAnchorItem(
  anchorItem: AnchorItem, delta: number, rowHeight: number, totalLength: number,
): {offset: number; index: number} {
  if (delta === 0 || totalLength === 0) {
    return anchorItem;
  }
  const { index, offset } = anchorItem;
  /**
     * 滚动时元素可能只有一部分在可见部分，不可见部分的大小使用offset表示，永远是正数
     * 这种情况计算滚动距离时需要先除去offset的部分
     */
  const realDelta = delta + offset;
  let nextOffset = 0;
  let nextIndex = index + Math.floor(realDelta / rowHeight);
  /**
     * 滚动后如果nextIndex<0或者nextIndex超过了可展示的数据范围，那么重置nextIndex和nextOffset字段
     * 其他情况使用realDelta取模获取最新的offset(js中%为取余操作符，因此realDelta<0时应该加上rowHeight取模)
     */
  if (nextIndex < 0) {
    nextIndex = 0;
    nextOffset = 0;
  } else if (nextIndex >= totalLength) {
    nextIndex = totalLength - 1;
    nextOffset = 0;
  } else if (realDelta >= 0) {
    nextOffset = realDelta % rowHeight;
  } else {
    nextOffset = rowHeight + (realDelta % rowHeight);
  }

  return {
    index: nextIndex,
    offset: nextOffset,
  };
}

/**
   * 固定模式下计算startIndex和endIndex的方法
   * @param {number} offset 开始的距离
   * @param {number} itemSize 每个元素的大小
   * @param {number} delta 结束的距离
   * @param {number} maxLength 元素数量
   * @return {{startIndex: number, endIndex: number}} 开始和结束的index, 均包括
   */
export function calcFixedIndex(
  offset: number, itemSize: number, delta: number, maxLength: number,
): RangeIndex {
  const anchorItem = {
    index: Math.floor(offset / itemSize),
    offset: offset % itemSize,
  };
  const lastAnchorItem = calculateAnchorItem(anchorItem, delta, itemSize, maxLength);
  return {
    startIndex: anchorItem.index,
    endIndex: lastAnchorItem.index,
  };
}

/**
   * 非固定大小的模式下计算startIndex和endIndex的方法
   *
   * @param {Array} accumulationList 包含每列累计大小的数组
   * @param {number} offset 开始的距离
   * @param {number} delta 结束的距离
   * @return {{startIndex: number, endIndex: number}} 开始和结束的index, 均包括
   */
export function calcAccumulationIndex(
  accumulationList: number[], offset: number, delta: number,
): RangeIndex {
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < accumulationList.length; i += 1) {
    const accOffset = accumulationList[i];
    if (i < accumulationList.length - 1) {
      const nextAccOffset = accumulationList[i + 1];
      if (offset >= accOffset && offset < nextAccOffset) {
        startIndex = i;
      }
      if (
        startIndex !== -1
          && offset + delta >= accOffset && offset + delta < nextAccOffset
      ) {
        endIndex = i;
        break;
      }
    } else {
      if (startIndex === -1) {
        startIndex = i;
      }
      endIndex = i;
    }
  }
  return { startIndex, endIndex };
}
