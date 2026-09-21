<template>
  <in-drawer v-model="visible" title="权限诊断" :loading="loading" size="560px">
    <el-alert
      class="mb-12px"
      type="info"
      :closable="false"
      title="诊断只给出当前结论与可披露来源，不提供模拟执行或登录。"
    />
    <in-form label-position="top">
      <el-form-item label="身份">
        <el-radio-group v-model="identityKind">
          <el-radio-button value="member">成员</el-radio-button>
          <el-radio-button value="account">账号</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="identityKind === 'member'" label="成员" required>
        <in-page-select
          v-model="memberId"
          filterable
          remote
          clearable
          value-field="id"
          label-field="name"
          placeholder="远程分页选择成员"
          :load-data="loadMembers"
        />
      </el-form-item>
      <el-form-item v-else label="账号 ID" required>
        <el-input v-model="accountId" placeholder="仅在当前可信域解析" />
      </el-form-item>
      <el-form-item label="应用" required>
        <in-page-select
          v-model="applicationId"
          filterable
          remote
          clearable
          value-field="id"
          label-field="name"
          placeholder="远程分页选择应用"
          :load-data="loadApplications"
        />
      </el-form-item>
      <el-form-item label="操作 ID" required>
        <el-input v-model="actionId" placeholder="application 内的操作" />
      </el-form-item>
      <el-form-item label="目标对象 ID">
        <el-input v-model="targetId" placeholder="可选" />
      </el-form-item>
      <biz-iam-diagnose-panel :decision="decision" />
    </in-form>
    <template #footer>
      <in-button @click="visible = false">关闭</in-button>
      <in-button type="primary" :loading="loading" @in-click="privateRun">诊断</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message, type LoadDataParams, type Page, type R } from "@ingot/admin-core";
import type { Decision, DiagnoseInput, IamSelectOption } from "../models/iam";

defineOptions({ name: "BizIamDiagnoseDrawer" });

const props = defineProps<{
  loadMembers: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  loadApplications: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  diagnoseApi: (input: DiagnoseInput) => Promise<R<Decision>>;
}>();

const visible = ref(false);
const loading = ref(false);
const identityKind = ref<"member" | "account">("member");
const memberId = ref("");
const accountId = ref("");
const applicationId = ref("");
const actionId = ref("");
const targetId = ref("");
const decision = ref<Decision | null>(null);

const privateRun = (): void => {
  if (identityKind.value === "member" && !memberId.value.trim()) {
    Message.warning("请选择成员");
    return;
  }
  if (identityKind.value === "account" && !accountId.value.trim()) {
    Message.warning("请填写账号 ID");
    return;
  }
  if (!applicationId.value.trim() || !actionId.value.trim()) {
    Message.warning("请填写应用和操作");
    return;
  }
  loading.value = true;
  const input: DiagnoseInput = {
    applicationId: applicationId.value.trim(),
    actionId: actionId.value.trim(),
    targetId: targetId.value.trim() || undefined,
    memberId: identityKind.value === "member" ? memberId.value.trim() : undefined,
    accountId: identityKind.value === "account" ? accountId.value.trim() : undefined,
  };
  props
    .diagnoseApi(input)
    .then((response) => {
      decision.value = response.data;
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(preset?: Partial<DiagnoseInput>) {
    visible.value = true;
    decision.value = null;
    identityKind.value = preset?.accountId ? "account" : "member";
    memberId.value = preset?.memberId ?? "";
    accountId.value = preset?.accountId ?? "";
    applicationId.value = preset?.applicationId ?? "";
    actionId.value = preset?.actionId ?? "";
    targetId.value = preset?.targetId ?? "";
  },
});
</script>
