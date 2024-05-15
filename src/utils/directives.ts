export const portal = {
  mounted(el: Element) {
    document.body.appendChild(el);
  },

  beforeUnmount(el: Element) {
    if ((el as any)._transitionClasses && (el as any).__vue__) {
      // Will be removed by transition
      return;
    }

    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  },
};
