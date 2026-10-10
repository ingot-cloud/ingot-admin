<template>
  <div class="iam-mask-editor w-full flex flex-col gap-12px">
    <el-select :model-value="model.kind" placeholder="请选择脱敏方式" @change="privateKind">
      <el-option
        v-for="item in IAM_MASK_OPTIONS"
        :key="item.value"
        :value="item.value"
        :label="item.label"
      />
    </el-select>
    <div v-if="model.kind === MaskKind.KEEP_EDGES" class="iam-mask-editor__rows">
      <label class="iam-mask-editor__row">
        <span>保留前几位</span>
        <el-input-number
          v-model="model.prefix"
          :min="0"
          :max="IAM_MASK_MAX_POSITION"
          placeholder="请输入前部字符数"
        />
      </label>
      <label class="iam-mask-editor__row">
        <span>保留后几位</span>
        <el-input-number
          v-model="model.suffix"
          :min="0"
          :max="IAM_MASK_MAX_POSITION"
          placeholder="请输入后部字符数"
        />
      </label>
    </div>
    <div v-if="model.kind === MaskKind.RANGE" class="iam-mask-editor__rows">
      <label class="iam-mask-editor__row">
        <span>起始字符</span>
        <el-input-number
          v-model="rangeStart"
          :min="1"
          :max="IAM_MASK_MAX_POSITION"
          placeholder="请输入起始字符序号"
        />
      </label>
      <label class="iam-mask-editor__row">
        <span>结束字符</span>
        <el-input-number
          v-model="model.end"
          :min="1"
          :max="IAM_MASK_MAX_POSITION"
          placeholder="请输入结束字符序号"
        />
      </label>
    </div>
    <div class="iam-mask-editor__hint">{{ hint }}</div>
    <div class="iam-mask-editor__preview">
      <div class="font-500 mb-8px">效果预览</div>
      <label class="iam-mask-editor__row">
        <span>示例原文</span>
        <el-input v-model="sample" placeholder="请输入示例内容" />
      </label>
      <div class="iam-mask-editor__row mt-8px">
        <span>脱敏结果</span>
        <output v-if="valid" class="iam-mask-editor__result" aria-live="polite">{{
          result
        }}</output>
        <span v-else class="text-[var(--in-color-danger)]" role="status"
          >请先填写有效的脱敏参数</span
        >
      </div>
      <div class="iam-mask-editor__hint mt-8px">使用示例数据演示，可修改原文查看效果。</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { MaskKind } from "../models/iam/constants";
import {
  defaultIamMask,
  IAM_MASK_MAX_POSITION,
  IAM_MASK_OPTIONS,
  isValidIamMask,
  previewIamMask,
} from "../models/iam/masking";
import type { MaskSpec } from "../models/iam/types";

defineOptions({ name: "BizIamMaskEditor" });
const model = defineModel<MaskSpec>({ default: () => ({ kind: MaskKind.ALL }) });
const sample = ref("");
watch(
  () => model.value.kind,
  (kind) => {
    sample.value = IAM_MASK_OPTIONS.find((option) => option.value === kind)?.sample ?? "abcdef";
  },
  { immediate: true },
);
const rangeStart = computed<number | undefined>({
  get: () => (model.value.start === undefined ? undefined : model.value.start + 1),
  set: (value) => {
    model.value.start = value === undefined ? undefined : value - 1;
  },
});
const valid = computed(() => isValidIamMask(model.value));
const result = computed(() => previewIamMask(sample.value, model.value));
const hint = computed(() => {
  switch (model.value.kind) {
    case MaskKind.ALL:
      return "所有内容统一显示为 ***，不保留原文长度。";
    case MaskKind.PHONE:
      return "仅支持数字；不超过 7 个字符或包含非数字时显示为 ***。";
    case MaskKind.EMAIL:
      return "保留域名；名称只有 1 个字符时不保留首字符，格式不符时显示为 ***。";
    case MaskKind.KEEP_EDGES:
      return "按字符计数；原文长度不超过保留字符总数时显示为 ***。";
    case MaskKind.RANGE:
      return "从第 1 个字符开始计数，包含起始和结束字符；结束超出原文时遮盖到末尾，起始超出原文时显示为 ***。";
    default:
      return "";
  }
});
const privateKind = (kind: MaskKind): void => {
  model.value = defaultIamMask(kind);
};
</script>
<style lang="postcss" scoped>
.iam-mask-editor__rows {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-2);
}
.iam-mask-editor__row {
  display: grid;
  grid-template-columns: 6em minmax(0, 1fr);
  align-items: center;
  gap: var(--in-space-3);
  & > span:first-child {
    color: var(--in-text-color-secondary);
  }
  & :deep(.el-input-number) {
    width: 100%;
  }
}
.iam-mask-editor__hint {
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-caption);
  line-height: var(--in-line-height-body);
}
.iam-mask-editor__preview {
  padding: var(--in-space-3);
  border-radius: var(--in-radius-control);
  background: var(--in-permission-panel-bg);
}
.iam-mask-editor__result {
  color: var(--in-text-color);
  font-weight: 600;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
