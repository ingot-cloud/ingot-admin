import figure_tenant_assignment_flow_image from "./assets/tenant-assignment-flow.png?url&no-inline";
import figure_tenant_assignment_flow_thumb from "./assets/tenant-assignment-flow-thumb.png?url&no-inline";
import figure_tenant_delegation_ceilings_image from "./assets/tenant-delegation-ceilings.png?url&no-inline";
import figure_tenant_delegation_ceilings_thumb from "./assets/tenant-delegation-ceilings-thumb.png?url&no-inline";
import figure_tenant_department_import_image from "./assets/tenant-department-import.png?url&no-inline";
import figure_tenant_department_import_thumb from "./assets/tenant-department-import-thumb.png?url&no-inline";
import figure_tenant_download_states_image from "./assets/tenant-download-states.png?url&no-inline";
import figure_tenant_download_states_thumb from "./assets/tenant-download-states-thumb.png?url&no-inline";
import figure_tenant_group_sources_image from "./assets/tenant-group-sources.png?url&no-inline";
import figure_tenant_group_sources_thumb from "./assets/tenant-group-sources-thumb.png?url&no-inline";
import figure_tenant_department_replace_image from "./assets/tenant-department-replace.png?url&no-inline";
import figure_tenant_department_replace_thumb from "./assets/tenant-department-replace-thumb.png?url&no-inline";
import figure_tenant_field_policy_image from "./assets/tenant-field-policy.png?url&no-inline";
import figure_tenant_field_policy_thumb from "./assets/tenant-field-policy-thumb.png?url&no-inline";
import figure_tenant_member_import_image from "./assets/tenant-member-import.png?url&no-inline";
import figure_tenant_member_import_thumb from "./assets/tenant-member-import-thumb.png?url&no-inline";
import figure_tenant_members_lifecycle_image from "./assets/tenant-members-lifecycle.png?url&no-inline";
import figure_tenant_members_lifecycle_thumb from "./assets/tenant-members-lifecycle-thumb.png?url&no-inline";
import figure_tenant_owner_transfer_image from "./assets/tenant-owner-transfer.png?url&no-inline";
import figure_tenant_owner_transfer_thumb from "./assets/tenant-owner-transfer-thumb.png?url&no-inline";
import {
  commonHelpContent,
  createStaticHelpProvider,
  type HelpContentSources,
} from "@ingot/help-plugin";
import article0 from "./articles/tenant-applications.md?raw";
import article1 from "./articles/tenant-assignments.md?raw";
import article2 from "./articles/tenant-authorization-audit.md?raw";
import article3 from "./articles/tenant-authorization-diagnostics.md?raw";
import article4 from "./articles/tenant-delegations.md?raw";
import article5 from "./articles/tenant-department-leaders.md?raw";
import article6 from "./articles/tenant-department-workbook.md?raw";
import article7 from "./articles/tenant-departments.md?raw";
import article8 from "./articles/tenant-downloads.md?raw";
import article9 from "./articles/tenant-getting-started.md?raw";
import article10 from "./articles/tenant-groups.md?raw";
import article11 from "./articles/tenant-member-departments.md?raw";
import article12 from "./articles/tenant-member-policies.md?raw";
import article13 from "./articles/tenant-member-workbook.md?raw";
import article14 from "./articles/tenant-members.md?raw";
import article15 from "./articles/tenant-organization-settings.md?raw";
import article16 from "./articles/tenant-roles.md?raw";
import asset0 from "./assets/tenant-roles-relationship.png?url&no-inline";
import asset1 from "./assets/tenant-roles-relationship-thumb.png?url&no-inline";
import article17 from "./articles/tenant-workbench.md?raw";

