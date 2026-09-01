import type { Ref } from "vue";
import { onMounted } from "vue";

const options = {
  // root: document.querySelector(".container"), // 根元素，默认为视口
  rootMargin: "0px", // 根元素的边距
  threshold: 0.5, // 可见性比例阈值
  once: true,
};

function callback(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
  entries.forEach((entry) => {
    if (entry.intersectionRatio <= 0) return;
    const img = entry.target as HTMLImageElement;
    const src = img.getAttribute("load-src");

    img.setAttribute("src", src ?? ""); // 将真实的图片地址赋给 src 属性

    img.onload = () => {
      img.setAttribute("class", "in-anim-fade-in");
    };

    observer.unobserve(img);
  });
}

export const useImageLoad = (ref: Ref) => {
  const observer = new IntersectionObserver(callback, options);

  onMounted(() => {
    Object.keys(ref.value).forEach((e) => observer.observe(ref.value[e]));
  });
};
