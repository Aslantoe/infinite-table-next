<template>
  <div class="range-render">
    <div
      v-if="pool.length"
      v-for="item of pool"
      :key="item.props.id"
      class="range-render__item"
      :style="{
        transform: `translate${direction === 'vertical' ? 'Y' : 'X'}(${
          item.position
        }px)`,
      }"
    >
      <slot :data="item.data" :index="item.props.index" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, ref, watch, onMounted, computed, toRaw } from "vue";
import get from "get-value";
import { calcAccumulationIndex, calcFixedIndex } from "./transform";
import "./style.scss";

interface ViewItem {
  position: number;
  data: any;
  props: {
    active: boolean;
    key: string;
    index: number;
  };
}

type RangeDirection = "vertical" | "horizontal";

const props = defineProps({
  /**
   * 要渲染的数组，必填
   * */
  data: {
    type: Array as PropType<any[]>,
    required: true,
    default: () => [],
  },
  /**
   * 列表的方向，可选值 vertical horizontal
   * 默认为vertical
   */
  direction: {
    type: String as PropType<RangeDirection>,
    default: "vertical",
  },
  /**
   * 默认offset
   */
  offset: {
    type: Number,
    required: true,
  },
  /**
   * 可视区域的尺寸
   */
  viewportSize: {
    type: Number,
    required: true,
  },
  /**
   * 唯一识别数据的key
   */
  dataKey: {
    type: [String, Function],
    required: true,
  },
  /**
   * 单个元素的尺寸，适用于每个元素尺寸都相同的模式
   */
  size: {
    type: Number,
    default: null,
  },
  /**
   * 获取元素大小的字段，适用于每个元素尺寸不同的模式
   */
  sizeField: {
    type: String,
    default: null,
  },
  /**
   * 前置的元素个数
   */
  leadingSize: {
    type: Number,
    default: 0,
  },
  /**
   * 后置的元素个数
   */
  trailSize: {
    type: Number,
    default: 0,
  },
});
/**
 * RangeRender 按需渲染列表的组件
 *
 */

const pool: any = [];

/**
 * 计算每个元素的位置
 */
const accumulationOffset = (): any[] => {
  if (props.sizeField) {
    let sum = 0;
    return props.data.map((item: any, index: number, data: any[]) => {
      if (index === 0) {
        return 0;
      }
      const lastItem = data[index - 1];
      const size = get(lastItem, props.sizeField);
      const offset = sum + size;
      sum += size;
      return offset;
    });
  }
  return [];
};

/**
 * 使用计算属性返回所有的props，以便统一watch
 */
const componentProps = computed(() => {
  return {
    data: props.data,
    offset: props.offset,
    viewportSize: props.viewportSize,
    size: props.size,
    sizeField: props.sizeField,
    leadingSize: props.leadingSize,
    trailSize: props.trailSize,
    direction: props.direction,
  };
});

const viewId = ref(0);

const cacheViewList = ref<ViewItem[]>([]);

let activeViewMap: Map<string, ViewItem> = new Map();

onMounted(() => {
  handleIndexChange();

  console.log("pool", pool);
});

watch(
  () => componentProps,
  () => {
    handleIndexChange();
  },
  { deep: true }
);

const addToPool = (
  view: { data: any; position: number },
  index: number,
  key: string
): ViewItem => {
  const viewProps = {
    id: viewId,
    active: true,
    index,
    key,
  };

  viewId.value += 1;

  Object.defineProperty(view, "props", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: viewProps,
  });
  pool.push(view);

  return view as ViewItem;
};

/**
 * 当前viewItem不再被显示，将viewItem从map中删除并添加到一个cache列表中去
 * 同时改变viewItem的位置和状态
 */
const invalidViewItem = (viewItem: ViewItem): void => {
  activeViewMap.delete(viewItem.props.key);
  cacheViewList.value.push(viewItem);
  // eslint-disable-next-line no-param-reassign
  viewItem.position = -99999;
  // eslint-disable-next-line no-param-reassign
  viewItem.props.active = false;
};

/**
 * 当offset变化或数据发生变化的时候调用此方法
 */
const handleIndexChange = (): void => {
  console.log(11111111);

  const { offset, viewportSize, dataKey, data, size, sizeField } = props;

  let startIndex: number; // 开始的index，包含
  let endIndex: number; // 结束的index，不包含
  /**
   * 如果是固定大小的模式
   * 直接计算startIndex和endIndex
   * 如果是动态大小的模式，则使用累加的方式
   */
  if (!sizeField) {
    const fixedIndex = calcFixedIndex(offset, size, viewportSize, data.length);
    startIndex = fixedIndex.startIndex;
    endIndex = fixedIndex.endIndex + 1;
  } else {
    const accumulation = calcAccumulationIndex(
      accumulationOffset(),
      offset,
      viewportSize
    );
    startIndex = accumulation.startIndex;
    endIndex = accumulation.endIndex + 1;
  }

  startIndex = Math.max(0, startIndex - props.leadingSize);
  endIndex = Math.min(data.length, endIndex + props.trailSize);

  // 清理现有的pool，将没有在展示的viewItem无效化
  for (let i = 0; i < pool.length; i += 1) {
    const viewItem = pool[i];
    const currentData = props.data[viewItem.props.index];
    /**
     * 判断元素是否在显示范围内
     * 或者元素本身已经不在原来的位置(data发生变化)
     * 需要额外判断元素是否已经失效，避免同一个viewItem多次执行invalid操作
     */
    if (
      (viewItem.props.index < startIndex ||
        viewItem.props.index >= endIndex ||
        viewItem.data !== currentData) && // 当data本身发生变化时，单独使用index判断元素是否生效是不够的，需要对比元素本身是否变化
      viewItem.props.active
    ) {
      invalidViewItem(viewItem);
    }
  }
  /**
   * 循环设置startIndex到endIndex的viewItem
   * 此方法会优先尝试从activeViewMap中获取，获取到了证明该节点已存在且位置正确无需更新
   * 如果不存在，那么会再尝试从cacheViewList中获取已经失效的viewItem，存在的话会使用该节点更新位置和数据
   * 如果上面两种都没有执行，那么会创建一个新的viewItem并添加到pool当中，随后会更新该viewItem的位置和数据
   */
  for (let i = startIndex; i < endIndex; i += 1) {
    const item = props.data[i];
    const key =
      typeof dataKey === "function" ? dataKey(item) : get(item, dataKey);
    if (key === undefined || key === null) {
      throw new Error("[range-render]: 无法获取数据的唯一key值");
    }
    let viewItem: ViewItem | undefined = activeViewMap.get(key);
    console.log("viewitem");

    if (!viewItem) {
      viewItem = cacheViewList.value.pop();
      if (viewItem) {
        viewItem.data = item;
        viewItem.props.key = key;
        viewItem.props.index = i;
        viewItem.props.active = true;
      } else {
        viewItem = addToPool({ data: item, position: 0 }, i, key);
      }
      activeViewMap.set(viewItem.props.key, viewItem);
    }
    if (size) {
      viewItem.position = props.size * i;
    } else {
      viewItem.position = accumulationOffset[i];
    }
  }
};
</script>
