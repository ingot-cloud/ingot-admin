---
name: in-conventional-commits
description: Enforces Conventional Commits for git commits in this repository. Use when creating a commit, writing a commit message, amending a commit, or when the user asks to 提交 / commit / 提交信息 / 提交规范 / Conventional Commits.
---

# Conventional Commits

本仓库 Git 提交信息必须遵循 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/zh-hans/v1.0.0/)。`AGENTS.md` 只写门禁；本 skill 是 type、scope、拆分与示例的唯一细则。用户要求提交时先读本 skill，再写 message。

## 格式

```text
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

- `type` 小写英文；`description` **中文**；冒号后必须有一个空格
- 标题只写一件事，聚焦 **why**（让…以免…、以对齐…），不超过 72 字，句末不加句号
- 不要在标题堆文件名或路径；禁止 `Update xxx`、`提交xxx`、`WIP`、无 type 的纯中文标题
- 一次提交只包含一个逻辑变更；`specs/` / skill / `AGENTS.md` 等规范文档与业务改动分开提交（本仓库常见 `feat`/`fix` 与 `docs` 成对）

## type

| type | 何时用 |
| --- | --- |
| `feat` | 用户可见的新能力 |
| `fix` | 修复缺陷 |
| `refactor` | 重构、重命名；不改变对外行为语义时优先用这个，而不是 `feat` |
| `docs` | 只改文档 / spec / skill / AGENTS |
| `style` | 仅格式，不影响含义 |
| `test` | 只改测试 |
| `perf` | 性能 |
| `build` | 构建系统或依赖 |
| `ci` | CI 配置 |
| `chore` | 杂项（工具、忽略文件、与运行时无关的维护） |

`feat` 与 `fix` 是规范定义的 type；其余沿用 Angular 惯例。不使用仓库历史里出现过、但不属于上表的 type。

## scope

可选。只动单一包 / 插件 / 域时再写，例如 `admin-core`、`platform`、`org`、`member`、`security`、`auth`、`specs`。跨多个目录时省略 scope，不要写 `*`。

## 正文与 footer

- 标题无法说清时，空一行再写正文（中文，说明动机与影响）
- 破坏性变更：`type(scope)!:` 或 footer `BREAKING CHANGE: <说明>`
- 关联 issue：`Refs: #123` / `Closes: #123`

## 示例

```text
feat: 用工具栏筛选浮层收纳多余查询条件
```

```text
docs: 约定条件多时用筛选浮层收纳额外查询
```

```text
fix(admin-core): 让表格与树的展开图标与行内容垂直对齐
```

```text
refactor: 将 InFilterContainer 重命名为 InSplitLayout

统一左右分栏工作面的组件名、class、Token 与持久化前缀。
```

## Agent 执行

1. 先 `git status` / `git diff` / `git log`，确认暂存范围与近期 type 风格
2. 不提交密钥、`.env`、无关格式化文件
3. 用 HEREDOC 传 message；不要 `--no-verify`
4. 提交后 `git status` 核对成功
