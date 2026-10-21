<template>
  <in-dialog v-model="visible" title="编辑基础信息" width="560px" append-to-body>
    <el-form label-position="top">
      <el-form-item label="组织 Logo">
        <in-common-upload-avatar v-model="avatar" />
      </el-form-item>
      <el-form-item label="组织名称" required>
        <el-input v-model="name" maxlength="128" placeholder="请输入组织名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="saving" @click="privateOnSave">保存</in-button>
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import { Message, type R } from "@ingot/admin-core";
import type { ResourceDetail, TenantRecord, TenantSettingsInput } from "@ingot/admin-common";

defineOptions({ name: "OrgBasicDialog" });

const props = defineProps<{
  save: (input: TenantSettingsInput) => Promise<R<ResourceDetail<TenantRecord>>>;
}>();

const emit = defineEmits<{
  saved: [ResourceDetail<TenantRecord>];
}>();

const visible = ref(false);
const saving = ref(false);
const version = ref("");
const name = ref("");
const avatar = ref("");

const show = (record: TenantRecord, expectedVersion: string): void => {
  version.value = expectedVersion;
  name.value = record.name;
  avatar.value = record.avatar || "";
  visible.value = true;
};

const privateOnSave = (): void => {
  const nextName = name.value.trim();
  if (!nextName || saving.value) {
    if (!nextName) {
      Message.warning("请输入组织名称");
    }
    return;
  }
  saving.value = true;
  props
    .save({
      expectedVersion: version.value,
      name: nextName,
      avatar: avatar.value || undefined,
    })
    .then((response) => {
      visible.value = false;
      Message.success("保存成功");
      emit("saved", response.data);
    })
    .finally(() => {
      saving.value = false;
    });
};

defineExpose({ show });
</script>
