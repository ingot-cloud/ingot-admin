# API 层与 TypeScript 规范

## API 模块组织

```
plugins/{plugin}/src/api/
```

每个文件对应一个资源域，模块内定义 `PATH` 常量 + 若干 `XxxAPI` 函数。

---

## 标准 API 函数模板

```typescript
import request from "@/net";
import type { RequestOptions } from "@ingot/admin-core";
import type { SysUser, Page, AllOrgUserFilterDTO, UserDTO, R } from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/admin/user";

/** 用户分页信息 */
export function UserPageAPI(
  page: Page,
  condition?: AllOrgUserFilterDTO,
  options?: RequestOptions,
): Promise<R<Page<SysUser>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<SysUser>>(
    `${PATH}/page`,
    {
      ...page,
      ...condition,
    },
    options,
  );
}

/** 创建用户 */
export function CreateUserAPI(params: UserDTO): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(PATH, params);
}

/** 用户简介 */
export function UserProfileAPI(id: string): Promise<R<UserProfileVO>> {
  return request.get<UserProfileVO>(`${PATH}/profile/${id}`);
}
```

### 命名规则

| 操作 | 模式 | 示例 |
|------|------|------|
| 分页 | `{Entity}PageAPI` | `UserPageAPI` |
| 详情 | `{Entity}ProfileAPI` / `{Entity}InfoAPI` | `UserProfileAPI` |
| 创建 | `Create{Entity}API` | `CreateUserAPI` |
| 更新 | `Update{Entity}API` | `UpdateUserAPI` |
| 删除 | `Delete{Entity}API` | `DeleteUserAPI` |

**禁止**漏掉 `API` 后缀（现有反例 `SearchByPhone` 应改为 `SearchByPhoneAPI`）。

### import 规范

```typescript
// ✅ 统一别名
import request from "@/net";

// ❌ 混用别名
import Http from "@/net";
```

---

## 响应类型 R\<T\>

定义于 `packages/admin-core/src/models/net.ts`：

```typescript
export interface R<T = unknown> extends AxiosResponse {
  code: string;
  message: string;
  data: T;
}
```

### 使用约定

- API 函数返回 `Promise<R<T>>`，不在 API 层解包 `data`
- 页面/hook 层通过 Query Options 或 `.then(({ data }) => ...)` 取数据；旧 `transformPageAPI` 仅用于含手机号的命令式列表
- 成功码：`StatusCode.OK`（`"S0200"`），由拦截器统一判断

### 分页类型 Page\<T\>

```typescript
// models/common.ts
export interface Page<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
}
```

### useServerPaging 集成

```typescript
import { useServerPaging } from "@ingot/admin-core";
import { AppPageQueryOptions } from "@/api/platform/config/app.query";

const paging = useServerPaging({
  queryOptions: AppPageQueryOptions,
});

// 输入变化不立刻请求；无参 fetchData / search 提交条件并回到第一页
paging.fetchData();
```

列表 `:loading` 使用 `paging.fetching`。含手机号搜索的用户列表仍用已废弃的 `usePaging` + `transformPageAPI`，敏感字段不得进入 Query Key。

---

## Http 层

共享传输底座在 `@ingot/http-client`，admin / auth 通过适配器注入鉴权、提示与安全协议。页面仍使用：

```typescript
import request from "@/net";
```

API 第三参可传 `RequestOptions`：

```typescript
export function AppPageAPI(
  page: Page,
  condition?: PlatformAppFilterDTO,
  options?: RequestOptions,
): Promise<R<Page<PlatformApp>>> {
  return request.get<Page<PlatformApp>>(`${PATH}/page`, { ...page, ...condition }, options);
}
```

| 选项 | 含义 |
|------|------|
| `signal` | Query 传入的 AbortSignal，优先于 CancelManager |
| `feedback: "silent"` | 不弹 Axios 全局提示，由 Query 最终错误处理 |
| `progress: "silent"` | 不计入 NProgress 前台计数 |
| `manualProcessingFailure` | **已废弃**，等价 `feedback: "silent"` |

Query 缓存只保存 `R<T>.data`。错误类型为 `ApiError`，`error.code` 仍可用于业务码判断。

---

## Query Options

