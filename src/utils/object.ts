import getValue from 'get-value';

export function get(target: any, path: string | ((item: any) => any), options?: any) {
  if (typeof path === 'function') {
    return path(target);
  }
  return getValue(target, path, options);
}

/**
 * 获取行数据的唯一key值
 * @param row 行数据
 * @param dataKey 获取行唯一标识的字段或方法
 */
export function getDataKey(row: any, dataKey: string | ((item: any) => string)): string {
  let key: string;
  if (typeof dataKey === 'function') {
    key = dataKey(row);
  } else {
    key = getValue(row, dataKey);
  }
  return key;
}

export function intersection(d1: Iterable<any>, d2: Iterable<any>) {
  const setA = new Set(d1);
  const setB = new Set(d2);
  const _intersection = new Set();
  // eslint-disable-next-line no-restricted-syntax
  for (const elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem);
    }
  }
  return _intersection;
}

/**
 * 判断对象是否为空
 * @param a
 */
export function isEmpty(a: any) {
  return a === null || a === undefined || a === '';
}