/** 本宿主专属资料，另一端不导入本文件。 */
const ownContent = {
  categories: [
    {
      id: "tenant-start",
      title: "快速入门",
      description: "组织入门与日常工作台",
      icon: "ep:compass",
      articleIds: ["tenant-getting-started", "tenant-workbench"],
    },
    {
      id: "tenant-organization",
      title: "组织与成员",
      description: "成员、部门、负责人和用户组",
      icon: "ep:office-building",
      articleIds: [
        "tenant-members",
        "tenant-member-departments",
        "tenant-departments",
        "tenant-department-leaders",
        "tenant-groups",
        "tenant-organization-settings",
      ],
    },
    {
      id: "tenant-authorization",
      title: "权限与应用",
      description: "角色、授权、委派与可用应用",
      icon: "ep:key",
      articleIds: [
        "tenant-roles",
        "tenant-assignments",
        "tenant-delegations",
        "tenant-authorization-diagnostics",
        "tenant-applications",
      ],
    },
    {
      id: "tenant-compliance",
      title: "安全与合规",
      description: "成员访问规则与组织审计",
      icon: "ep:lock",
      articleIds: ["tenant-member-policies", "tenant-authorization-audit"],
    },
    {
      id: "tenant-data",
      title: "导入导出与下载",
      description: "表格模板、批量处理和文件下载",
      icon: "ep:download",
      articleIds: ["tenant-member-workbook", "tenant-department-workbook", "tenant-downloads"],
    },
  ],
  articles: [
    {
      id: "tenant-applications",
      title: "查看和使用组织应用",
      summary: "查看组织已开通应用、应用权限目录，并配置哪些成员能看见应用。",
      categoryId: "tenant-authorization",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["查看和使用组织应用", "看不到应用", "开通", "应用人群"],
      relatedArticleIds: ["tenant-roles", "tenant-assignments", "tenant-delegations"],
      relatedViewPaths: ["org.iam.applications"],
      assets: [],
      markdown: article0,
    },
    {
      id: "tenant-assignments",
      title: "为成员分配角色与管理范围",
      summary: "给成员或用户组分配角色，明确授权依据、对象范围和有效期。",
      categoryId: "tenant-authorization",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["为成员分配角色与管理范围", "分配权限", "管理范围", "有效期", "撤销授权"],
      relatedArticleIds: ["tenant-roles", "tenant-delegations", "tenant-authorization-diagnostics"],
      relatedViewPaths: [],
      assets: [
        {
          id: "tenant-assignment-flow",
          thumbnailAssetId: "tenant-assignment-flow-thumb",
          alt: "租户角色分配：四步核对",
          caption: "交互流程示意（非页面截图）：租户角色分配：四步核对。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article1,
    },
    {
      id: "tenant-authorization-audit",
      title: "查询组织授权审计",
      summary: "查询当前组织管理范围内的授权变更，核对操作者、对象和配置差异。",
      categoryId: "tenant-compliance",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["查询组织授权审计", "组织审计", "操作记录", "授权记录", "游标分页"],
      relatedArticleIds: ["tenant-member-policies"],
      relatedViewPaths: ["org.iam.authorization.audit"],
      assets: [],
      markdown: article2,
    },
    {
      id: "tenant-authorization-diagnostics",
      title: "排查无权限和授权未生效",
      summary: "只读查看某成员对操作或目标对象的当前有效权限及可披露来源。",
      categoryId: "tenant-authorization",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["排查无权限和授权未生效", "无权限", "权限不生效", "按钮不可用", "授权诊断"],
      relatedArticleIds: ["tenant-roles", "tenant-assignments", "tenant-delegations"],
      relatedViewPaths: [],
      assets: [],
      markdown: article3,
    },
    {
      id: "tenant-delegations",
      title: "配置授权管理员与委派",
      summary: "为指定成员提供受限的角色分配能力，支持按角色、接收对象、操作和范围上限控制。",
      categoryId: "tenant-authorization",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["配置授权管理员与委派", "授权管理员", "委派上限", "转授权", "接收委派"],
      relatedArticleIds: ["tenant-roles", "tenant-assignments", "tenant-authorization-diagnostics"],
      relatedViewPaths: [],
      assets: [
        {
          id: "tenant-delegation-ceilings",
          thumbnailAssetId: "tenant-delegation-ceilings-thumb",
          alt: "授权管理员：分配能力的边界",
          caption: "交互流程示意（非页面截图）：授权管理员：分配能力的边界。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article4,
    },
    {
      id: "tenant-department-leaders",
      title: "设置部门负责人",
      summary: "设置部门负责人及主负责人，支持本组织成员跨部门兼管。",
      categoryId: "tenant-organization",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["设置部门负责人", "主负责人", "兼管", "部门领导", "负责人权限"],
      relatedArticleIds: ["tenant-members", "tenant-member-departments", "tenant-departments"],
      relatedViewPaths: [],
      assets: [],
      markdown: article5,
    },
    {
      id: "tenant-department-workbook",
      title: "批量导入部门与更新结构",
      summary: "用 xlsx 批量创建或更新部门树，按逐行报告处理错误。",
      categoryId: "tenant-data",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["批量导入部门与更新结构", "部门导入", "组织结构模板", "上级部门", "部门导出"],
      relatedArticleIds: ["tenant-member-workbook", "tenant-downloads"],
      relatedViewPaths: ["org.iam.departments.workbook"],
      assets: [
        {
          id: "tenant-department-import",
          thumbnailAssetId: "tenant-department-import-thumb",
          alt: "部门工作簿：路径与处理顺序",
          caption: "交互流程示意（非页面截图）：部门工作簿：路径与处理顺序。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article6,
    },
    {
      id: "tenant-departments",
      title: "创建和维护部门",
      summary: "维护本组织部门树、基本资料和层级，区分部门人数与删除条件。",
      categoryId: "tenant-organization",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["创建和维护部门", "部门树", "添加子部门", "删除部门", "直属人数"],
      relatedArticleIds: [
        "tenant-members",
        "tenant-member-departments",
        "tenant-department-leaders",
      ],
      relatedViewPaths: ["org.iam.departments"],
      assets: [],
      markdown: article7,
    },
    {
      id: "tenant-downloads",
      title: "导出文件与我的下载",
      summary: "集中查看本人发起的导出任务，在生成完成后下载文件。",
      categoryId: "tenant-data",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["导出文件与我的下载", "导出在哪", "我的下载", "文件过期", "7天"],
      relatedArticleIds: ["tenant-member-workbook", "tenant-department-workbook"],
      relatedViewPaths: ["common.downloads"],
      assets: [
        {
          id: "tenant-download-states",
          thumbnailAssetId: "tenant-download-states-thumb",
          alt: "导出文件：等待生成后再下载",
          caption: "交互流程示意（非页面截图）：导出文件：等待生成后再下载。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article8,
    },
    {
      id: "tenant-getting-started",
      title: "组织管理员快速入门",
      summary: "组织管理员可按“目录 → 角色 → 分配 → 应用 → 复核”的顺序完成基础配置。",
      categoryId: "tenant-start",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["组织管理员快速入门", "管理员入门", "组织初始化", "租户端"],
      relatedArticleIds: ["tenant-workbench"],
      relatedViewPaths: ["org.iam.settings"],
      assets: [],
      markdown: article9,
    },
    {
      id: "tenant-groups",
      title: "维护用户组与有效成员",
      summary: "把直接选择的成员及部门来源聚合为用户组，用于统一分配角色或设置应用人群。",
      categoryId: "tenant-organization",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["维护用户组与有效成员", "用户组", "有效成员", "包含下级", "部门成员"],
      relatedArticleIds: ["tenant-members", "tenant-member-departments", "tenant-departments"],
      relatedViewPaths: ["org.iam.groups"],
      assets: [
        {
          id: "tenant-group-sources",
          thumbnailAssetId: "tenant-group-sources-thumb",
          alt: "用户组：检查所有成员来源",
          caption: "交互流程示意（非页面截图）：用户组：检查所有成员来源。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article10,
    },
    {
      id: "tenant-member-departments",
      title: "批量变更成员部门",
      summary: "为成员维护任职部门，可批量整体替换多个成员的部门集合。",
      categoryId: "tenant-organization",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["批量变更成员部门", "批量调部门", "变更主部门", "任职替换"],
      relatedArticleIds: ["tenant-members", "tenant-departments", "tenant-department-leaders"],
      relatedViewPaths: [],
      assets: [
        {
          id: "tenant-department-replace",
          thumbnailAssetId: "tenant-department-replace-thumb",
          alt: "批量变更部门：整体替换",
          caption: "交互流程示意（非页面截图）：批量变更部门：整体替换。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article11,
    },
    {
      id: "tenant-member-policies",
      title: "设置成员访问与字段规则",
      summary: "按已接入资源配置字段可见性、编辑和筛选，区分“谁查看”与“查看哪些对象”。",
      categoryId: "tenant-compliance",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["设置成员访问与字段规则", "字段权限", "脱敏", "通讯录可见范围", "成员访问策略"],
      relatedArticleIds: ["tenant-authorization-audit"],
      relatedViewPaths: ["org.iam.field.policies"],
      assets: [
        {
          id: "tenant-field-policy",
          thumbnailAssetId: "tenant-field-policy-thumb",
          alt: "字段策略：区分查看者与数据对象",
          caption: "交互流程示意（非页面截图）：字段策略：区分查看者与数据对象。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article12,
    },
    {
      id: "tenant-member-workbook",
      title: "批量导入成员与更新资料",
      summary: "使用 xlsx 批量创建成员或更新现有成员资料，并核对逐行结果。",
      categoryId: "tenant-data",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["批量导入成员与更新资料", "导入人员", "xlsx", "模板", "批量更新", "初始密码下载"],
      relatedArticleIds: ["tenant-department-workbook", "tenant-downloads"],
      relatedViewPaths: ["org.iam.members.workbook"],
      assets: [
        {
          id: "tenant-member-import",
          thumbnailAssetId: "tenant-member-import-thumb",
          alt: "成员工作簿：核对逐行结果",
          caption: "交互流程示意（非页面截图）：成员工作簿：核对逐行结果。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article13,
    },
    {
      id: "tenant-members",
      title: "添加、维护与重新加入成员",
      summary: "添加和维护本组织成员，管理暂停、恢复、移出与重新加入。",
      categoryId: "tenant-organization",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: [
        "添加、维护与重新加入成员",
        "添加人员",
        "成员管理",
        "重新加入",
        "移出成员",
        "暂停",
      ],
      relatedArticleIds: [
        "tenant-member-departments",
        "tenant-departments",
        "tenant-department-leaders",
      ],
      relatedViewPaths: ["org.iam.members"],
      assets: [
        {
          id: "tenant-members-lifecycle",
          thumbnailAssetId: "tenant-members-lifecycle-thumb",
          alt: "成员入职与重新加入",
          caption: "交互流程示意（非页面截图）：成员入职与重新加入。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article14,
    },
    {
      id: "tenant-organization-settings",
      title: "维护组织信息与拥有者",
      summary: "维护组织名称、Logo 和基础信息；组织所有者可按验证流程转交所有权。",
      categoryId: "tenant-organization",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["维护组织信息与拥有者", "组织设置", "组织头像", "转让拥有者"],
      relatedArticleIds: ["tenant-members", "tenant-member-departments", "tenant-departments"],
      relatedViewPaths: ["org.iam.settings"],
      assets: [
        {
          id: "tenant-owner-transfer",
          thumbnailAssetId: "tenant-owner-transfer-thumb",
          alt: "组织所有权转交",
          caption: "交互流程示意（非页面截图）：组织所有权转交。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article15,
    },
    {
      id: "tenant-roles",
      title: "维护组织角色与当前权限",
      summary:
        "用组织角色定义操作、对象范围及字段权限。组织角色权限修改后，已分配人员自动采用当前配置。",
      categoryId: "tenant-authorization",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["维护组织角色与当前权限", "组织角色", "自动生效", "权限生效", "影响范围"],
      relatedArticleIds: [
        "tenant-assignments",
        "tenant-delegations",
        "tenant-authorization-diagnostics",
      ],
      relatedViewPaths: ["org.iam.authorization"],
      assets: [
        {
          id: "tenant-roles-relationship",
          thumbnailAssetId: "tenant-roles-relationship-thumb",
          alt: "组织角色：当前权限自动生效",
          caption: "交互流程示意（非页面截图）：组织角色：当前权限自动生效。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article16,
    },
    {
      id: "tenant-workbench",
      title: "使用工作台与快捷入口",
      summary: "查看当前组织概况，并从可用入口进入日常管理。",
      categoryId: "tenant-start",
      audienceDescription: "具有相关操作及对象范围的组织成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["使用工作台与快捷入口", "组织统计", "工作台", "快捷入口"],
      relatedArticleIds: ["tenant-getting-started"],
      relatedViewPaths: ["org.iam.workbench"],
      assets: [],
      markdown: article17,
    },
  ],
  assets: {
    "tenant-roles-relationship": asset0,
    "tenant-roles-relationship-thumb": asset1,
    "tenant-assignment-flow": figure_tenant_assignment_flow_image,
    "tenant-assignment-flow-thumb": figure_tenant_assignment_flow_thumb,
    "tenant-delegation-ceilings": figure_tenant_delegation_ceilings_image,
    "tenant-delegation-ceilings-thumb": figure_tenant_delegation_ceilings_thumb,
    "tenant-department-import": figure_tenant_department_import_image,
    "tenant-department-import-thumb": figure_tenant_department_import_thumb,
    "tenant-download-states": figure_tenant_download_states_image,
    "tenant-download-states-thumb": figure_tenant_download_states_thumb,
    "tenant-group-sources": figure_tenant_group_sources_image,
    "tenant-group-sources-thumb": figure_tenant_group_sources_thumb,
    "tenant-department-replace": figure_tenant_department_replace_image,
    "tenant-department-replace-thumb": figure_tenant_department_replace_thumb,
    "tenant-field-policy": figure_tenant_field_policy_image,
    "tenant-field-policy-thumb": figure_tenant_field_policy_thumb,
    "tenant-member-import": figure_tenant_member_import_image,
    "tenant-member-import-thumb": figure_tenant_member_import_thumb,
    "tenant-members-lifecycle": figure_tenant_members_lifecycle_image,
    "tenant-members-lifecycle-thumb": figure_tenant_members_lifecycle_thumb,
    "tenant-owner-transfer": figure_tenant_owner_transfer_image,
    "tenant-owner-transfer-thumb": figure_tenant_owner_transfer_thumb,
  },
} satisfies HelpContentSources;

export default createStaticHelpProvider({
  domain: "TENANT",
  productVersion: "2026.11-text-diagrams",
  categories: [...commonHelpContent.categories, ...ownContent.categories],
  articles: [...commonHelpContent.articles, ...ownContent.articles],
  assets: { ...commonHelpContent.assets, ...ownContent.assets },
  quickStartArticleIds: ["tenant-getting-started", "common-navigation", "tenant-member-workbook"],
  faqArticleIds: [
    "tenant-authorization-diagnostics",
    "tenant-applications",
    "tenant-downloads",
    "common-password",
  ],
  pageBindings: [
    {
      viewPath: "common.downloads",
      articleId: "tenant-downloads",
    },
    {
      viewPath: "org.iam.applications",
      articleId: "tenant-applications",
    },
    {
      viewPath: "org.iam.authorization",
      articleId: "tenant-roles",
    },
    {
      viewPath: "org.iam.authorization.audit",
      articleId: "tenant-authorization-audit",
    },
    {
      viewPath: "org.iam.departments",
      articleId: "tenant-departments",
    },
    {
      viewPath: "org.iam.departments.workbook",
      articleId: "tenant-department-workbook",
    },
    {
      viewPath: "org.iam.field.policies",
      articleId: "tenant-member-policies",
    },
    {
      viewPath: "org.iam.groups",
      articleId: "tenant-groups",
    },
    {
      viewPath: "org.iam.members",
      articleId: "tenant-members",
    },
    {
      viewPath: "org.iam.members.workbook",
      articleId: "tenant-member-workbook",
    },
    {
      viewPath: "org.iam.settings",
      articleId: "tenant-organization-settings",
    },
    {
      viewPath: "org.iam.workbench",
      articleId: "tenant-workbench",
    },
  ],
});
