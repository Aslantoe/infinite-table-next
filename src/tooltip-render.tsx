import { h, ref, VNode, onMounted, onBeforeUnmount, nextTick, inject } from "vue";
import { portal } from "@/utils/directives";
import { isEmpty } from "@/utils/object";
import { createPopper } from "@popperjs/core/lib/popper-lite";
import { tableStoreInjectKey } from "@/common/types";
import arrow from "@popperjs/core/lib/modifiers/arrow";
import preventOverflow from "@popperjs/core/lib/modifiers/preventOverflow";
import flip from "@popperjs/core/lib/modifiers/flip";
import TableStore from "@/table-store";

const tableStore: any = inject(tableStoreInjectKey)

const popper = ref();

const tooltipVisible = ref<boolean>(false);

declare let _tooltipVnode: VNode;

declare let _tooltipWrapperClass: Record<string, boolean>;

declare let _tooltip: ReturnType<typeof createPopper>;

onMounted(() => {
  tableStore.$on("show-tooltip", handleShowTooltip);
  tableStore.$on("hide-tooltip", handleHideTooltip);
});

onBeforeUnmount(() => {
  handleHideTooltip();
});

const handleShowTooltip = (
  element: HTMLElement,
  textVNode: VNode,
  wrapperClass: Record<string, boolean>
) => {
  if (element instanceof HTMLElement) {
    // tooltip 遇到textContent为空的情况会报错
    if (!isEmpty(textVNode)) {
      _tooltipVnode = textVNode;
      _tooltipWrapperClass = wrapperClass;
      tooltipVisible.value = true;
      nextTick(() => {
        _tooltip = createPopper(element, popper.value, {
          placement: "top",
          modifiers: [arrow, preventOverflow, flip],
        });
      });
    }
  }
};

const handleHideTooltip = () => {
  tooltipVisible.value = false;
  if (_tooltip) {
    _tooltip.destroy();
    // _tooltip = undefined;
  }
};

export const TooltipRender = (): VNode => {
  return (
    tooltipVisible &&
    h(
      "div",
      {
        ref: "popper",
        class: _tooltipWrapperClass,
        staticClass: "infinite-table__tooltip",
        role: "tooltip",
      },
      [
        _tooltipVnode,
        h("div", {
          class: "tooltip-arrow",
          dataPopperArrow: true,
        }),
      ]
    )
  );
};
