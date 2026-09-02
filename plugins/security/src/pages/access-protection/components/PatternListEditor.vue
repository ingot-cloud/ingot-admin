<template>
  <div class="pattern-list-editor">
    <div v-for="(item, index) in modelValue" :key="index" class="pattern-list-editor__row">
      <el-form-item
        :prop="`${propPrefix}.${index}.path`"
        :rules="pathRules"
        label-width="0"
        class="pattern-list-editor__path"
      >
        <el-input
          v-model="item.path"
          :disabled="disabled"
          clearable
          placeholder="路径，如 /auth/token/**"
        />
      </el-form-item>
      <el-form-item
        :prop="`${propPrefix}.${index}.method`"
        :rules="methodRules"
        label-width="0"
        class="pattern-list-editor__method"
      >
        <in-select
          v-model="item.method"
          :disabled="disabled"
          :options="httpMethodEnum.getOptions()"
          placeholder="方法"
        />
      </el-form-item>
      <in-button
        v-if="!disabled"
        type="danger"
        text
        link
        :disabled="modelValue.length <= 1"
        @click="privateOnRemove(index)"
      >
        <template #icon>
          <i-ep:delete />
        </template>
      </in-button>
    </div>
    <in-button v-if="!disabled" type="primary" text link @click="privateOnAdd">
      <template #icon>
        <i-ep:plus />
      </template>
      添加路径
    </in-button>
  </div>
</template>

<script setup lang="ts">
import type { GatewayEndpointPattern } from "@/models";
import { HttpMethodEnum, useHttpMethodEnum } from "@/models/enums";

const modelValue = defineModel<Array<GatewayEndpointPattern>>({ required: true });

withDefaults(
  defineProps<{
    disabled?: boolean;
    propPrefix?: string;
  }>(),
  {
    disabled: false,
    propPrefix: "patternList",
  },
);

const httpMethodEnum = useHttpMethodEnum();

const pathRules = [{ required: true, message: "请输入路径", trigger: "blur" }];
const methodRules = [{ required: true, message: "请选择方法", trigger: "change" }];

const normalizeMethod = (method?: string): string | undefined => {
  if (method === "*") {
    return HttpMethodEnum.ALL;
  }
  return method;
};

watch(
  modelValue,
  (list) => {
    list.forEach((item) => {
      const normalized = normalizeMethod(item.method);
      if (normalized !== item.method) {
        item.method = normalized;
      }
    });
  },
  { deep: true, immediate: true },
);

const privateOnAdd = (): void => {
  modelValue.value = [
    ...modelValue.value,
    {
      path: "",
      method: HttpMethodEnum.POST,
    },
  ];
};

const privateOnRemove = (index: number): void => {
  if (modelValue.value.length <= 1) {
    return;
  }
  modelValue.value = modelValue.value.filter((_, itemIndex) => itemIndex !== index);
};
</script>

<style lang="postcss" scoped>
.pattern-list-editor {
  @apply w-full flex flex-col gap-2;

  & .pattern-list-editor__row {
    @apply flex flex-row items-start gap-2;
  }

  & .pattern-list-editor__path {
    @apply flex-1 mb-0;
  }

  & .pattern-list-editor__method {
    @apply w-140px mb-0;
  }
}
</style>
