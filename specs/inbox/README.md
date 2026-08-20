# 投递区（inbox）

把接口文档和（可选的）需求文档丢到这里，然后对 Agent 说「根据 inbox 生成 spec」。

**不要**在这里手建 `change-id`。Agent 会生成 `changes/active/<YYYYMMDD>-<domain>-<feature>/`，把本目录里的文件**移入**该 change，再生成其余规格，初始状态为 `draft`。未到 `approved` 不得改业务代码。

inbox 不是契约库，只是一次性投递盒。生成完成后对应位置应为空（保留本 README 与 `.gitkeep`）。

## 怎么投递

**一次只做一个变更（默认）**，文件直接放在本目录根下：

```text
specs/inbox/
├── API.md              # 或 PLATFORM-API.md、其它 *API*.md
└── REQUIREMENTS.md     # 可选：需求.md / PRD.md
```

**并行多个变更**时，用口语化子目录（不要写成 change-id）：

```text
specs/inbox/session-safety/API.md
specs/inbox/访问防护/需求.md
```

然后对 Agent 说「根据 inbox/session-safety 生成 spec」。

## 文件名（Agent 移入 change 时规范化）

| inbox 中的名字 | 移入 change 后 |
|----------------|----------------|
| `API.md`、`PLATFORM-API.md`、含 `API` 的 `.md` | `API.md` |
| `REQUIREMENTS.md`、`需求.md`、`PRD.md` | `REQUIREMENTS.md` |
| 其它附件 | `refs/`（可选） |

inbox 里已有完整后端接口文档时，**以移入的原文为准**，不必按 `templates/change/API.md` 重写。

## 给 Agent

1. 读取指定 inbox（用户未指定时：根下有投递文件则用根目录；否则若只有一个子目录则用它；多个子目录则先问用户）
2. 根据接口标题、路径前缀、对话里的域，生成 `change-id = <今天日期>-<domain>-<feature>`；`changes/active/` 已有同 id 则加后缀，禁止覆盖
3. 从 `specs/templates/change/` 创建 `changes/active/<change-id>/`
4. **移动**（不是复制后留底）inbox 中的接口/需求文件，统一改名为 `API.md` / `REQUIREMENTS.md`；在 change 的 `README.md` 记录原始文件名与后端来源，**状态设为 `draft`**
5. 根据输入生成 `README.md`、`DESIGN.md`、`TASKS.md`；接口字段表不要再抄进 DESIGN，引用 `./API.md`
6. 确认本 inbox 对应位置已空（只留 README 与 `.gitkeep`）
7. 停在 `draft`，等用户确认后再改业务代码。状态未到 `approved` 不得施工
8. 开工后只读该 change 目录，不再读 inbox

用户若只在对话里给出后端仓库路径、没有先拷到 inbox：把该文件拷进即将创建的 change，等价于代为投递。
