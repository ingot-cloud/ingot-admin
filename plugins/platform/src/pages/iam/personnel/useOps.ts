import { computed, watch, type Ref } from "vue";
import {
  IamAction,
  pruneFieldFilters,
  type IamListQuery,
  type ResourceDetail,
  type MemberRecord,
} from "@ingot/admin-common";
import { PlatformMemberPageQueryOptions } from "@/api/iam/personnel.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";
import { useMemberFieldContext } from "./useMemberFieldContext";

export const useOps = (active: Ref<boolean>) => {
  const { unavailable, hasAction } = useCapabilities();
  const fields = useMemberFieldContext(active);
  const enabled = () =>
    active.value &&
    !unavailable.value &&
    hasAction(IamAction.PLATFORM_MEMBER_READ) &&
    Boolean(fields.context.value);
  const paging = useServerPaging<ResourceDetail<MemberRecord>, IamListQuery>({
    queryOptions: PlatformMemberPageQueryOptions,
    enabled,
  });
  watch(fields.context, (value) => {
    const result = pruneFieldFilters(
      paging.condition,
      { name: "displayName" },
      value?.fieldOperations,
      IamAction.PLATFORM_MEMBER_READ,
    );
    if (result.changed) {
      paging.condition.name = undefined;
      paging.search();
    }
  });
  const refreshData = (): void => {
    paging.search();
  };
  return {
    paging,
    refreshData,
    ...fields,
    loading: computed(() => fields.contextLoading.value || paging.fetching.value),
  };
};
