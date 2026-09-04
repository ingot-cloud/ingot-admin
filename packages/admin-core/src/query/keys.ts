export type ResourceQueryKeys = {
  readonly all: readonly [string, string];
  lists: () => readonly [string, string, "list"];
  list: (params: unknown) => readonly [string, string, "list", unknown];
  details: () => readonly [string, string, "detail"];
  detail: (id: string) => readonly [string, string, "detail", string];
};

/**
 * 资源 Query Key 工厂：`[domain, resource, operation, scope, params]`。
 */
export function createResourceQueryKeys(domain: string, resource: string): ResourceQueryKeys {
  const all = [domain, resource] as const;
  return {
    all,
    lists: () => [...all, "list"] as const,
    list: (params: unknown) => [...all, "list", params] as const,
    details: () => [...all, "detail"] as const,
    detail: (id: string) => [...all, "detail", id] as const,
  };
}
