import figure_platform_security_layers_image from "./assets/platform-security-layers.png?url&no-inline";
import figure_platform_security_layers_thumb from "./assets/platform-security-layers-thumb.png?url&no-inline";
import figure_platform_entitlement_layers_image from "./assets/platform-entitlement-layers.png?url&no-inline";
import figure_platform_entitlement_layers_thumb from "./assets/platform-entitlement-layers-thumb.png?url&no-inline";
import {
  commonHelpContent,
  createStaticHelpProvider,
  type HelpContentSources,
} from "@ingot/help-plugin";
import article0 from "./articles/platform-access-protection.md?raw";
import article1 from "./articles/platform-account-protection.md?raw";
import article2 from "./articles/platform-accounts.md?raw";
import asset0 from "./assets/platform-accounts-relationship.png?url&no-inline";
import asset1 from "./assets/platform-accounts-relationship-thumb.png?url&no-inline";
import article3 from "./articles/platform-applications.md?raw";
import asset2 from "./assets/platform-applications-relationship.png?url&no-inline";
import asset3 from "./assets/platform-applications-relationship-thumb.png?url&no-inline";
import article4 from "./articles/platform-assignments.md?raw";
import article5 from "./articles/platform-authorization-audit.md?raw";
import article6 from "./articles/platform-clients.md?raw";
import article7 from "./articles/platform-credential-policies.md?raw";
import article8 from "./articles/platform-dictionaries.md?raw";
import article9 from "./articles/platform-entitlements.md?raw";
import article10 from "./articles/platform-getting-started.md?raw";
import article11 from "./articles/platform-id-allocation.md?raw";
import article12 from "./articles/platform-personnel.md?raw";
import article13 from "./articles/platform-plans.md?raw";
import article14 from "./articles/platform-qrcode.md?raw";
import article15 from "./articles/platform-roles.md?raw";
import asset4 from "./assets/platform-roles-relationship.png?url&no-inline";
import asset5 from "./assets/platform-roles-relationship-thumb.png?url&no-inline";
import article16 from "./articles/platform-sessions.md?raw";
import article17 from "./articles/platform-shared-roles.md?raw";
import article18 from "./articles/platform-social.md?raw";
import article19 from "./articles/platform-tenants.md?raw";

