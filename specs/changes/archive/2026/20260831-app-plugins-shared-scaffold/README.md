# 20260831-app-plugins-shared-scaffold

> 状态：completed

## 协作模式

一人全栈

## 背景与动机

上一 change 将平台业务页沉入 `@ingot/admin-base`，与「业务页归属 App、App 既可独立部署也可被组合」的目标冲突。同时 `utils` / `crypto` / `hooks` 拆分过细；新 App 缺少静态+动态菜单约定与可视化脚手架。

## 目标

- 业务页迁回 `ingot-admin`；该 App 导出 `adminPlugin`，可独立部署也可被其他 App 依赖组合。
- 废弃 `@ingot/admin-base`。
- 合并 `@ingot/utils` + `@ingot/crypto` + `@ingot/hooks` 为 `@ingot/shared`。
- 在 `admin-core` 定义静态菜单与后端动态菜单的混合配置。
- 公共 API 中文 JSDoc；完善插件与脚手架文档。
- 新增 `apps/create-app` 本地 Web UI，勾选官方插件并生成新 App。

## 范围

### In Scope

- `@ingot/shared` 包与引用迁移
- `admin-base` → `ingot-admin` 回迁与 App 插件导出
- `target-project` / vite-config / pack / CI 适配
- 静态+动态菜单 API 与测试
- JSDoc 与文档
- `apps/create-app` Web 脚手架

### Out of Scope

- 实现真实的 `ingot-ops` 业务（仅脚手架预留）
- 运行时远程加载插件 / 微前端
- 后端菜单批量改键
- 将 `ingot-login` 改为管理台插件

## 输入来源

- 接口文档：无 inbox；沿用现有菜单接口与已批准实施计划
- 需求文档：对话中的 App 插件化重组方案
- 后端来源：`GET /api/pms/v1/auth/user/menus`

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- App 依赖 App 的 Vite 打包（`import.meta.glob`、样式）
- 与上一 change 的 `admin-base` 结构相反，需完整回归
- create-app 写磁盘仅限本地

## 相关链接

- [CONSTITUTION](../../../../CONSTITUTION.md)
- [上一 change（已取消）](../20260829-packages-composable-admin-runtime/README.md)

## 完成记录

- 完成日期：2026-08-31
- 关联提交或 PR：
- 更新的 current capability：`packages/app-plugins-shared-scaffold`
- 与原设计的差异：仓库根包名改为 `@ingot/workspace`，避免与 App `ingot-admin` 同名导致 pnpm 链接错误；vite-config 用正则解析 `@/` 与 `@base`。
- 取消原因：
