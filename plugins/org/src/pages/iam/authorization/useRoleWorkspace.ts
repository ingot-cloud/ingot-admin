import { useCapabilities, useServerPaging } from "@ingot/admin-core";
import {
  IamAction,
  type ResourceDetail,
  type RoleSubjectPage,
  type RoleSubjectSummary,
  type RoleWorkspaceQuery,
  type TenantAssignmentRecord,
} from "@ingot/admin-common";
import {
  TenantRoleSourcePageQueryOptions,
  TenantRoleSubjectPageQueryOptions,
} from "@/api/iam/authorization.query";
import type { MaybeRefOrGetter } from "vue";

/** 只查询当前选中角色和激活的成员或用户组页。 */
export const useRoleWorkspace = (active: MaybeRefOrGetter<boolean>) => {
  const { hasAction, unavailable } = useCapabilities();
  const roleId = ref("");
  const memberId = ref("");
  const subjectKind = ref<"members" | "groups">("members");
  const sourcesVisible = ref(false);
  const enabled = () =>
    toValue(active) &&
    !unavailable.value &&
    hasAction(IamAction.TENANT_ROLE_READ) &&
    hasAction(IamAction.TENANT_ASSIGNMENT_READ);
  const subjects = useServerPaging<RoleSubjectSummary, RoleWorkspaceQuery>({
    queryOptions: TenantRoleSubjectPageQueryOptions,
    enabled,
    queryWhen: (query) => !!query.roleId,
  });
  const sources = useServerPaging<ResourceDetail<TenantAssignmentRecord>, RoleWorkspaceQuery>({
    queryOptions: TenantRoleSourcePageQueryOptions,
    enabled: () => enabled() && sourcesVisible.value,
    queryWhen: (query) => !!query.roleId && !!query.memberId,
  });
  const restricted = computed(
    () =>
      (
        subjects.query.data.value as typeof subjects.query.data.value &
          Pick<RoleSubjectPage, "inheritedSourcesRestricted">
      )?.inheritedSourcesRestricted === true,
  );
  const refresh = (): void => {
    subjects.condition.roleId = roleId.value;
    subjects.condition.subjectKind = subjectKind.value;
    subjects.search();
    if (sourcesVisible.value) sources.search();
  };
  watch(roleId, () => {
    subjectKind.value = "members";
    subjects.condition.keyword = undefined;
    sourcesVisible.value = false;
    refresh();
  });
  watch(subjectKind, refresh);
  const showSources = (id: string): void => {
    memberId.value = id;
    sources.condition.roleId = roleId.value;
    sources.condition.memberId = id;
    sources.search();
    sourcesVisible.value = true;
  };
  return {
    roleId,
    subjectKind,
    subjects,
    restricted,
    refresh,
    sources,
    showSources,
    sourcesVisible,
  };
};
