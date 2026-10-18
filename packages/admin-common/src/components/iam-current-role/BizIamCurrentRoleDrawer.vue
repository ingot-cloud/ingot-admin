<template>
  <in-drawer
    v-model="visible"
    :title="id ? '角色详情' : '创建角色'"
    size="80%"
    :loading="loading"
    :before-close="privateBeforeClose"
  >
    <el-alert
      v-if="sharedReadonly"
      title="平台共享角色由平台维护，本组织可直接分配"
      type="info"
      :closable="false"
    />
    <in-biz-tabs v-model="tab">
      <in-biz-tab-panel name="profile" title="基本信息"
        ><in-form>
          <el-form-item label="编码" required
            ><el-input
              v-model="profile.code"
              :disabled="!!id"
              placeholder="请输入角色编码，创建后不可修改"
          /></el-form-item>
          <el-form-item label="名称" required
            ><el-input
              v-model="profile.name"
              :disabled="sharedReadonly || (!!id && !canProfile)"
              placeholder="请输入角色名称"
          /></el-form-item>
          <el-form-item label="说明"
            ><el-input
              v-model="profile.description"
              :disabled="sharedReadonly || (!!id && !canProfile)"
              placeholder="请输入角色说明"
          /></el-form-item>
          <el-form-item label="分组"
            ><el-input
              v-model="profile.groupName"
              :disabled="sharedReadonly || (!!id && !canProfile)"
              placeholder="请输入角色分组"
          /></el-form-item>
          <el-form-item v-if="id" label="状态"
            ><el-switch v-model="enabled" :disabled="!canProfile"
          /></el-form-item> </in-form
      ></in-biz-tab-panel>
      <in-biz-tab-panel name="permissions" title="当前权限"
        ><biz-iam-current-permission-editor
          v-if="permissionsReady"
          v-model="definition"
          :readonly="!canSave"
          :items="items"
          :catalog-a-p-i="catalogAPI"
          :application-candidates="applicationCandidates"
      /></in-biz-tab-panel>
    </in-biz-tabs>
    <biz-iam-preview-alert v-if="preview" :preview="preview" />
    <el-alert
      v-if="preview?.effectiveResult"
      type="info"
      :closable="false"
      :title="`新增 ${preview.effectiveResult.addedActionIds.length} 项、移除 ${preview.effectiveResult.removedActionIds.length} 项、调整范围 ${preview.effectiveResult.changedScopeActionIds.length} 项；保存后关联人员自动生效`"
    />
    <template #footer>
      <in-button v-if="conflicted" @in-click="privateReloadLock">重读当前配置，保留草稿</in-button>
      <in-button
        v-if="!id || (tab === 'permissions' && canSave)"
        :disabled="unavailable"
        @in-click="privatePreview"
        >预览</in-button
      >
      <in-button
        v-if="!sharedReadonly"
        type="primary"
        :disabled="unavailable || (tab === 'permissions' || !id ? !ready || !canSave : !canProfile)"
        @in-click="privateSave"
        >{{
          !id ? "创建角色" : tab === "permissions" ? "保存权限，关联人员自动生效" : "保存基本信息"
        }}</in-button
      >
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import { computed, ref, reactive, watch } from "vue";
import {
  Message,
  refreshSessionPermissions,
  useCapabilities,
  confirmUnsavedChanges,
  isApiError,
} from "@ingot/admin-core";
import {
  ConfigurationStatus,
  IamAction,
  RoleKind,
  objectActionAllowed,
  type CurrentRoleApis,
  type CurrentGrantCatalogAPI,
  type AuthorizationCandidatesApi,
  type CurrentRoleDefinition,
  type CurrentRoleCatalogAction,
  type CurrentRoleSummary,
  type ResourceDetail,
  type Preview,
  type CurrentRolePreviewResult,
} from "../../models/iam";
import BizIamCurrentPermissionEditor from "./BizIamCurrentPermissionEditor.vue";
import BizIamPreviewAlert from "../BizIamPreviewAlert.vue";
import { iamEditorFailure } from "../../hooks/iamEditorFailure";
const props = defineProps<{
  apis: CurrentRoleApis;
  catalogAPI: CurrentGrantCatalogAPI;
  applicationCandidates: AuthorizationCandidatesApi;
  shared?: boolean;
}>();
const emits = defineEmits<{ success: [] }>();
const visible = ref(false),
  loading = ref(false),
  tab = ref("profile"),
  id = ref(""),
  lock = ref(""),
  enabled = ref(true),
  permissionsReady = ref(false);
