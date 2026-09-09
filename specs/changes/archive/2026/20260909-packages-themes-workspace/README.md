# 20260909-packages-themes-workspace

> 状态：completed

## 协作模式

前端工程变更；根据对话制定规格，本次仅生成 change，待确认后施工。

## 背景与动机

主题预设将持续增加，后续脚手架也将提供创建主题的快捷功能。需要给主题提供稳定、独立的目录分类，避免具体主题与基础公共包混放，并让新增主题自动受到工程检查约束。

## 目标与范围

- 在同一个 pnpm workspace 中增加 `themes/*`，正式主题统一位于 `themes/<id>/`。
- 建立主题包约定、构建与检查入口、依赖边界和开发文档。
- 本 change 同时作为主题目录分类的独立架构修订提案：将现有三类目录扩展为 apps、plugins、themes、packages 四类；批准仅适用于本设计说明的例外范围。
- 保留 admin-core 中的主题协议、运行机制和默认回退主题。

### 不包含

- 不迁移默认主题，不新增正式视觉预设，不修改 admin 默认外观。
- 不实现创建主题 CLI/Web、主题选择界面或模板生成器；本次只确定后续生成产物的位置与约定。
- 不增加运行时主题 ID 切换、远程主题加载、主题市场或 auth 主题支持。
- 不发布 npm 包，不引入后端接口。

## 输入来源

- 需求文档：本次对话。用户提出主题增多时增加顶层 `themes/`，并明确未来脚手架创建主题的需求，随后要求制定 change。
- inbox：无本次投递，不移动或清空其它内容。
- 后端来源：无；不生成不适用的 API.md。

## 工件

- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- 当前 workspace、构建筛选与边界检查均未覆盖 themes，必须一并接入。
- 宪章目前将共享能力限定在 packages，并规定三层目录；不得把新增 themes 默认为符合旧规则。需明确批准本架构修订，按 DESIGN 的时序同步规则。
- 默认主题继续作为核心回退基线；不能让 core 反向依赖具体主题形成环。

## 相关链接

- [主题现行规格](../../../../current/packages/admin-theme/spec.md)
- [主题开发](../../../../../docs/theme-development.md)
- [架构分层](../../../../../docs/development-model.md)
- [宪章](../../../../CONSTITUTION.md)

## 完成记录

- 完成日期：2026-09-09
- 关联提交或 PR：cc22841
- 更新的 current capability：packages/admin-theme
- 与原设计的差异：无
- 取消原因：不适用
- 验证结果：
  - `pnpm test:boundaries` 19 项通过（空 themes、多主题发现、合法 apps → themes → packages、各类非法引用）
  - `pnpm build:themes` / `type-check:themes` / `test:themes` / `clean:themes` 在空目录成功退出
  - `pnpm check:boundaries`、`pnpm check:docs`、`pnpm lint:check`（0 error）、`pnpm type-check`、`pnpm check:examples`、`pnpm check:themes-workspace`、`pnpm build:admin` 通过
  - `@ingot/admin-core` 单测 340 通过；admin 仍使用 `defaultAdminTheme`
  - 完整 `pnpm check` 会卡在既有 `plugins/org` 单测 `IndexPage.test.ts`（断言已不存在的 `action-box__more`），与本次 themes 分类无关
