import { onScopeDispose, ref, watch, type Ref } from "vue";
import { IamAction, type PlatformMemberContext } from "@ingot/admin-common";
import { PlatformMemberContextAPI } from "@/api/iam/personnel";
import { createLoadGuard, useCapabilities } from "@ingot/admin-core";

/** 成员列概览独立于分页；切换身份、授权版本或页面上下文使旧响应失效。 */
export function useMemberFieldContext(active: Ref<boolean>) {
  const { unavailable, hasAction, contextEpoch, version } = useCapabilities();
  const context = ref<PlatformMemberContext>();
  const contextLoading = ref(false);
  const contextError = ref(false);
  const guard = createLoadGuard();
  const refreshContext = async (): Promise<void> => {
    const request = guard.begin();
    context.value = undefined;
    contextError.value = false;
    contextLoading.value = false;
    if (!active.value || unavailable.value || !hasAction(IamAction.PLATFORM_MEMBER_READ)) return;
    contextLoading.value = true;
    try {
      const response = await PlatformMemberContextAPI();
      if (request.isCurrent()) context.value = response.data;
    } catch {
      if (request.isCurrent()) contextError.value = true;
    } finally {
      if (request.isCurrent()) contextLoading.value = false;
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
  return { context, contextLoading, contextError, refreshContext };
}
