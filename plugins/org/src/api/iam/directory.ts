import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  IAM_DEFAULT_PAGE_SIZE,
  mapIamPage,
  toIamListParams,
  SelectionPurpose,
  type AccountLookupInput,
  type AccountRecord,
  type ActionRecord,
  type AudienceDraft,
  type AudienceUpdateInput,
  type CreatedResource,
  type DepartmentDraft,
  type DepartmentLeaderPage,
  type DepartmentLeaderUpdateInput,
  type DepartmentRecord,
  type DepartmentTreeRow,
  type DepartmentUpdateInput,
  type EntitlementRecord,
  type ExportTask,
  type MemberWorkbookArtifact,
  type DepartmentWorkbookExportInput,
  type MemberWorkbookExportInput,
  type MemberWorkbookFile,
  type MemberWorkbookHistoryItem,
  type MemberWorkbookMode,
  type MemberWorkbookTask,
  type GroupDraft,
  type GroupEffectiveMemberRecord,
  type GroupRecord,
  type GroupUpdateInput,
  type IamListQuery,
  type IamPageResponse,
  type TenantMemberCreateInput,
  type TenantMemberCreated,
  type TenantMemberRejoinInput,
  type MemberDepartmentInput,
  type MemberProfileInput,
  type MemberRecord,
  type MemberStatusInput,
  type OwnerTransferInput,
  type Preview,
  type ReferenceImpactPreview,
  type ResourceDetail,
  type ResourceFieldContext,
  type TenantRecord,
  type TenantSettingsInput,
  type VersionInput,
} from "@ingot/admin-common";

const MEMBER_PATH = `${IAM_API_PREFIX}/v1/tenant/members`;
const DEPT_PATH = `${IAM_API_PREFIX}/v1/tenant/departments`;
const GROUP_PATH = `${IAM_API_PREFIX}/v1/tenant/groups`;
const SETTINGS_PATH = `${IAM_API_PREFIX}/v1/tenant/settings`;
const APP_PATH = `${IAM_API_PREFIX}/v1/tenant/applications`;
const DIR_MEMBER_PATH = `${IAM_API_PREFIX}/v1/directory/members`;
const DIR_DEPT_PATH = `${IAM_API_PREFIX}/v1/directory/departments`;

const asPage = <T>(res: R<IamPageResponse<T>>): R<Page<T>> => ({
  ...res,
  data: mapIamPage(res.data),
});

const toPurposeParams = (
  page: Page,
  condition: IamListQuery | undefined,
  purpose: SelectionPurpose,
): Record<string, unknown> => {
  if (condition) {
    filterParams(condition);
  }
  return {
    ...toIamListParams(page, condition),
    purpose,
  };
};

export function TenantMemberPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<MemberRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<MemberRecord>>>(
      MEMBER_PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function TenantMemberDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<MemberRecord>>> {
  return request.get<ResourceDetail<MemberRecord>>(`${MEMBER_PATH}/${id}`, undefined, options);
}

export function TenantMemberGroupsAPI(
  id: string,
  page: Page,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<GroupRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<GroupRecord>>>(
      `${MEMBER_PATH}/${id}/groups`,
      toIamListParams(page),
      options,
    )
    .then(asPage);
}

const secretCrypto = {
  crypto: {
    response: { mode: "data_only" as const },
  },
};

export function TenantMemberCreateAPI(
  params: TenantMemberCreateInput,
  options?: RequestOptions,
): Promise<R<TenantMemberCreated>> {
  filterParams(params);
  return request.post<TenantMemberCreated>(MEMBER_PATH, params, { ...options, ...secretCrypto });
}

export function TenantMemberRejoinAPI(
  id: string,
  params: TenantMemberRejoinInput,
  options?: RequestOptions,
): Promise<R<TenantMemberCreated>> {
  filterParams(params);
  return request.post<TenantMemberCreated>(`${MEMBER_PATH}/${id}/rejoin`, params, options);
}

export function TenantMemberUpdateAPI(
  id: string,
  params: MemberProfileInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<MemberRecord>>> {
  return request.patch<ResourceDetail<MemberRecord>>(`${MEMBER_PATH}/${id}`, params, options);
}

export function TenantMemberDepartmentsAPI(
  id: string,
  params: MemberDepartmentInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<MemberRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<MemberRecord>>(
    `${MEMBER_PATH}/${id}/departments`,
    params,
    options,
  );
}

export function TenantMemberStatusAPI(
  id: string,
  params: MemberStatusInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.patch<CreatedResource>(`${MEMBER_PATH}/${id}/status`, params, options);
}

export function TenantMemberRemoveAPI(
  id: string,
  params: VersionInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${MEMBER_PATH}/${id}/remove`, params, options);
}

export function TenantMemberExportCreateAPI(
  params: VersionInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${MEMBER_PATH}/export`, params, options);
}

export function TenantMemberExportStatusAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ExportTask>> {
  return request.get<ExportTask>(`${MEMBER_PATH}/export/${id}/status`, undefined, options);
}

export function TenantMemberExportDownloadAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<MemberRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<MemberRecord>>>(
      `${MEMBER_PATH}/export/${id}`,
      undefined,
      options,
    )
    .then(asPage);
}