资源 Query 与 API 同目录，Key 使用 `[domain, resource, operation, scope, params]`。参数必须先做不可变快照；Query 请求使用 `silentQueryRequest(signal)`（`feedback/progress: "silent"`）。

分页优先用 `createPageQueryOptions`：

```typescript
import { createPageQueryOptions, createResourceQueryKeys } from "@ingot/admin-core";
import { AppPageAPI } from "./app";

export const appQueryKeys = createResourceQueryKeys("platform", "app");
export const AppPageQueryOptions = createPageQueryOptions<PlatformApp, PlatformAppFilterDTO>(
  appQueryKeys,
  AppPageAPI,
);
```

树、详情和嵌套资源手写 `queryOptions`：

```typescript
import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createResourceQueryKeys,
  silentQueryRequest,
  snapshotQueryParams,
} from "@ingot/admin-core";
import { AppPageAPI } from "./app";

const resourceKeys = createResourceQueryKeys("platform", "app");

export const appQueryKeys = {
  ...resourceKeys,
  menus: (appId: string) => [...resourceKeys.detail(appId), "menus"] as const,
};

export function AppPageQueryOptions(
  input: MaybeRefOrGetter<{ current: number; size: number; condition?: PlatformAppFilterDTO }>,
) {
  const value = toValue(input);
  return queryOptions({
    queryKey: appQueryKeys.list(
      snapshotQueryParams({
        current: value.current,
        size: value.size,
        condition: value.condition,
      }),
    ),
    queryFn: ({ signal }) =>
      AppPageAPI(
        { current: value.current, size: value.size },
        { ...value.condition },
        silentQueryRequest(signal),
      ).then(({ data }) => data),
  });
}
```

嵌套 Key 不要调用不存在的 `resourceKeys.trees()`；应写 `[...resourceKeys.all, "tree", params]`。

命令式 CUD 保持全局 feedback。`useMutation` 才用 silent，由 MutationCache 提示。

选择器、远程搜索等需要命令式读缓存时，使用 `queryAdminData(XxxQueryOptions(...))`（内部是 `QueryClient.query`）。不要用已废弃的 `fetchQuery` / `prefetchQuery` / `ensureQueryData`。

Token、密码、手机号不得进入 Query Key。登录、挑战、上传下载和敏感即时搜索保持命令式请求。

`usePaging` / `transformPageAPI` / `useConfirm*` 已标记 deprecated，后续版本化 change 再删除公共导出。

### 请求 config 扩展

通过 `declare module "axios"` 扩展：

| 字段 | 用途 |
|------|------|
| `feedback` / `progress` | 见上表；由 `@ingot/http-client` 声明 |
| `manualProcessingFailure` | **已废弃**，等价 `feedback: "silent"` |
| `refreshTokenAndRetry` | 401 时刷新 token 重试 |
| `crypto` | 信封加密配置（请求/响应方向独立，见 `docs/envelope-crypto.md`） |

### 信封加密示例

```typescript
export function UserInfoAPI(): Promise<R<UserInfo>> {
  return request.get<UserInfo>("/api/pms/v1/auth/user/info", null, {
    crypto: {
      response: {
        mode: "field",
        fields: [
          { key: "mustChangePwd", type: "boolean" },
          { key: "roles", type: "array" },
        ],
      },
    },
  });
}

export function FixPasswordAPI(params: UserPasswordDTO): Promise<R> {
  return request.put<void>("/api/pms/v1/org/user/pwd", params, {
    crypto: {
      request: { mode: "field", fields: ["password", "newPassword"] },
    },
  });
}
```

加解密底层实现：`@ingot/shared/crypto` 包 + axios 信封拦截器（`net/interceptor/request/envelope.ts`、`response/envelope.ts`）。

---

## TypeScript 类型约定

### interface vs type

| 用途 | 选择 | 示例 |
|------|------|------|
| DTO/VO/实体 | `interface` | `SysUser`、`UserDTO` |
| 联合类型 | `type` | `ElTagType = "primary" \| "success"` |
| 工具/函数签名 | `type` | `FetchPageAPI<T, C>` |
| 枚举 | `enum`（string enum） | `StatusCode`、`CommonStatus` |

### 模型组织