const profile = reactive({ code: "", name: "", description: "", groupName: "" });
const definition = ref<CurrentRoleDefinition>({ grants: [], parameterDefinitions: [] });
const items = ref<CurrentRoleCatalogAction[]>([]);
const detail = ref<ResourceDetail<CurrentRoleSummary>>();
const preview = ref<Preview<CurrentRolePreviewResult>>();
const previewed = ref("");
let epoch = 0;
const { unavailable, contextEpoch, hasAction } = useCapabilities();
const initial = ref("");
const conflicted = ref(false);
const privateBeforeClose = (done: () => void) => {
  if (loading.value) return;
  if (initial.value === fingerprint.value) done();
  else
    void confirmUnsavedChanges().then((allowed) => {
      if (allowed) done();
    });
};
const privateReloadLock = async () => {
  const current = epoch;
  try {
    const response = await props.apis.detailAPI(id.value);
    if (current !== epoch) return;
    detail.value = response.data;
    lock.value = response.data.version;
    preview.value = undefined;
    previewed.value = "";
    conflicted.value = false;
    Message.warning("已重读当前配置，草稿已保留，请核对后重新预览");
  } catch (error) {
    void iamEditorFailure(error);
  }
};
const fingerprint = computed(() =>
  JSON.stringify({
    profile,
    definition: definition.value,
    enabled: enabled.value,
    lock: lock.value,
  }),
);
const ready = computed(() => preview.value?.valid && previewed.value === fingerprint.value);
const sharedReadonly = computed(
  () => !props.shared && detail.value?.record.kind === RoleKind.SHARED,
);
const canSave = computed(
  () =>
    !sharedReadonly.value &&
    (!id.value ||
      hasAction(
        props.shared ? IamAction.PLATFORM_SHARED_ROLE_UPDATE : IamAction.TENANT_ROLE_UPDATE,
      )) &&
    (!id.value
      ? hasAction(
          props.shared ? IamAction.PLATFORM_SHARED_ROLE_CREATE : IamAction.TENANT_ROLE_CREATE,
        )
      : objectActionAllowed(
          detail.value?.capabilities || {},
          props.shared ? IamAction.PLATFORM_SHARED_ROLE_UPDATE : IamAction.TENANT_ROLE_UPDATE,
        ).allowed),
);
const canProfile = computed(
  () =>
    !sharedReadonly.value &&
    hasAction(
      props.shared ? IamAction.PLATFORM_SHARED_ROLE_STATUS : IamAction.TENANT_ROLE_STATUS,
    ) &&
    objectActionAllowed(
      detail.value?.capabilities || {},
      props.shared ? IamAction.PLATFORM_SHARED_ROLE_STATUS : IamAction.TENANT_ROLE_STATUS,
    ).allowed,
);
const privateLoadPermissions = async () => {
  const current = epoch;
  try {
    const response = await props.apis.grantsAPI(id.value);
    if (current !== epoch) return;
    definition.value = structuredClone(response.data.definition);
    items.value = response.data.items;
    permissionsReady.value = true;
    initial.value = fingerprint.value;
  } catch (error) {
    iamEditorFailure(error);
  }
};
watch(tab, () => {
  if (tab.value === "permissions" && id.value && !permissionsReady.value)
    void privateLoadPermissions();
});
watch(contextEpoch, () => {
  epoch += 1;
  visible.value = false;
});
const show = async (roleId = "") => {
  const current = ++epoch;
  loading.value = false;
  conflicted.value = false;
  lock.value = "";
  id.value = roleId;
  visible.value = true;
  tab.value = "profile";
  preview.value = undefined;
  previewed.value = "";
  detail.value = undefined;
  items.value = [];
  definition.value = { grants: [], parameterDefinitions: [] };
  permissionsReady.value = !roleId;
  Object.assign(profile, { code: "", name: "", description: "", groupName: "" });
  initial.value = fingerprint.value;
  if (!roleId) return;
  loading.value = true;
  try {
    const result = await props.apis.detailAPI(roleId);
    if (current !== epoch) return;
    detail.value = result.data;
    lock.value = result.data.version;
    Object.assign(profile, {
      code: result.data.record.code,
      name: result.data.record.name,
      description: result.data.record.description || "",
      groupName: result.data.record.groupName || "",
    });
    enabled.value = result.data.record.status === ConfigurationStatus.ENABLED;
    initial.value = fingerprint.value;
  } catch (error) {
    iamEditorFailure(error);
  } finally {
    if (current === epoch) loading.value = false;
  }
};
const privatePreview = async () => {
  const current = epoch;
  const mark = fingerprint.value;
  loading.value = true;
  try {
    const result = id.value
      ? await props.apis.previewAPI(id.value, {
          expectedVersion: lock.value,
          definition: definition.value,
        })
      : await props.apis.createPreviewAPI({ ...profile, definition: definition.value });
    if (current === epoch) {
      preview.value = result.data;
      previewed.value = mark;
    }
  } catch (error) {
    iamEditorFailure(error);
  } finally {
    if (current === epoch) loading.value = false;
  }
};
const privateSave = async () => {
  if (unavailable.value) return;
  const current = epoch;
  loading.value = true;
  try {
    if (!id.value) {
      if (!ready.value) return;
      await props.apis.createAPI({ ...profile, definition: definition.value });
    } else if (tab.value === "permissions") {
      if (!ready.value || !canSave.value) return;
      await props.apis.saveAPI(id.value, {
        expectedVersion: lock.value,
        definition: definition.value,
      });
    } else {
      if (!canProfile.value) return;
      await props.apis.profileAPI(id.value, {
        expectedVersion: lock.value,
        name: profile.name,
        description: profile.description,
        groupName: profile.groupName,
        status: enabled.value ? ConfigurationStatus.ENABLED : ConfigurationStatus.DISABLED,
      });
    }
    await refreshSessionPermissions({ refreshMenusIfVersionChanged: true }).catch(() =>
      Message.warning("已保存，权限刷新暂不可用，请稍后重试"),
    );
    if (current === epoch) {
      Message.success("已保存");
      visible.value = false;
      emits("success");
    }
  } catch (error) {
    if (current !== epoch) return;
    previewed.value = "";
    conflicted.value = isApiError(error) && error.status === 409;
    void iamEditorFailure(error);
  } finally {
    if (current === epoch) loading.value = false;
  }
};
defineExpose({ show });
</script>
