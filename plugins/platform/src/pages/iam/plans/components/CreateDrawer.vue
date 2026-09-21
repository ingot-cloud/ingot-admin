<template>
  <in-drawer v-model="visible" title="创建套餐" :loading="loading" size="560px">
    <el-form label-position="top">
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" />
      </el-form-item>
      <el-form-item label="说明">
        <el-input v-model="draft.description" type="textarea" :rows="3" />
      </el-form-item>
      <el-form-item label="包含应用">
        <biz-iam-chip-page-select
          v-model="draft.applicationIds"
          empty-text="未绑定应用"
          placeholder="远程分页添加应用"
          :load-data="loadApplications"
        />
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
import {
  BizIamChipPageSelect,
  createIamListLoader,
  toIamSelectRecords,
} from "@ingot/admin-common";
import { PlatformApplicationPageAPI, PlatformPlanCreateAPI } from "@/api/iam/catalog";
import { platformPlanQueryKeys } from "@/api/iam/catalog.query";
import { useQueryClient } from "@tanstack/vue-query";

defineOptions({ name: "PlanCreateDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const visible = ref(false);
const loading = ref(false);
const draft = reactive({
  name: "",
  description: "",
  applicationIds: [] as string[],
});

const loadApplications = createIamListLoader(async (page, condition) => {
  const response = await PlatformApplicationPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const privateSubmit = (): void => {
  if (!draft.name.trim()) {
    Message.warning("请输入套餐名称");
    return;
  }
  loading.value = true;
  PlatformPlanCreateAPI({
    name: draft.name.trim(),
    description: draft.description.trim() || undefined,
    applicationIds: [...draft.applicationIds],
  })
    .then(() => {
      Message.success("创建成功，修改套餐不会自动改变既有租户开通");
      void queryClient.invalidateQueries({ queryKey: platformPlanQueryKeys.lists() });
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show() {
    draft.name = "";
    draft.description = "";
    draft.applicationIds = [];
    visible.value = true;
  },
});
</script>
