<template>
  <in-drawer v-model="visible" title="创建应用" :loading="loading" size="520px">
    <el-form label-position="top" :model="draft">
      <el-form-item label="编码" required>
        <el-input v-model="draft.code" clearable placeholder="创建后不可改" />
      </el-form-item>
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" clearable />
      </el-form-item>
      <el-form-item label="说明">
        <el-input v-model="draft.description" type="textarea" :rows="3" />
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="draft.sortOrder" :min="0" />
      </el-form-item>
      <el-form-item label="基础应用">
        <el-switch v-model="draft.baseline" />
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" @in-click="privateSubmit">创建</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import { AuthorizationDomain } from "@ingot/admin-common";
import { PlatformApplicationCreateAPI } from "@/api/iam/catalog";
import { platformApplicationQueryKeys } from "@/api/iam/catalog.query";
import { useQueryClient } from "@tanstack/vue-query";

defineOptions({ name: "ApplicationCreateDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const visible = ref(false);
const loading = ref(false);
const draft = reactive({
  code: "",
  name: "",
  description: "",
  sortOrder: 0,
  baseline: false,
});

const reset = (): void => {
  draft.code = "";
  draft.name = "";
  draft.description = "";
  draft.sortOrder = 0;
  draft.baseline = false;
};

const privateSubmit = (): void => {
  if (!draft.code.trim() || !draft.name.trim()) {
    Message.warning("请填写编码和名称");
    return;
  }
  loading.value = true;
  PlatformApplicationCreateAPI({
    code: draft.code.trim(),
    domain: AuthorizationDomain.PLATFORM,
    name: draft.name.trim(),
    description: draft.description.trim() || undefined,
    sortOrder: draft.sortOrder,
    baseline: draft.baseline,
  })
    .then(() => {
      Message.success("创建成功");
      void queryClient.invalidateQueries({ queryKey: platformApplicationQueryKeys.lists() });
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show() {
    reset();
    visible.value = true;
  },
});
</script>
