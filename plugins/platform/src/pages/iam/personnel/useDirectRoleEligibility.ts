import { computed, onMounted, ref, watch } from "vue";
import { useCapabilities } from "@ingot/admin-core";
import { IamAction, type AssignmentContext } from "@ingot/admin-common";
import { PlatformAssignmentContextAPI } from "@/api/iam/authorization";
export function useDirectRoleEligibility() {
  const { hasAction, contextEpoch } = useCapabilities();
  const context = ref<AssignmentContext>();
  let epoch = 0;
  const refresh = async (): Promise<void> => {
    const current = ++epoch;
    context.value = undefined;
    if (
      !hasAction(IamAction.PLATFORM_ASSIGNMENT_CREATE) &&
      !hasAction(IamAction.PLATFORM_ASSIGNMENT_DELETE)
    )
      return;
    try {
      const response = await PlatformAssignmentContextAPI();
      if (current === epoch) context.value = response.data;
    } catch {
      if (current === epoch) context.value = undefined;
    }
  };
  watch(contextEpoch, () => {
    void refresh();
  });
  onMounted(() => {
    void refresh();
  });
  return {
    canGrantDirect: computed(() => context.value?.directCreate === true),
    canReplaceDirect: computed(
      () => context.value?.directCreate === true && context.value?.directRevoke === true,
    ),
    refresh,
  };
}
