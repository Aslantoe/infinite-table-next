<script lang="tsx">
import {
  defineComponent,
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { portal } from "./utils/directives";
import { isEmpty } from "./utils/object";
import { createPopper } from "@popperjs/core/lib/popper-lite";
import arrow from "@popperjs/core/lib/modifiers/arrow";
import preventOverflow from "@popperjs/core/lib/modifiers/preventOverflow";
import flip from "@popperjs/core/lib/modifiers/flip";
import { eventBus } from "./eventBus";

export default defineComponent({
  name: "TooltipRender",
  directives: {
    portal,
  },
  setup() {
    const popperRef = ref();
    const tooltipVisible = ref<Boolean>(false);
    const _tooltipVnode = ref();
    const _tooltipWrapperClass = ref();
    let _tooltip: ReturnType<typeof createPopper>;

    onMounted(() => {
      eventBus.on("hide-tooltip", () => {
        handleHideTooltip();
      });
      eventBus.on("show-tooltip", (data) => {
        const { element, textVNode, wrapperClass } = data;
        handleShowTooltip(element, textVNode, wrapperClass);
      });
    });

    onBeforeUnmount(() => {
      handleHideTooltip();
    });

    /**
     * 显示 tooltip
     * @param element
     * @param textVNode
     * @param wrapperClass
     */
    const handleShowTooltip = (
      element: HTMLElement,
      textVNode,
      wrapperClass: Record<string, boolean>
    ) => {
      if (element instanceof HTMLElement) {
        // tooltip 遇到textContent为空的情况会报错
        if (!isEmpty(textVNode)) {
          _tooltipVnode.value = textVNode;
          _tooltipWrapperClass.value = wrapperClass;
          tooltipVisible.value = true;
          nextTick(() => {
            _tooltip = createPopper(element, popperRef.value, {
              placement: "top",
              modifiers: [arrow, preventOverflow, flip],
            });
          });
        }
      }
    };
    /**
     * 隐藏 tooltip
     */
    const handleHideTooltip = () => {
      tooltipVisible.value = false;
      if (_tooltip) {
        _tooltip.destroy();
        _tooltip = undefined;
      }
    };

    return () =>
      tooltipVisible.value && (
        <div
          v-portal
          ref={popperRef}
          class={["infinite-table__tooltip", _tooltipWrapperClass.value]}
          role="tooltip"
        >
          {_tooltipVnode.value}
          <div class="tooltip-arrow" data-popper-arrow="true" />
        </div>
      );
  },
});
</script>
