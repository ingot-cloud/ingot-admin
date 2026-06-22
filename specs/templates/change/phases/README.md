# 分阶段任务

当单次变更任务过多或存在明确依赖阶段时，在 `phases/` 下拆分子目录。

## 何时拆分

- 任务超过 10 项且存在明显阶段边界
- 需要先完成基础设施再开发业务功能
- 需要分批发版或分 PR 合并

## 命名约定

```text
phases/phase-01-<name>/TASKS.md
phases/phase-02-<name>/TASKS.md
...
```

示例：

```text
phases/
├── phase-01-foundation/
│   └── TASKS.md
├── phase-02-api/
│   └── TASKS.md
└── phase-03-ui/
    └── TASKS.md
```

## 与主 TASKS.md 的关系

- 主 `TASKS.md`：总览与跨阶段任务
- 各 `phases/phase-XX-*/TASKS.md`：该阶段的具体任务清单
- 阶段完成后在主 `TASKS.md` 勾选对应里程碑

## 模板

复制本目录结构，在 `phase-01-<name>/` 下创建 `TASKS.md`，格式与主 `TASKS.md` 相同。