```
models/
├── index.ts       # barrel export
├── common.ts      # Page<T>、通用类型
├── net.ts         # R<T>
├── user.ts        # SysUser、UserDTO
├── enums/
│   ├── index.ts
│   └── common.ts  # CommonStatus 等
└── security.ts
```

- API 类型与领域模型共用 `models/`，**无独立 `types/api/` 层**
- 枚举配合 `EnumExt` / `newEnumExt` 做 UI 标签映射

### 泛型默认值

```typescript
// ✅ Http 方法：默认 unknown 而非 any
get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<R<T>>

// ❌ 现有模式（新代码禁止）
get<T = any>(url: string, params?: any): Promise<R<T>>
```

### 类型断言

```typescript
// ✅ 仅在必要时，配合类型守卫
const el = document.getElementById("app") as HTMLElement;

// ❌ 绕过类型检查
const componentSize = "default" as any;
defineExpose({} as any);
```

---

## 工具函数

### app 层 utils

按文件分散，**无统一 barrel**：

```typescript
import { filterParams, omit, getDiff } from "@/utils/object";
import { Message, Confirm } from "@/utils/message";
import { isObject, isString } from "@/utils/index";
```

`filterParams`：清除对象中的 `undefined`/`null`/`""`，API 写操作前必调。

### packages 层

| 包 | 职责 | 使用 |
|----|------|------|
| `@ingot/http-client` | HTTP 传输底座 | admin / auth 适配器注入，页面不直接依赖 |
| `@ingot/shared` | 指纹、下载、挑战契约 | 跨 app 通用 |
| `@ingot/shared/crypto` | 信封加密 | 敏感字段 / HYBRID |
| `@ingot/shared/hooks` | `useStateResettable` | 优先于 app 内重复实现 |

**新工具函数流程**：
1. 检查 `@/utils/` 是否已有
2. 检查 `@ingot/shared` 是否已有
3. 仅单 app 使用 → 放 `apps/{app}/src/utils/`
4. 跨 app 使用 → 放 `packages/` 并 workspace 引用

---

## 错误处理

业务失败由 `@ingot/http-client` 归一化为 `ApiError`，admin 适配器按码处理：

| code | 行为 |
|------|------|
| `S0200` | 成功 |
| `S0401` / `invalid_token` | 登出刷新 |
| `user_sign_out` | 签退确认弹窗 |
| 其他 | `Message.warning(message)` + reject |

Query / Mutation 使用 `silentQueryRequest()`，最终错误由 QueryCache/MutationCache 提示一次。命令式 CUD 保持默认全局 feedback。需要自行处理时传 `feedback: "silent"`：

```typescript
try {
  await SomeAPI(params, { feedback: "silent" });
} catch (error) {
  if (isApiError(error) && error.code === StatusCode.ILLEGAL_OPERATION) {
    // 自定义错误处理
  }
}
```

`manualProcessingFailure: true` 仍可用，但已废弃，等价 `feedback: "silent"`。

---

## 好/坏对比

### API 返回类型

```typescript
// ✅ 显式返回类型
export function TenantInfoAPI(id: string): Promise<R<TenantVO>> {
  return request.get<TenantVO>(`${PATH}/${id}`);
}

// ❌ 依赖推断，缺少文档
export function TenantInfoAPI(id: string) {
  return request.get(`${PATH}/${id}`);
}
```

### 错误抛出

```typescript
// ✅
throw new Error("Unsupported image type");

// ❌ packages/shared/src/download.ts 现有模式
throw "Error image type";
```

### 比较运算

```typescript
// ✅
return arr.find((item) => item.value === value)?.oppositeValue ?? "";

// ❌ hooks/biz/useEnum.ts 现有模式
return arr.find((item) => item.value == value)?.oppositeValue || ("" as any);
```

---

## 跨 app 重复（禁止扩大）

以下模块在两个 app 间几乎相同，新功能**不得再复制**，应上提到 `packages/`：

- `src/net/` 传输已上提到 `@ingot/http-client`；鉴权/信封/挑战仍由 admin 与 auth 适配器注入
- `src/utils/object.ts`（equals、filterParams、omit）
- `src/components/verifition/`（验证码组件）
