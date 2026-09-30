<template>
  <in-drawer v-model="visible" title="权限诊断" :loading="loading" size="600px">
    <el-alert
      type="info"
      :closable="false"
      title="只读诊断当前有效权限与可披露来源，不提供代登录或模拟执行。"
      class="mb-12px"
    />
    <in-form label-position="top">
      <el-form-item label="成员" required>
        <el-input
          v-if="memberLocked"
          :model-value="memberName || memberId"
          disabled
          placeholder="该分配记录的成员不可修改"
        />
        <biz-iam-diagnose-candidate-picker
          v-else
          v-model="memberId"
          :api="candidatesApi"
          :query="{ kind: 'MEMBER' }"
          title="选择成员"
          placeholder="请选择成员"
        />
      </el-form-item>
      <el-form-item label="应用" required
        ><biz-iam-diagnose-candidate-picker
          v-model="applicationId"
          :api="candidatesApi"
          :query="{ kind: 'APPLICATION' }"
          title="选择应用"
          placeholder="请选择应用"
      /></el-form-item>
      <el-form-item label="操作" required
        ><biz-iam-diagnose-candidate-picker
          v-model="actionId"
          :api="candidatesApi"
          :query="{ kind: 'ACTION', applicationId }"
          :disabled="!applicationId"
          title="选择操作"
          placeholder="请选择操作"
      /></el-form-item>
      <el-form-item label="目标对象（可选）"
        ><biz-iam-diagnose-candidate-picker
          v-model="targetId"
          :api="candidatesApi"
          :query="{ kind: 'OBJECT', actionId }"
          :disabled="!actionId"
          title="选择目标对象"
          placeholder="请选择目标对象"
      /></el-form-item>
      <div class="text-12px text-[var(--el-text-color-secondary)] mb-12px">
        目标对象是所选操作作用的具体资源记录；留空时只诊断操作权限。
      </div>
      <biz-iam-diagnose-panel :decision="decision" />
      <div
        v-if="hasAction(IamAction.PLATFORM_ASSIGNMENT_READ)"
        class="flex flex-wrap gap-8px m-t-8px"
      >
        <in-button
          v-for="source in decision?.sources.filter((item) => item.assignmentId) || []"
          :key="source.assignmentId"
          @click="openSource(source.assignmentId!)"
        >
          查看分配 {{ source.assignmentId }}
        </in-button>
      </div>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">关闭</in-button>
      <in-button type="primary" :loading="loading" @in-click="run">诊断</in-button>
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import { Message, useCapabilities, type R } from "@ingot/admin-core";
import {
  IamAction,
  type AuthorizationCandidatesApi,
  type Decision,
  type DiagnoseInput,
} from "../models/iam";
import { iamEditorFailure } from "../hooks/iamEditorFailure";
import BizIamDiagnoseCandidatePicker from "./BizIamDiagnoseCandidatePicker.vue";
import BizIamDiagnosePanel from "./BizIamDiagnosePanel.vue";
defineOptions({ name: "BizIamPlatformDiagnoseDrawer" });
const props = defineProps<{
  candidatesApi: AuthorizationCandidatesApi;
  diagnoseApi: (input: DiagnoseInput) => Promise<R<Decision>>;
}>();
const emits = defineEmits<{ openAssignment: [id: string] }>();
const { hasAction, contextEpoch } = useCapabilities();
const visible = ref(false);
const loading = ref(false);
const memberId = ref("");
const memberName = ref("");
const memberLocked = ref(false);
const applicationId = ref("");
const actionId = ref("");
const targetId = ref("");
const decision = ref<Decision | null>(null);
let request = 0;
watch(applicationId, () => {
  actionId.value = "";
  targetId.value = "";
});
watch(actionId, () => {
  targetId.value = "";
});
watch([memberId, applicationId, actionId, targetId, contextEpoch, visible], () => {
  request += 1;
  decision.value = null;
  loading.value = false;
});
const openSource = (id: string): void => {
  if (hasAction(IamAction.PLATFORM_ASSIGNMENT_READ)) emits("openAssignment", id);
};
const run = async (): Promise<void> => {
  if (!memberId.value || !applicationId.value || !actionId.value) {
    Message.warning("请选择成员、应用和操作");
    return;
  }
  if (loading.value) return;
  const id = ++request;
  loading.value = true;
  try {
    const response = await props.diagnoseApi({
      memberId: memberId.value,
      applicationId: applicationId.value,
      actionId: actionId.value,
      targetId: targetId.value || undefined,
    });
    if (id === request) decision.value = response.data;
  } catch (error) {
    await iamEditorFailure(error);
  } finally {
    if (id === request) loading.value = false;
  }
};
defineExpose({
  show(preset?: { memberId?: string; memberName?: string }) {
    memberId.value = preset?.memberId || "";
    memberName.value = preset?.memberName || "";
    memberLocked.value = Boolean(preset?.memberId);
    applicationId.value = "";
    actionId.value = "";
    targetId.value = "";
    decision.value = null;
    visible.value = true;
  },
});
</script>
