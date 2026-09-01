import type { Directive } from "vue";

const setConvertStyle = (obj: Record<string, string | number>): string => {
  return Object.entries(obj)
    .map(([key, value]) => `${key}:${value};`)
    .join("");
};

export const wavesDirective: Directive<HTMLElement, string | undefined> = {
  mounted(el, binding) {
    el.classList.add("waves-effect");
    if (binding.value) {
      el.classList.add(`waves-${binding.value}`);
    }
    const onCurrentClick = (event: MouseEvent): void => {
      const elDiv = document.createElement("div");
      elDiv.classList.add("waves-ripple");
      el.appendChild(elDiv);
      const styles = {
        left: `${event.offsetX}px`,
        top: `${event.offsetY}px`,
        opacity: 1,
        transform: `scale(${(el.clientWidth / 100) * 10})`,
        "transition-duration": `750ms`,
        "transition-timing-function": `cubic-bezier(0.250, 0.460, 0.450, 0.940)`,
      };
      elDiv.setAttribute("style", setConvertStyle(styles));
      setTimeout(() => {
        elDiv.setAttribute(
          "style",
          setConvertStyle({
            opacity: 0,
            transform: styles.transform,
            left: styles.left,
            top: styles.top,
          }),
        );
        setTimeout(() => {
          elDiv.remove();
        }, 750);
      }, 450);
    };
    el.addEventListener("mousedown", onCurrentClick, false);
  },
};