export function TenantMemberWorkbookTemplateAPI(
  options?: RequestOptions,
): Promise<R<MemberWorkbookFile>> {
  return request.get<MemberWorkbookFile>(`${MEMBER_PATH}/workbook/template`, undefined, options);
}

export function TenantMemberWorkbookExportAPI(
  params: MemberWorkbookExportInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${MEMBER_PATH}/workbook/export`, params, options);
}

export function TenantMemberWorkbookImportAPI(
  file: File,
  mode: MemberWorkbookMode,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  const form = new FormData();
  form.append("file", file);
  form.append("mode", mode);
  return request.post<CreatedResource>(`${MEMBER_PATH}/workbook/import`, form, options);
}

export function TenantMemberWorkbookHistoryAPI(
  options?: RequestOptions,
): Promise<R<MemberWorkbookHistoryItem[]>> {
  return request.get<MemberWorkbookHistoryItem[]>(`${MEMBER_PATH}/workbook/history`, undefined, options);
}

export function TenantMemberWorkbookStatusAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<MemberWorkbookTask>> {
  return request.get<MemberWorkbookTask>(`${MEMBER_PATH}/workbook/${id}/status`, undefined, options);
}

export function TenantMemberWorkbookFileAPI(
  id: string,
  artifact: MemberWorkbookArtifact,
  options?: RequestOptions,
): Promise<R<MemberWorkbookFile>> {
  return request.get<MemberWorkbookFile>(
    `${MEMBER_PATH}/workbook/${id}/file`,
    { artifact },
    options,
  );
}

export function TenantAccountLookupAPI(
  params: AccountLookupInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AccountRecord>>> {
  filterParams(params);
  return request.post<ResourceDetail<AccountRecord>>(
    `${IAM_API_PREFIX}/v1/platform/accounts/lookup`,
    params,
    options,
  );
}

export function TenantDepartmentTreeAPI(options?: RequestOptions): Promise<R<DepartmentTreeRow[]>> {
  return request.get<DepartmentTreeRow[]>(
    DEPT_PATH,
    { purpose: SelectionPurpose.MANAGED_DEPARTMENT },
    options,
  );
}

const flattenDepartmentTreeRows = (
  nodes: DepartmentTreeRow[],
): Array<ResourceDetail<DepartmentRecord>> => {
  const items: Array<ResourceDetail<DepartmentRecord>> = [];
  const walk = (list: DepartmentTreeRow[]): void => {
    for (const node of list) {
      items.push({
        record: node.record,
        fieldAccess: node.fieldAccess,
        capabilities: node.capabilities,
        version: node.version,
      });
      walk(node.children ?? []);
    }
  };
  walk(nodes);
  return items;
};

export async function TenantDepartmentPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<DepartmentRecord>>>> {
  const response = await TenantDepartmentTreeAPI(options);
  const records = flattenDepartmentTreeRows(response.data ?? []);
  return {
    ...response,
    data: {
      records,
      total: records.length,
      current: page.current ?? 1,
      size: page.size ?? records.length,
    },
  };
}

export function TenantDepartmentCreateAPI(
  params: DepartmentDraft,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(DEPT_PATH, params, options);
}

export function TenantDepartmentDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<DepartmentRecord>>> {
  return request.get<ResourceDetail<DepartmentRecord>>(`${DEPT_PATH}/${id}`, undefined, options);
}

export function TenantDepartmentUpdateAPI(
  id: string,
  params: DepartmentUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<DepartmentRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<DepartmentRecord>>(`${DEPT_PATH}/${id}`, params, options);
}

export function TenantDepartmentDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(`${DEPT_PATH}/${id}`, null, options);
}

export function TenantDepartmentWorkbookTemplateAPI(
  options?: RequestOptions,
): Promise<R<MemberWorkbookFile>> {
  return request.get<MemberWorkbookFile>(`${DEPT_PATH}/workbook/template`, undefined, options);
}

export function TenantDepartmentWorkbookExportAPI(
  params: DepartmentWorkbookExportInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${DEPT_PATH}/workbook/export`, params, options);
}