/** 本宿主专属资料，另一端不导入本文件。 */
const ownContent = {
  categories: [
    {
      id: "platform-start",
      title: "快速入门",
      description: "平台职责与治理路径",
      icon: "ep:compass",
      articleIds: ["platform-getting-started"],
    },
    {
      id: "platform-tenants",
      title: "组织与租户",
      description: "租户维护及应用开通",
      icon: "ep:office-building",
      articleIds: ["platform-tenants", "platform-entitlements"],
    },
    {
      id: "platform-configuration",
      title: "应用与配置",
      description: "应用资源、共享角色与套餐",
      icon: "ep:setting",
      articleIds: ["platform-applications", "platform-plans", "platform-shared-roles"],
    },
    {
      id: "platform-management",
      title: "平台管理",
      description: "账号、平台人员和职责授权",
      icon: "ep:user",
      articleIds: [
        "platform-accounts",
        "platform-personnel",
        "platform-roles",
        "platform-assignments",
      ],
    },
    {
      id: "platform-security",
      title: "安全中心",
      description: "凭证、账号、访问与会话安全",
      icon: "ep:lock",
      articleIds: [
        "platform-credential-policies",
        "platform-account-protection",
        "platform-access-protection",
        "platform-sessions",
      ],
    },
    {
      id: "platform-settings",
      title: "系统设置与审计",
      description: "字典及平台授权变更",
      icon: "ep:document",
      articleIds: ["platform-dictionaries", "platform-authorization-audit"],
    },
    {
      id: "platform-develop",
      title: "开发者平台",
      description: "客户端、第三方应用和开发工具",
      icon: "ep:cpu",
      articleIds: [
        "platform-clients",
        "platform-social",
        "platform-id-allocation",
        "platform-qrcode",
      ],
    },
  ],
  articles: [
    {
      id: "platform-access-protection",
      title: "维护访问防护与失败策略",
      summary: "维护请求路径分组、限流、名单、挑战和登录失败防护，减少异常访问。",
      categoryId: "platform-security",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["维护访问防护与失败策略", "访问防护", "限流", "登录失败策略", "规则匹配"],
      relatedArticleIds: [
        "platform-credential-policies",
        "platform-account-protection",
        "platform-sessions",
      ],
      relatedViewPaths: ["security.access.protection"],
      assets: [],
      markdown: article0,
    },
    {
      id: "platform-account-protection",
      title: "配置账号登录失败保护",
      summary: "配置连续认证失败后的账号锁定规则，区分管理端与应用端策略。",
      categoryId: "platform-security",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["配置账号登录失败保护", "账号保护", "失败锁定", "解锁", "登录失败次数"],
      relatedArticleIds: [
        "platform-credential-policies",
        "platform-access-protection",
        "platform-sessions",
      ],
      relatedViewPaths: ["security.account.protection"],
      assets: [],
      markdown: article1,
    },
    {
      id: "platform-accounts",
      title: "维护全局账号与登录凭证",
      summary: "维护全局登录账号，管理联系方式、启停、锁定、解锁和密码重置。",
      categoryId: "platform-management",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["维护全局账号与登录凭证", "全局账号", "锁定账号", "重置密码", "账号与成员"],
      relatedArticleIds: ["platform-personnel", "platform-roles", "platform-assignments"],
      relatedViewPaths: ["platform.iam.accounts"],
      assets: [
        {
          id: "platform-accounts-relationship",
          thumbnailAssetId: "platform-accounts-relationship-thumb",
          alt: "维护全局账号与登录凭证关系示意图",
          caption: "关系示意（非页面截图）：登录账号 → 成员资格 → 当前管理域 → 具体功能权限。",
          width: 1280,
          height: 360,
        },
      ],
      markdown: article2,
    },
    {
      id: "platform-applications",
      title: "维护应用、资源、操作与菜单",
      summary: "维护应用，以及应用下的资源、操作、字段和菜单目录，供授权和导航使用。",
      categoryId: "platform-configuration",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["维护应用、资源、操作与菜单", "资源操作", "菜单关联", "应用目录", "viewPath"],
      relatedArticleIds: ["platform-plans", "platform-shared-roles"],
      relatedViewPaths: ["platform.iam.applications"],
      assets: [
        {
          id: "platform-applications-relationship",
          thumbnailAssetId: "platform-applications-relationship-thumb",
          alt: "维护应用、资源、操作与菜单关系示意图",
          caption: "关系示意（非页面截图）：应用目录 → 资源与操作 → 菜单关联 → 成员实际入口。",
          width: 1280,
          height: 360,
        },
      ],
      markdown: article3,
    },
    {
      id: "platform-assignments",
      title: "分配平台角色与授权管理员",
      summary:
        "向平台成员或用户组分配固定角色版本，配置期限与各角色独立的对象范围；也可管理授权管理员。",
      categoryId: "platform-management",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["分配平台角色与授权管理员", "平台授权", "授权管理员", "平台委派"],
      relatedArticleIds: ["platform-accounts", "platform-personnel", "platform-roles"],
      relatedViewPaths: [],
      assets: [],
      markdown: article4,
    },
    {
      id: "platform-authorization-audit",
      title: "查看平台授权审计",
      summary: "查询当前平台管理范围内的授权变更，核对操作者、对象和配置差异。",
      categoryId: "platform-settings",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["查看平台授权审计", "平台审计", "授权变更", "审计详情"],
      relatedArticleIds: ["platform-dictionaries"],
      relatedViewPaths: ["platform.iam.authorization.audit"],
      assets: [],
      markdown: article5,
    },
    {
      id: "platform-clients",
      title: "维护OAuth客户端",
      summary: "维护 OAuth 客户端的认证方式、授权类型、回调地址与令牌有效期。",
      categoryId: "platform-develop",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["维护OAuth客户端", "OAuth客户端", "回调地址", "客户端密钥"],
      relatedArticleIds: ["platform-social", "platform-id-allocation", "platform-qrcode"],
      relatedViewPaths: ["platform.develop.client"],
      assets: [],
      markdown: article6,
    },
    {
      id: "platform-credential-policies",
      title: "配置凭证安全策略",
      summary: "按密码强度、历史、过期和初始密码四组维护凭证规则，各组独立保存。",
      categoryId: "platform-security",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["配置凭证安全策略", "密码策略", "密码历史", "密码强度", "过期策略"],
      relatedArticleIds: [
        "platform-account-protection",
        "platform-access-protection",
        "platform-sessions",
      ],
      relatedViewPaths: ["security.credential.policies"],
      assets: [
        {
          id: "platform-security-layers",
          thumbnailAssetId: "platform-security-layers-thumb",
          alt: "安全配置：按问题定位入口",
          caption: "交互流程示意（非页面截图）：安全配置：按问题定位入口。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article7,
    },
    {
      id: "platform-dictionaries",
      title: "维护字典类型与字典项",
      summary: "维护不同作用域下的字典类型和字典项，区分业务存储值与展示文本。",
      categoryId: "platform-settings",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["维护字典类型与字典项", "字典项", "字典排序", "内置字典"],
      relatedArticleIds: ["platform-authorization-audit"],
      relatedViewPaths: ["platform.settings.dictionaries"],
      assets: [],
      markdown: article8,
    },
    {
      id: "platform-entitlements",
      title: "配置租户应用开通",
      summary: "为目标组织维护开通应用集合，区分套餐清单、组织开通与成员权限。",
      categoryId: "platform-tenants",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["配置租户应用开通", "应用开通", "租户应用", "套餐应用", "适用人群"],
      relatedArticleIds: ["platform-tenants"],
      relatedViewPaths: [],
      assets: [
        {
          id: "platform-entitlement-layers",
          thumbnailAssetId: "platform-entitlement-layers-thumb",
          alt: "应用可用：逐层核对条件",
          caption: "交互流程示意（非页面截图）：应用可用：逐层核对条件。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article9,
    },
    {
      id: "platform-getting-started",
      title: "平台管理员快速入门",
      summary: "平台管理员按账号、成员、组织、应用和授权的关系完成初始化，并复核全局安全配置。",
      categoryId: "platform-start",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["平台管理员快速入门", "平台端", "平台管理员", "治理职责"],
      relatedArticleIds: [],
      relatedViewPaths: [],
      assets: [],
      markdown: article10,
    },
    {
      id: "platform-id-allocation",
      title: "维护业务ID号段",
      summary: "维护按业务标签划分的 ID 号段配置。",
      categoryId: "platform-develop",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["维护业务ID号段", "业务ID", "号段", "步长"],
      relatedArticleIds: ["platform-clients", "platform-social", "platform-qrcode"],
      relatedViewPaths: ["platform.develop.id"],
      assets: [],
      markdown: article11,
    },
    {
      id: "platform-personnel",
      title: "维护平台人员和平台用户组",
      summary: "把已有全局账号加入平台，维护平台成员资料、角色和用户组。",
      categoryId: "platform-management",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["维护平台人员和平台用户组", "平台成员", "平台用户组", "人员角色"],
      relatedArticleIds: ["platform-accounts", "platform-roles", "platform-assignments"],
      relatedViewPaths: ["platform.iam.personnel"],
      assets: [],
      markdown: article12,
    },
    {
      id: "platform-plans",
      title: "维护套餐与应用清单",
      summary: "维护应用清单套餐，供组织开通流程选择。",
      categoryId: "platform-configuration",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["维护套餐与应用清单", "套餐", "应用清单", "套餐变更"],
      relatedArticleIds: ["platform-applications", "platform-shared-roles"],
      relatedViewPaths: ["platform.iam.plans"],
      assets: [],
      markdown: article13,
    },
    {
      id: "platform-qrcode",
      title: "生成和使用二维码",
      summary: "根据文本和样式实时生成二维码，并下载 SVG 或图片。",
      categoryId: "platform-develop",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["生成和使用二维码", "二维码", "扫描", "生成图片"],
      relatedArticleIds: ["platform-clients", "platform-social", "platform-id-allocation"],
      relatedViewPaths: ["platform.develop.qrcode"],
      assets: [],
      markdown: article14,
    },
    {
      id: "platform-roles",
      title: "维护平台角色与职责",
      summary: "定义平台业务角色，并通过固定版本分配及显式版本应用控制授权变化。",
      categoryId: "platform-management",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["维护平台角色与职责", "平台角色", "固定版本", "版本应用", "发布角色"],
      relatedArticleIds: ["platform-accounts", "platform-personnel", "platform-assignments"],
      relatedViewPaths: ["platform.iam.authorization"],
      assets: [
        {
          id: "platform-roles-relationship",
          thumbnailAssetId: "platform-roles-relationship-thumb",
          alt: "平台角色：发布与应用分开完成",
          caption: "交互流程示意（非页面截图）：平台角色：发布与应用分开完成。",
          width: 1280,
          height: 720,
        },
      ],
      markdown: article15,
    },
    {
      id: "platform-sessions",
      title: "查看在线会话与并发策略",
      summary: "查询在线会话、查看设备与认证信息，并维护会话并发策略。",
      categoryId: "platform-security",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["查看在线会话与并发策略", "会话撤销", "在线用户", "并发登录", "踢下线"],
      relatedArticleIds: [
        "platform-credential-policies",
        "platform-account-protection",
        "platform-access-protection",
      ],
      relatedViewPaths: ["security.sessions"],
      assets: [],
      markdown: article16,
    },
    {
      id: "platform-shared-roles",
      title: "维护组织共享角色与当前权限",
      summary: "平台统一维护组织默认共享角色，保存权限后所有使用组织自动采用当前配置。",
      categoryId: "platform-configuration",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["维护组织共享角色与当前权限", "共享角色", "自动生效", "基础角色"],
      relatedArticleIds: ["platform-applications", "platform-plans"],
      relatedViewPaths: ["platform.iam.shared.roles"],
      assets: [],
      markdown: article17,
    },
    {
      id: "platform-social",
      title: "配置第三方登录应用",
      summary: "配置第三方社交登录应用的凭据与回调资料。",
      categoryId: "platform-develop",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["配置第三方登录应用", "社交登录", "第三方应用", "回跳"],
      relatedArticleIds: ["platform-clients", "platform-id-allocation", "platform-qrcode"],
      relatedViewPaths: ["platform.develop.social"],
      assets: [],
      markdown: article18,
    },
    {
      id: "platform-tenants",
      title: "创建和维护租户",
      summary: "创建和维护组织，初始化根部门、所有者成员和应用开通。",
      categoryId: "platform-tenants",
      audienceDescription: "具有对应治理操作及范围的平台成员",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["创建和维护租户", "租户管理", "创建组织", "组织启停"],
      relatedArticleIds: ["platform-entitlements"],
      relatedViewPaths: ["platform.iam.tenants"],
      assets: [],
      markdown: article19,
    },
  ],
  assets: {
    "platform-accounts-relationship": asset0,
    "platform-accounts-relationship-thumb": asset1,
    "platform-applications-relationship": asset2,
    "platform-applications-relationship-thumb": asset3,
    "platform-roles-relationship": asset4,
    "platform-roles-relationship-thumb": asset5,
    "platform-security-layers": figure_platform_security_layers_image,
    "platform-security-layers-thumb": figure_platform_security_layers_thumb,
    "platform-entitlement-layers": figure_platform_entitlement_layers_image,
    "platform-entitlement-layers-thumb": figure_platform_entitlement_layers_thumb,
  },
} satisfies HelpContentSources;

export default createStaticHelpProvider({
  domain: "PLATFORM",
  productVersion: "2026.11-text-diagrams",
  categories: [...commonHelpContent.categories, ...ownContent.categories],
  articles: [...commonHelpContent.articles, ...ownContent.articles],
  assets: { ...commonHelpContent.assets, ...ownContent.assets },
  quickStartArticleIds: ["platform-getting-started", "platform-applications", "platform-roles"],
  faqArticleIds: [
    "platform-entitlements",
    "platform-accounts",
    "platform-sessions",
    "common-password",
  ],
  pageBindings: [
    {
      viewPath: "platform.develop.client",
      articleId: "platform-clients",
    },
    {
      viewPath: "platform.develop.id",
      articleId: "platform-id-allocation",
    },
    {
      viewPath: "platform.develop.qrcode",
      articleId: "platform-qrcode",
    },
    {
      viewPath: "platform.develop.social",
      articleId: "platform-social",
    },
    {
      viewPath: "platform.iam.accounts",
      articleId: "platform-accounts",
    },
    {
      viewPath: "platform.iam.applications",
      articleId: "platform-applications",
    },
    {
      viewPath: "platform.iam.authorization",
      articleId: "platform-roles",
    },
    {
      viewPath: "platform.iam.authorization.audit",
      articleId: "platform-authorization-audit",
    },
    {
      viewPath: "platform.iam.personnel",
      articleId: "platform-personnel",
    },
    {
      viewPath: "platform.iam.plans",
      articleId: "platform-plans",
    },
    {
      viewPath: "platform.iam.shared.roles",
      articleId: "platform-shared-roles",
    },
    {
      viewPath: "platform.iam.tenants",
      articleId: "platform-tenants",
    },
    {
      viewPath: "platform.settings.dictionaries",
      articleId: "platform-dictionaries",
    },
    {
      viewPath: "security.access.protection",
      articleId: "platform-access-protection",
    },
    {
      viewPath: "security.account.protection",
      articleId: "platform-account-protection",
    },
    {
      viewPath: "security.credential.policies",
      articleId: "platform-credential-policies",
    },
    {
      viewPath: "security.sessions",
      articleId: "platform-sessions",
    },
  ],
});
