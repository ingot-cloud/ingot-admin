import "@/styles/global-loading.css";

export const useGlobalLoading = () => {
  const start = () => {
    if (window.globalLoading) {
      return;
    }
    const bodys: Element = document.body;
    const div = <HTMLElement>document.createElement("div");
    div.setAttribute("class", "in-global-loading");
    const htmls = `
			<div class="in-global-loading-box">
				<div class="in-global-loading-box-warp">
					<div class="in-global-loading-box-item"></div>
					<div class="in-global-loading-box-item"></div>
					<div class="in-global-loading-box-item"></div>
					<div class="in-global-loading-box-item"></div>
					<div class="in-global-loading-box-item"></div>
					<div class="in-global-loading-box-item"></div>
					<div class="in-global-loading-box-item"></div>
					<div class="in-global-loading-box-item"></div>
					<div class="in-global-loading-box-item"></div>
				</div>
        <div class="in-global-loading-text">加载中...</div>
			</div>

		`;
    div.innerHTML = htmls;
    bodys.insertBefore(div, bodys.childNodes[0]);
    window.globalLoading = true;
  };

  const stop = (time: number = 0) => {
    nextTick(() => {
      setTimeout(() => {
        window.globalLoading = false;
        const el = <HTMLElement>document.querySelector(".in-global-loading");
        el?.parentNode?.removeChild(el);
      }, time);
    });
  };

  return {
    start,
    stop,
  };
};

export default useGlobalLoading;
