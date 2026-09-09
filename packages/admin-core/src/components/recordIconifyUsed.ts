import { getIcon, loadIcon } from "virtual:ingot-iconify-icon";

const ENDPOINT = "/__ingot/iconify-used";

/** 开发态把成功加载的 Iconify 图标 SVG 交给 Vite 写入 used.json。测试与生产不请求。 */
export const recordIconifyUsed = async (iconName: string): Promise<void> => {
  if (!import.meta.env.DEV || import.meta.env.MODE === "test") {
    return;
  }
  const separator = iconName.indexOf(":");
  if (separator <= 0 || separator === iconName.length - 1) {
    return;
  }
  const prefix = iconName.slice(0, separator);
  const name = iconName.slice(separator + 1);
  try {
    await loadIcon(iconName);
    const data = getIcon(iconName);
    if (!data?.body) {
      return;
    }
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prefix,
        name,
        body: data.body,
        width: data.width,
        height: data.height,
        left: data.left,
        top: data.top,
      }),
    });
  } catch {
    // 收集失败不影响预览
  }
};
