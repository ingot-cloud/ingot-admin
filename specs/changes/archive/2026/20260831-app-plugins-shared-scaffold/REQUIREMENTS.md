# 需求：App 插件化重组与脚手架可视化

## 场景与页面

### 场景 1：平台 App 独立部署

- **入口**：`ingot-admin`
- **步骤**：仅依赖 `@ingot/admin-core` + `@ingot/shared`，本地 `adminPlugin` 注册业务页
- **预期**：登录、菜单、原有 platform/org/dashboard 行为与迁移前等价

### 场景 2：项目 App 组合官方插件

- **入口**：`target-project`（或 create-app 生成的新 App）
- **步骤**：`plugins: [adminPlugin, projectPlugin]` 后构建
- **预期**：单 SPA 内同时可用平台页与项目页；共享 Router/Pinia

### 场景 3：静态 + 动态菜单

- **步骤**：App/插件声明 `staticMenus`，后端返回动态菜单
- **预期**：侧栏合并展示；同 path/routeName 冲突启动失败；仅静态时本地 Demo 菜单可见

### 场景 4：可视化创建 App

- **入口**：`apps/create-app` 本地 Web UI
- **步骤**：填写 appCode/端口，勾选官方插件，生成到 `apps/<name>`
- **预期**：生成可 `pnpm --filter <name> dev` 的薄入口；不覆盖已有目录

## 验收标准

- [x] `@ingot/admin-base` 已移除；业务页仅在 `ingot-admin`（及将来其他业务 App）
- [x] `@ingot/shared` 替代 utils/crypto/hooks；login 与 admin-core 构建通过
- [x] `ingot-admin` 独立部署与作为插件被 target 组合均通过
- [x] 静态+动态菜单合并行为符合 API.md
- [x] 公共插件/bootstrap/菜单 API 有中文 JSDoc；文档可指导组合与脚手架
- [x] `create-app` UI 可勾选 `ingot-admin` 并生成新 App
- [x] `pnpm build:packages`、admin/login/target、`pnpm test:pack`（若适用）通过
