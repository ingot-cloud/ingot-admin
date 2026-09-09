# 管理台主题

正式主题包统一放在 `themes/<id>/`，由同一 pnpm workspace 识别。主题不是 `InAdminPlugin`，不注册路由、权限、业务菜单或服务。

默认视觉与回退主题仍在 `@ingot/admin-core`。本目录初期可以为空；新增子目录后会自动纳入构建和检查，不必改根命令。

独立示例 [examples/admin-theme](../examples/admin-theme/README.md) 不加入 workspace。外部 npm 主题仍可按公开协议消费。

## 命名

| 约定     | 规则                                   |
| -------- | -------------------------------------- |
| 目录     | `themes/<id>/`，`id` 为小写 kebab-case |
| 仓库包名 | `@ingot/theme-<id>`                    |

后续脚手架把生成文件写入这里；创建主题与在 App 中启用是两件独立的事。创建主题不会自动修改 App 依赖或 `bootstrapAdminApp` 配置。

生成器（尚未实现）必须拒绝目录逃逸和覆盖已有主题。

## 最小结构

```text
themes/<id>/
├── package.json
├── src/
│   ├── index.ts
│   ├── theme.ts
│   └── style.css
├── vite.config.ts
├── tsconfig.json
└── README.md
```

自定义 Shell 与 `parts` 按需增加。主题使用包内 `tsconfig.json` 做类型检查，不必把每个主题登记到仓库根 TS references。

## 公开导出与依赖

- `exports` 提供 `.` 与 `./style.css`
- 正式包交付编译后的 JS、类型声明和 CSS；CSS 列入 `sideEffects`
- `vue` 与 `@ingot/admin-core` 放 `peerDependencies`，打包时 external
- 本地构建所需依赖显式声明，不要打进第二份运行时
- 若使用 UnoCSS，由主题构建生成 CSS；消费端不扫描主题源码
- 禁止 `@/`、`@ingot/admin-core/src` 以及跨包源码 / 相对路径引用
- 附加 CSS 使用 `html[data-in-theme="<id>"]` 作用域，不要重定义公共 `--in-*` Token

主题只依赖 `packages/` 与外部库，不得依赖 App、业务插件或另一具体主题。主题之间的公共能力进入 `packages/`。

## 包脚本

主题包需要提供：

| 脚本         | 说明                                                      |
| ------------ | --------------------------------------------------------- |
| `build`      | 产出 JS、声明和 CSS                                       |
| `type-check` | 使用包内 tsconfig                                         |
| `test:unit`  | 无测试时也须正常通过（如 `vitest run --passWithNoTests`） |
| `clean`      | 清理 `dist` / `node_modules`                              |

根目录对应命令会动态筛选 `./themes/*`。本目录没有主题包时，这些命令成功退出。

```bash
pnpm build:themes
pnpm type-check:themes
pnpm test:themes
pnpm clean:themes
```

根 `build` / `build:admin` / `check` 会先构建 packages 再构建 themes。主题改动可先执行单包 `build`，再由 Vite 开发服务消费产物。

## App 接入

App 显式增加 workspace 依赖，引入主题与 CSS，再交给既有启动接口。不要做主题总注册表或全量导入；未选择的主题不应进入 App 模块图。

```ts
import { bootstrapAdminApp } from "@ingot/admin-core";
import "@ingot/admin-core/style.css";
import { projectTheme } from "@ingot/theme-project";
import "@ingot/theme-project/style.css";
import "uno.css";

await bootstrapAdminApp({
  ...appOptions,
  theme: projectTheme,
});
```

未配置 `theme` 时仍回退到 `defaultAdminTheme`。协议与 Token 约定见 [主题开发](../docs/theme-development.md)。
