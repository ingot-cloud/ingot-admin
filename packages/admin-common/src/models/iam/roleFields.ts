import type { FieldAccess, ResourceFieldPermissions } from "./types";
export function fieldAccessLabel(value?: FieldAccess): string {
  if (!value) return "未声明／隐藏";
  return `${{ HIDDEN: "隐藏", MASKED: "脱敏", FULL: "完整可见" }[value.visibility]}${value.editable ? "，可编辑" : "，只读"}`;
}
export function fieldPermissionChanges(
  before?: ResourceFieldPermissions,
  after?: ResourceFieldPermissions,
) {
  const resources = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return [...resources].flatMap((resourceId) =>
    [
      ...new Set([
        ...Object.keys(before?.[resourceId] ?? {}),
        ...Object.keys(after?.[resourceId] ?? {}),
      ]),
    ].flatMap((field) => {
      const previous = before?.[resourceId]?.[field];
      const current = after?.[resourceId]?.[field];
      return JSON.stringify(previous) === JSON.stringify(current)
        ? []
        : [
            {
              key: `${resourceId}:${field}`,
              resourceId,
              field,
              before: fieldAccessLabel(previous),
              after: current ? fieldAccessLabel(current) : "未声明／隐藏",
            },
          ];
    }),
  );
}
