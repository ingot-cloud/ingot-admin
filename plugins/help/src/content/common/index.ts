import type { HelpContentSources } from "../types";
import article0 from "./articles/common-account-access.md?raw";
import article1 from "./articles/common-navigation.md?raw";
import article2 from "./articles/common-password.md?raw";
import article3 from "./articles/common-personal-settings.md?raw";

/** 两端一致的通用说明；不能在此导入宿主专属内容。 */
export const commonHelpContent = {
  categories: [
    {
      id: "common-basics",
      title: "账号与基础使用",
      description: "登录、导航、密码和界面设置",
      icon: "ep:user",
      articleIds: [
        "common-navigation",
        "common-account-access",
        "common-password",
        "common-personal-settings",
      ],
    },
  ],
  articles: [
    {
      id: "common-account-access",
      title: "登录、退出与访问问题",
      summary:
        "登录后，系统根据当前管理端、账号和成员资格建立访问上下文。菜单和数据范围由当前身份决定。",
      categoryId: "common-basics",
      audienceDescription: "所有已登录成员；具体业务操作仍需相应权限",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["登录、退出与访问问题", "登录不上", "退出登录", "没有菜单", "会话过期"],
      relatedArticleIds: ["common-navigation", "common-password", "common-personal-settings"],
      relatedViewPaths: [],
      assets: [],
      markdown: article0,
    },
    {
      id: "common-navigation",
      title: "认识界面与应用导航",
      summary: "通过应用导航、侧栏和面包屑定位功能；帮助中心提供当前端的教程、搜索和章节链接。",
      categoryId: "common-basics",
      audienceDescription: "所有已登录成员；具体业务操作仍需相应权限",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["认识界面与应用导航", "应用切换", "导航搜索", "菜单", "找功能"],
      relatedArticleIds: ["common-account-access", "common-password", "common-personal-settings"],
      relatedViewPaths: [],
      assets: [],
      markdown: article1,
    },
    {
      id: "common-password",
      title: "修改密码与初始密码处理",
      summary: "修改个人登录密码，并处理初始密码、到期或强制改密提示。",
      categoryId: "common-basics",
      audienceDescription: "所有已登录成员；具体业务操作仍需相应权限",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["修改密码与初始密码处理", "强制改密", "忘记密码", "密码过期", "初始密码"],
      relatedArticleIds: ["common-navigation", "common-account-access", "common-personal-settings"],
      relatedViewPaths: [],
      assets: [],
      markdown: article2,
    },
    {
      id: "common-personal-settings",
      title: "调整界面与显示偏好",
      summary: "调整当前界面的显示偏好，并区分个人资料与界面配置。",
      categoryId: "common-basics",
      audienceDescription: "所有已登录成员；具体业务操作仍需相应权限",
      updatedAt: "2026-11-03T00:00:00Z",
      keywords: ["调整界面与显示偏好", "深色", "浅色", "主题", "时区", "界面设置"],
      relatedArticleIds: ["common-navigation", "common-account-access", "common-password"],
      relatedViewPaths: [],
      assets: [],
      markdown: article3,
    },
  ],
  assets: {},
} satisfies HelpContentSources;
