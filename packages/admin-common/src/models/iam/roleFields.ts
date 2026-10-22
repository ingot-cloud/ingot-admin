import { FieldVisibility } from "./constants";
import type {
  FieldAccess,
  FieldCapability,
  FieldOperations,
  ResourceFieldDefinition,
  ResourceFieldPermissions,
} from "./types";

/** 可见性和操作快照分别解释；缺失字段关闭。 */
export function resourceFieldAccess(
  definition: ResourceFieldDefinition | undefined,
  key: string,
): FieldAccess {
  return {
    visibility: definition?.visibility[key] ?? FieldVisibility.HIDDEN,
    editable: definition?.operations[key]?.editable === true,
  };
}
export function fieldAccessLabel(value?: FieldAccess, operations?: FieldOperations): string {
  if (!value) return "未声明／隐藏";
  return `${{ HIDDEN: "隐藏", MASKED: "脱敏", FULL: "完整可见" }[value.visibility]}${value.editable ? "，可编辑" : "，只读"}${operations?.filterable ? "，可筛选" : ""}`;
}
export function resourceFieldKeys(definition?: ResourceFieldDefinition): string[] {
  return [
    ...new Set([
      ...Object.keys(definition?.visibility ?? {}),
      ...Object.keys(definition?.operations ?? {}),
    ]),
  ];
}
export function fieldPermissionChanges(
  before?: ResourceFieldPermissions,
  after?: ResourceFieldPermissions,
) {
  const resources = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return [...resources].flatMap((resourceId) =>
    [
      ...new Set([
        ...resourceFieldKeys(before?.[resourceId]),
        ...resourceFieldKeys(after?.[resourceId]),
      ]),
    ].flatMap((field) => {
      const previous = before?.[resourceId];
      const current = after?.[resourceId];
      const left = {
        visibility: previous?.visibility[field],
        operations: previous?.operations[field],
      };
      const right = {
        visibility: current?.visibility[field],
        operations: current?.operations[field],
      };
      return JSON.stringify(left) === JSON.stringify(right)
        ? []
        : [
            {
              key: `${resourceId}:${field}`,
              resourceId,
              field,
              before: fieldAccessLabel(
                previous?.visibility[field] !== undefined
                  ? resourceFieldAccess(previous, field)
                  : undefined,
                previous?.operations[field],
              ),
              after: fieldAccessLabel(
                current?.visibility[field] !== undefined
                  ? resourceFieldAccess(current, field)
                  : undefined,
                current?.operations[field],
              ),
            },
          ];
    }),
  );
}

/** 将目录默认值转换为可见性与操作分开的角色定义。 */
export function defaultFieldDefinition(
  defaults: Record<string, FieldAccess> = {},
): ResourceFieldDefinition {
  return {
    visibility: Object.fromEntries(
      Object.entries(defaults).map(([key, value]) => [key, value.visibility]),
    ),
    operations: Object.fromEntries(
      Object.entries(defaults).map(([key, value]) => [
        key,
        { editable: value.editable === true, filterable: false },
      ]),
    ),
  };
}

/** 同一资源只保留一份字段快照，未改动的字段沿用资源默认值。 */
export function collectResourceFieldPermissions(
  grants: Array<{
    resourceId: string;
    fieldCapabilities?: FieldCapability[];
    fieldDefaults?: Record<string, FieldAccess>;
    fieldPermissions?: ResourceFieldDefinition;
  }>,
): ResourceFieldPermissions | undefined {
  const resources = [
    ...new Map(
      grants
        .filter((grant) => (grant.fieldCapabilities?.length ?? 0) > 0)
        .map((grant) => [grant.resourceId, grant]),
    ).values(),
  ];
  if (!resources.length) return undefined;
  return Object.fromEntries(
    resources.map((grant) => [
      grant.resourceId,
      {
        visibility: Object.fromEntries(
          (grant.fieldCapabilities ?? []).map((field) => [
            field.key,
            grant.fieldPermissions?.visibility[field.key] ??
              grant.fieldDefaults?.[field.key]?.visibility ??
              FieldVisibility.HIDDEN,
          ]),
        ),
        operations: Object.fromEntries(
          (grant.fieldCapabilities ?? []).map((field) => [
            field.key,
            grant.fieldPermissions?.operations[field.key] ?? {
              editable: grant.fieldDefaults?.[field.key]?.editable ?? false,
              filterable: false,
            },
          ]),
        ),
      },
    ]),
  );
}