export function TenantDepartmentWorkbookImportAPI(
  file: File,
  mode: MemberWorkbookMode,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  const form = new FormData();
  form.append("file", file);
  form.append("mode", mode);
  return request.post<CreatedResource>(`${DEPT_PATH}/workbook/import`, form, options);
}

export function TenantDepartmentWorkbookHistoryAPI(
  options?: RequestOptions,
): Promise<R<MemberWorkbookHistoryItem[]>> {
  return request.get<MemberWorkbookHistoryItem[]>(`${DEPT_PATH}/workbook/history`, undefined, options);
}

export function TenantDepartmentWorkbookStatusAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<MemberWorkbookTask>> {
  return request.get<MemberWorkbookTask>(`${DEPT_PATH}/workbook/${id}/status`, undefined, options);
}

export function TenantDepartmentWorkbookFileAPI(
  id: string,
  artifact: MemberWorkbookArtifact,
  options?: RequestOptions,
): Promise<R<MemberWorkbookFile>> {
  return request.get<MemberWorkbookFile>(
    `${DEPT_PATH}/workbook/${id}/file`,
    { artifact },
    options,
  );
}

export function TenantGroupPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<GroupRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<GroupRecord>>>(
      GROUP_PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function TenantGroupCreateAPI(
  params: GroupDraft,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(GROUP_PATH, params, options);
}

export function TenantGroupDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<GroupRecord>>> {
  return request.get<ResourceDetail<GroupRecord>>(`${GROUP_PATH}/${id}`, undefined, options);
}

export function TenantGroupUpdateAPI(
  id: string,
  params: GroupUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<GroupRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<GroupRecord>>(`${GROUP_PATH}/${id}`, params, options);
}

export function TenantGroupDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(`${GROUP_PATH}/${id}`, null, options);
}

export function TenantGroupEffectiveMembersAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<GroupEffectiveMemberRecord>>> {
  const groupId = condition?.groupId;
  if (!groupId) {
    throw new Error("缺少用户组");
  }
  if (condition) {
    filterParams(condition);
  }
  const { groupId: _boundGroupId, ...filters } = condition;
  return request
    .get<IamPageResponse<GroupEffectiveMemberRecord>>(
      `${GROUP_PATH}/${groupId}/effective-members`,
      toIamListParams(page, filters),
      options,
    )
    .then(asPage);
}

export function TenantGroupPreviewAPI(
  id: string,
  params: GroupUpdateInput,
  options?: RequestOptions,
): Promise<R<Preview<ReferenceImpactPreview>>> {
  filterParams(params);
  return request.post<Preview<ReferenceImpactPreview>>(
    `${GROUP_PATH}/${id}/preview`,
    params,
    options,
  );
}

export function TenantSettingsAPI(
  options?: RequestOptions,
): Promise<R<ResourceDetail<TenantRecord>>> {
  return request.get(`${SETTINGS_PATH}`, undefined, options);
}

