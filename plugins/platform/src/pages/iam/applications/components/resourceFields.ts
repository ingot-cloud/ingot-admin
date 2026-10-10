import {
  FieldVisibility,
  MaskKind,
  isValidIamMask,
  type FieldBindingManifest,
  type FieldCapability,
} from "@ingot/admin-common";

export const cloneResourceField = (field: FieldCapability): FieldCapability => ({
  ...field,
  visibilities: [...field.visibilities],
  mask: field.mask ? { ...field.mask } : undefined,
});

export const normalizeResourceField = (field: FieldCapability): FieldCapability => ({
  ...cloneResourceField(field),
  key: field.key.trim(),
  label: field.label.trim(),
  mask: field.visibilities.includes(FieldVisibility.MASKED)
    ? { ...(field.mask ?? { kind: MaskKind.ALL }) }
    : undefined,
});

export const isNonTextResourceField = (key: string, manifest?: FieldBindingManifest): boolean =>
  manifest?.bindings.some(
    (binding) => binding.fieldKey === key.trim() && binding.use === "READ" && !binding.textual,
  ) ?? false;

export const resourceFieldErrors = (
  field: FieldCapability,
  otherKeys: string[],
  manifest?: FieldBindingManifest,
): Partial<Record<"key" | "label" | "visibilities" | "mask", string>> => {
  const errors: ReturnType<typeof resourceFieldErrors> = {};
  if (!field.key.trim()) errors.key = "请输入字段键";
  else if (otherKeys.includes(field.key.trim())) errors.key = "字段键已存在，请使用不同的字段键";
  if (!field.label.trim()) errors.label = "请输入展示名";
  if (!field.visibilities.length) errors.visibilities = "请至少选择一种可见性";
  if (field.visibilities.includes(FieldVisibility.MASKED)) {
    if (isNonTextResourceField(field.key, manifest))
      errors.visibilities = "非文本字段不支持脱敏，请取消脱敏选项";
    if (!isValidIamMask(field.mask ?? { kind: MaskKind.ALL }))
      errors.mask = "请填写有效的脱敏参数，结束字符不能小于起始字符";
  }
  return errors;
};

export const resourceFieldBinding = (
  field: FieldCapability,
  checkable: boolean,
  manifest?: FieldBindingManifest,
  failed = false,
): { label: string; detail: string; tone: "success" | "warning" | "info" } => {
  if (!checkable) return { label: "待保存", detail: "保存资源后可查看接入状态", tone: "info" };
  if (failed) return { label: "读取失败", detail: "未能读取接入状态，请重试", tone: "warning" };
  if (!manifest) return { label: "读取中", detail: "正在读取后端接入状态", tone: "info" };
  const names = { READ: "可见性", WRITE: "编辑", FILTER: "筛选" };
  const uses = new Set(
    manifest.bindings
      .filter((binding) => binding.fieldKey === field.key.trim())
      .map((binding) => binding.use),
  );
  if (!uses.size)
    return { label: "未接入", detail: "可保存配置，后端接入后才能生效", tone: "warning" };
  const required: Array<keyof typeof names> = ["READ"];
  if (field.editable) required.push("WRITE");
  if (field.filterable) required.push("FILTER");
  const missing = required.filter((use) => !uses.has(use));
  const detail = `已接入：${Object.keys(names)
    .filter((use) => uses.has(use as keyof typeof names))
    .map((use) => names[use as keyof typeof names])
    .join("、")}`;
  return missing.length
    ? {
        label: "部分接入",
        detail: `${detail}；待接入：${missing.map((use) => names[use]).join("、")}`,
        tone: "warning",
      }
    : { label: "已接入", detail, tone: "success" };
};
