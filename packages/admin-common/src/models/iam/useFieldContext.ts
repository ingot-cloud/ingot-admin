import { onScopeDispose, ref, watch, type Ref } from "vue";
import { createLoadGuard, useCapabilities, type R } from "@ingot/admin-core";
import type { ResourceFieldContext } from "./types";

/** 按身份和授权版本刷新字段能力；失败或换身份时先关闭旧能力。 */
export function useFieldContext(
  action: string,
  loader: () => Promise<R<ResourceFieldContext>>,
  active: Ref<boolean>,
) {
  const { unavailable, hasAction, contextEpoch, version } = useCapabilities();
  const context = ref<ResourceFieldContext>();
  const loading = ref(false);
  const error = ref(false);
  const guard = createLoadGuard();
  const refreshContext = async (): Promise<void> => {
    const request = guard.begin();
    context.value = undefined;
    error.value = false;
    loading.value = false;
    if (!active.value || unavailable.value || !hasAction(action)) return;
    loading.value = true;
    try {
      const response = await loader();
      if (request.isCurrent()) context.value = response.data;
    } catch {
      if (request.isCurrent()) error.value = true;
    } finally {
      if (request.isCurrent()) loading.value = false;
    }
  };
  watch(
    [active, contextEpoch, version, unavailable],
    () => {
      void refreshContext();
    },
    { immediate: true },
  );
  onScopeDispose(() => {
    guard.begin();
  });
  return { context, contextLoading: loading, contextError: error, refreshContext };
}
