# 需求：构建期插件化后台框架

接口与公共 TypeScript 契约见 [API.md](./API.md)。

## 场景与页面

### 场景 1：组合基础能力与项目能力

- **角色**：框架维护者、项目开发者
- **入口**：目标 app 的 `main.ts` 与插件清单
- **步骤**：安装明确版本的 core/base 插件，在清单中加入 target 插件并执行生产构建
- **预期结果**：基础页面 A/B/C 与 target 页面 D/E/F 进入同一个 SPA、Router、Pinia 和部署产物

### 场景 2：插件注入全局资源

- **角色**：插件开发者
- **入口**：插件 manifest
- **步骤**：声明页面、全局组件、指令、第三方 Vue plugin 与静态路由
- **预期结果**：所有资源在 mount 前按依赖顺序注册；基础及 target 模板均可正常使用声明的全局组件

### 场景 3：后端动态菜单解析插件页面

- **角色**：已登录用户
- **入口**：后端用户菜单
- **步骤**：后端返回基础或 target 的稳定页面键；前端从已安装插件注册表解析并添加路由
- **预期结果**：权限与菜单仍由后端控制；已安装页面正常展示，未知页面显示受控配置错误

### 场景 4：发现插件冲突或依赖错误

- **角色**：项目开发者、CI
- **入口**：应用启动或自动化测试
- **步骤**：配置重复 ID/资源、缺失依赖、依赖环或不兼容 API 版本
- **预期结果**：应用在 mount 前失败，并给出包含插件 ID 与冲突资源的明确错误

### 场景 5：独立仓库消费框架

- **角色**：新项目开发者
- **入口**：私有包仓库与项目脚手架
- **步骤**：在不访问当前 monorepo 源码的隔离工程安装打包产物、开发并构建 target app
- **预期结果**：ESM、类型、CSS、全局组件提示与 peer dependencies 均正常，不产生第二份 Vue/Router/Pinia

### 场景 6：迁移现有管理台

- **角色**：现有管理台用户
- **入口**：`ingot-admin`
- **步骤**：完成 core/base 抽取后访问原有菜单、路由、登录、权限和页面
- **预期结果**：行为与迁移前一致，旧后端 `viewPath` 在兼容期继续可用

### 页面结构

```text
ingot-admin
└── adminBasePlugin
    └── 现有 dashboard / org / platform 页面

target-project
├── adminBasePlugin
└── targetPlugin
    ├── D：插件概览
    ├── E：共享状态验证
    └── F：动态组件验证
```

D/E/F 是无后端依赖的框架验证页，不引入虚构业务 CRUD。

## 验收标准

- [ ] `ingot-admin` 由 core/base 组合启动，原有页面、菜单、权限与登录行为保持不变
- [ ] `target-project` 生产构建包含 A–F，并只有一个 Vue、Router、Pinia 实例
- [ ] app/package 内组件自动导入与插件 manifest 显式注册可同时工作
- [ ] core `In*` 与 target 业务全局组件在模板和 TypeScript 中均可识别
- [ ] 页面、组件、指令、路由、插件 ID 冲突不会静默覆盖
- [ ] 插件缺失依赖、循环依赖或 API 版本不兼容时不会 mount
- [ ] 后端稳定页面键与旧源码路径都能解析；未知键显示受控错误页
- [ ] A 与 D 之间切换不整页刷新，并共享用户、权限、主题和公共状态
- [ ] target 深层路由刷新、登录重定向与退出登录正常
- [ ] `pnpm pack` 产物能在隔离消费工程完成类型检查与生产构建
- [ ] 新 app/packages 复用 workspace catalog；发布 manifest 不泄漏 `catalog:` 或 `workspace:` 协议
- [ ] TypeScript 6 + `moduleResolution: "Bundler"` 与 Vite 8/Rolldown library build 均通过
- [ ] 新增脚手架和文档能指导创建 app、插件、稳定页面键和全局组件

## ADDED

### REQ-A001：构建期插件组合

**验收标准：**

- [ ] 插件以依赖和 manifest 形式加入应用，新增插件需要重新构建
- [ ] 最终产物是单 SPA，不引入运行时微前端容器

### REQ-A002：启动期动态注册

**验收标准：**

- [ ] 页面、组件、指令、Vue plugins 和静态路由在 mount 前注册
- [ ] 注册顺序遵循插件依赖拓扑顺序
- [ ] 第一版不支持 mount 后热卸载或替换

### REQ-A003：稳定页面键

**验收标准：**

- [ ] 新页面不把源码路径写入后端菜单
- [ ] 基础页面与布局提供旧 `viewPath` 别名
- [ ] 未知键不产生空白页

### REQ-A004：可发布包边界

**验收标准：**

- [ ] 跨 app 能力全部位于 packages，不复制 net、stores、layouts 或公共组件
- [ ] 发布包不要求消费方配置本 monorepo 的 `@/` 路径
- [ ] Vue 生态运行时依赖通过 peer dependency 保持单实例
- [ ] workspace 内版本来自 catalog，peer ranges 与当前 catalog major/minor 兼容

## MODIFIED

### REQ-M001：现有动态组件解析

**变更说明：** 从只扫描 `ingot-admin/src/pages` 改为合并所有已安装插件的显式页面注册表，同时保留旧路径别名。

**验收标准：**

- [ ] 现有后端菜单无需同步切换即可继续工作
- [ ] target 页面无需放入 `ingot-admin/src/pages` 即可被解析

### REQ-M002：现有组件安装

**变更说明：** 保留 app/package 自身的编译期组件自动导入；将 `components/index.ts` 的第三方安装能力纳入插件 `vuePlugins`。

**验收标准：**

- [ ] `vue3-tree-org` 行为保持不变
- [ ] 插件可显式提供全局组件和第三方 Vue plugin

## REMOVED

无。
