import { VNode } from "vue";
import { px2num } from "@/utils/layout";
import { get } from "@/utils/object";
import {
  checkboxColumnRender,
  checkboxHeaderRender,
  defaultHeaderRender,
} from "@/render/headerRenders";
import TableStore from "@/table-store";
import {
  RowItemType,
  ElementExtraAttrs,
  ColumnFixedType,
  ColumnRenderProps,
  HeaderRenderProps,
} from "@/common/types";
import { defaultComparator } from "./table-data-store.vue";

/**
 * 默认的列渲染方法
 * 返回row中[prop]字段中的数据
 * prop可以使用a.b.c等复杂方式表示
 *
 * @param h
 * @param {{options: Object, row: Object}} props 渲染列时的对象
 * @return {string}
 */
export const defaultColumnRender = function defaultColumnRender(
  h,
  props: {
    options: TableColumnItem;
    rowIndex: number;
    row: any;
    tableStore: TableStore;
  }
): VNode | string {
  if (!props || !props.options || !props.row) {
    return "";
  }
  const { options, row } = props;
  const { prop } = options;
  if (prop) {
    return get(row, prop);
  }
  return "";
};

export function normalizeTooltipWrapperClass(
  wrapper?: TableColumnOptions["tooltipWrapperClass"]
): (row: RowItemType) => Record<string, boolean> {
  if (!wrapper) {
    return () => ({});
  }
  if (typeof wrapper === "function") {
    return wrapper;
  }
  return () => wrapper;
}

type HeaderRender = (h, props: HeaderRenderProps) => VNode;

export type ColumnRender = (h, props: ColumnRenderProps) => VNode | string;

type ColumnExtraAttrsFunc = (
  rowData: RowItemType,
  rowColumn: TableColumnItem,
  index: number
) => ElementExtraAttrs;

export interface TableColumnOptions {
  key: string;
  type: string;
  label: string;
  width: number;
  sortable: boolean;
  comparator?: (a: any, b: any, row1?: any, row2?: any) => number;
  sortBy?: string;
  prop?: string;
  fixed: ColumnFixedType;
  columnRender: ColumnRender;
  headerRender: HeaderRender;
  tooltipTrigger: "auto" | "always" | false;
  tooltipFormatter?: (props: ColumnRenderProps) => string;
  tooltipRender?: (h, props: ColumnRenderProps) => VNode | string;
  tooltipWrapperClass:
    | Record<string, boolean>
    | ((row: RowItemType) => Record<string, boolean>);
  columnExtraAttrs?: ColumnExtraAttrsFunc;
}

type OptionMerger = (
  props: Partial<TableColumnOptions>
) => Partial<TableColumnOptions>;

const columnOptionsMergers: Map<string, OptionMerger> = new Map([
  [
    "selection",
    (props) => ({
      type: "selection",
      key: "__selection__",
      width: 46,
      originalWidth: 46,
      label: "__selection__",
      fixed: props.fixed,
      comparator: undefined,
      sortable: undefined,
      prop: "",
      sortBy: "",
      columnExtraAttrs: () => ({
        class: "infinite-table__cell__selection",
      }),
      headerRender: checkboxHeaderRender,
      columnRender: checkboxColumnRender,
    }),
  ],
]);

/**
 * 创建TableColumnItem的选项
 *
 * @typedef {Object} TableColumnItemOptions
 * @property {string} label
 * @property {string} width
 * @property {boolean} sortable
 * @property {string} prop
 * @property {boolean} fixed
 * @property {function} render
 * @property {function} comparator
 *
 */
export default class TableColumnItem implements TableColumnOptions {
  tooltipRender?: (h, props: ColumnRenderProps) => VNode | string;

  key: string;

  type: string;

  label: string;

  width: number;

  // 用于记录原始设置的宽度，方便layout时使用
  originalWidth: number;

  sortable: boolean;

  comparator?: ((a: any, b: any, row1?: any, row2?: any) => number) | undefined;

  prop?: string;

  sortBy: string;

  fixed: Exclude<ColumnFixedType, true>;

  headerRender: HeaderRender;

  columnRender: ColumnRender;

  columnExtraAttrs?: ColumnExtraAttrsFunc;

  tooltipTrigger: "auto" | "always" | false;

  tooltipWrapperClass: (row: RowItemType) => Record<string, boolean>;

  constructor(options: Partial<TableColumnOptions>) {
    if (options.type && columnOptionsMergers.has(options.type)) {
      // eslint-disable-next-line no-param-reassign
      options = columnOptionsMergers.get(options.type)!(options);
    }
    if (!options.key) {
      throw new Error("[TableColumnItem]: key不能为空");
    }

    if ((options as any).render) {
      console.error("render字段已被废弃，请使用columnRender字段代替");
      // eslint-disable-next-line no-param-reassign
      options.columnRender = (options as any).render;
    }

    if (options.columnRender) {
      if (options.sortable && !options.sortBy) {
        throw new Error(
          "[TableColumnItem]: 使用render函数时排序需要设置sortBy字段"
        );
      }
      this.sortBy = options.sortBy || "";
      this.columnRender = options.columnRender;
    } else {
      this.sortBy = options.sortBy || options.prop || "";
      this.columnRender = defaultColumnRender;
    }

    this.key = options.key;
    this.type = options.type || "normal";
    this.width = px2num(options.width || 0);
    this.originalWidth = this.width;
    this.label = options.label || "";
    this.sortable = options.sortable === true;
    this.comparator = options.comparator || defaultComparator;
    this.prop = options.prop;
    this.fixed = options.fixed === true ? "left" : options.fixed || false;
    this.tooltipTrigger =
      options.tooltipTrigger === undefined ? "auto" : options.tooltipTrigger;
    this.headerRender = options.headerRender || defaultHeaderRender;
    if (options.tooltipFormatter) {
      console.error(
        "[Deprecated]: tooltipFormatter已被弃用，请使用支持VNode的tooltipRender"
      );
    }
    this.tooltipRender = options.tooltipRender;
    this.columnExtraAttrs = options.columnExtraAttrs;
    this.tooltipWrapperClass = normalizeTooltipWrapperClass(
      options.tooltipWrapperClass
    );
  }
}
