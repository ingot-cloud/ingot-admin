import { computed, inject, onBeforeUnmount, ref, watch, type InjectionKey } from "vue";
import { useCapabilities, type Page, type LoadDataParams } from "@ingot/admin-core";
import { IamAction } from "../models/iam/constants";
import { IAM_DEFAULT_PAGE_SIZE } from "../models/iam";
import type { IamSelectOption } from "../models/iam";

export interface OrganizationMemberParams extends LoadDataParams {
  departmentId?: string;
  ids?: string[];
}
export interface DepartmentNavigationEntry {
  id: string;
  name: string;
}
export interface DepartmentNavigationPage {
  items: DepartmentNavigationEntry[];
  total: number;
  page: number;
  pageSize: number;
  breadcrumbs: DepartmentNavigationEntry[];
  organization?: DepartmentNavigationEntry;
}
export const OrganizationMemberScene = {
  MEMBER: "MEMBER",
  DEPARTMENT_LEADER: "DEPARTMENT_LEADER",
  ASSIGNMENT: "ASSIGNMENT",
} as const;
export interface OrganizationMemberBrowseParams extends OrganizationMemberParams {
  departmentPage?: number;
}
export interface OrganizationMemberBrowseQuery extends OrganizationMemberBrowseParams {
  scene: (typeof OrganizationMemberScene)[keyof typeof OrganizationMemberScene];
  targetDepartmentId?: string;
  delegationGrantId?: string;
}
export interface OrganizationMemberBrowseResult {
  navigationAvailable: boolean;
  navigation: DepartmentNavigationPage;
  members: Page<IamSelectOption>;
}
export type OrganizationMemberBrowseLoader = (
  params: OrganizationMemberBrowseParams,
) => Promise<OrganizationMemberBrowseResult>;
export interface OrganizationMemberPickerContext {
  browse?: (params: OrganizationMemberBrowseQuery) => Promise<OrganizationMemberBrowseResult>;
  loadDepartments: (parentId?: string, page?: number) => Promise<DepartmentNavigationPage>;
}
export interface OrganizationMemberRelation {
  boundIds: string[];
  boundItems?: IamSelectOption[];
  added?: IamSelectOption[];
  removedIds?: string[];
  partial?: boolean;
  /** 连续已加载的原始关系快照，current为最后成功页，确认时可返回更新后的快照。 */
  initialBoundPage?: Page<IamSelectOption>;
}
export const ORGANIZATION_PICKER_SCROLL_THRESHOLD = 24;

/** 同时尊重总数、服务端页位置和空页，避免去重或删除导致无限加载。 */
export function hasMoreOrganizationPage(loaded: number, total: number, page: number, size: number) {
  return loaded < total && page > 0 && size > 0 && page * size < total;
}
export function mergeOrganizationItems<T extends { id: string }>(previous: T[], next: T[]): T[] {
  return [...new Map([...previous, ...next].map((item) => [item.id, item])).values()];
}
export interface MemberPickerChanges {
  added: IamSelectOption[];
  removedIds: string[];
}
export const organizationMemberPickerKey: InjectionKey<OrganizationMemberPickerContext> = Symbol(
  "organization-member-picker",
);

/** 身份纪元、权限版本或失效状态变化时，旧候选与姓名快照不再可用。 */
export function useOrganizationMemberScopeKey(
  permissions: ReturnType<typeof useCapabilities> | undefined,
) {
  return computed(() =>
    JSON.stringify([
      permissions?.contextEpoch.value,
      permissions?.version?.value,
      permissions?.unavailable?.value,
      permissions?.actionCodes?.value,
    ]),
  );
}

/** 部门导航只使用既有读取资格，候选成员仍由各业务 loader 提供。 */
export function useOrganizationMemberNavigation(unified?: {
  enabled: () => boolean;
  load: (append: boolean) => Promise<void>;
}) {
  const context = inject(organizationMemberPickerKey, undefined);
  const permissions = context ? useCapabilities() : undefined;
  const scopeKey = useOrganizationMemberScopeKey(permissions);
  const available = ref<boolean>();
  const canBrowse = computed(
    () =>
      !!context &&
      available.value !== false &&
      !!permissions?.hasAction(IamAction.TENANT_DEPARTMENT_READ),
  );
  const parentId = ref<string>();
  const organization = ref<DepartmentNavigationEntry>();
  const items = ref<DepartmentNavigationEntry[]>([]);
  const breadcrumbs = ref<DepartmentNavigationEntry[]>([]);
  const total = ref(0),
    page = ref(0),
    loading = ref(false),
    failed = ref(false);
  const exhausted = ref(false);
  const hasMore = computed(
    () =>
      !exhausted.value &&
      hasMoreOrganizationPage(items.value.length, total.value, page.value, pageSize.value),
  );
  const pageSize = ref(IAM_DEFAULT_PAGE_SIZE);
  let request = 0;
  const load = async (append = false) => {
    if (!context || !canBrowse.value) return;
    if (unified?.enabled()) return unified.load(append);
    const current = ++request;
    loading.value = true;
    failed.value = false;
    try {
      const result = await context.loadDepartments(parentId.value, append ? page.value + 1 : 1);
      if (current !== request) return;
      apply(result, append);
    } catch {
      if (current === request) failed.value = true;
    } finally {
      if (current === request) loading.value = false;
    }
  };
  const apply = (result: DepartmentNavigationPage, append = false) => {
    items.value = append ? mergeOrganizationItems(items.value, result.items) : result.items;
    exhausted.value = result.items.length === 0;
    pageSize.value = result.pageSize;
    breadcrumbs.value = result.breadcrumbs;
    organization.value = result.organization;
    total.value = result.total;
    page.value = result.page;
  };
  const reset = () => {
    request++;
    available.value = undefined;
    parentId.value = undefined;
    organization.value = undefined;
    items.value = [];
    breadcrumbs.value = [];
    total.value = 0;
    page.value = 0;
    exhausted.value = false;
    failed.value = false;
    loading.value = false;
  };
  const navigate = (id?: string) => {
    parentId.value = id;
    items.value = [];
    breadcrumbs.value = [];
    total.value = 0;
    page.value = 0;
    exhausted.value = false;
    if (!unified?.enabled()) void load();
  };
  if (permissions) watch(scopeKey, reset);
  onBeforeUnmount(() => {
    request++;
  });
  return {
    context,
    canBrowse,
    available,
    hasMore,
    parentId,
    items,
    breadcrumbs,
    organization,
    total,
    page,
    apply,
    loading,
    failed,
    load,
    reset,
    navigate,
    scopeKey: permissions ? scopeKey : undefined,
  };
}
