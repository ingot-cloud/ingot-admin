<template>
  <in-drawer :title="title" v-model="visible" :loading="loading" size="520px">
    <in-form label-position="top">
      <el-form-item label="所属资源" required>
        <el-select v-model="draft.resourceId" :disabled="Boolean(editing)" filterable>
          <el-option
            v-for="item in resources"
            :key="item.record.id"
            :label="`${item.record.name} (${item.record.code})`"
            :value="item.record.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="操作码" required>
        <el-input v-model="draft.code" :disabled="Boolean(editing)" placeholder="不得包含通配符" />
      </el-form-item>
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" @in-click="privateSubmit">保存</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import type { AppActionRecord, AppResourceRecord, ResourceDetail } from "@ingot/admin-common";
import { PlatformActionCreateAPI, PlatformActionUpdateAPI } from "@/api/iam/catalog";

defineOptions({ name: "ActionEditDrawer" });

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const loading = ref(false);
const applicationId = ref("");
const resources = ref<Array<ResourceDetail<AppResourceRecord>>>([]);
const editing = ref<ResourceDetail<AppActionRecord>>();
const draft = reactive({
  resourceId: "",
  code: "",
  name: "",
});

const title = computed(() => (editing.value ? "编辑操作" : "创建操作"));

const privateSubmit = (): void => {
  if (!draft.resourceId || !draft.name.trim() || (!editing.value && !draft.code.trim())) {
    Message.warning("请填写资源、操作码和名称");
    return;
  }
  if (!editing.value && draft.code.includes("*")) {
    Message.warning("操作码不得包含通配符");
    return;
  }
  loading.value = true;
  const done = (): void => {
    Message.success("保存成功");
    visible.value = false;
    emits("success");
  };
  if (editing.value) {
    PlatformActionUpdateAPI(applicationId.value, editing.value.record.id, {
      expectedVersion: editing.value.version,
      name: draft.name.trim(),
    })
      .then(done)
      .finally(() => {
        loading.value = false;
      });
    return;
  }
  PlatformActionCreateAPI(applicationId.value, {
    resourceId: draft.resourceId,
    code: draft.code.trim(),
    name: draft.name.trim(),
  })
    .then(done)
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(
    appId: string,
    resourceList: Array<ResourceDetail<AppResourceRecord>>,
    target?: ResourceDetail<AppActionRecord>,
    preferredResourceId?: string,
  ) {
    applicationId.value = appId;
    resources.value = resourceList;
    editing.value = target;
    draft.resourceId = target?.record.resourceId || preferredResourceId || resourceList[0]?.record.id || "";
    draft.code = target?.record.code ?? "";
    draft.name = target?.record.name ?? "";
    visible.value = true;
  },
});
</script>
