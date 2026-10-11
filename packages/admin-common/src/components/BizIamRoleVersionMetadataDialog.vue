<template>
  <in-dialog v-model="visible" title="编辑版本信息" width="min(560px, calc(100vw - 32px))">
    <div class="mb-16px">{{ roleVersionLabel(revision) }} · {{ revision?.id }}</div>
    <biz-iam-role-version-form v-model:name="name" v-model:remark="remark" />
    <div v-if="failure" class="text-[var(--el-color-danger)] mt-12px">{{ failure }}</div>
    <template #footer>
      <in-button @in-click="visible = false">取消</in-button>
      <in-button type="primary" :loading="saving" @in-click="privateSave">保存</in-button>
    </template>
  </in-dialog>
</template>
<script setup lang="ts">
import { Message, isApiError, useCapabilities } from "@ingot/admin-core";
import { roleVersionLabel, type RoleRevision, type RoleRevisionMetadataApi } from "../models/iam";
import BizIamRoleVersionForm from "./BizIamRoleVersionForm.vue";
defineOptions({ name: "BizIamRoleVersionMetadataDialog" });
const props = defineProps<{ updateApi: RoleRevisionMetadataApi }>();
const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const saving = ref(false);
const revision = ref<RoleRevision>();
const roleId = ref("");
const name = ref("");
const remark = ref("");
const failure = ref("");
const { contextEpoch } = useCapabilities();
let session = 0;
watch(visible, (value) => {
  if (!value) session++;
});
watch(contextEpoch, () => {
  visible.value = false;
});
onBeforeUnmount(() => {
  session++;
});
const privateSave = async (): Promise<void> => {
  if (!revision.value || saving.value) return;
  const current = ++session;
  saving.value = true;
  failure.value = "";
  try {
    await props.updateApi(roleId.value, revision.value.id, {
      expectedMetadataVersion: revision.value.metadataVersion ?? "0",
      versionName: name.value.trim(),
      remark: remark.value.trim(),
    });
    if (current !== session) return;
    Message.success("版本信息已更新");
    visible.value = false;
    emits("success");
  } catch (error) {
    if (current !== session) return;
    failure.value =
      isApiError(error) && error.status === 409
        ? "版本信息已被其他管理员修改，请关闭后刷新版本历史再编辑。当前输入已保留。"
        : "保存失败，请重试";
  } finally {
    if (current === session) saving.value = false;
  }
};
defineExpose({
  show(id: string, row: RoleRevision) {
    session++;
    roleId.value = id;
    revision.value = { ...row };
    name.value = row.versionName ?? "";
    remark.value = row.remark ?? "";
    failure.value = "";
    saving.value = false;
    visible.value = true;
  },
});
</script>
