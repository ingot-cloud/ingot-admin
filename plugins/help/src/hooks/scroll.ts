import { nextTick } from "vue";
import type { HelpRuntime } from "../runtime";

export async function restoreHelpPosition(runtime: HelpRuntime, fullPath: string): Promise<void> {
  await nextTick();
  const container = document.querySelector<HTMLElement>("[data-help-scroll]");
  const hash = fullPath.includes("#") ? fullPath.slice(fullPath.indexOf("#") + 1) : "";
  const target = hash ? document.getElementById(hash) : null;
  if (target && container?.contains(target)) target.scrollIntoView({ block: "start" });
  else if (container) container.scrollTop = runtime.positions.get(fullPath) ?? 0;
}
