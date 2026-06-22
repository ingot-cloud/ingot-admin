# API 层与 TypeScript 规范

## API 模块组织

```
apps/ingot-admin/src/api/
├── common/          # auth、user、oss
├── org/             # 租户/组织侧
└── platform/        # 平台管理
    ├── admin/       # 平台管理员
    ├── base/        # menu/role/dict/app
    ├── dev/         # client/social
    ├── member/
    ├── org/
    └── security/
```

每个文件对应一个资源域，模块内定义 `PATH` 常量 + 若干 `XxxAPI` 函数。

---

## 标准 API 函数模板

```typescript
import request from "@/net";
import type { SysUser, Page, AllOrgUserFilterDTO, UserDTO, R } from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/admin/user";

/** 用户分页信息 */
export function UserPageAPI(
  page: Page,
  condition?: AllOrgUserFilterDTO,
): Promise<R<Page<SysUser>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<SysUser>>(`${PATH}/page`, {
    ...page,
    ...condition,
  });
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

定义于 `apps/ingot-admin/src/models/net.ts`：

```typescript
export interface R<T = unknown> extends AxiosResponse {
  code: string;
  message: string;
  data: T;
}
```

### 使用约定

- API 函数返回 `Promise<R<T>>`，不在 API 层解包 `data`
- 页面/hook 层通过 `transformPageAPI` 或 `.then(({ data }) => ...)` 取数据
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

### usePaging 集成

```typescript
// hooks/biz/usePaging.ts
export type FetchPageAPI<T, C> = (page: Page, condition?: C) => Promise<R<Page<T>>>;
export type FetchPageFn<T, C> = (page: Page, condition?: C) => Promise<Page<T>>;

export const transformPageAPI = <T, C>(api: FetchPageAPI<T, C>): FetchPageFn<T, C> => {
  return (page, condition) =>
    api(page, condition).then((response) => response.data);
};

// 页面 useOps.ts
const paging = usePaging(transformPageAPI(UserPageAPI));
```

---

## Http 层

单例类 + axios，默认导出：

```typescript
// net/index.ts
class Http {
  private instance: AxiosInstance;
  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_APP_NET_BASE_URL,
      timeout: import.meta.env.VITE_APP_NET_DEFAULT_TIMEOUT || 10_000,
    });
    RequestInterceptor.install(this.instance);
    ResponseInterceptor.install(this.instance);
  }
  get<T = unknown>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) { ... }
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) { ... }
}
export default new Http();
```

### 请求 config 扩展

通过 `declare module "axios"` 扩展（`net/axios-extend.d.ts`）：

| 字段 | 用途 |
|------|------|
| `manualProcessingFailure` | 业务失败时不弹 toast，由调用方处理 |
| `manualProcessingAbort` | 取消请求时不弹 toast |
| `refreshTokenAndRetry` | 401 时刷新 token 重试 |
| `aesEncryptKeys` | 请求体字段 AES 加密 |
| `aesDecryptKeys` | 响应体字段 AES 解密 |
| `aesMode` | `"CBC"` \| `"GCM"` |

### AES 加解密示例

```typescript
export function UserInfoAPI(): Promise<R<UserInfo>> {
  return request.get<UserInfo>("/api/pms/v1/auth/user/info", null, {
    aesDecryptKeys: [
      { key: "initPwd", type: "boolean" },
      { key: "roles", type: "array" },
    ],
  });
}
```

加解密底层实现：`@ingot/utils` 的 AES 模块；app 层通过 `utils/encrypt.ts` 注入 `VITE_APP_AES` 环境变量。

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
| `@ingot/utils` | AES、指纹、下载 | 跨 app 通用 |
| `@ingot/hooks` | `useStateResettable` | 优先于 app 内重复实现 |

**新工具函数流程**：
1. 检查 `@/utils/` 是否已有
2. 检查 `@ingot/utils` 是否已有
3. 仅单 app 使用 → 放 `apps/{app}/src/utils/`
4. 跨 app 使用 → 放 `packages/` 并 workspace 引用

---

## 错误处理

业务失败由 `net/interceptor/response/biz.ts` 统一处理：

| code | 行为 |
|------|------|
| `S0200` | 成功 |
| `S0401` / `invalid_token` | 登出刷新 |
| `user_sign_out` | 签退确认弹窗 |
| 其他 | `Message.warning(message)` + reject |

调用方可通过 `manualProcessingFailure: true` 自行处理：

```typescript
try {
  await SomeAPI();
} catch (response) {
  const r = response as R;
  // 自定义错误处理
}
```

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

// ❌ packages/utils/src/download.ts 现有模式
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

- `src/net/`（Http 类、拦截器、R\<T\>、StatusCode）
- `src/utils/object.ts`（equals、filterParams、omit）
- `src/utils/encrypt.ts`（@ingot/utils 薄包装）
- `src/components/verifition/`（验证码组件）
