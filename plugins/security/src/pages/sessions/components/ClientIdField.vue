<template>
  <ClientSelect
    v-if="canQueryClient"
    v-model="model"
    class="w-full"
    value-field="clientId"
    :default-select-index="props.defaultSelectIndex"
  />
  <el-input v-else v-model="model" class="w-full" clearable placeholder="请输入 clientId" />
</template>

<script setup lang="ts">
import { ClientSelect } from "@ingot/admin-common";
import { useCanQueryClient } from "../useCanQueryClient";

const props = withDefaults(
  defineProps<{
    defaultSelectIndex?: number;
  }>(),
  {
    defaultSelectIndex: -1,
  },
);

const model = defineModel<string | undefined>();
const { canQueryClient } = useCanQueryClient();
</script>