export function TenantSettingsUpdateAPI(
  params: TenantSettingsInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<TenantRecord>>> {
  filterParams(params);
  return request.put(`${SETTINGS_PATH}`, params, options);
}

const transferCrypto = {
  crypto: { request: { mode: "field" as const, fields: ["secret"] } },
};

export function TenantOwnerTransferAPI(
  params: OwnerTransferInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${SETTINGS_PATH}/owner-transfer`, params, {
    ...options,
    ...transferCrypto,
  });
}

export function TenantApplicationPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<EntitlementRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<EntitlementRecord>>>(
      APP_PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function TenantApplicationAudienceAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AudienceDraft>>> {
  return request.get<ResourceDetail<AudienceDraft>>(
    `${APP_PATH}/${id}/audience`,
    undefined,
    options,
  );
}

export function TenantApplicationAudienceUpdateAPI(
  id: string,
  params: AudienceUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AudienceDraft>>> {
  filterParams(params);
  return request.put<ResourceDetail<AudienceDraft>>(`${APP_PATH}/${id}/audience`, params, options);
}

export function TenantApplicationActionPageAPI(
  id: string,
  page: Page,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<ActionRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<ActionRecord>>>(
      `${APP_PATH}/${id}/actions`,
      toIamListParams(page),
      options,
    )
    .then(asPage);
}

export function DirectoryMemberPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<MemberRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<MemberRecord>>>(
      DIR_MEMBER_PATH,
      toPurposeParams(page, condition, SelectionPurpose.DIRECTORY),
      options,
    )
    .then(asPage);
}

export function DirectoryMemberDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<MemberRecord>>> {
  return request.get<ResourceDetail<MemberRecord>>(`${DIR_MEMBER_PATH}/${id}`, undefined, options);
}

export function DirectoryDepartmentPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<DepartmentRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<DepartmentRecord>>>(
      DIR_DEPT_PATH,
      toPurposeParams(page, condition, SelectionPurpose.DIRECTORY),
      options,
    )
    .then(asPage);
}

/** 当前身份的成员全局字段能力。 */
export function TenantMemberContextAPI(options?: RequestOptions): Promise<R<ResourceFieldContext>> {
  return request.get<ResourceFieldContext>(`${MEMBER_PATH}/context`, undefined, options);
}
/** 当前通讯录完整查询范围的字段能力。 */
export function DirectoryContextAPI(options?: RequestOptions): Promise<R<ResourceFieldContext>> {
  return request.get<ResourceFieldContext>(
    `${IAM_API_PREFIX}/v1/directory/context`,
    undefined,
    options,
  );
}

/** 查询部门实际关联的负责人，不能用人员列表 ids 拼接回查。 */
export function TenantDepartmentLeadersAPI(
  id: string,
  page: number,
  keyword?: string,
  options?: RequestOptions,
): Promise<R<DepartmentLeaderPage>> {
  return request.get<DepartmentLeaderPage>(
    `${DEPT_PATH}/${id}/leaders`,
    { page, pageSize: IAM_DEFAULT_PAGE_SIZE, keyword },
    options,
  );
}

/** 候选同时受负责人维护和已有成员读取范围约束。 */
export function TenantDepartmentLeaderCandidatesAPI(
  id: string,
  page: number,
  keyword?: string,
  options?: RequestOptions,
  browseDepartmentId?: string,
): Promise<R<DepartmentLeaderPage>> {
  return request.get<DepartmentLeaderPage>(
    `${DEPT_PATH}/${id}/leader-candidates`,
    { page, pageSize: IAM_DEFAULT_PAGE_SIZE, keyword, browseDepartmentId },
    options,
  );
}

/** 只提交显式增删和设主差量，不覆盖未加载关系。 */
export function TenantDepartmentLeadersUpdateAPI(
  id: string,
  params: DepartmentLeaderUpdateInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.patch<CreatedResource>(`${DEPT_PATH}/${id}/leaders`, params, options);
}

/** 按权限读取人员选择器的当前部门分支。 */
export function TenantDepartmentNavigationAPI(
  parentId?: string,
  page = 1,
): Promise<R<import("@ingot/admin-common").DepartmentNavigationPage>> {
  return request.get(`${DEPT_PATH}/member-picker-navigation`, {
    parentId,
    page,
    pageSize: IAM_DEFAULT_PAGE_SIZE,
  });
}
/** 最小组织成员候选及少量已知ID回显。 */
export async function TenantMemberPickerLoad(
  params: import("@ingot/admin-common").OrganizationMemberParams,
): Promise<Page<import("@ingot/admin-common").IamSelectOption>> {
  const response = await request.get<IamPageResponse<MemberRecord>>(`${MEMBER_PATH}/picker`, {
    departmentId: params.departmentId,
    keyword: params.query,
    ids: params.ids,
    page: params.current || 1,
    pageSize: params.size || IAM_DEFAULT_PAGE_SIZE,
  });
  return {
    current: response.data.page,
    size: response.data.pageSize,
    total: Number(response.data.total),
    records: response.data.items.map((item) => ({
      id: item.id,
      name: item.displayName || "姓名受限",
      avatar: item.avatar,
      available: item.status === "ACTIVE",
      summary: item.departments.map((department) => department.name).join("、"),
    })),
  };
}
export function TenantDepartmentEditAPI(
  id: string,
  input: {
    expectedVersion: string;
    department?: DepartmentDraft;
    leaders?: Omit<DepartmentLeaderUpdateInput, "expectedVersion">;
  },
): Promise<R<ResourceDetail<DepartmentRecord>>> {
  return request.patch(`${DEPT_PATH}/${id}`, input);
}

/** 组直接成员独立关联分页，供组织人员选择器已选栏使用。 */
export async function TenantGroupBoundMembersLoad(
  id: string,
  params: import("@ingot/admin-common").OrganizationMemberParams,
): Promise<Page<import("@ingot/admin-common").IamSelectOption>> {
  const response = await request.get<IamPageResponse<MemberRecord>>(`${GROUP_PATH}/${id}/members`, {
    page: params.current || 1,
    pageSize: params.size || IAM_DEFAULT_PAGE_SIZE,
  });
  return {
    current: response.data.page,
    size: response.data.pageSize,
    total: Number(response.data.total),
    records: response.data.items.map((item) => ({
      id: item.id,
      name: item.displayName || "姓名受限",
      avatar: item.avatar,
      available: item.status === "ACTIVE",
      summary: item.departments.map((department) => department.name).join("、"),
    })),
  };
}

const MEMBER_PICKER_PATH = `${IAM_API_PREFIX}/v1/tenant/member-picker`;
/** 一次请求返回组织导航和场景候选，真实任职与虚拟根标签分别消费。 */
export async function TenantOrganizationMemberBrowseAPI(
  params: import("@ingot/admin-common").OrganizationMemberBrowseQuery,
  options?: RequestOptions,
): Promise<R<import("@ingot/admin-common").OrganizationMemberBrowseResult>> {
  type Result = {
    navigationAvailable: boolean;
    navigation: import("@ingot/admin-common").DepartmentNavigationPage;
    members: IamPageResponse<{
      id: string;
      name?: string;
      avatar?: string;
      available: boolean;
      departments: { id: string; name: string }[];
      implicitRoot?: { id: string; name: string };
    }>;
  };
  const response = await request.get<Result>(
    `${MEMBER_PICKER_PATH}/browse`,
    {
      scene: params.scene,
      departmentId: params.departmentId,
      keyword: params.query,
      targetDepartmentId: params.targetDepartmentId,
      delegationGrantId: params.delegationGrantId,
      page: params.current || 1,
      pageSize: params.size || IAM_DEFAULT_PAGE_SIZE,
      departmentPage: params.departmentPage || 1,
      departmentPageSize: IAM_DEFAULT_PAGE_SIZE,
    },
    options,
  );
  return {
    ...response,
    data: {
      navigationAvailable: response.data.navigationAvailable,
      navigation: response.data.navigation,
      members: {
        current: response.data.members.page,
        size: response.data.members.pageSize,
        total: Number(response.data.members.total),
        records: response.data.members.items.map((item) => ({
          id: item.id,
          name: item.name || "姓名受限",
          avatar: item.avatar,
          available: item.available,
          summary:
            item.departments.map((department) => department.name).join("、") ||
            item.implicitRoot?.name,
        })),
      },
    },
  };
}
