import { createResourceQueryKeys, useCapabilities, useServerPaging } from "@ingot/admin-core";
import {
  createIamPageQueryOptions,
  IamAction,
  type RoleWorkspaceQuery,
  type RoleRevision,
  type RoleSubjectSummary,
  type RoleSubjectPage,
  type ResourceDetail,
  type AssignmentRecord,
} from "@ingot/admin-common";
import {
  PlatformRoleSubjectPageQueryOptions,
  PlatformRoleSourcePageQueryOptions,
} from "@/api/iam/authorization.query";
import { PlatformRoleRevisionPageAPI } from "@/api/iam/authorization";
import type { MaybeRefOrGetter } from "vue";

const revisionQuery = createIamPageQueryOptions(
  createResourceQueryKeys("iam-platform", "role-filter-version"),
  (page, condition: RoleWorkspaceQuery | undefined, options) =>
    PlatformRoleRevisionPageAPI(String(condition?.roleId), page, options),
);

/** 只查询可见角色和当前激活主体页，Query key 包含可信身份与所选角色。 */
export const useRoleWorkspace = (active: MaybeRefOrGetter<boolean>) => {
  const { hasAction, unavailable } = useCapabilities();
  const roleId = ref("");
  const memberId = ref("");
  const subjectKind = ref<"members" | "groups">("members");
  const version = ref<{ id: string; number: string }>();
  const versionsVisible = ref(false);
  const sourcesVisible = ref(false);
  const enabled = () =>
    toValue(active) &&
    !unavailable.value &&
    hasAction(IamAction.PLATFORM_ROLE_READ) &&
    hasAction(IamAction.PLATFORM_ASSIGNMENT_READ);
  const subjects = useServerPaging<RoleSubjectSummary, RoleWorkspaceQuery>({
    queryOptions: PlatformRoleSubjectPageQueryOptions,
    enabled,
    queryWhen: (q) => !!q.roleId,
  });
  const sources = useServerPaging<ResourceDetail<AssignmentRecord>, RoleWorkspaceQuery>({
    queryOptions: PlatformRoleSourcePageQueryOptions,
    enabled: () => enabled() && sourcesVisible.value,
    queryWhen: (q) => !!q.roleId && !!q.memberId,
  });
  const versions = useServerPaging<ResourceDetail<RoleRevision>, RoleWorkspaceQuery>({
    queryOptions: revisionQuery,
    enabled: () => enabled() && versionsVisible.value,
    queryWhen: (q) => !!q.roleId,
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
    subjects.condition.revisionId = version.value?.id;
    subjects.search();
    if (sourcesVisible.value) {
      sources.condition.revisionId = version.value?.id;
      sources.search();
    }
  };
  watch(roleId, () => {
    subjectKind.value = "members";
    version.value = undefined;
    subjects.condition.keyword = undefined;
    versionsVisible.value = false;
    sourcesVisible.value = false;
    refresh();
  });
  watch([subjectKind, version], refresh);
  const showVersions = (): void => {
    versions.condition.roleId = roleId.value;
    versions.search();
    versionsVisible.value = true;
  };
  const showSources = (id: string): void => {
    memberId.value = id;
    sources.condition.roleId = roleId.value;
    sources.condition.memberId = id;
    sources.condition.revisionId = version.value?.id;
    sources.search();
    sourcesVisible.value = true;
  };
  return {
    roleId,
    subjectKind,
    version,
    subjects,
    restricted,
    refresh,
    sources,
    showSources,
    sourcesVisible,
    versions,
    versionsVisible,
    showVersions,
  };
};
