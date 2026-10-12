import { createLoadGuard, type Page, type R } from "@ingot/admin-core";
import {
  IAM_DEFAULT_PAGE_SIZE,
  RoleKind,
  type ResourceDetail,
  type RoleApplicationApi,
  type RoleApplicationTask,
  type RoleGrantList,
  type RoleRevision,
  type RoleRevisionDistribution,
  type RoleRevisionSummary,
  type RoleSummary,
} from "@ingot/admin-common";
import type { Ref } from "vue";
import { selectedGrantsOf } from "../actionCatalog";
import type { SelectedGrant } from "../wizard";

type RoleDetailApis = {
  get: (id: string) => Promise<R<ResourceDetail<RoleSummary>>>;
  grants: (id: string) => Promise<R<RoleGrantList>>;
  revisions: (id: string, page: Page) => Promise<R<Page<ResourceDetail<RoleRevision>>>>;
  applications: () => Pick<RoleApplicationApi, "list" | "distribution"> | undefined;
  canGovern: () => boolean;
};

const emptyPage = <T>(size = IAM_DEFAULT_PAGE_SIZE): Page<T> => ({
  current: 1,
  size,
  total: 0,
  records: [],
});

/** 详情各区域独立加载，历史和任务仅在激活时读取；关闭和换角色拒绝迟到响应。 */
export const useRoleDetailData = (
  apis: RoleDetailApis,
  tab: Ref<string>,
  visible: Ref<boolean>,
) => {
  const roleId = ref("");
  const detail = ref<ResourceDetail<RoleSummary>>();
  // 同角色刷新保留来源类型，避免销毁正在显示的应用任务向导。
  const roleKind = ref<RoleKind>();
  const canApply = computed(() => apis.canGovern() && roleKind.value === RoleKind.PLATFORM_CUSTOM);
  const grants = ref<SelectedGrant[]>([]);
  const latestRevision = ref<RoleRevisionSummary>();
  const distribution = ref<RoleRevisionDistribution[]>([]);
  const revisionPage = ref<Page<ResourceDetail<RoleRevision>>>(emptyPage());
  const taskPage = ref<Page<RoleApplicationTask>>(emptyPage());
  const loading = ref(false);
  const grantLoading = ref(false);
  const distributionLoading = ref(false);
  const revisionLoading = ref(false);
  const taskLoading = ref(false);
  const detailError = ref(false);
  const grantError = ref(false);
  const distributionError = ref(false);
  const revisionError = ref(false);
  const taskError = ref(false);
  const revisionsDirty = ref(true);
  const tasksDirty = ref(true);
  const distributionDirty = ref(true);
  const detailGuard = createLoadGuard();
  const grantGuard = createLoadGuard();
  const distributionGuard = createLoadGuard();
  const revisionGuard = createLoadGuard();
  const taskGuard = createLoadGuard();

  const loadDistribution = async (): Promise<void> => {
    const api = apis.applications();
    if (!visible.value || !roleId.value || !api || !canApply.value) return;
    const token = distributionGuard.begin();
    distributionLoading.value = true;
    distributionError.value = false;
    try {
      const response = await api.distribution(roleId.value);
      if (!token.isCurrent()) return;
      distribution.value = response.data;
      distributionDirty.value = false;
    } catch {
      if (token.isCurrent()) distributionError.value = true;
    } finally {
      if (token.isCurrent()) distributionLoading.value = false;
    }
  };

  const loadDetail = async (): Promise<void> => {
    if (!visible.value || !roleId.value) return;
    const token = detailGuard.begin();
    loading.value = true;
    detailError.value = false;
    try {
      const response = await apis.get(roleId.value);
      if (!token.isCurrent()) return;
      detail.value = response.data;
      roleKind.value = response.data.record.kind;
      if (distributionDirty.value && !distributionLoading.value) void loadDistribution();
    } catch {
      if (token.isCurrent()) detailError.value = true;
    } finally {
      if (token.isCurrent()) loading.value = false;
    }
  };

  const loadGrants = async (): Promise<void> => {
    if (!visible.value || !roleId.value) return;
    const token = grantGuard.begin();
    grantLoading.value = true;
    grantError.value = false;
    try {
      const response = await apis.grants(roleId.value);
      if (!token.isCurrent()) return;
      grants.value = selectedGrantsOf(response.data.items);
      latestRevision.value = response.data.revision;
    } catch {
      if (token.isCurrent()) grantError.value = true;
    } finally {
      if (token.isCurrent()) grantLoading.value = false;
    }
  };

  const loadRevisions = async (): Promise<void> => {
    if (!visible.value || !roleId.value || tab.value !== "revisions") return;
    const token = revisionGuard.begin();
    revisionLoading.value = true;
    revisionError.value = false;
    try {
      const response = await apis.revisions(roleId.value, {
        current: revisionPage.value.current,
        size: revisionPage.value.size,
      });
      if (!token.isCurrent()) return;
      revisionPage.value = response.data;
      revisionsDirty.value = false;
    } catch {
      if (token.isCurrent()) revisionError.value = true;
    } finally {
      if (token.isCurrent()) revisionLoading.value = false;
    }
  };

  const loadTasks = async (page = taskPage.value.current ?? 1): Promise<void> => {
    const api = apis.applications();
    if (!visible.value || !roleId.value || !api || !canApply.value || tab.value !== "applications")
      return;
    const token = taskGuard.begin();
    taskPage.value.current = page;
    taskLoading.value = true;
    taskError.value = false;
    try {
      const response = await api.list(roleId.value, { current: page, size: taskPage.value.size });
      if (!token.isCurrent()) return;
      taskPage.value = response.data;
      tasksDirty.value = false;
    } catch {
      if (token.isCurrent()) taskError.value = true;
    } finally {
      if (token.isCurrent()) taskLoading.value = false;
    }
  };

  const ensureActiveTab = (): void => {
    if (tab.value === "revisions" && revisionsDirty.value && !revisionLoading.value)
      void loadRevisions();
    if (tab.value === "applications" && tasksDirty.value && !taskLoading.value) void loadTasks();
  };
  watch([tab, visible, canApply], ensureActiveTab);

  const invalidateLists = (revisions: boolean, tasks: boolean): void => {
    if (revisions) {
      revisionGuard.begin();
      revisionLoading.value = false;
      revisionsDirty.value = true;
    }
    if (tasks) {
      taskGuard.begin();
      taskLoading.value = false;
      tasksDirty.value = true;
    }
    ensureActiveTab();
  };
  const refreshDistribution = (): void => {
    distributionDirty.value = true;
    void loadDistribution();
  };
  const refreshVersionMetadata = (): void => {
    void loadGrants();
    refreshDistribution();
    invalidateLists(true, true);
  };
  const refreshPublication = (): void => {
    void loadDetail();
    void loadGrants();
    invalidateLists(true, true);
  };
  const refreshApplications = (): void => {
    refreshDistribution();
    invalidateLists(false, true);
  };

  const invalidate = (): void => {
    for (const guard of [detailGuard, grantGuard, distributionGuard, revisionGuard, taskGuard])
      guard.begin();
    loading.value = grantLoading.value = distributionLoading.value = false;
    revisionLoading.value = taskLoading.value = false;
  };
  const resetData = (): void => {
    roleKind.value = undefined;
    detail.value = undefined;
    grants.value = [];
    latestRevision.value = undefined;
    distribution.value = [];
    revisionPage.value = emptyPage(revisionPage.value.size);
    taskPage.value = emptyPage(taskPage.value.size);
    detailError.value = grantError.value = distributionError.value = false;
    revisionError.value = taskError.value = false;
    revisionsDirty.value = tasksDirty.value = distributionDirty.value = true;
  };
  const open = (id: string): void => {
    invalidate();
    roleId.value = id;
    resetData();
    void loadDetail();
    void loadGrants();
  };
  watch(
    visible,
    (value) => {
      if (!value) {
        invalidate();
        roleId.value = "";
        resetData();
      }
    },
    { flush: "sync" },
  );
  onScopeDispose(invalidate);

  return {
    roleId,
    detail,
    canApply,
    grants,
    latestRevision,
    distribution,
    revisionPage,
    taskPage,
    loading,
    grantLoading,
    distributionLoading,
    revisionLoading,
    taskLoading,
    detailError,
    grantError,
    distributionError,
    revisionError,
    taskError,
    open,
    loadDetail,
    loadGrants,
    loadDistribution,
    loadRevisions,
    loadTasks,
    refreshVersionMetadata,
    refreshPublication,
    refreshApplications,
  };
};
