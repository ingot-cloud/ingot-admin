# 接口：开发者中心本地生成服务

## 来源与边界

本契约由本 change 定义，无业务后端来源。服务位于门户 Vite 开发中间件，仅本地 dev 注册；静态构建与 preview 不启用。它不是业务 API，不沿用业务 R<T>、OAuth 或业务权限码。

- Base path：`/__dev-portal/api`，由浏览器使用当前门户 origin 访问，不拼接外部服务地址。
- 成功：`{ ok: true, data: T }`；失败：`{ ok: false, error: { code, message, fields? } }`。fields 为字段路径到中文错误文本的映射。
- JSON 请求和响应；POST 仅接受 application/json，请求体上限 1 MiB。
- server 固定绑定 127.0.0.1、strictPort=true、默认端口 5801；拒绝不符合当前 loopback 服务的 Host，以及不匹配当前服务的 Origin。CLI 直接调用引擎，不绕 HTTP。
- capabilities 下发每次 dev 启动随机生成的内存 sessionToken；POST 使用 `X-Ingot-Scaffold-Token`。不启用跨域读取，不持久化 token；服务重启后客户端重新检测。
- 不接受 rootDir、任意源文件路径、任意目标路径、shell 命令或可执行 JS 请求字段。

## 公共输入类型

类型表示线协议；实现以 CONFIGURATION.md 的字段约束生成描述及校验器。下列 Record 值均为可序列化数据，禁止函数或任意代码。

```ts
type ScaffoldKind = "app" | "plugin" | "theme";

interface PackageSelection {
  packageName: string;
  exportName: string;
}

interface AppScaffoldOptions {
  appCode: string;
  env: {
    common: Record<string, string>;
    modes: Record<string, Record<string, string>>;
  };
  branding: { logo?: string };
  dev: { port: number; host: string; enableDevTools: boolean };
  build: { base: string };
  proxy: Array<{
    prefix: string;
    target: string;
    changeOrigin: boolean;
    stripPrefix: boolean;
  }>;
  iconify: { collections: string[]; extra: string[]; scan: boolean; usedFile: string };
  plugins: PackageSelection[];
  theme: { kind: "default" } | ({ kind: "workspace" } & PackageSelection);
  withDemo: boolean;
  header: {
    visibility: Partial<Record<"brand" | "navigation" | "search" | "user", boolean>>;
    builtinUtilities?: string[];
    builtinUserMenu?: string[];
  };
  extensions: { netInterceptors: boolean; shellSlots: boolean; vite: boolean };
}

interface PluginScaffoldOptions {
  directoryId: string;
  pluginId: string;
  exportName: string;
  canonicalPrefix: string;
  description: string;
  withDemo: boolean;
  extensions: {
    layouts: boolean;
    components: boolean;
    directives: boolean;
    stores: boolean;
    install: boolean;
  };
}

interface ThemeScaffoldOptions {
  id: string;
  name: string;
  exportName: string;
  tokens: { light: Record<string, string>; dark: Record<string, string> };
  shell: boolean;
  parts: Array<"header" | "navigation" | "breadcrumb" | "footer">;
}

type ScaffoldRequest =
  | { version: 1; kind: "app"; options: AppScaffoldOptions }
  | { version: 1; kind: "plugin"; options: PluginScaffoldOptions }
  | { version: 1; kind: "theme"; options: ThemeScaffoldOptions };
```

以上规范化输入为完整结构；UI／CLI 使用共享 defaults 补齐缺省值再校验。字符串枚举（内置顶栏项、Token 键）必须从现有公开清单校验，不接受任意值。配置版本不支持时返回错误，不能静默按新格式解释。

## 接口列表

### GET /capabilities

返回 `{ mode: "local", canWrite: true, configVersion: 1, sessionToken: string }`。响应 no-store，不返回用户环境变量或绝对仓库路径。静态页面通过构建期运行模式禁止调用，而不是循环请求 404 检测服务。

### GET /catalog

