import { FieldVisibility } from "./constants";
import type { FieldAccessMap, FieldOperations } from "./types";

export type FieldBindings<K extends string = string> = Readonly<Record<K, string>>;
export type FieldTextDraft<K extends string> = Record<K, string | undefined | null>;

/** 只读显示由安全响应提供；编辑草稿仅使用 FULL 原值，脱敏字段从空输入开始。 */
export function fieldTextDraft<K extends string>(
  record: Partial<Record<NoInfer<K>, string | null>>,
  bindings: FieldBindings<K>,
  access: FieldAccessMap,
): FieldTextDraft<K> {
  const result = {} as FieldTextDraft<K>;
  for (const property of Object.keys(bindings) as K[]) {
    result[property] =
      access[bindings[property]]?.visibility === FieldVisibility.FULL
        ? (record[property] ?? "")
        : "";
  }
  return result;
}

/** 只提交实际输入事件标记的字段；清空 nullable 字段发送 null，缺键保持原值。 */
export function fieldTextPatch<K extends string>(
  values: FieldTextDraft<K>,
  initial: FieldTextDraft<K>,
  bindings: FieldBindings<K>,
  access: FieldAccessMap,
  dirty: ReadonlySet<K>,
  nullable: ReadonlySet<K>,
): Partial<Record<K, string | null>> {
  const patch: Partial<Record<K, string | null>> = {};
  for (const property of dirty) {
    const field = access[bindings[property]];
    if (!field || field.visibility === FieldVisibility.HIDDEN || field.editable !== true) continue;
    const next = values[property];
    if ((next === "" || next === undefined || next === null) && nullable.has(property)) {
      patch[property] = null;
    } else if (next !== initial[property] && next !== undefined && next !== null) {
      patch[property] = next;
    }
  }
  return patch;
}

/** 全局操作上下文缺失时关闭筛选，不从行级可见性推断。 */
export function isFieldFilterable(
  operations: Record<string, Record<string, FieldOperations>> | undefined,
  actionCode: string,
  fieldKey: string,
): boolean {
  return operations?.[actionCode]?.[fieldKey]?.filterable === true;
}

/** 权限或场景变化时剔除受控禁止条件，调用方用 changed 重置页码和查询键。 */
export function pruneFieldFilters<T extends object>(
  current: T,
  bindings: Readonly<Partial<Record<keyof T & string, string>>>,
  operations: Record<string, Record<string, FieldOperations>> | undefined,
  actionCode: string,
): { condition: T; changed: boolean } {
  const condition = { ...current };
  let changed = false;
  for (const property of Object.keys(bindings) as Array<keyof T & string>) {
    const field = bindings[property];
    if (
      field &&
      !isFieldFilterable(operations, actionCode, field) &&
      condition[property] !== undefined
    ) {
      delete condition[property];
      changed = true;
    }
  }
  return { condition, changed };
}