返回 `{ plugins: PluginCatalogItem[], themes: ThemeCatalogItem[] }`，只扫描固定 plugins/* 与 themes/* 的 manifest 和公开入口，不执行其代码。

- 共用字段：packageName、directory（仓库相对路径）、id、label、exportName（可空）、available、reason（不可用原因，可空）、source（official／metadata／manual）。
- 插件额外包含 canonicalPrefix（可空）；默认主题作为内置选项独立展示。
- 有生成元数据则使用元数据；四个官方插件使用内置适配。无元数据的既有包标为 manual，要求用户填写 exportName，预览时用静态 TypeScript 导出分析校验其公共入口和类型兼容性。
- 目录真实路径、包名、ID、公开导出和 CSS 出口重新核对；不可用项明确展示原因，不提供悄悄忽略已选择项的回退。

### POST /preview

请求体为 ScaffoldRequest。只在内存校验和渲染，不创建目标目录，不安装依赖。

返回：

```ts
interface ScaffoldPreview {
  kind: ScaffoldKind;
  targetDir: string;
  packageName: string;
  fingerprint: string;
  files: Array<
    | { path: string; kind: "text"; content: string; bytes: number }
    | { path: string; kind: "binary"; bytes: number }
  >;
  diagnostics: Array<{ level: "info" | "warning"; message: string; field?: string }>;
  nextSteps: Array<{ title: string; command?: string; code?: string; language?: string }>;
}
```

path 相对目标目录，targetDir 相对仓库根。二进制只展示信息，不按 UTF-8 展示或替换。fingerprint 为规范化配置、实际输出字节和所选 catalog 元数据的确定性摘要；不是持久化预览会话，不写配置到磁盘。

### POST /create

请求体 `{ request: ScaffoldRequest, fingerprint: string }`。重新校验输入、catalog、模板与目标目录并重新渲染；摘要与用户预览不同则返回 PREVIEW_STALE，让用户重新预览。

成功返回 `{ kind, targetDir, packageName, files: string[], nextSteps }`，HTTP 201。写入过程不执行 install／build，不修改已有 App 或根 lockfile。响应仅包含生成目录相对路径，不返回文件中的配置值。

## 错误与写入语义

| HTTP | code | 场景 |
| --- | --- | --- |
| 400 | INVALID_JSON / VALIDATION_ERROR / UNSUPPORTED_VERSION | 无效 JSON、字段约束、配置版本不支持 |
| 403 | LOCAL_ACCESS_REQUIRED / INVALID_SESSION | Host／Origin／token 不符合要求 |
| 409 | TARGET_EXISTS / PREVIEW_STALE / CREATE_IN_PROGRESS | 已有目标、预览已过期、相同目标正在生成 |
| 413 | PAYLOAD_TOO_LARGE | 请求超过上限 |
| 415 | UNSUPPORTED_MEDIA_TYPE | 非 application/json |
| 500 | WRITE_FAILED | 文件系统失败；不泄漏堆栈、凭据或绝对路径 |

使用目标目录排他创建，绝不覆盖；进程内同目标操作串行并对跨进程使用排他创建防竞态。失败仅清理已确认属于本次创建的目录／文件，不删除已有或被替换的目标。校验固定分类根真实路径并拒绝符号链接绕过。页面在连接中断等不确定状态时提示检查目标目录，不自动重发写入。

## CLI 与旧接口

- `pnpm create:app:cli [appCode]`：保留旧位置参数和交互输入。
- `pnpm create:plugin:cli [directoryId]`、`pnpm create:theme:cli [id]`：新增交互入口。
- 三种 CLI 均支持 `--config <file.json>`，内容为对应 kind 的 ScaffoldRequest；与位置参数同时使用时拒绝歧义输入。
- `--dry-run` 输出预览而不写入；完整配置模式不再弹交互问题。成功退出 0，校验／写入失败非 0。
- 无交互配置模式的 CLI 在进程内先渲染后写入，使用相同校验和写入保护，不强制额外确认。
- 根 `create:app`、`dev:create-app` 保留为门户启动别名；新增 `create:plugin`、`create:theme` 启动门户并打开对应向导。
- 旧 `/api/official-plugins`、`/api/scaffold` 随门户前端一同替换，属于内部本地接口，不保留 HTTP 别名；已有 App CLI 通过兼容适配调用新引擎。
